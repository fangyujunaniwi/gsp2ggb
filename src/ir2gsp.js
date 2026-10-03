// IR (from .ggb) -> GSP writer.
// Strategy: clone real per-type object record blocks from gsp-template.json, patch
// parents/coords/params/label, and surround with header/tail records from a clean sample.
'use strict';
const tpl = require('./gsp-template.json');

const MARGIN = 120; // keep geometry inside the positive GSP canvas (y-down)

// ---------- expression parsing ----------
function splitArgs(s) {
  const out = []; let d = 0, cur = '';
  for (const ch of String(s)) {
    if ('([{'.includes(ch)) d++;
    else if (')]}'.includes(ch)) d--;
    if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function defOf(o) {
  if (o.cmd) return { name: o.cmd.name, args: o.cmd.args.slice() };
  if (o.expr) {
    const m = /^\s*([A-Za-z]\w*)\s*\((.*)\)\s*$/.exec(o.expr);
    if (m) return { name: m[1], args: splitArgs(m[2]) };
  }
  return null;
}

// ---------- kind mapping (ggb object -> gsp spec) ----------
function mapObj(o, byLabel, lineByPair) {
  const A = a => byLabel.get(a);
  const ids = args => args.map(A).filter(Boolean).map(x => x.id);
  // Resolve an inline `Line(a,b)` / `Segment(a,b)` mirror expression to an
  // existing GSP line/segment object that shares those endpoints.
  const inlineLine = (expr) => {
    const m = /(?:line|segment)\s*\(([^)]*)\)/i.exec(String(expr || ''));
    if (!m) return null;
    const ab = m[1].split(',').map(s => A(s.trim())).filter(Boolean).map(x => x.id);
    if (ab.length !== 2) return null;
    return (lineByPair && (lineByPair.get(ab[0] + '_' + ab[1]) || lineByPair.get(ab[1] + '_' + ab[0]))) || null;
  };

  if (!o.expr && !o.cmd) {
    if (o.ggbType === 'point') return { t: 0, coords: o.coords, rich: false };
    if (o.ggbType === 'numeric') return { t: 0, rich: true };
    if (o.ggbType === 'segment') return { skip: 'segment without definition' };
    if (o.ggbType === 'text') return { skip: 'text' };
    return { skip: 'free ' + o.ggbType };
  }
  const def = defOf(o);
  if (!def) {
    const e = String(o.expr);
    let m = /^\s*x\(([^)]+)\)\s*-\s*x\(([^)]+)\)\s*$/.exec(e);
    if (m) { const p = ids([m[1], m[2]]); return p.length === 2 ? { t: 65, parents: p } : { skip: 'dx refs' }; }
    m = /^\s*y\(([^)]+)\)\s*-\s*y\(([^)]+)\)\s*$/.exec(e);
    if (m) { const p = ids([m[1], m[2]]); return p.length === 2 ? { t: 66, parents: p } : { skip: 'dy refs' }; }
    m = /^\s*\(?([\w]+)\)?\s*\+\s*\(\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*\)\s*$/.exec(e);
    if (m) {
      const p = ids([m[1]]);
      if (p.length === 1) {
        const gx = parseFloat(m[2]), gy = parseFloat(m[3]);
        // (origin)+(dx,0) -> SimpleUnitPoint (t52); (origin)+(0,dy) -> unitY (t55);
        // otherwise a fixed-offset point (t17).
        if (gy === 0) return { t: 52, parents: p, params: [gx * 50] };
        if (gx === 0) return { t: 55, parents: p, params: [gy * 50] };
        return { t: 17, parents: p, params: [gx * 50, -gy * 50] };
      }
    }
    if (o.coords) return { t: 0, coords: o.coords, rich: false };
    return { skip: 'unparsed expression' };
  }
  const nm = def.name.toLowerCase();
  const A2 = def.args.map(A);
  const P = A2.filter(Boolean).map(x => x.id);
  const anyMissing = A2.some(x => !x);
  switch (nm) {
    case 'segment': return P.length === 2 ? { t: 2, parents: P } : { skip: 'segment args' };
    case 'line': return P.length === 2 ? { t: 63, parents: P } : { skip: 'line args' };
    case 'circle':
      if (P.length === 2) {
        const s = A2[1];
        return (s && (s.ggbType === 'segment' || s.ggbType === 'line')) ? { t: 4, parents: P } : { t: 3, parents: P };
      }
      return { skip: 'circle args' };
    case 'midpoint': return P.length >= 1 ? { t: 1, parents: P } : { skip: 'midpoint args' };
    case 'perpendicularline': return P.length === 2 ? { t: 5, parents: P } : { skip: 'perp args' };
    case 'parallelline': return P.length === 2 ? { t: 6, parents: P } : { skip: 'parallel args' };
    case 'anglebisector': return P.length === 3 ? { t: 7, parents: P } : { skip: 'bisector args' };
    case 'intersect': {
      if (P.length >= 2) {
        const idx = P.length > 2 ? parseInt(def.args[2], 10) : 0;
        const isConic = x => x && (x.ggbType === 'conic' || x.ggbType === 'circle' || x.ggbType === 'conicpart');
        if (isConic(A2[0]) && isConic(A2[1])) return { t: idx === 2 ? 14 : 13, parents: P.slice(0, 2) };
        if (isConic(A2[0]) || isConic(A2[1])) return { t: idx === 2 ? 12 : 11, parents: P.slice(0, 2) };
        return { t: 9, parents: P.slice(0, 2) };
      }
      return { skip: 'intersect args' };
    }
    case 'translate': {
      const arg1 = String(def.args[1] || '');
      const vm = /vector\s*\(([^)]*)\)/i.exec(arg1);
      if (P.length >= 1 && vm) {
        const vp = vm[1].split(',').map(s => A(s.trim())).filter(Boolean).map(x => x.id);
        if (vp.length === 2) return { t: 16, parents: [P[0], vp[0], vp[1]] };
        // Numeric vector: Vector((gx,gy))  -> PolarTranslation (t21) by a fixed vector.
        const nm = /^\s*\(?\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*\)?\s*$/.exec(vm[1]);
        if (nm) {
          const gx = parseFloat(nm[1]), gy = parseFloat(nm[2]);
          const ddx = gx * 50, ddy = -gy * 50;      // GGB units -> GSP file (sketch-pixel) units
          const d1 = Math.hypot(ddx, ddy);
          if (d1 > 0)
            return { t: 21, parents: [P[0]],
              params: [ddy / d1, ddx / d1, Math.atan2(ddx, -ddy), 0, d1] };
        }
      }
      // (k)*Vector((cx,cy))  -> FixedAngleMarkedDistance (t24)
      const km = /^\s*\(?([^)]*?)\)?\s*\*\s*vector\s*\(\s*\(?\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*\)?\s*\)/i.exec(arg1);
      if (km && P.length >= 1) {
        const kObj = A(km[1].trim());
        const cx = parseFloat(km[2]), cy = parseFloat(km[3]);
        if (kObj && isFinite(cx) && isFinite(cy))
          return { t: 24, parents: [P[0], kObj.id],
            params: [cy, cx] };
      }
      return { skip: 'translate args' };
    }
    case 'point': {
      // Point(path) / Point(path, t): the GSP point-on-object family.
      const path = A(def.args[0]);
      if (!path) return { skip: 'point path unresolved' };
      if (def.args.length === 1) return { t: 15, parents: [path.id] };
      const vObj = A(def.args[1]);
      if (vObj) return { t: 95, parents: [vObj.id, path.id] };   // [value, path]
      const tv = parseFloat(String(def.args[1]).replace('\u00B0', '').replace('°', ''));
      if (isFinite(tv)) return { t: 15, parents: [path.id], params: [tv] };
      return { skip: 'point parameter unresolved' };
    }
    case 'rotate': {
      // Rotate(pre, Angle(A,B,C), center)  ->  MarkedAngleRotation (t28)
      const am = /^\s*angle\s*\(([^)]*)\)\s*$/i.exec(String(def.args[1] || ''));
      if (am && P.length >= 2) {
        const tri = am[1].split(',').map(s => A(s.trim())).filter(Boolean).map(x => x.id);
        if (tri.length === 3) return { t: 28, parents: [P[0], P[1], tri[0], tri[1], tri[2]] };
      }
      const ang = parseFloat(String(def.args[1] || '').replace('\u00B0', '').replace('°', ''));
      if (P.length >= 2 && isFinite(ang)) {
        const r = ang * Math.PI / 180;
        return { t: 27, parents: [P[0], P[1]], params: [-Math.sin(r), Math.cos(r), ang, 0] };
      }
      return { skip: 'rotate args' };
    }
    case 'dilate': {
      // Dilate(pre, ratio, center).  The ratio may be a literal, Length(s1)/Length(s2),
      // or a measured value (a numeric reference / expression).
      const pre = A2[0], center = A2[2];
      const ratioArg = String(def.args[1] || '');
      if (!pre || !center) return { skip: 'dilate args' };
      // Dilate(pre, Length(s1)/Length(s2), center)  ->  Dilation2S (t31)
      const dm = /^\s*length\s*\(([^)]*)\)\s*\/\s*length\s*\(([^)]*)\)\s*$/i.exec(ratioArg);
      if (dm) {
        const s1 = A(dm[1].trim()), s2 = A(dm[2].trim());
        if (s1 && s2) return { t: 31, parents: [pre.id, center.id, s1.id, s2.id] };
      }
      const k = parseFloat(ratioArg);
      if (isFinite(k)) return { t: 30, parents: [pre.id, center.id], params: [k] };
      // Dilate(pre, <measured value>, center)  ->  DilationMR (t33)
      const kRef = A(def.args[1]);
      if (kRef) return { t: 33, parents: [pre.id, center.id, kRef.id] };
      return { skip: 'dilate args' };
    }
    case 'reflect': {
      if (P.length < 1) return { skip: 'reflect args' };
      let mir = P.length > 1 ? P[1] : null;
      if (mir == null) mir = inlineLine(def.args[1]);
      if (mir == null) return { skip: 'reflect mirror unresolved' };
      return { t: 34, parents: [P[0], mir] };
    }
    case 'foot': return { skip: 'perpendicular foot has no verified GSP object type' };
    case 'distance': return P.length === 2 ? { t: 37, parents: P } : { skip: 'distance args' };
    case 'length': return P.length === 1 ? { t: 36, parents: P } : { skip: 'length args' };
    case 'slope': return P.length === 1 ? { t: 87, parents: P } : { skip: 'slope args' };
    case 'angle': return P.length === 3 ? { t: 41, parents: P } : { skip: 'angle args' };
    case 'polygon': return P.length >= 3 ? { t: 8, parents: P } : { skip: 'polygon args' };
    case 'pointon': case 'pointonpath':
      return P.length >= 1 ? { t: 15, parents: [P[0]] } : { skip: 'pointOn args' };
    default: {
      if (o.coords) return { t: 0, coords: o.coords, rich: false };
      return { skip: 'command ' + def.name + (anyMissing ? ' (unresolved arg)' : '') };
    }
  }
}

