// IR <-> GeoGebra .ggb
// .ggb = ZIP containing geogebra.xml (plus optional aux entries).
// Writer: <expression label exp/> + <element type label> pairs inside <construction>,
// modeled on ground-truth files (test.ggb / circ1.ggb / sine-curves.ggb).
// Reader: regex parse of expressions/commands/elements -> IR objects with inferred parents.
'use strict';
const { unzip, zip } = require('./zip');
const { decodeExpr } = require('./expr');

const SCALE = 50;            // GSP logical units per GeoGebra unit
const GEO_W = 1000, GEO_H = 800;

// ---------- tag-2311 expression decoding ----------
// Decode a "Calculate"/"Function" object's stored expression program (see src/expr.js)
// into a GeoGebra infix template containing {#id} parent placeholders.
// Returns { exprTpl, args } on success, or null when absent/undecodable.
function decodedExpr(o) {
  const pay = o._raw && o._raw.rich && o._raw.rich[2311];
  if (!pay) return null;
  const r = decodeExpr(pay, o);
  return r.ok ? r : null;
}
// Does the template use the independent variable x (i.e. is it a function, not a number)?
function usesX(tpl) { return /(^|[^A-Za-z0-9_])x([^A-Za-z0-9_]|$)/.test(tpl); }
// Evaluate a template that is a plain constant (number / pi / e / unary minus / ^).
// Returns a JS number, or null if it contains anything else.
function constValue(tpl) {
  const s = tpl.trim();
  let m;
  if ((m = /^\(-\s*(.+)\)$/.exec(s))) { const v = constValue(m[1]); return v === null ? null : -v; }
  if ((m = /^(-?\d+(?:\.\d+)?)(?:\s*\^\s*(-?\d+(?:\.\d+)?))?$/.exec(s)))
    return Math.pow(Number(m[1]), m[2] === undefined ? 1 : Number(m[2]));
  if (s === 'pi') return Math.PI;
  if (s === 'e') return Math.E;
  return null;
}

// ---------- helpers ----------
function fmt(v) {
  if (typeof v !== 'number' || !isFinite(v)) return '0';
  return String(Number(v.toPrecision(12)));
}
function xmlEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function toGgb(c, unit) {           // -> ggb coords
  if (!c) return null;
  if (unit === 'ggb') return { x: c.x, y: c.y };
  return { x: c.x / SCALE, y: -c.y / SCALE };
}
function toGsp(c) {                 // ggb -> gsp logical (y-down)
  return { x: c.x * SCALE, y: -c.y * SCALE };
}

// ---------- kind classification ----------
const POINT_KINDS = new Set(['free', 'midpoint', 'pointOnPath', 'intersectLL',
  'intersectLC1', 'intersectLC2', 'intersectCC1', 'intersectCC2', 'foot', 'offsetPoint',
  'unitX', 'squareUnitY', 'rectUnitY', 'rotateImage', 'dilateImage', 'translateImage', 'plotPoint']);
const LINE_KINDS = new Set(['line2pt', 'perpLine', 'parallelLine', 'angleBisector', 'axis']);
const SEG_KINDS = new Set(['segment']);
const XFORM_KINDS = new Set(['translateImage', 'rotateImage', 'dilateImage', 'reflectImage',
  'markedAngleRotate', 'measuredAngleRotate', 'segRatioDilate', 'markedRatioDilate', 'implicitRotate']);
// Follow a chain of affine images back to the original object kind ('segment'/'line'/...).
function straightBaseKind(obj, byId, depth) {
  let cur = obj, guard = 0;
  while (cur && XFORM_KINDS.has(cur.kind) && guard++ < 16) cur = byId.get(cur.parents[0]);
  return cur ? cur.kind : null;
}
const CIRC_KINDS = new Set(['circleOn', 'circleRadiusSeg', 'circleRadiusObj']);
const NUM_KINDS = new Set(['measureDistance', 'measureLengthSeg', 'measureSlope',
  'deltaX', 'deltaY', 'calc', 'angleMeasure', 'angle', 'angleValue', 'ratioMeasure']);

function isPointish(o) {
  if (!o) return false;
  if (o.kind === 'free') return !!o.coords;
  if (XFORM_KINDS.has(o.kind))
    return isPointish(o._byId ? o._byId.get(o.parents[0]) : null);
  return POINT_KINDS.has(o.kind);
}
function elemTypeOf(o, byId) {
  if (!o) return 'point';
  if (o.kind === 'free') return o.coords ? 'point' : 'numeric';
  if (SEG_KINDS.has(o.kind)) return 'segment';
  if (LINE_KINDS.has(o.kind)) return 'line';
  if (CIRC_KINDS.has(o.kind)) return 'conic';
  if (o.kind === 'polygon') return 'polygon';
  if (NUM_KINDS.has(o.kind)) return 'numeric';
  if (o.kind === 'text') return 'text';
  if (XFORM_KINDS.has(o.kind))
    return elemTypeOf(byId.get(o.parents[0]), byId);
  return 'point';
}

// Resolve the three defining points (A,B,C; B = vertex) of an angle measure used
// as a transform marker.  Handles a geometric angle (t41/t113), an angle value
// (t120, whose parent is the angle), and a t48 label wrapping one.
function angleTriple(o, byId) {
  if (!o) return null;
  if ((o.srcType === 41 || o.srcType === 113) && o.parents.length >= 3) return o.parents.slice(0, 3);
  if (o.srcType === 120 && o.parents.length >= 1) return angleTriple(byId.get(o.parents[0]), byId);
  if (o.kind === 'text') {
    for (const id of o.parents) { const t = angleTriple(byId.get(id), byId); if (t) return t; }
  }
  return null;
}
// Ratio measure (t47, SimpleMeasure): either Ratio/Segments (measureType 8, two
// segment parents) or Ratio/Points (measureType 11, three point parents). Returns
// the reference ids plus a `{#id}`-placeholder template, or null when unsupported.
function ratioTemplate(o, byId) {
  if (!o || o.srcType !== 47) return null;
  if (o.parents.length === 2) {
    const a = byId.get(o.parents[0]), b = byId.get(o.parents[1]);
    if (a && b && a.kind === 'segment' && b.kind === 'segment')
      return { obj: o, ids: o.parents.slice(),
        tpl: 'Length({#' + o.parents[0] + '})/Length({#' + o.parents[1] + '})' };
  }
  // measureType 11: parents are [A,B,C] and the value is |AC|/|AB|, negated when
  // angle BAC > 90° (SimpleMeasure case 11 + computed3PtRatio). The sign equals the
  // sign of the dot product A→B · A→C, which is orientation-independent.
  // Coordinate arithmetic (x()/y()) is used instead of Vector()/Distance() because a
  // point emitted as `P + t*(Q-P)` is typed by GeoGebra as a vector, which would make
  // Vector()/Distance() misbehave; x()/y() are valid for points and vectors alike.
  if (o.parents.length === 3) {
    const [A, B, C] = o.parents;
    if ([A, B, C].every(id => { const q = byId.get(id); return q && isPointish(q); })) {
      const xA = 'x({#' + A + '})', yA = 'y({#' + A + '})';
      const xB = 'x({#' + B + '})', yB = 'y({#' + B + '})';
      const xC = 'x({#' + C + '})', yC = 'y({#' + C + '})';
      const bx = '(' + xB + '-' + xA + ')', by = '(' + yB + '-' + yA + ')';
      const cx = '(' + xC + '-' + xA + ')', cy = '(' + yC + '-' + yA + ')';
      return { obj: o, ids: [A, B, C],
        tpl: '(If(' + bx + '*' + cx + ' + ' + by + '*' + cy + ' < 0, -1, 1)) * ' +
             '(sqrt(' + cx + '^2 + ' + cy + '^2) / sqrt(' + bx + '^2 + ' + by + '^2))' };
    }
  }
  return null;
}

// Resolve a ratio measure used as a dilation marker, optionally wrapped in a t48 label.
function ratioInfo(o, byId) {
  const r = ratioTemplate(o, byId);
  if (r) return r;
  if (o && o.kind === 'text') {
    for (const id of o.parents) { const s = ratioInfo(byId.get(id), byId); if (s) return s; }
  }
  return null;
}

// ---------- label assignment ----------
const RESERVED = new Set(['x', 'y', 'z', 'e', 'i', 'pi', 'exp', 'ln', 'log', 'sin', 'cos', 'tan',
  'sqrt', 'abs', 'min', 'max', 'sum', 'length', 'distance', 'midpoint', 'segment',
  'circle', 'line', 'intersect', 'translate', 'rotate', 'dilate', 'foot', 'slope',
  'polygon', 'vector', 'point', 'number', 'text', 'function', 'list']);
