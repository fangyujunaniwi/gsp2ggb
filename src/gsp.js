// GSP -> IR reader.
// Record chain: from offset 4: u32 payloadLen | u32 tag | payload, LE, exact to EOF.
// Object block: tag 2000 (28B, u16[0]=type) ... tag 2007, children in between.
// Parent refs: 1-based ordinals, section-local when the file has tag-1100 sections,
// otherwise global.
'use strict';

// ---------- record chain ----------
function parseRecords(buf) {
  if (buf.length < 8 || buf.toString('latin1', 0, 4) !== 'GSP4') {
    throw new Error('not a GSP4 file');
  }
  const recs = [];
  let p = 4;
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32LE(p);
    const tag = buf.readUInt32LE(p + 4);
    if (p + 8 + len > buf.length) {
      throw new Error('record overrun @0x' + p.toString(16) + ' len=' + len + ' tag=' + tag +
        ' remain=' + (buf.length - p - 8));
    }
    recs.push({ off: p, tag, pay: buf.subarray(p + 8, p + 8 + len) });
    p += 8 + len;
    // Some variable-length records omit one trailing pad byte from their stored
    // length.  This is common for tag 1300 (embedded PNG) and tag 9009 (a
    // variable-length document metadata/list record).  Only skip when the tag
    // at the declared boundary is implausibly shifted and the tag one byte later
    // becomes a normal 16-bit GSP tag, so ordinary zero-length records are not
    // affected.
    if (tag === 1300 || tag === 9009) {
      if (p + 1 === buf.length && buf[p] === 0x00) {
        p += 1;                                    // pad is the last byte of the file
      } else if (p + 9 <= buf.length && buf.readUInt32LE(p + 4) >= 0x10000 &&
                 buf.readUInt32LE(p + 5) < 0x10000) {
        p += 1;                                    // next tag only becomes valid when shifted by 1
      }
    }
  }
  if (p !== buf.length) throw new Error('trailing bytes: ' + p + '/' + buf.length);
  return recs;
}

// label string from tag 2005 payload: u16 len @22, bytes follow
function strAt(pay, o) {
  if (o + 2 > pay.length) return '';
  const n = pay.readUInt16LE(o);
  if (o + 2 + n > pay.length) return '';
  const b = pay.subarray(o + 2, o + 2 + n);
  // prefer strict UTF-8; fall back to GBK via TextDecoder when invalid
  try {
    const dec = new TextDecoder('utf-8', { fatal: true });
    return dec.decode(b);
  } catch (e) {
    try { return new TextDecoder('gbk').decode(b); } catch (e2) { return b.toString('latin1'); }
  }
}

// section name from tag 1100 payload: UTF-8 or GBK text (NUL padded), no length prefix
function sectionName(pay) {
  const s = pay.toString('utf8').replace(/\0+$/, '');
  if (!s || /[\uFFFD]/.test(s)) {
    try { return new TextDecoder('gbk').decode(pay).replace(/\0+$/, ''); } catch (e) { return s; }
  }
  return s;
}

// Decode the inline rich-text stored in a tag-2300 record (FixedText objects).
// Payload layout: 12-byte serialized header, 6 bytes of ids/coords, then the
// markup+text (UTF-8), closed by '>'. Markup codes look like "<T23x" (a text run:
// the following characters up to '>' are displayed) or "<VL"/"<H"/"<SR1G1L100"
// (containers, followed by a nested '<').  The displayed message is the
// concatenation of the run contents (containers contribute nothing themselves).
function decodeGspText(pay) {
  if (!pay || pay.length <= 18) return '';
  let s = Buffer.from(pay).subarray(18).toString('utf8');
  s = s.split('\u0000')[0];            // markup+text is NUL-terminated; drop trailing fields
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '<') {
      let j = i + 1;                    // skip the markup code
      while (j < s.length && s[j] !== '<' && s[j] !== '>') {
        if (s[j] === 'x') { j++; break; }
        j++;
      }
      i = j - 1;
    } else if (c !== '>') {
      out += c;
    }
  }
  return out;
}