// ---------- skeleton selection ----------
function pickSkel(type, want) {
  const keys = Object.keys(tpl.skels).filter(k => tpl.skels[k].type === type);
  if (!keys.length) return null;
  const score = k => {
    const v = tpl.skels[k].variant;
    let s = 0;
    if (want.coords && v[0] === 'P') s += 6; else if (!want.coords && v[0] !== 'P') s += 2;
    if (want.params && v[2] === '3') s += 6;
    if (want.rich && v[4] === 'F') s += 6; else if (!want.rich && v[4] !== 'F') s += 1;
    if (want.rich2310 && v[5] === 'G') s += 8;
    if (want.parents && v[1] === '2') s += 3; else if (!want.parents && v[1] !== '2') s += 2;
    return s;
  };
  keys.sort((a, b) => score(b) - score(a));
  return tpl.skels[keys[0]];
}

function setRec(recs, tag, pay) {
  const i = recs.findIndex(r => r.tag === tag);
  if (i >= 0) recs[i] = { tag, pay };
  else recs.splice(1, 0, { tag, pay }); // right after the 2000 header
  return recs;
}
function delRec(recs, tag) {
  const i = recs.findIndex(r => r.tag === tag);
  if (i >= 0) recs.splice(i, 1);
  return recs;
}

function buildBlock(spec) {
  const skel = pickSkel(spec.t, {
    coords: !!spec.coords, params: spec.params && spec.params.length,
    rich: !!spec.rich, rich2310: spec.t === 62, parents: spec.parents && spec.parents.length
  });
  if (!skel) return null;
  const recs = skel.recs.map(r => ({ tag: r.tag, pay: Buffer.from(r.pay, 'hex') }));
  // header color
  const h = recs[0].pay;
  if (spec.color !== undefined && h.length >= 16) h.writeUInt32LE(spec.color >>> 0, 12);
  // parents
  if (spec.parents && spec.parents.length) {
    const p = Buffer.alloc(4 + spec.parents.length * 4);
    p.writeUInt32LE(spec.parents.length, 0);
    spec.parents.forEach((id, i) => p.writeUInt32LE(id, 4 + i * 4));
    setRec(recs, 2002, p);
  } else delRec(recs, 2002);
  // coords
  if (spec.coords) {
    const p = Buffer.alloc(16);
    p.writeDoubleLE(spec.coords.x, 0);
    p.writeDoubleLE(spec.coords.y, 8);
    setRec(recs, 2201, p);
  } else if (spec.t === 0 && spec.coords === null) {
    delRec(recs, 2201);
  }
  // params
  if (spec.params && spec.params.length) {
    const p = Buffer.alloc(4 + spec.params.length * 8);
    p.writeUInt32LE(spec.t, 0);
    spec.params.forEach((v, i) => p.writeDoubleLE(v, 4 + i * 8));
    setRec(recs, 2003, p);
  } else if (spec.params && !spec.params.length) {
    delRec(recs, 2003);
  }
  // label
  if (spec.label) {
    const old = recs.find(r => r.tag === 2005);
    const prefix = old ? Buffer.from(old.pay.subarray(0, 22)) : Buffer.alloc(22);
    const name = Buffer.from(spec.label, 'utf8');
    const p = Buffer.alloc(prefix.length + 2 + name.length + (name.length & 1 ? 1 : 0));
    prefix.copy(p, 0);
    p.writeUInt16LE(name.length, 22);
    name.copy(p, 24);
    setRec(recs, 2005, p);
  } else delRec(recs, 2005);
  return canonical(recs);
}