function sanitizeLabel(raw, used, stemHint) {
  let base = String(raw || '').trim().replace(/\[(\d+)\]/g, '_$1');  // m[1] -> m_1
  if (!/^[A-Za-z][A-Za-z0-9_']{0,14}$/.test(base)) {
    base = ''; // must generate
  } else if (RESERVED.has(base) || RESERVED.has(base.toLowerCase())) {
    base = base + '_';
  }
  let lab = base || null;
  if (lab) {
    if (used.has(lab)) lab = null;
  }
  if (!lab) {
    const stem = base || stemHint || 'O';
    if (!used.has(stem)) lab = stem;
    else {
      let n = 2;
      while (used.has(stem + '_' + n)) n++;
      lab = stem + '_' + n;
    }
  }
  used.add(lab);
  return lab;
}

// Reference pair (p1,p2) of a straight object, as GeoGebra point expressions.
// GSP parameterises a point on any straight as p1 + φ·(p2−p1) (see PointOnStraight.Constrain):
//   segment/line2pt       : p1,p2 = the two defining points
//   parallel(P, base)     : p1,p2 = P ∓ d/2      (d = base direction vector)
//   perpendicular(P, base): p1,p2 = P ∓ perp(d)/2
//   angleBisector(A,B,C)  : p1 = B, p2 = B + fixed-length bisector direction
// Tells whether an axis object is the horizontal x-axis (record 2309 = 1) or
// the vertical y-axis (0). Falls back to the conventional label.
function axisHorizontal(o) {
  const rich = (o._raw && o._raw.rich) || {};
  if (rich[2309] && Buffer.from(rich[2309]).length >= 4)
    return Buffer.from(rich[2309]).readUInt32LE(0) === 1;
  return o.label === 'x';
}

// Effective pixel scale of a unit point (see the t52/t54/t55 note below).
function unitScaleOf(o, byId, depth) {
  if (!o || (depth || 0) > 16) return null;
  if (o.kind === 'unitX' || o.kind === 'rectUnitY')
    return (o.params && o.params.length) ? o.params[0] : null;
  if (o.kind === 'squareUnitY')
    return unitScaleOf(byId.get(o.parents[0]), byId, (depth || 0) + 1);
  return null;
}
// Resolve the true origin point of a unit point.  SimpleUnitPoint's origin is its parent
// point; SquareUnitPoint/RectangularUnitPoint chain to the origin of a parent unit point
// (UnitPoint.getOriginX).
function unitPointOrigin(o, byId) {
  const unitish = k => k === 'unitX' || k === 'squareUnitY' || k === 'rectUnitY';
  let cur = o, g = 0;
  while (cur && unitish(cur.kind) && g++ < 16) {
    const p = byId.get(cur.parents[0]);
    if (p && unitish(p.kind)) { cur = p; continue; }
    return cur.parents[0];
  }
  return null;
}

// ---------- sketch coordinate system (custom axes) ----------
// A sketch can define its own coordinate system: a gCoordSys (t61) over two axes (t58), each
// anchored at an origin point and a unit point (often t52/t54 unit points).  Functions are
// plotted in that system while ordinary points live in sketch-pixel space, so the two only
// agree once everything is expressed in the system's units.  When such a frame exists we emit
// all coordinates in frame units; GeoGebra's own axes then coincide with the sketch's, and
// measured slopes/ratios keep the sketch's units.
function pxOfPoint(o, byId, depth) {
  if (!o || (depth || 0) > 16) return null;
  if (o.coords && Number.isFinite(o.coords.x) && Number.isFinite(o.coords.y))
    return { x: o.coords.x, y: o.coords.y };
  if (o.kind === 'unitX' && o.params && o.params.length) {
    const orgId = unitPointOrigin(o, byId);
    const b = pxOfPoint(byId.get(orgId != null ? orgId : o.parents[0]), byId, (depth || 0) + 1);
    if (b) return { x: b.x + o.params[0], y: b.y };
  }
  if (o.kind === 'rectUnitY' || o.kind === 'squareUnitY') {
    const s = unitScaleOf(o, byId, 0);
    const orgId = unitPointOrigin(o, byId);
    const b = pxOfPoint(byId.get(orgId != null ? orgId : o.parents[0]), byId, (depth || 0) + 1);
    if (b && s != null) return { x: b.x, y: b.y - s };  // +dy = up (sketch pixels are y-down)
  }
  return null;
}

// Pixel radius of a GSP circle (t64 family): either the distance center->on-point or the
// length of the radius segment.  Returns null when it cannot be resolved numerically.
function circleRadiusPx(circ, byId, depth) {
  if (!circ || (depth || 0) > 24) return null;
  const center = byId.get((circ.parents || [])[0]);
  const p2 = byId.get((circ.parents || [])[1]);
  if (!center || !p2) return null;
  if (SEG_KINDS.has(p2.kind) && p2.parents.length === 2) {
    const a = gspPosXY(byId.get(p2.parents[0]), byId, (depth || 0) + 1);
    const b = gspPosXY(byId.get(p2.parents[1]), byId, (depth || 0) + 1);
    if (a && b) return Math.hypot(b.x - a.x, b.y - a.y);
    return null;
  }
  const c = gspPosXY(center, byId, (depth || 0) + 1);
  const p = gspPosXY(p2, byId, (depth || 0) + 1);
  if (c && p) return Math.hypot(p.x - c.x, p.y - c.y);
  return null;
}

// Numeric position (GSP logical, y-down) of a point-like object.  Used to seed a
// GeoGebra point that lives on a path: GeoGebra stores such a point's position in
// <coords> and restores its path parameter from them (GeoPoint.setCoords ->
// path.pointChanged), which is the only way to get a *changeable* — hence
// animatable — point on a path (AlgoPointOnPath.isChangeable() is `param == null`).
// Returns null when the position cannot be computed from stored data.
function gspPosXY(o, byId, depth) {
  if (!o || (depth || 0) > 24) return null;
  const free = pxOfPoint(o, byId, depth || 0);
  if (free) return free;
  if (o.kind === 'midpoint') {
    if (o.parents.length >= 2) {
      const a = gspPosXY(byId.get(o.parents[0]), byId, (depth || 0) + 1);
      const b = gspPosXY(byId.get(o.parents[1]), byId, (depth || 0) + 1);
      if (a && b) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    } else if (o.parents.length === 1) {
      const s = byId.get(o.parents[0]);
      if (s && SEG_KINDS.has(s.kind) && s.parents.length === 2) {
        const a = gspPosXY(byId.get(s.parents[0]), byId, (depth || 0) + 1);
        const b = gspPosXY(byId.get(s.parents[1]), byId, (depth || 0) + 1);
        if (a && b) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      }
    }
    return null;
  }
  if (o.kind === 'pointOnPath') {
    const path = byId.get(o.parents[0]);
    if (!path) return null;
    const ps = o.params || [];
    // circle: the point's position is stored as a unit direction (px,py) in a y-UP frame,
    // while the file's point coordinates are y-down, so the y component is negated:
    // position = center + r·(px, −py).  Verified against a GSP render of
    // ref-ctrl/angle_bisector.gsp (G has py>0 and is rendered above the centre).
    // The one-parameter form is NOT a decodable position: its value does not match the
    // point's rendered angle in the corpus (it is animation state / a constraint handle),
    // so it is left for GeoGebra to choose.
    if (CIRC_KINDS.has(path.kind) && path.parents.length === 2 && ps.length >= 2) {
      const n = Math.hypot(ps[0], ps[1]);
      if (!(n > 0.9 && n < 1.1)) return null;
      const c = gspPosXY(byId.get(path.parents[0]), byId, (depth || 0) + 1);
      const r = circleRadiusPx(path, byId, (depth || 0) + 1);
      if (c && r != null) return { x: c.x + r * ps[0], y: c.y - r * ps[1] };
      return null;
    }
    const t = ps.length ? ps[0] : null;
    if (t === null) return null;
    if (SEG_KINDS.has(path.kind) && path.parents.length === 2) {
      const a = gspPosXY(byId.get(path.parents[0]), byId, (depth || 0) + 1);
      const b = gspPosXY(byId.get(path.parents[1]), byId, (depth || 0) + 1);
      if (a && b) return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
    }
    if (path.kind === 'polygon' && path.parents.length >= 3) {
      // GSP stores offset = edgeIndex + φ; walk that edge by the fractional part.
      const n = path.parents.length, off = ((t % n) + n) % n;
      const e = Math.floor(off), f = off - e;
      const a = gspPosXY(byId.get(path.parents[e]), byId, (depth || 0) + 1);
      const b = gspPosXY(byId.get(path.parents[(e + 1) % n]), byId, (depth || 0) + 1);
      if (a && b) return { x: a.x + f * (b.x - a.x), y: a.y + f * (b.y - a.y) };
    }
    return null;
  }
  return null;
}

// Can GeoGebra animate the object described by this plan?  Only a point that is
// free *on a path* (plan.pathXY) qualifies.  A plain free point is not animatable,
// and neither is a plain number: GeoNumeric.isAnimatable() requires an active
// slider interval (`isIntervalMinActive() && isIntervalMaxActive()`), which our
// numerics do not carry.  A GSP parameter target therefore stays unconverted
// rather than emitting a script GeoGebra rejects.
function planIsAnimatable(p) {
  return !!(p && !p.skip && p.elem === 'point' && p.pathXY);
}
function sketchFrame(ir, byId) {
  // Only meaningful (and only safe) when the sketch has a single, unambiguous coordinate
  // system: multiple coordinate systems make the "active" frame ambiguous, and the derived
  // units become unreliable.
  const systems = ir.objects.filter(o => o.srcType === 61 && o.parents && o.parents.length >= 2);
  if (systems.length !== 1) return null;
  const cs = systems[0];
  const axes = cs.parents.map(id => byId.get(id))
    .filter(o => o && o.srcType === 58 && o.parents && o.parents.length >= 2);
  if (axes.length < 2) return null;
  const O = pxOfPoint(byId.get(axes[0].parents[0]), byId, 0) || pxOfPoint(byId.get(axes[1].parents[0]), byId, 0);
  if (!O) return null;
  let Ux = null, Uy = null;
  const vecs = [];
  for (const ax of axes) {
    const u = pxOfPoint(byId.get(ax.parents[1]), byId, 0);
    if (!u) continue;
    vecs.push({ v: { x: u.x - O.x, y: u.y - O.y }, horiz: axisHorizontal(ax) });
  }
  if (vecs.length < 2) return null;
  if (!Ux) { const e = vecs.find(e => e.horiz) || vecs.find(e => Math.abs(e.v.x) >= Math.abs(e.v.y)); if (e) Ux = e.v; }
  if (!Uy) { const e = vecs.find(e => !e.horiz && e.v !== Ux) || vecs.find(e => e.v !== Ux); if (e) Uy = e.v; }
  if (!Ux || !Uy) return null;
  const det = Ux.x * Uy.y - Ux.y * Uy.x;
  if (!Number.isFinite(det) || Math.abs(det) < 1e-6) return null;
  const uxLen = Math.hypot(Ux.x, Ux.y), uyLen = Math.hypot(Uy.x, Uy.y);
  if (!(uxLen > 0) || !(uyLen > 0)) return null;
  const ratio = uyLen / uxLen;                     // guard against mis-read unit points
  if (ratio < 0.2 || ratio > 5) return null;
  return {
    O, Ux, Uy, uxLen, uyLen,
    pt(p) {                                    // sketch-pixel point -> frame coordinates
      const dx = p.x - O.x, dy = p.y - O.y;
      return { x: (Uy.y * dx - Uy.x * dy) / det, y: (Ux.x * dy - Ux.y * dx) / det };
    },
  };
}
// t72 function plot: the tag-2306 record stores the plotted x-domain [xmin, xmax] (frame units).
function plotDomain(o) {
  const recs = (o._raw && o._raw.recs) || [];
  for (const r of recs)
    if (r.tag === 2306 && r.pay.length >= 16) return [r.pay.readDoubleLE(0), r.pay.readDoubleLE(8)];
  return null;
}

// Scalar (origin, unit) of one coordinate axis, as GeoGebra expressions.
// Axis4 (origin point + unit point) → origin = x/y(point), unit = px/SCALE.
// Axis3 (parent coordinate system)  → inherit from that coordinate system.
function axisScaleRef(o, byId, R) {
  const P = o.parents.map(i => byId.get(i));
  const horiz = axisHorizontal(o);
  if (P.length >= 2 && isPointish(P[0])) {
    const up = P[1];
    const s = unitScaleOf(up, byId, 0);
    if (s != null)
      return { origin: (horiz ? 'x(' : 'y(') + R(o.parents[0]) + ')', unit: fmt(s / SCALE) };
    return null;                                   // unit defined by a measurement/text: unknown
  }
  if (P.length === 1) {
    const cs = coordSysRef(P[0], byId, R);
    if (cs) return { origin: horiz ? cs.ox : cs.oy, unit: horiz ? cs.ux : cs.uy };
  }
  return null;
}

// Origin/unit of a gCoordSys (t61), as GeoGebra expressions, or null.
function coordSysRef(o, byId, R) {
  if (!o) return null;
  const P = o.parents.map(i => byId.get(i));
  if (P.length === 2 && P[0] && P[1] && P[0].kind === 'axis' && P[1].kind === 'axis') {
    const ax = axisScaleRef(P[0], byId, R), ay = axisScaleRef(P[1], byId, R);
    if (ax && ay) return { ox: ax.origin, ux: ax.unit, oy: ay.origin, uy: ay.unit };
    return null;
  }
  if (P.length === 2 && isPointish(P[0]) && isPointish(P[1])) {
    const d = 'Distance(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')';
    return { ox: 'x(' + R(o.parents[0]) + ')', oy: 'y(' + R(o.parents[0]) + ')', ux: d, uy: d };
  }
  if (P.length === 1 && P[0] && CIRC_KINDS.has(P[0].kind) && P[0].parents.length >= 2) {
    const cen = P[0].parents[0], on = P[0].parents[1];
    const rad = 'Distance(' + R(cen) + ',' + R(on) + ')';
    return { ox: 'x(' + R(cen) + ')', oy: 'y(' + R(cen) + ')', ux: rad, uy: rad };
  }
  return null;
}