// ---------- semantic type table (RE'd from Tool Folder constructions + corpus) ----------
// value: { k: kind, minP: min parents }
const TYPES = {
  0:  { k: 'free' },
  1:  { k: 'midpoint' },
  2:  { k: 'segment' },
  3:  { k: 'circleOn' },        // center + point on circle
  4:  { k: 'circleRadiusSeg' }, // center + radius segment
  5:  { k: 'perpLine' },        // point + line
  6:  { k: 'parallelLine' },    // point + line
  7:  { k: 'angleBisector' },   // p1 + vertex + p2
  8:  { k: 'polygon' },         // >=3 vertex points (polygon interior)
  9:  { k: 'intersectLL' },
  11: { k: 'intersectLC1' },
  12: { k: 'intersectLC2' },
  13: { k: 'intersectCC1' },
  14: { k: 'intersectCC2' },
  15: { k: 'pointOnPath' },
  16: { k: 'translateImage' },  // preimage + vector endpoints p1,p2
  17: { k: 'offsetPoint' },     // parent + fixed pixel offset (dx,dy), y-down
  21: { k: 'implicitRotate' },  // rotation about an implicit/marked center (arity 1, params carry angle)
  24: { k: 'fixedAngleMarkedDistance' }, // preimage + marked-distance value; params (-sinθ, cosθ, θ) = fixed angle
  27: { k: 'rotateImage' },     // preimage + center, params (sin_i, cos_i, deg, 0)
  28: { k: 'markedAngleRotate' }, // preimage + center + A + B + C (rotate by marked angle ABC)
  29: { k: 'measuredAngleRotate' }, // preimage + center + angle-measure (MeasuredAngleRotation)
  30: { k: 'dilateImage' },     // preimage + center, params (ratio)
  31: { k: 'segRatioDilate' },  // preimage + center + numSeg + denomSeg (Dilation2S)
  33: { k: 'markedRatioDilate' }, // preimage + center + ratio-measure (DilationMR)
  34: { k: 'reflectImage' },    // preimage + mirror (line/segment/point): Reflection
  35: { k: 'locus' },           // Sampler/gPointLocus: traced point + mover path + mover (+ deps)
  36: { k: 'measureLengthSeg' },// length of segment (label a/b/c/d)
  37: { k: 'measureDistance' }, // distance point-point (label a/b/c/d)
  38: { k: 'measureDistPtLine' }, // SimpleMeasure mT3: distance point-line
  39: { k: 'measurePerimeter' }, // SimpleMeasure mT4: perimeter (polygon)
  40: { k: 'measureCircumference' }, // SimpleMeasure mT4: circumference (circle)
  41: { k: 'angleMeasure' },    // 3 points, middle = vertex (Angle ABC)
  42: { k: 'measureArea' },     // SimpleMeasure mT6: area (polygon/circle)
  43: { k: 'measureArcAngle' }, // arc angle (degrees) of an arc object
  44: { k: 'measureArcLength' },// arc length of an arc object
  46: { k: 'measureRadius' },   // SimpleMeasure mT9: radius (circle)
  47: { k: 'ratioMeasure' },    // SimpleMeasure: ratio of 2 segments (mT8) or of 3 points (mT11)
  48: { k: 'text' },
  86: { k: 'measureCoordDistance' }, // SimpleMeasure mT15: coordinate distance (2 pts + coord sys)
  52: { k: 'unitX' },           // SimpleUnitPoint: horizontal axis unit point (origin + dx)
  54: { k: 'squareUnitY' },     // SquareUnitPoint: vertical unit point derived from unitX (same scale)
  55: { k: 'rectUnitY' },       // RectangularUnitPoint: vertical unit point with its own scale
  58: { k: 'axis' },             // Axis4: coordinate axis (parents: origin + unit point; 2309=horizontal)
  59: { k: 'axis' },             // coordinate axis variant (origin + unit by measurement / text)
  61: { k: 'coordsys' },         // gCoordSys (CoordSysByAxes / OriginUnitCoords / UnitCircleCoords)
  67: { k: 'plotPoint' },        // PlotFixedXY: point at fixed (x,y) in a coordinate system
  49: { k: 'coordPair' },        // CoordinatePair: "(x, y)" readout of a point in a coordinate system
  62: { k: 'button' },          // Sketchpad action button (has record 2310); not geometry
  63: { k: 'line2pt' },
  64: { k: 'circleRadiusObj' }, // center + radius (segment/vector)
  65: { k: 'abscissa' },        // SimpleMeasure mT13: (x(P)-originX)/unitX in a coordinate system
  66: { k: 'ordinate' },        // SimpleMeasure mT14: -(y(P)-originY)/unitY
  69: { k: 'plotXY' },          // PlotXY: point at (xExpr,yExpr) in a coordinate system
  70: { k: 'plotXY' },          // PlotXY variant (same [xExpr,yExpr,coordSys] shape)
  76: { k: 'iteration' },      // GSP iteration x_{k+1}=f(x_k): parents [preimage, image, ...]; count in tag 2314 +16
  89: { k: 'iterationParam' }, // iteration with the count as parents[0] (depth iteration): [count, preimage, image, ...]
  77: { k: 'iterateImage' },   // iterate image: parents [object X, iteration] -> the iterates of X
  79: { k: 'arc' },             // circle arc between two points: [conic, point, point]
  80: { k: 'arcCenter' },       // arc of the circle centred at parents[0] through P1,P2
  81: { k: 'arc3Points' },       // arc through three points (GSP "arc through 3 points" tool)
  87: { k: 'measureSlope' },    // slope of segment (2nd parent = value ref, ignored)
  94: { k: 'pathParam' },       // point's relative position along its host path (PointOnObject)
  95: { k: 'pointAtParam' },    // point on a path at a parameter given by the other parent
  101:{ k: 'customXformPt' },   // custom-transformation image of a point: [P', X, P, ..., P'] (P->X substitution)
  102:{ k: 'customXform' },     // custom-transformation image of a non-point (same parent layout)
  113:{ k: 'angle' },           // 3 points, middle = vertex (geometric angle)
  120:{ k: 'angleValue' }       // measurement of an angle object (parent = t113)
};