// Canonical GSP child-record order (observed from real files):
// 2000 | 2002 parents | 2003 params | 2306/2307/2308/2309/2310/2311 content |
// 2005 label | 2008 | 2211 | 2201 coords | 2007 end
const RANK = { 2000: 0, 2002: 1, 2003: 2, 2306: 3, 2307: 3, 2308: 3, 2309: 3, 2310: 3, 2311: 3, 2005: 5, 2008: 6, 2211: 7, 2201: 8, 2007: 9 };
function canonical(recs) {
  return recs
    .map((r, i) => ({ r, i, k: RANK[r.tag] === undefined ? 4 : RANK[r.tag] }))
    .sort((a, b) => (a.k - b.k) || (a.i - b.i))
    .map(x => x.r);
}

function serialize(recs) {
  const parts = [Buffer.from('GSP4', 'latin1')];
  for (const r of recs) {
    const h = Buffer.alloc(8);
    h.writeUInt32LE(r.pay.length, 0);
    h.writeUInt32LE(r.tag, 4);
    parts.push(h, r.pay);
  }
  return Buffer.concat(parts);
}

const { toGsp } = require('./ggb.js');

function irToGsp(ir) {
  const warnings = [];
  const byLabel = new Map();
  for (const o of ir.objects) if (o.label) byLabel.set(o.label, o);

  // pass 1: decide specs, collect raw coords for offset
  const lineByPair = new Map(); // "idA_idB" -> line/segment object id
  for (const o of ir.objects) {
    if ((o.ggbType === 'line' || o.ggbType === 'segment') && o.parents && o.parents.length >= 2) {
      lineByPair.set(o.parents[0] + '_' + o.parents[1], o.id);
      lineByPair.set(o.parents[1] + '_' + o.parents[0], o.id);
    }
  }
  const specs = [];
  for (const o of ir.objects) {
    let sp;
    try { sp = mapObj(o, byLabel, lineByPair); } catch (e) { sp = { skip: 'map error: ' + e.message }; }
    if (!sp.skip && sp.t === 0 && o.ggbType === 'point' && o.coords) sp.coords = toGsp(o.coords);
    specs.push({ o, sp });
  }
  let minx = Infinity, miny = Infinity;
  for (const { sp } of specs) if (sp.coords) { minx = Math.min(minx, sp.coords.x); miny = Math.min(miny, sp.coords.y); }
  const offx = isFinite(minx) && minx < MARGIN ? MARGIN - minx : 0;
  const offy = isFinite(miny) && miny < MARGIN ? MARGIN - miny : 0;

  // pass 2: emit
  const outRecs = tpl.header.map(r => ({ tag: r.tag, pay: Buffer.from(r.pay, 'hex') }));
  let emitted = 0;
  const ordOf = new Map(); // IR id -> output ordinal (GSP parent refs are output-relative)
  for (const { o, sp } of specs) {
    if (sp.skip) { warnings.push('skip #' + o.id + ' ' + o.ggbType + ' ' + (o.label || '') + ': ' + sp.skip); continue; }
    // remap parents to output ordinals; all must already be emitted
    if (sp.parents && sp.parents.length) {
      const mapped = sp.parents.map(id => ordOf.get(id));
      if (mapped.some(x => x === undefined)) {
        warnings.push('skip #' + o.id + ' ' + (o.label || '') + ': depends on skipped object');
        continue;
      }
      sp.parents = mapped;
    }
    if (sp.coords) sp.coords = { x: sp.coords.x + offx, y: sp.coords.y + offy };
    if (o.color !== null && o.color !== undefined) sp.color = o.color;
    sp.label = /^[A-Za-z0-9_'\u4e00-\u9fff]{1,40}$/.test(o.label || '') ? o.label : '';
    const block = buildBlock(sp);
    if (!block) { warnings.push('skip #' + o.id + ': no template skeleton for GSP type ' + sp.t); continue; }
    for (const r of block) outRecs.push(r);
    emitted++;
    ordOf.set(o.id, emitted);
  }
  for (const r of tpl.tail.map(r => ({ tag: r.tag, pay: Buffer.from(r.pay, 'hex') }))) outRecs.push(r);
  // GSP validates tag1000[24] == object count; tail 9000 mirrors it.
  const c1000 = outRecs.find(r => r.tag === 1000);
  if (c1000 && c1000.pay.length >= 28) c1000.pay.writeUInt32LE(emitted, 24);
  const t9000 = [...outRecs].reverse().find(r => r.tag === 9000);
  if (t9000 && t9000.pay.length >= 4) t9000.pay.writeUInt32LE(emitted, 0);
  return { buf: serialize(outRecs), warnings, stats: { planned: emitted, total: ir.objects.length } };
}

module.exports = { irToGsp };