// Rotation angle in degrees.  GSP stores the rotation as (sin, cos) in its y-down
// frame plus a cached angle that may be in DEGREES or RADIANS depending on how the
// sketch was authored.  Derive the angle from the sine/cosine instead (y-down → y-up
// flips the sign), which is unit-independent.
function rotateAngleDeg(o) {
  const p = o.params || [];
  if (p.length >= 2 && (Math.abs(p[0]) > 1e-12 || Math.abs(p[1]) > 1e-12))
    return Math.atan2(-p[0], p[1]) * 180 / Math.PI;
  return p.length >= 3 ? p[2] : 0;
}

function straightRef(obj, byId, R) {
  const ids = [];
  const rec = o => {
    if (!o) return null;
    if (o.kind === 'segment' || o.kind === 'line2pt') {
      if (o.parents.length < 2) return null;
      ids.push(o.parents[0], o.parents[1]);
      return { p1: R(o.parents[0]), p2: R(o.parents[1]) };
    }
    if (o.kind === 'parallelLine' || o.kind === 'perpLine') {
      // .gsp stores these as [thruPt, baseStraight] (e.g. [midpoint, segment]);
      // GeoGebra's ParallelLine/PerpendicularLine take (<Point>, <Line>) too.
      if (o.parents.length < 2) return null;
      const base = rec(byId.get(o.parents[1]));
      if (!base) return null;
      ids.push(o.parents[0]);
      const P = '(' + R(o.parents[0]) + ')';
      const d = '((' + base.p2 + ')-(' + base.p1 + '))';
      const dir = o.kind === 'perpLine' ? 'PerpendicularVector(' + d + ')' : d;
      return { p1: P + '-0.5*' + dir, p2: P + '+0.5*' + dir };
    }
    if (o.kind === 'angleBisector') {
      if (o.parents.length < 3) return null;
      const A = R(o.parents[0]), B = R(o.parents[1]), C = R(o.parents[2]);
      ids.push(o.parents[0], o.parents[1], o.parents[2]);
      const c = fmt(Math.sqrt(9000) / (2 * SCALE));   // 0.5·√9000 GSP px in GeoGebra units
      const dir = '((' + c + '/Distance(' + A + ',' + B + '))*((' + A + ')-(' + B + '))'
        + '+(' + c + '/Distance(' + C + ',' + B + '))*((' + C + ')-(' + B + ')))';
      return { p1: '(' + B + ')', p2: '(' + B + ')+' + dir };
    }
    if (o.kind === 'axis') {
      // Axis4 reference pair (GSP px, y-down → GeoGebra units):
      //   horizontal: origin ± 200 px          → O ± (4,0)
      //   vertical  : origin-200 … origin-600  → O+(0,4) … O+(0,12)
      if (o.parents.length < 1 || !isPointish(byId.get(o.parents[0]))) return null;
      ids.push(o.parents[0]);
      const O = '(' + R(o.parents[0]) + ')';
      return axisHorizontal(o)
        ? { p1: O + '+(-4,0)', p2: O + '+(4,0)' }
        : { p1: O + '+(0,4)', p2: O + '+(0,12)' };
    }
    // Affine image of a straight: transform its two defining points.  This lets a
    // reflected/rotated/translated segment act as the mirror of another reflection.
    if (XFORM_KINDS.has(o.kind) && o.parents.length >= 1) {
      const base = rec(byId.get(o.parents[0]));
      if (!base) return null;
      if (o.kind === 'translateImage' && o.parents.length === 3) {
        ids.push(o.parents[1], o.parents[2]);
        const v = 'Vector(' + R(o.parents[1]) + ',' + R(o.parents[2]) + ')';
        return { p1: 'Translate(' + base.p1 + ',' + v + ')', p2: 'Translate(' + base.p2 + ',' + v + ')' };
      }
      if (o.kind === 'rotateImage' && o.parents.length === 2 && o.params.length >= 3) {
        ids.push(o.parents[1]);
        const a = fmt(rotateAngleDeg(o)) + '\u00B0', c = R(o.parents[1]);
        return { p1: 'Rotate(' + base.p1 + ',' + a + ',' + c + ')', p2: 'Rotate(' + base.p2 + ',' + a + ',' + c + ')' };
      }
      if (o.kind === 'dilateImage' && o.parents.length === 2 && o.params.length >= 1) {
        ids.push(o.parents[1]);
        const r0 = fmt(o.params[0]), c = R(o.parents[1]);
        return { p1: 'Dilate(' + base.p1 + ',' + r0 + ',' + c + ')', p2: 'Dilate(' + base.p2 + ',' + r0 + ',' + c + ')' };
      }
      if (o.kind === 'markedAngleRotate' && o.parents.length === 5) {
        ids.push(o.parents[1], o.parents[2], o.parents[3], o.parents[4]);
        const a = 'Angle(' + R(o.parents[2]) + ',' + R(o.parents[3]) + ',' + R(o.parents[4]) + ')';
        const c = R(o.parents[1]);
        return { p1: 'Rotate(' + base.p1 + ',' + a + ',' + c + ')', p2: 'Rotate(' + base.p2 + ',' + a + ',' + c + ')' };
      }
      if (o.kind === 'segRatioDilate' && o.parents.length === 4) {
        ids.push(o.parents[1], o.parents[2], o.parents[3]);
        const r0 = 'Length(' + R(o.parents[2]) + ')/Length(' + R(o.parents[3]) + ')';
        const c = R(o.parents[1]);
        return { p1: 'Dilate(' + base.p1 + ',' + r0 + ',' + c + ')', p2: 'Dilate(' + base.p2 + ',' + r0 + ',' + c + ')' };
      }
      if (o.kind === 'measuredAngleRotate' && o.parents.length === 3) {
        const tri = angleTriple(byId.get(o.parents[2]), byId);
        if (!tri) return null;
        ids.push(o.parents[1], ...tri);
        const a = 'Angle(' + tri.map(R).join(',') + ')';
        const c = R(o.parents[1]);
        return { p1: 'Rotate(' + base.p1 + ',' + a + ',' + c + ')', p2: 'Rotate(' + base.p2 + ',' + a + ',' + c + ')' };
      }
      if (o.kind === 'markedRatioDilate' && o.parents.length === 3) {
        const r0 = ratioInfo(byId.get(o.parents[2]), byId);
        if (!r0) return null;
        ids.push(o.parents[1], ...r0.ids);
        const c = R(o.parents[1]);
        return { p1: 'Dilate(' + base.p1 + ',' + r0.tpl + ',' + c + ')', p2: 'Dilate(' + base.p2 + ',' + r0.tpl + ',' + c + ')' };
      }
      if (o.kind === 'reflectImage' && o.parents.length === 2) {
        const mObj = byId.get(o.parents[1]);
        if (isPointish(mObj)) {
          ids.push(o.parents[1]);
          const m = R(o.parents[1]);
          return { p1: 'Reflect(' + base.p1 + ',' + m + ')', p2: 'Reflect(' + base.p2 + ',' + m + ')' };
        }
        const mb = rec(mObj);
        if (!mb) return null;
        const ml = 'Line(' + mb.p1 + ',' + mb.p2 + ')';
        return { p1: 'Reflect(' + base.p1 + ',' + ml + ')', p2: 'Reflect(' + base.p2 + ',' + ml + ')' };
      }
      return null;
    }
    return null;
  };
  const r = rec(obj);
  return r ? { p1: r.p1, p2: r.p2, ids: [...new Set(ids)] } : null;
}