// tag2003 params: u32 echo/handle + doubles
function readParams(pay) {
  const out = [];
  if (pay.length >= 12) {
    for (let o = 4; o + 8 <= pay.length; o += 8) out.push(pay.readDoubleLE(o));
  }
  return out;
}

function gspToIR(buf, opts) {
  opts = opts || {};
  const recs = parseRecords(buf);
  const hasSections = recs.some(r => r.tag === 1100);
  const sections = [{ name: '', objects: [] }];
  let cur = null; // current object
  let curSec = sections[0];

  for (const r of recs) {
    if (r.tag === 1100) {
      cur = null;
      curSec = { name: sectionName(r.pay), objects: [] };
      sections.push(curSec);
      continue;
    }
    if (r.tag === 2000) {
      cur = {
        type: r.pay.readUInt16LE(0),
        hdr: Buffer.from(r.pay),
        parents: [], label: '', labelRec: null, coords: null, params: [],
        recs: []
      };
      curSec.objects.push(cur);
      continue;
    }
    if (!cur) continue;
    cur.recs.push(r);
    if (r.tag === 2007) { cur = null; continue; }
    switch (r.tag) {
      case 2002: {
        const n = r.pay.readUInt32LE(0);
        for (let i = 0; i < n && 4 + 4 * i + 4 <= r.pay.length; i++) {
          cur.parents.push(r.pay.readUInt32LE(4 + 4 * i));
        }
        break;
      }
      case 2005:
        cur.labelRec = Buffer.from(r.pay);
        cur.label = strAt(r.pay, 22);
        break;
      case 2003:
        cur.params = readParams(r.pay);
        cur.paramRaw = Buffer.from(r.pay);
        break;
      case 2201:
        if (r.pay.length >= 16) cur.coords = { x: r.pay.readDoubleLE(0), y: r.pay.readDoubleLE(8) };
        break;
      default:
        if (r.tag === 2306 || r.tag === 2307 || r.tag === 2308 || r.tag === 2309 ||
            r.tag === 2310 || r.tag === 2311 || r.tag === 2314 || r.tag === 2211) {
          cur.rich = cur.rich || {};
          cur.rich[r.tag] = Buffer.from(r.pay);
        }
        break;
    }
  }

  // ---- assemble IR objects with resolved parents ----
  const objects = [];
  const warnings = [];
  const allSecs = sections.filter(s => s.objects.length);
  const globalList = [];
  for (const s of allSecs) for (const o of s.objects) globalList.push(o);

  const makeIR = (raw, id, localIdx) => {
    const def = TYPES[raw.type];
    let kind = def ? def.k : 'unknown';
    let msg;
    // type-0 objects carrying a tag-2300 record are FixedText objects whose
    // message is stored inline (plain UTF-8 + rich-text markup).
    if (raw.type === 0) {
      const t = (raw.recs || []).find(r => r.tag === 2300);
      if (t) { kind = 'text'; msg = decodeGspText(t.pay); }
    }
    const ir = {
      id,
      srcType: raw.type,
      kind,
      label: raw.label || '',
      msg,
      parents: [],       // resolved ids (1-based IR ids)
      localIndex: localIdx, // ordinal within resolution scope
      coords: raw.coords,   // GSP logical, y-down
      params: raw.params,
      style: styleFromHdr(raw.hdr),
      _raw: raw
    };
    // Action buttons (t62) carry a 24-byte tag-2310 record: 3 u32 of framing
    // (tag / payload length / field offset) followed by six u16 fields.  Field 0
    // (offset 12) is the button kind, fields 4/5 (offsets 20/22) are the button's
    // position in sketch pixels:
    //   kind 0 = hide, 1 = show, 2 = animate, 3 = move, 4 = scroll,
    //   7 = simultaneous (triggers other buttons), 8/9 = unknown.
    if (raw.type === 62) {
      const b = raw.rich && raw.rich[2310];
      if (b && b.length >= 24) {
        ir.button = {
          code: b.readUInt16LE(12),
          flag: b.readUInt16LE(14),
          left: b.readUInt16LE(20),
          top: b.readUInt16LE(22)
        };
      }
    }
    return ir;
  };

  const styleFromHdr = (h) => {
    if (h.length < 20) return {};
    return {
      u1: h.readUInt16LE(4), u2: h.readUInt16LE(6), u3: h.readUInt16LE(8),
      u4: h.readUInt16LE(10), color: h.readUInt32LE(12)
    };
  };

  // build per-scope lists and map raw -> ir
  const scopes = hasSections ? allSecs.map(s => s.objects) : [globalList];
  const rawToIR = new Map();
  for (const list of scopes) {
    list.forEach((raw, i) => {
      const ir = makeIR(raw, objects.length + 1, i + 1);
      objects.push(ir);
      rawToIR.set(raw, ir);
    });
  }
  // resolve parents
  for (const list of scopes) {
    list.forEach((raw, i) => {
      const ir = rawToIR.get(raw);
      for (const pref of raw.parents) {
        let target = null;
        if (hasSections) {
          // section-local first (1-based), then global ordinal
          if (pref >= 1 && pref <= list.length) target = rawToIR.get(list[pref - 1]);
          else if (pref >= 1 && pref <= globalList.length) target = rawToIR.get(globalList[pref - 1]);
        } else if (pref >= 1 && pref <= list.length) {
          target = rawToIR.get(list[pref - 1]);
        }
        if (target) ir.parents.push(target.id);
        else {
          warnings.push('obj#' + (i + 1) + ' (t' + ir.srcType + '): unresolved parent ' + pref);
        }
      }
    });
  }

  return {
    source: 'gsp',
    title: '',
    objects,
    warnings,
    meta: { hasSections, sections: allSecs.map(s => ({ name: s.name, n: s.objects.length })) }
  };
}

module.exports = { gspToIR, parseRecords, strAt, TYPES, decodeGspText };