// ---------- planning: IR object -> emitable plan ----------
// plan = { skip: why } | { elem, exprTpl?, args?, free:{xy|value}, label?, warn? }
// exprTpl uses {#id} tokens replaced with final labels.
function planOf(o, byId) {
  const P = o.parents.map(id => byId.get(id)).filter(Boolean);
  const R = id => '{#' + id + '}';
  const skip = why => ({ skip: why });
  const frame = byId.frame, plotted = byId.plotted;
  const toPt = c => frame ? frame.pt(c) : toGgb(c, o._unit);

  switch (o.kind) {
    case 'free':
      if (o.coords) {
        const g = toPt(o.coords);
        return { elem: 'point', free: { xy: g } };
      }
      {
        const dec = decodedExpr(o);      // free number / parameter: value stored as a constant program
        if (dec) {
          if (usesX(dec.exprTpl) || (plotted && plotted.has(o.id)))
            return { elem: 'function', exprTpl: dec.exprTpl, args: dec.args };
          const cv = constValue(dec.exprTpl);
          if (cv !== null) return { elem: 'numeric', free: { value: cv } };
          return { elem: 'numeric', exprTpl: dec.exprTpl, args: dec.args };
        }
      }
      if (o._raw && o._raw.rich && o._raw.rich[2311])
        return skip('free object expression (tag 2311) not decodable');
      if (/^[A-Za-z]\d{0,2}$/.test(o.label))
        return { elem: 'numeric', free: { value: 0, assumed: true },
          warn: 'free number "' + o.label + '": value not stored in GSP, assumed 0' };
      if (o.label)
        return { elem: 'text', exprTpl: '"' + o.label.replace(/"/g, "'") + '"' };
      return { elem: 'numeric', free: { value: 0, assumed: true }, warn: 'free value-less object assumed 0' };

    case 'segment':
      if (P.length === 2) return { elem: 'segment', exprTpl: 'Segment(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      return skip('segment needs 2 parents');
    case 'line2pt':
      if (P.length === 2) return { elem: 'line', exprTpl: 'Line(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      return skip('line needs 2 parents');
    case 'midpoint':
      if (P.length === 2) return { elem: 'point', exprTpl: 'Midpoint(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      if (P.length === 1) return { elem: 'point', exprTpl: 'Midpoint(' + R(o.parents[0]) + ')', args: o.parents };
      return skip('midpoint needs 1-2 parents');
    case 'circleOn':
      if (P.length === 2) return { elem: 'conic', exprTpl: 'Circle(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      return skip('circle needs 2 parents');
    case 'circleRadiusSeg':
      if (P.length === 2) return { elem: 'conic', exprTpl: 'Circle(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      return skip('circle needs center+segment');
    case 'circleRadiusObj':
      if (P.length === 2 && SEG_KINDS.has(P[1].kind))
        return { elem: 'conic', exprTpl: 'Circle(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      if (P.length === 2 && isPointish(P[1]))
        return { elem: 'conic', exprTpl: 'Circle(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      return skip('radius object unsupported (vector radius)');
    case 'perpLine':
      if (P.length === 2) return { elem: 'line', exprTpl: 'PerpendicularLine(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      return skip('perp line needs 2 parents');
    case 'parallelLine':
      if (P.length === 2) return { elem: 'line', exprTpl: 'ParallelLine(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      return skip('parallel line needs 2 parents');
    case 'angleBisector':
      if (P.length === 3) return { elem: 'line', exprTpl: 'AngleBisector(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ',' + R(o.parents[2]) + ')', args: o.parents };
      return skip('bisector needs 3 parents');
    case 'axis': {
      if (P.length < 1) return skip('axis needs origin');
      const O = R(o.parents[0]);
      const d = axisHorizontal(o) ? '(1,0)' : '(0,1)';
      return { elem: 'line', exprTpl: 'Line(' + O + ',' + O + '+' + d + ')', args: [o.parents[0]],
        warn: 'coordinate axis emitted as line through its origin' };
    }
    case 'coordsys':
      return skip('coordinate system (internal; not a GeoGebra object)');
    case 'plotPoint': {
      if (P.length < 1 || o.params.length < 2) return skip('plot point needs coord sys + (x,y)');
      const cs = coordSysRef(P[0], byId, R);
      if (!cs) return skip('plot point: coordinate system not computable');
      const x = fmt(o.params[0]), y = fmt(o.params[1]);
      return { elem: 'point',
        exprTpl: '(' + cs.ox + ' + (' + x + ')*(' + cs.ux + '), ' + cs.oy + ' - (' + y + ')*(' + cs.uy + '))',
        warn: 'fixed-coordinate plot point in a custom coordinate system' };
    }
    case 'coordPair': {
      if (P.length < 2 || !isPointish(P[0])) return skip('coordinate pair needs point + coord sys');
      const cs = coordSysRef(P[1], byId, R);
      if (!cs) return skip('coordinate pair: coordinate system not computable');
      const xv = '(x(' + R(o.parents[0]) + ') - (' + cs.ox + '))/(' + cs.ux + ')';
      const yv = '-(y(' + R(o.parents[0]) + ') - (' + cs.oy + '))/(' + cs.uy + ')';
      return { elem: 'text', exprTpl: '"(" + (' + xv + ') + ", " + (' + yv + ') + ")"',
        warn: 'coordinate-pair readout rendered as dynamic text' };
    }
    case 'intersectLL':
      if (P.length === 2) return { elem: 'point', exprTpl: 'Intersect(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      return skip('intersect needs 2 parents');
    case 'intersectLC1': case 'intersectLC2':
      if (P.length === 2) {
        const idx = o.kind === 'intersectLC1' ? 1 : 2;
        return { elem: 'point', exprTpl: 'Intersect(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ',' + idx + ')', args: o.parents,
          warn: 'line-circle root ' + idx + ' (index form unverified)' };
      }
      return skip('intersect needs 2 parents');
    case 'intersectCC1': case 'intersectCC2':
      if (P.length === 2) {
        const idx = o.kind === 'intersectCC1' ? 1 : 2;
        return { elem: 'point', exprTpl: 'Intersect(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ',' + idx + ')', args: o.parents,
          warn: 'circle-circle root ' + idx + ' (index form unverified)' };
      }
      return skip('intersect needs 2 parents');
    case 'pointOnPath': {
      if (P.length < 1) return skip('point-on-path needs parent');
      const path = P[0], t = (o.params && o.params.length) ? o.params[0] : null;
      // straight of any kind (segment/line/perp/parallel/bisector): exact reference pair
      if (path && t !== null && (SEG_KINDS.has(path.kind) || LINE_KINDS.has(path.kind))) {
        // A point on a *segment* carries the segment's own fraction, so emit it as a real
        // path point: GeoGebra then keeps it constrained to (and animatable along) the
        // segment.  For lines / derived straights GSP's φ is relative to a reference pair
        // that need not be the path's own defining points, so the coordinate form is used.
        if (SEG_KINDS.has(path.kind)) {
          // Seed the point's position with <coords> instead of a parameter: a free
          // path point stays changeable, so an animate button can act on it (see
          // gspPosXY).  Keep the parameterised form only when the position is
          // unknown — geometry stays exact, it just cannot be animated.
          const xy = gspPosXY(o, byId, 0);
          if (xy) return { elem: 'point', exprTpl: 'Point(' + R(path.id) + ')',
            args: [path.id], pathXY: toPt(xy) };
          return { elem: 'point', exprTpl: 'Point(' + R(path.id) + ',' + fmt(t) + ')',
            args: [path.id], noAnim: true, warn: 'point on segment: position not computable, kept fixed' };
        }
        const ref = straightRef(path, byId, R);
        if (ref) return { elem: 'point',
          exprTpl: '(' + ref.p1 + ') + ' + fmt(t) + ' * ((' + ref.p2 + ') - (' + ref.p1 + '))',
          args: [path.id].concat(ref.ids),
          warn: (path.kind === 'perpLine' || path.kind === 'parallelLine' || path.kind === 'angleBisector')
            ? 'point on ' + path.kind + ' via GSP reference parameter' : undefined };
      }
      // polygon boundary: GSP stores offset = edgeIndex + φ (gPolygon.mapOffsetToPoint);
      // GeoGebra's polygon path parameter is (edgeIndex + φ)/n, n = vertex count.
      if (path && path.kind === 'polygon' && t !== null && path.parents.length >= 3) {
        const xy = gspPosXY(o, byId, 0);
        if (xy) return { elem: 'point', exprTpl: 'Point(' + R(path.id) + ')',
          args: [path.id], pathXY: toPt(xy), warn: 'point on polygon boundary as free-on-path point' };
        return { elem: 'point', exprTpl: 'Point(' + R(path.id) + ',' + fmt(t / path.parents.length) + ')',
          args: [path.id], noAnim: true, warn: 'point on polygon boundary (offset/n)' };
      }
      // transformed path: affine images preserve the fraction φ (segments) and
      // the offset (polygons), and GeoGebra's Point(path, t) uses the same segment
      // fraction / polygon (offset/n) parameter.
      if (path && t !== null && XFORM_KINDS.has(path.kind)) {
        let cur = path, g = 0;
        while (cur && XFORM_KINDS.has(cur.kind) && g++ < 16) cur = byId.get(cur.parents[0]);
        if (cur && cur.kind === 'segment') {
          return { elem: 'point', exprTpl: 'Point(' + R(path.id) + ',' + fmt(t) + ')',
            args: [path.id], noAnim: true, warn: 'point on transformed segment via path parameter' };
        }
        if (cur && cur.kind === 'polygon' && cur.parents.length >= 3) {
          return { elem: 'point', exprTpl: 'Point(' + R(path.id) + ',' + fmt(t / cur.parents.length) + ')',
            args: [path.id], noAnim: true, warn: 'point on transformed polygon (offset/n)' };
        }
      }
      // circle path: the two-parameter form is a unit direction (cos,sin) in a y-up frame
      // (see gspPosXY).  Emit a real free-on-path point — Point(circle) + <coords> — so it
      // stays constrained to (and animatable along) the circle.  When the position is not
      // computable (unresolvable centre/radius, or the one-parameter form whose meaning is
      // not decoded) keep the relation as a bare Point(circle) and leave the initial
      // parameter to GeoGebra rather than guess.
      if (path && CIRC_KINDS.has(path.kind) && path.parents.length === 2) {
        const ps = o.params || [];
        const n = ps.length >= 2 ? Math.hypot(ps[0], ps[1]) : 0;
        const unitDir = ps.length >= 2 && n > 0.9 && n < 1.1;
        const xy = unitDir ? gspPosXY(o, byId, 0) : null;
        if (xy) return { elem: 'point', exprTpl: 'Point(' + R(path.id) + ')',
          args: [path.id], pathXY: toPt(xy), warn: 'point on circle as free-on-path point' };
        return { elem: 'point', exprTpl: 'Point(' + R(path.id) + ')', args: [path.id],
          warn: unitDir
            ? 'point on circle: position not computable (initial position left to GeoGebra)'
            : 'point on circle: stored parameter form not decodable (initial position left to GeoGebra)' };
      }
      // function plot (t72): the plot's tag-2306 record stores the x-domain [xmin, xmax] in
      // frame units and the point parameter is the fraction along it, so x = xmin + t·(xmax-xmin)
      // and the point is (x, f(x)) on the plotted function object (the plot's first parent).
      if (path && path.srcType === 72 && t !== null) {
        const fn = path.parents && path.parents[0];
        const dom = plotDomain(path);
        if (fn != null && dom && Number.isFinite(dom[0]) && Number.isFinite(dom[1])) {
          const x0 = dom[0] + t * (dom[1] - dom[0]);
          return { elem: 'point',
            exprTpl: '(' + fmt(x0) + ',' + R(fn) + '(' + fmt(x0) + '))',
            args: [fn], warn: 'point on function plot (domain fraction)' };
        }
        return skip('point on function plot without decodable function/domain');
      }
      return skip('point on unsupported path (falls back nowhere)');
    }
    case 'translateImage':
      if (P.length === 3) return { elem: elemTypeOf(o, byId),
        exprTpl: 'Translate(' + R(o.parents[0]) + ',Vector(' + R(o.parents[1]) + ',' + R(o.parents[2]) + '))',
        args: o.parents };
      return skip('translate needs preimage + 2 vector points');
    case 'rotateImage':
      if (P.length === 2 && o.params.length >= 3)
        return { elem: elemTypeOf(o, byId),
          exprTpl: 'Rotate(' + R(o.parents[0]) + ',' + fmt(rotateAngleDeg(o)) + '\u00B0,' + R(o.parents[1]) + ')',
          args: o.parents };
      return skip('rotate needs preimage+center+angle');
    case 'dilateImage':
      if (P.length === 2 && o.params.length >= 1)
        return { elem: elemTypeOf(o, byId),
          exprTpl: 'Dilate(' + R(o.parents[0]) + ',' + fmt(o.params[0]) + ',' + R(o.parents[1]) + ')',
          args: o.parents };
      return skip('dilation needs preimage+center+ratio');
    case 'markedAngleRotate':
      // MarkedAngleRotation(center, A, B, C): rotate by the (dynamic) angle ∠ABC.
      if (P.length === 5)
        return { elem: elemTypeOf(o, byId),
          exprTpl: 'Rotate(' + R(o.parents[0]) + ',Angle(' + R(o.parents[2]) + ',' + R(o.parents[3]) +
            ',' + R(o.parents[4]) + '),' + R(o.parents[1]) + ')',
          args: o.parents };
      return skip('marked-angle rotation needs preimage+center+A+B+C');
    case 'segRatioDilate':
      // Dilation2S(center, numSeg, denomSeg): scale = |numSeg| / |denomSeg|.
      if (P.length === 4)
        return { elem: elemTypeOf(o, byId),
          exprTpl: 'Dilate(' + R(o.parents[0]) + ',Length(' + R(o.parents[2]) + ')/Length(' + R(o.parents[3]) +
            '),' + R(o.parents[1]) + ')',
          args: o.parents };
      return skip('segment-ratio dilation needs preimage+center+numSeg+denomSeg');
    case 'measuredAngleRotate': {
      // MeasuredAngleRotation(center, measure): rotate by the value of an angle
      // measure (t41 angle / t120 angle value, possibly wrapped in a t48 label).
      if (P.length !== 3) return skip('measured-angle rotation needs preimage+center+measure');
      const mk = byId.get(o.parents[2]);
      const tri = angleTriple(mk, byId);
      if (tri) return { elem: elemTypeOf(o, byId),
        exprTpl: 'Rotate(' + R(o.parents[0]) + ',Angle(' + tri.map(R).join(',') + '),' + R(o.parents[1]) + ')',
        args: [o.parents[0], o.parents[1]].concat(tri),
        warn: 'rotation by a measured angle (direction from Angle(A,B,C))' };
      // The marker's own tag-2311 program is the marked angle itself. GSP stores
      // angles in radians and GeoGebra also interprets a bare number in an angle
      // context as radians, so the decoded value is used directly.
      const dec = decodedExpr(mk);
      if (dec && !usesX(dec.exprTpl)) return { elem: elemTypeOf(o, byId),
        exprTpl: 'Rotate(' + R(o.parents[0]) + ',' + dec.exprTpl + ',' + R(o.parents[1]) + ')',
        args: [o.parents[0], o.parents[1]].concat(dec.args),
        warn: 'rotation by marked angle (tag 2311 decoded; value used as radians)' };
      return skip('measured angle value not decodable (tag 2311)');
    }
    case 'markedRatioDilate': {
      // DilationMR(center, ratioMeasure): scale by a measured ratio. The marker may
      // be a t47 ratio of two segments or of three points, or any marked number whose
      // value is stored in its tag-2311 program (the dilation factor is
      // dimensionless, so the decoded value is used verbatim).
      if (P.length !== 3) return skip('marked-ratio dilation needs preimage+center+ratio');
      const mk = byId.get(o.parents[2]);
      const r = ratioInfo(mk, byId);
      if (r) {
        // The ratio measure (when resolved through a t48 label wrapper) is emitted as
        // a numeric object, so reference it instead of duplicating the expression.
        const src = r.obj;
        if (src && src.srcType === 47)
          return { elem: elemTypeOf(o, byId),
            exprTpl: 'Dilate(' + R(o.parents[0]) + ',' + R(src.id) + ',' + R(o.parents[1]) + ')',
            args: [o.parents[0], o.parents[1], src.id],
            warn: 'dilation by a measured ratio' };
        return { elem: elemTypeOf(o, byId),
          exprTpl: 'Dilate(' + R(o.parents[0]) + ',' + r.tpl + ',' + R(o.parents[1]) + ')',
          args: [o.parents[0], o.parents[1]].concat(r.ids),
          warn: 'dilation by a measured ratio' };
      }
      const dec = decodedExpr(mk);
      if (dec && !usesX(dec.exprTpl)) return { elem: elemTypeOf(o, byId),
        exprTpl: 'Dilate(' + R(o.parents[0]) + ',' + dec.exprTpl + ',' + R(o.parents[1]) + ')',
        args: [o.parents[0], o.parents[1]].concat(dec.args),
        warn: 'dilation by marked value (tag 2311 decoded; scale = marker value)' };
      return skip('marked-ratio value not decodable (tag 2311)');
    }
    case 'implicitRotate':
      return skip('rotation about an implicit/marked center not decodable (arity 1, tag 2311)');
    case 'unitX':
      if (o.params.length >= 1) {
        const org = unitPointOrigin(o, byId);
        const u = frame ? frame.uxLen : SCALE;
        if (org) return { elem: 'point', exprTpl: '(' + R(org) + ') + (' + fmt(o.params[0] / u) + ',0)', args: [org] };
      }
      return skip('unit point needs origin+dx');
    case 'offsetPoint':
      if (P.length >= 1 && o.params.length >= 2)
        return { elem: 'point',
          exprTpl: '(' + R(o.parents[0]) + ') + (' + fmt(o.params[0] / SCALE) + ',' + fmt(-o.params[1] / SCALE) + ')',
          args: [o.parents[0]], warn: 'offset point (t17): direction convention assumed y-down' };
      return skip('offset point needs parent + (dx,dy)');
    case 'squareUnitY':
    case 'rectUnitY':
      {
        const org = unitPointOrigin(o, byId);
        const s = unitScaleOf(o, byId, 0);
        if (org && s != null) {
          const u = frame ? frame.uyLen : SCALE;
          return { elem: 'point', exprTpl: '(' + R(org) + ') + (0,' + fmt(s / u) + ')', args: [org] };
        }
      }
      return skip('vertical unit point needs origin+scale');
    case 'foot':
      if (P.length === 2) return { elem: 'point', exprTpl: 'Foot(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      return skip('foot needs point+line');
    case 'reflectImage': {
      if (P.length !== 2) return skip('reflection needs preimage+mirror');
      const pre = P[0], mir = P[1];
      // The mirror may be a line (used directly — including affine images of lines),
      // a segment (use its supporting line, incl. transformed segments),
      // or a point (central reflection).
      const mt = elemTypeOf(mir, byId);
      if (isPointish(mir))
        return { elem: elemTypeOf(pre, byId),
          exprTpl: 'Reflect(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      // Reflection in a circle = inversion.  GSP's Reflect accepts a circle mirror
      // just like GeoGebra's Reflect(<Object>, <Circle>), so map it straight through.
      if (mt === 'conic')
        return { elem: elemTypeOf(pre, byId),
          exprTpl: 'Reflect(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents,
          warn: 'reflection in a circle (inversion)' };
      if (mt === 'line' && (LINE_KINDS.has(mir.kind) || XFORM_KINDS.has(mir.kind)))
        return { elem: elemTypeOf(pre, byId),
          exprTpl: 'Reflect(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      const ref = straightRef(mir, byId, R);
      if (ref)
        return { elem: elemTypeOf(pre, byId),
          exprTpl: 'Reflect(' + R(o.parents[0]) + ',Line(' + ref.p1 + ',' + ref.p2 + '))',
          args: [o.parents[0]].concat(ref.ids) };
      return skip('reflection mirror unsupported');
    }
    case 'polygon': {
      if (P.length < 3) return skip('polygon needs >=3 vertices');
      if (!P.every(isPointish)) return skip('polygon vertices must all be points');
      return { elem: 'polygon', exprTpl: 'Polygon(' + o.parents.map(R).join(',') + ')', args: o.parents };
    }
    case 'angleMeasure':
    case 'angle':
      if (P.length === 3 && P.every(isPointish))
        return { elem: 'numeric', exprTpl: 'Angle(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ',' + R(o.parents[2]) + ')', args: o.parents };
      return skip('angle needs 3 points');
    case 'angleValue':
      if (P.length === 1 && NUM_KINDS.has(P[0].kind))
        return { elem: 'numeric', exprTpl: R(o.parents[0]), args: o.parents };
      return skip('angle value needs angle parent');
    case 'measureLengthSeg':
      if (P.length === 1) return { elem: 'numeric', exprTpl: 'Length(' + R(o.parents[0]) + ')', args: o.parents };
      return skip('length measure needs segment');
    case 'measureDistance':
      if (P.length === 1) return { elem: 'numeric', exprTpl: 'Length(' + R(o.parents[0]) + ')', args: o.parents };
      if (P.length === 2 && P.every(isPointish))
        return { elem: 'numeric', exprTpl: 'Distance(' + R(o.parents[0]) + ',' + R(o.parents[1]) + ')', args: o.parents };
      return skip('distance measure: unsupported parents');
    case 'measureSlope':
      if (P.length >= 1) return { elem: 'numeric', exprTpl: 'Slope(' + R(o.parents[0]) + ')', args: [o.parents[0]] };
      return skip('slope measure needs line/segment');
    case 'ratioMeasure': {
      const r = ratioTemplate(o, byId);
      if (r) return { elem: 'numeric', exprTpl: r.tpl, args: r.ids };
      return skip('ratio measure: unsupported parents');
    }
    case 'deltaX':
      if (P.length === 2) return { elem: 'numeric', exprTpl: 'x(' + R(o.parents[0]) + ')-x(' + R(o.parents[1]) + ')', args: o.parents, warn: 'dx sign/order unverified' };
      return skip('dx needs 2 parents');
    case 'deltaY':
      if (P.length === 2) return { elem: 'numeric', exprTpl: 'y(' + R(o.parents[0]) + ')-y(' + R(o.parents[1]) + ')', args: o.parents, warn: 'dy sign/order unverified' };
      return skip('dy needs 2 parents');
    case 'calc': {
      // label = formula template with {n} = nth parent (e.g. "=({2})+({3})")
      const tpl = (o.label || '').replace(/^=/, '');
      if (!/\{\d+\}/.test(tpl)) return skip('calc without {n} template');
      const ids = [];
      let bad = false;
      const exprTpl = tpl.replace(/\{(\d+)\}/g, (m, n) => {
        const idx = parseInt(n, 10) - 1;
        if (idx < 0 || idx >= o.parents.length) { bad = true; return m; }
        ids.push(o.parents[idx]);
        return '{#' + o.parents[idx] + '}';
      });
      if (bad || !ids.length) return skip('calc template refs out of range');
      return { elem: 'numeric', exprTpl, args: ids, warn: 'calc operator set best-effort' };
    }
    case 'text': {
      if (o.msg) {                       // FixedText: message stored inline (tag 2300)
        const s = String(o.msg).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
          .replace(/[\r\n]+/g, ' ');
        return { elem: 'text', exprTpl: '"' + s + '"' };
      }
      {
        const dec = decodedExpr(o);      // t48 "Calculate" object: a stored numeric/functional expression
        if (dec) {
          if (usesX(dec.exprTpl)) return { elem: 'function', exprTpl: dec.exprTpl, args: dec.args };
          return { elem: 'numeric', exprTpl: dec.exprTpl, args: dec.args };
        }
      }
      const l = o.label || '';
      if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef ]{1,}/.test(l) || l.length > 14)
        return { elem: 'text', exprTpl: '"' + l.replace(/"/g, "'") + '"' };
      return skip('text/metric content (tag 2311) not decodable');
    }
    case 'polygonOrButton':
      return skip('polygon/button hybrid (not geometry)');
    case 'button': {
      const b = o.button;
      if (!b) return skip('action button without metadata');
      if (!o.parents.length) return skip('action button without targets');
      const bx = Math.max(0, Math.min(GEO_W - 140, b.left));
      const by = Math.max(0, Math.min(GEO_H - 40, b.top));
      // kind 0/1 = hide/show the parent objects; kind 2 = animate the parent point(s)
      // along their path.  Other kinds (move/scroll/simultaneous) have no faithful
      // GeoGebra equivalent and are skipped rather than guessed at.
      if (b.code === 0 || b.code === 1)
        return { elem: 'button', args: o.parents,
          btn: { x: bx, y: by, targets: o.parents.slice(), verb: b.code === 0 ? 'hide' : 'show' } };
      if (b.code === 2) {
        // The animate targets are narrowed after planning (step 2), when we know
        // which objects became animatable (a free-on-path point or an independent
        // slider).  A GSP animate button can also drive a plain parameter, which
        // our converter emits as a GeoGebra numeric.
        return { elem: 'button', args: o.parents.slice(),
          btn: { x: bx, y: by, targets: o.parents.slice(), verb: 'animate' } };
      }
      return skip('action button kind ' + b.code + ' (not converted)');
    }
    default: {
      // GSP function (t71) and derivative (t78) objects store their definition
      // in a tag-2311 program; t72 is the plot, which GeoGebra draws from the
      // function itself.
      if (o.srcType === 72) return skip('function plot (recreated by its function)');
      if (o.srcType === 71 || o.srcType === 78) {
        const dec = decodedExpr(o);
        if (dec) return { elem: 'function', exprTpl: dec.exprTpl, args: dec.args };
        return skip('function definition (tag 2311) not decodable');
      }
      // unknown type
      if (o.coords) {
        const g = toPt(o.coords);
        return { elem: 'point', free: { xy: g }, warn: 'unknown GSP type ' + o.srcType + ' shown as free point' };
      }
      return skip('unknown GSP type ' + o.srcType + ' (no coords)');
    }
  }
}

// ---------- header template (structure copied from known-good GeoGebra 4.2 file) ----------
// NOTE: element names/enums here are exactly those GeoGebra accepts; using e.g.
// <angleUnit val="0"/> or <coordMode>/<missingsVal> makes GeoGebra 5.4 refuse the file.
function header(title, xZero, yZero, scale, yscale) {
  if (yscale == null) yscale = scale;
  const id = 'gspconv-' + Date.now().toString(16) + '-' + Math.floor(Math.random() * 1e9).toString(16);
  const W = GEO_W, H = GEO_H;
  return '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<geogebra format="4.2" id="' + id + '"  ' +
    'xsi:noNamespaceSchemaLocation="http://www.geogebra.org/ggb.xsd" xmlns="" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >\n' +
    '<gui>\n' +
    '\t<window width="' + W + '" height="' + H + '" />\n' +
    '\t<perspectives>\n<perspective id="tmp">\n' +
    '\t<panes>\n\t\t<pane location="" divider="Infinity" orientation="1" />\n\t</panes>\n' +
    '\t<views>\n' +
    '\t\t<view id="4" toolbar="0 || 2020 , 2021 , 2022 , 66 || 2001 , 2003 , 2002 , 2004 , 2005 || 2040 , 2041 , 2042 , 2044 , 2043" visible="false" inframe="false" stylebar="false" location="1,1" size="300" window="100,100,600,400" />\n' +
    '\t\t<view id="8" toolbar="1001 | 1002 | 1003  || 1005 | 1004 || 1006 | 1007 || 1008 1009" visible="false" inframe="false" stylebar="false" location="1,3" size="300" window="100,100,600,400" />\n' +
    '\t\t<view id="1" visible="true" inframe="false" stylebar="false" location="1" size="' + Math.round(W * 0.7) + '" window="100,100,600,400" />\n' +
    '\t\t<view id="2" visible="true" inframe="false" stylebar="false" location="3" size="' + Math.round(W * 0.3) + '" window="100,100,250,400" />\n' +
    '\t\t<view id="16" visible="false" inframe="true" stylebar="false" location="1" size="150" window="50,50,500,500" />\n' +
    '\t\t<view id="32" visible="false" inframe="true" stylebar="true" location="1" size="150" window="50,50,500,500" />\n' +
    '\t\t<view id="64" visible="false" inframe="true" stylebar="false" location="1" size="150" window="50,50,500,500" />\n' +
    '\t</views>\n' +
    '\t<toolbar show="true" items="0 39 59 || 1 501 5 19 67 72 | 2 15 45 18 , 7 37 | 4 3 8 9 , 13 44 , 58 , 47 || 16 51 64 70 65 | 10 34 53 11 , 24  20 22 , 21 23 | 55 56 57 , 12 || 36 46 , 38 49 50 , 71 | 30 29 54 32 31 33 | 17 26 62 , 14 66 68 | 25 52 60 61 || 40 41 42 , 27 28 35 , 6" />\n' +
    '\t<input show="true" cmd="true" top="false" />\n' +
    '</perspective>\n\t</perspectives>\n' +
    '\t<labelingStyle  val="3"/>\n\t<font  size="12"/>\n' +
    '\t<graphicsSettings javaLatexFonts="false"/>\n' +
    '\t<consProtColumns  col0="true" col1="true" col2="false" col3="true" col4="false" col5="true" col6="true" col7="false"/>\n' +
    '\t<consProtocol useColors="true" addIcons="false" showOnlyBreakpoints="false"/>\n' +
    '</gui>\n' +
    '<euclidianView>\n' +
    '\t<size  width="' + W + '" height="' + H + '"/>\n' +
    '\t<coordSystem xZero="' + fmt(xZero) + '" yZero="' + fmt(yZero) + '" scale="' + fmt(scale) + '" yscale="' + fmt(yscale) + '"/>\n' +
    '\t<evSettings axes="true" grid="false" gridIsBold="false" pointCapturing="3" rightAngleStyle="2" checkboxSize="13" gridType="0"/>\n' +
    '\t<bgColor r="255" g="255" b="255"/>\n' +
    '\t<axesColor r="0" g="0" b="0"/>\n' +
    '\t<gridColor r="192" g="192" b="192"/>\n' +
    '\t<lineStyle axes="1" grid="10"/>\n' +
    '\t<axis id="0" show="true" label="" unitLabel="" tickStyle="1" showNumbers="true"/>\n' +
    '\t<axis id="1" show="true" label="" unitLabel="" tickStyle="1" showNumbers="true"/>\n' +
    '</euclidianView>\n' +
    '<kernel>\n' +
    '\t<continuous val="false"/>\n\t<decimals val="2"/>\n\t<angleUnit val="degree"/>\n' +
    '\t<algebraStyle val="0"/>\n\t<coordStyle val="0"/>\n\t<angleFromInvTrig val="false"/>\n' +
    '</kernel>\n' +
    '<scripting blocked="false" disabled="false"/>\n' +
    '<construction title="' + xmlEsc(title || '') + '" author="" date="">\n';
}

function styleOf(o) {
  const s = (o.style || {});
  let r = 0, g = 0, b = 0;
  if (typeof s.color === 'number') { r = s.color & 0xff; g = (s.color >> 8) & 0xff; b = (s.color >> 16) & 0xff; }
  return r + ',' + g + ',' + b;
}

// ---------- main writer ----------
function irToGgb(ir) {
  const byId = new Map();
  for (const o of ir.objects) { o._unit = ir.meta && ir.meta.unit ? ir.meta.unit : 'gsp'; o._byId = byId; byId.set(o.id, o); }

  // 0) sketch coordinate frame (custom axes) + which functions are plotted (t72).
  // The frame is only applied when the sketch actually contains functions: that is where
  // GSP's own coordinate units and sketch-pixel space disagree.  Everything else keeps the
  // plain pixel mapping (and the sketch's axes are drawn as ordinary lines).
  const hasFn = ir.objects.some(o => o.srcType === 72 || o.srcType === 71 || o.srcType === 78);
  byId.frame = hasFn ? sketchFrame(ir, byId) : null;
  byId.plotted = new Map();
  for (const o of ir.objects) {
    if (o.srcType === 72 && o.parents && o.parents.length) {
      const d = plotDomain(o);
      byId.plotted.set(o.parents[0], { xmin: d ? d[0] : null, xmax: d ? d[1] : null });
    }
  }

  // 1) plan every object
  const plans = new Map();
  for (const o of ir.objects) {
    let p;
    try { p = planOf(o, byId); } catch (e) { p = { skip: 'planner error: ' + e.message }; }
    plans.set(o.id, p);
  }
  // 2) cascade: drop objects whose {#id} refs are not emitable
  let changed = true;
  const emit = id => { const p = plans.get(id); return p && !p.skip; };
  while (changed) {
    changed = false;
    for (const o of ir.objects) {
      const p = plans.get(o.id);
      if (!p || p.skip) continue;
      const refs = [];
      if (p.exprTpl) for (const m of p.exprTpl.matchAll(/\{#(\d+)\}/g)) refs.push(parseInt(m[1], 10));
      const bad = refs.find(id => !byId.has(id) || !emit(id));
      if (bad !== undefined) {
        plans.set(o.id, { skip: 'depends on skipped object #' + bad });
        changed = true;
      }
      // Buttons reach their targets through a click script, not an expression:
      // keep the button as long as one target survives and drop the rest.
      const p2 = plans.get(o.id);
      if (p2 && !p2.skip && p2.elem === 'button' && p2.btn) {
        let keep = p2.btn.targets.filter(id => byId.has(id) && emit(id));
        if (p2.btn.verb === 'animate') keep = keep.filter(id => planIsAnimatable(plans.get(id)));
        if (!keep.length) {
          plans.set(o.id, { skip: p2.btn.verb === 'animate'
            ? 'animate button without animatable target' : 'all button targets skipped' });
          changed = true;
        } else if (keep.length !== p2.btn.targets.length) p2.btn.targets = keep;
      }
    }
  }
  // 3) assign labels to survivors
  const used = new Set();
  const labels = new Map();
  // Reserve every explicit label first, so an earlier object's generated label can
  // never steal a later object's explicit name (e.g. unnamed segments defaulting
  // to "O" before the explicit point "O" is seen).
  const reservedFor = new Map();
  for (const o of ir.objects) {
    if (!emit(o.id)) continue;
    const base = String(o.label || '').trim();
    if (/^[A-Za-z][A-Za-z0-9_']{0,14}$/.test(base) &&
        !RESERVED.has(base) && !RESERVED.has(base.toLowerCase()) && !used.has(base)) {
      used.add(base);
      reservedFor.set(o.id, base);
    }
  }
  for (const o of ir.objects) {
    if (!emit(o.id)) continue;
    if (reservedFor.has(o.id)) { labels.set(o.id, reservedFor.get(o.id)); continue; }
    const pl = plans.get(o.id) || {};
    // name generated objects after what they became: f for functions, n for numbers,
    // text for textual annotations (GSP type 48 can be either a calculation or text).
    let stem;
    if (o.kind === 'text') stem = pl.elem === 'function' ? 'f' : pl.elem === 'numeric' ? 'n' : 'text';
    else if (pl.elem === 'function') stem = 'f';
    else if (pl.elem === 'button') stem = 'btn';
    labels.set(o.id, sanitizeLabel(o.label, used, stem));
  }
  // 4) build elements
  const warnings = (ir.warnings || []).slice();
  const emitted = [];
  const coordsAll = [];
  for (const o of ir.objects) {
    const p = plans.get(o.id);
    if (!p || p.skip) { if (o.kind !== 'free' || !o.coords) warnings.push('skip #' + o.id + ' t' + o.srcType + ' ' + o.kind + ': ' + p.skip); continue; }
    if (p.warn) warnings.push('#' + o.id + ' t' + o.srcType + ': ' + p.warn);
    if (p.free && p.free.assumed)
      warnings.push('#' + o.id + ' t' + o.srcType + ': value not stored in GSP; assumed ' + p.free.value);
    const lab = labels.get(o.id);
    const rgb = styleOf(o);
    const dep = !p.free;
    // Action buttons are GeoGebra <button> objects driven by a click script
    // (<ggbscript>), positioned with <absoluteScreenLocation>.  The script is
    // built from the (surviving) targets, so a button never references a
    // dropped object.
    if (p.elem === 'button') {
      const script = p.btn.targets.map(id => {
        const t = labels.get(id) || 'undefined_1';
        return p.btn.verb === 'show' ? 'SetVisibleInView(' + t + ',1,true)'
             : p.btn.verb === 'hide' ? 'SetVisibleInView(' + t + ',1,false)'
             : 'StartAnimation(' + t + ',true)';
      }).join('\n');
      const gspLabel = String(o.label || '').trim();
      const useCaption = !!gspLabel && gspLabel !== lab;
      let bi = '';
      bi += '\t<show object="true" label="true"/>\n';
      bi += '\t<objColor r="0" g="0" b="0" alpha="0"/>\n';
      bi += '\t<bgColor r="255" g="255" b="255" alpha="255"/>\n';
      bi += '\t<layer val="0"/>\n';
      if (useCaption) bi += '\t<caption val="' + xmlEsc(gspLabel) + '"/>\n';
      bi += '\t<labelMode val="' + (useCaption ? '3' : '0') + '"/>\n';
      bi += '\t<animation step="0.1" type="0" playing="false"/>\n';
      bi += '\t<auxiliary val="true"/>\n';
      bi += '\t<absoluteScreenLocation x="' + Math.round(p.btn.x) + '" y="' + Math.round(p.btn.y) + '"/>\n';
      bi += '\t<ggbscript val="' + xmlEsc(script).replace(/\n/g, '&#10;') + '"/>\n';
      emitted.push('<element type="button" label="' + xmlEsc(lab) + '">\n' + bi + '</element>');
      continue;
    }
    let exprLine = '';
    if (p.exprTpl) {
      let exp = p.exprTpl.replace(/\{#(\d+)\}/g, (m, id) => labels.get(parseInt(id, 10)) || 'undefined_1');
      // A function whose expression has no free variable is loaded by GeoGebra as a number
      // (rendered as a slider).  GSP stores constant functions (e.g. f(x) = sqrt(3)); write
      // them as "<label>(x)=..." so GeoGebra keeps the function and draws its graph.
      if (p.elem === 'function' && !usesX(exp)) exp = lab + '(x)=' + exp;
      exprLine = '<expression label="' + xmlEsc(lab) + '" exp="' + xmlEsc(exp) + '" />\n';
    }
    let inner = '';
    // A dependent number is a GSP measurement read-out (slope / length / angle / ratio ...).
    // GeoGebra draws *every* shown number as a slider-like figure, which is not what GSP
    // shows, so keep measurements out of the graphics view.  Free numbers (parameters) stay
    // visible as draggable sliders, the idiomatic GeoGebra representation of a GSP parameter.
    const showObj = p.elem !== 'numeric' || !dep;
    inner += '\t<show object="' + (showObj ? 'true' : 'false') + '" label="' + (dep ? 'false' : 'true') + '"/>\n';
    inner += '\t<objColor r="' + rgb.split(',')[0] + '" g="' + rgb.split(',')[1] + '" b="' + rgb.split(',')[2] + '" alpha="0"/>\n';
    inner += '\t<layer val="0"/>\n';
    inner += '\t<labelMode val="0"/>\n';
    if (p.elem === 'point') {
      if (p.free && p.free.xy) {
        inner += '\t<coords x="' + fmt(p.free.xy.x) + '" y="' + fmt(p.free.xy.y) + '" z="1"/>\n';
        coordsAll.push(p.free.xy);
      } else if (p.pathXY) {
        // A free-on-path point: <coords> both positions it and sets its path
        // parameter (GeoGebra's setCoords -> path.pointChanged).
        inner += '\t<coords x="' + fmt(p.pathXY.x) + '" y="' + fmt(p.pathXY.y) + '" z="1"/>\n';
        coordsAll.push(p.pathXY);
      }
      inner += '\t<pointSize val="5"/>\n\t<pointStyle val="0"/>\n';
    } else if (p.elem === 'numeric') {
      inner += '\t<value val="' + fmt(p.free ? p.free.value : 0) + '"/>\n';
      if (!dep) inner += '\t<symbolic val="true" />\n';
    } else if (p.elem === 'text') {
      inner += '\t<font serif="false" sizeM="1.1428571428571428" size="2" style="0"/>\n';
    } else if (p.elem === 'segment' || p.elem === 'line' || p.elem === 'conic' || p.elem === 'polygon' || p.elem === 'function') {
      inner += '\t<lineStyle thickness="3" type="0" typeHidden="1" opacity="255"/>\n';
      if (p.elem === 'polygon') inner += '\t<fillType type="0" opacity="128"/>\n';
    }
    const typeAttr = p.elem;
    emitted.push(exprLine + '<element type="' + typeAttr + '" label="' + xmlEsc(lab) + '">\n' + inner + '</element>');
  }
  // 5) view: fit bbox of emitted free points.  In a non-uniform sketch frame the sketch's
  // y unit differs from its x unit, so yscale tracks scale by that ratio to reproduce the
  // sketch's aspect on screen.
  let xZero = GEO_W / 2, yZero = GEO_H / 2, scale = 50, yscale = 50;
  const aspect = byId.frame && byId.frame.uxLen > 0 ? byId.frame.uyLen / byId.frame.uxLen : 1;
  if (coordsAll.length) {
    let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    for (const c of coordsAll) {
      minx = Math.min(minx, c.x); maxx = Math.max(maxx, c.x);
      miny = Math.min(miny, c.y); maxy = Math.max(maxy, c.y);
    }
    const dx = Math.max(maxx - minx, 1e-9), dy = Math.max(maxy - miny, 1e-9);
    scale = Math.min(0.8 * GEO_W / dx, 0.8 * GEO_H / (dy * aspect));
    scale = Math.min(Math.max(scale, 2), 400);
    yscale = scale * aspect;
    const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
    xZero = GEO_W / 2 - cx * scale;
    yZero = GEO_H / 2 + cy * yscale;
  }
  const xml = header(ir.title, xZero, yZero, scale, yscale) + emitted.join('\n') + '\n</construction>\n</geogebra>\n';
  const buf = zip([{ name: 'geogebra.xml', data: Buffer.from(xml, 'utf8') }]);
  return { buf, xml, warnings, stats: { planned: emitted.length, total: ir.objects.length } };
}

// ---------- reader: .ggb -> IR ----------
function parseAttrs(s) {
  const out = {};
  for (const m of s.matchAll(/([A-Za-z_][\w:.-]*)\s*=\s*"([^"]*)"/g)) out[m[1]] = m[2]
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  return out;
}
const FUNCS = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
  'sqrt', 'abs', 'exp', 'ln', 'log', 'floor', 'ceil', 'round', 'mod', 'min', 'max',
  'x', 'y', 'z', 'distance', 'length', 'spectrum', 'deg', 'rad', 'isclose']);
function refsOf(src) {
  const out = new Set();
  if (!src) return out;
  for (const m of String(src).matchAll(/[A-Za-z][A-Za-z0-9_']*/g)) {
    const w = m[0];
    if (FUNCS.has(w)) continue;
    out.add(w);
  }
  return out;
}

function ggbToIR(buf) {
  const entries = unzip(buf);
  const xmlE = entries.get('geogebra.xml');
  if (!xmlE) throw new Error('no geogebra.xml in ggb');
  const xml = xmlE.toString('utf8');
  const ci = xml.indexOf('<construction');
  const ce = xml.lastIndexOf('</construction>');
  const body = ci >= 0 ? xml.slice(ci, ce) : xml;
  const warnings = [];

  // expressions
  const exprMap = new Map();
  for (const m of body.matchAll(/<expression\b([^>]*)\/>/g)) {
    const a = parseAttrs(m[1]);
    if (a.label) exprMap.set(a.label, { exp: a.exp || '', type: a.type || '' });
  }
  // commands
  const cmdMap = new Map();
  for (const m of body.matchAll(/<command\b([^>]*)>([\s\S]*?)<\/command>/g)) {
    const name = parseAttrs(m[1]).name || '';
    const inM = /<input\b([^>]*)\/?>/.exec(m[2]);
    const outM = /<output\b([^>]*)\/?>/.exec(m[2]);
    const arr = s => {
      if (!s) return [];
      const a = parseAttrs(s);
      return Object.keys(a).filter(k => /^a\d+$/.test(k)).sort((x, y) => +x.slice(1) - +y.slice(1)).map(k => a[k]);
    };
    for (const o of arr(outM && outM[1])) cmdMap.set(o, { name, args: arr(inM && inM[1]) });
  }
  // elements
  const objects = [];
  for (const m of body.matchAll(/<element\b([^>]*)>([\s\S]*?)<\/element>/g)) {
    const a = parseAttrs(m[1]);
    const inner = m[2];
    let coords = null;
    const cM = /<coords\b([^>]*)\/>/.exec(inner);
    if (cM) {
      const c = parseAttrs(cM[1]);
      if (c.x !== undefined) coords = { x: +c.x, y: +c.y };
      else if (c.coords) { const p = c.coords.split(','); coords = { x: +p[0], y: +p[1] }; }
    }
    let value = null;
    const vM = /<value\b([^>]*)\/>/.exec(inner);
    if (vM) { const v = +parseAttrs(vM[1]).val; if (isFinite(v)) value = v; }
    const shM = /<show\b([^>]*)\/>/.exec(inner);
    const visible = shM ? parseAttrs(shM[1]).object !== 'false' : true;
    const colM = /<objColor\b([^>]*)\/>/.exec(inner);
    let color = null;
    if (colM) {
      const c = parseAttrs(colM[1]);
      color = (+(c.r || 0)) & 0xff | (((+(c.g || 0)) & 0xff) << 8) | (((+(c.b || 0)) & 0xff) << 16);
    }
    const label = a.label || '';
    const ex = exprMap.get(label);
    const cmd = cmdMap.get(label);
    const kindParts = {
      id: objects.length + 1,
      kind: 'ggb',
      ggbType: a.type || '',
      label,
      expr: ex ? ex.exp : null,
      cmd: cmd || null,
      coords,          // ggb units
      value,
      visible,
      color,
      parents: [],
      _raw: null,
      srcType: -1,
      params: [],
      style: color !== null ? { color } : {}
    };
    objects.push(kindParts);
  }
  // infer parents from expression/command refs
  const byLabel = new Map();
  for (const o of objects) if (o.label) byLabel.set(o.label, o);
  for (const o of objects) {
    const src = o.expr || (o.cmd ? o.cmd.name + '(' + o.cmd.args.join(',') + ')' : '');
    for (const ref of refsOf(src)) {
      const t = byLabel.get(ref);
      if (t && t.id !== o.id) o.parents.push(t.id);
    }
    if (!o.expr && !o.cmd && o.ggbType !== 'point') {
      // free non-point without expression is fine (numeric/text), but flag odd cases
      if (['segment', 'line', 'conic'].includes(o.ggbType)) warnings.push('no definition for ' + o.label);
    }
  }
  const titleM = /<construction[^>]*\btitle="([^"]*)"/.exec(xml);
  return {
    source: 'ggb',
    title: titleM ? titleM[1] : '',
    objects,
    warnings,
    meta: { unit: 'ggb' }
  };
}

module.exports = { irToGgb, ggbToIR, SCALE, toGgb, toGsp, FUNCS,
  // internals exposed for diagnostics/probes (tools/*): not part of the public API
  planOf, straightRef, elemTypeOf, isPointish, XFORM_KINDS, LINE_KINDS, SEG_KINDS, sketchFrame, plotDomain };
