'use strict';
// Self-contained smoke test — no corpus needed.  Exercises both directions on the bundled
// t.gsp (a function plot over a custom coordinate system) and checks the known-good result.
//
//   node test/smoke.js
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp.js');
const { irToGgb, ggbToIR } = require('../src/ggb.js');
const { irToGsp } = require('../src/ir2gsp.js');
const { unzip } = require('../src/zip.js');
const os = require('os');
const U = require('../src/tui-util.js');

let fails = 0;
function check(name, cond, detail) {
  if (cond) { console.log('  ok   ' + name); }
  else { console.log('  FAIL ' + name + (detail != null ? '  (' + detail + ')' : '')); fails++; }
}

const root = path.join(__dirname, '..');
const src = path.join(root, 't.gsp');
console.log('smoke test on ' + path.relative(root, src));

// --- gsp -> ggb ---
const ir = gspToIR(fs.readFileSync(src));
const fwd = irToGgb(ir);
const xml = unzip(fwd.buf).get('geogebra.xml').toString('utf8');
const exprOf = label => {
  const m = xml.match(new RegExp('<expression label="' + label + '" exp="([^"]*)"'));
  return m ? m[1] : null;
};
const pointOf = label => {
  const m = xml.match(new RegExp('<element type="point" label="' + label + '">[\\s\\S]*?<coords x="([^"]*)" y="([^"]*)"'));
  return m ? { x: +m[1], y: +m[2] } : null;
};
const showOf = label => {
  const m = xml.match(new RegExp('<element type="[^"]*" label="' + label + '">\\s*<show object="([^"]*)"'));
  return m ? m[1] : null;
};

check('C at origin (0,0)', (() => { const p = pointOf('C'); return p && Math.abs(p.x) < 1e-9 && Math.abs(p.y) < 1e-9; })(), JSON.stringify(pointOf('C')));
check('x unit point B = C + (1,0)', exprOf('B') === '(C) + (1,0)', exprOf('B'));
check('y unit point O = C + (0,1)', exprOf('O') === '(C) + (0,1)', exprOf('O'));
check('function f emitted (constant functions keep a variable prefix)', exprOf('f') === 'f(x)=sqrt(3)', exprOf('f'));
check('AC is a segment, O_7 its slope', exprOf('O_6') === 'Segment(A,C)' && exprOf('O_7') === 'Slope(O_6)',
  exprOf('O_6') + ' ; ' + exprOf('O_7'));
check('measurement O_5 hidden in graphics view (no slider figure)', showOf('O_5') === 'false', showOf('O_5'));
check('measurement O_7 hidden in graphics view (no slider figure)', showOf('O_7') === 'false', showOf('O_7'));
check('segment O_6 stays visible in graphics view', showOf('O_6') === 'true', showOf('O_6'));
check('point A stays visible in graphics view', showOf('A') === 'true', showOf('A'));
check('A is a draggable free point on f (Point(f))', exprOf('A') === 'Point(f)', exprOf('A'));
check('XML well-formed-ish', /<\/geogebra>/.test(xml) && /<construction[\s>]/.test(xml) && /<geogebra[\s>]/.test(xml));

// --- round-trip: ggb -> gsp -> ggb ---
const backIR = ggbToIR(fwd.buf);
check('ggb read-back has objects', backIR.objects.length > 0, backIR.objects.length);
const rev = irToGsp(backIR);
check('ggb -> gsp produced bytes', rev.buf && rev.buf.length > 0, rev.buf && rev.buf.length);
const reparsed = gspToIR(rev.buf);
check('regenerated gsp re-parses', reparsed.objects.length > 0, reparsed.objects.length);

// --- action button (t62): the project's only button truth sample is the JavaSketchpad pair
//     ref-ctrl/jsp-samples/运动方向(inRm).{gsp,htm} -> AnimateButton(20,90,'动画点')(4,3) ---
const btnSrc = path.join(root, 'ref-ctrl', 'jsp-samples', '运动方向(inRm).gsp');
if (fs.existsSync(btnSrc)) {
  const bx = unzip(irToGgb(gspToIR(fs.readFileSync(btnSrc))).buf).get('geogebra.xml').toString('utf8');
  const bm = bx.match(/<element type="button" label="([^"]+)">[\s\S]*?<ggbscript val="([^"]*)"/);
  const bLoc = bx.match(/<absoluteScreenLocation x="([^"]*)" y="([^"]*)"\/>/);
  const bCap = bx.match(/<caption val="([^"]*)"\/>/);
  check('action button emitted with a click script', !!bm, bm ? bm[2] : 'no button');
  check('button script animates the point on its path', !!bm && /^StartAnimation\(\w+,true\)$/.test(bm[2]), bm && bm[2]);
  check('button position matches JavaSketchpad truth (20,90)',
    !!bLoc && bLoc[1] === '20' && bLoc[2] === '90', bLoc && (bLoc[1] + ',' + bLoc[2]));
  check('button keeps its GSP caption', !!bCap && bCap[1] === '动画点', bCap && bCap[1]);
  // The animated point must be free *on its path* (AlgoPointOnPath with no
  // parameter) or GeoGebra refuses StartAnimation("参数不符合规则"); its position
  // is restored from <coords>.
  const bExpr = bx.match(/<expression label="C" exp="([^"]*)"/);
  check('animated point is a free-on-path point (Point(path), no fixed param)',
    bExpr && bExpr[1] === 'Point(O)', bExpr && bExpr[1]);
  const bPt = lab => {
    const m = bx.match(new RegExp('<element type="point" label="' + lab + '">[\\s\\S]*?<coords x="([^"]*)" y="([^"]*)"'));
    return m ? { x: +m[1], y: +m[2] } : null;
  };
  const A = bPt('A'), B = bPt('B'), C = bPt('C');
  const PHI = 0.17434512516156075;
  check('free-on-path point keeps its position via <coords> (A + φ(B−A))',
    !!(A && B && C) && Math.abs(C.x - (A.x + PHI * (B.x - A.x))) < 1e-6 &&
    Math.abs(C.y - (A.y + PHI * (B.y - A.y))) < 1e-6, JSON.stringify(C));
}

// --- point on a circle (t15): the two-parameter form is a (cos,sin) unit direction in a
//     y-up frame, giving position = center + r·(px, −py) in the file's y-down coordinates
//     (verified against a GSP render of ref-ctrl/angle_bisector.gsp: G has py>0 and is
//     drawn above the centre).  It must become a real free-on-path point —
//     Point(circle) + <coords> — lying on its circle, on the correct side.  The
//     one-parameter form is not a decodable position and stays a bare Point(circle).
//     ref-ctrl/angle_bisector.gsp has two unit-direction points (G, H) and one
//     one-parameter point (E). ---
const circSrc = path.join(root, 'ref-ctrl', 'angle_bisector.gsp');
if (fs.existsSync(circSrc)) {
  const cx = unzip(irToGgb(gspToIR(fs.readFileSync(circSrc))).buf).get('geogebra.xml').toString('utf8');
  const cExprOf = label => {
    const m = cx.match(new RegExp('<expression label="' + label + '" exp="([^"]*)"'));
    return m ? m[1] : null;
  };
  const cPtOf = label => {
    const m = cx.match(new RegExp('<element type="point" label="' + label + '">[\\s\\S]*?<coords x="([^"]*)" y="([^"]*)"'));
    return m ? { x: +m[1], y: +m[2] } : null;
  };
  const conics = new Set();
  for (const m of cx.matchAll(/<element type="conic" label="([^"]+)"/g)) conics.add(m[1]);
  const onCircle = [];
  for (const m of cx.matchAll(/<expression label="([^"]+)" exp="Point\(([^)]+)\)"/g)) {
    if (conics.has(m[2])) onCircle.push({ pt: m[1], circ: m[2] });
  }
  check('circle points become free-on-path Point(circle)',
    onCircle.length >= 2, onCircle.map(o => o.pt + '=' + cExprOf(o.pt)).join(' '));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const circleGeom = circ => {
    const m = (cExprOf(circ) || '').match(/^Circle\(([^,]+),([^)]+)\)$/);
    if (!m) return null;
    const c = cPtOf(m[1]);
    if (!c) return null;
    const sm = (cExprOf(m[2]) || '').match(/^Segment\(([^,]+),([^)]+)\)$/);
    if (sm) { const a = cPtOf(sm[1]), b = cPtOf(sm[2]); if (a && b) return { c, r: dist(a, b) }; }
    const p = cPtOf(m[2]);
    return p ? { c, r: dist(c, p) } : null;
  };
  const withCoords = onCircle.filter(o => cPtOf(o.pt));
  let allOn = withCoords.length >= 2;
  const bad = [];
  for (const o of withCoords) {
    const g = circleGeom(o.circ), p = cPtOf(o.pt);
    if (!g || Math.abs(dist(g.c, p) - g.r) > 1e-6) { allOn = false; bad.push(o.pt); }
  }
  check('unit-direction circle points keep their position via <coords> (on the circle)',
    allOn, bad.join(',') || ('withCoords=' + withCoords.length));
  // The direction is y-up: in GeoGebra's y-up frame the offset (p − centre) must have the
  // same sign as the stored py (position = centre + r·(px, −py) in GSP's y-down coords).
  const cirIR = gspToIR(fs.readFileSync(circSrc));
  const paramByLabel = new Map(cirIR.objects.filter(o => o.label).map(o => [o.label, o]));
  const sideBad = [];
  for (const o of withCoords) {
    const g = circleGeom(o.circ), p = cPtOf(o.pt);
    const src = paramByLabel.get(o.pt);
    const py = src && src.params && src.params.length >= 2 ? src.params[1] : null;
    if (!g || py === null || Math.sign(p.y - g.c.y) !== Math.sign(py)) sideBad.push(o.pt);
  }
  check('unit-direction circle points sit on the correct side (y-up direction)',
    withCoords.length >= 2 && sideBad.length === 0, sideBad.join(','));
  const relationOnly = onCircle.filter(o => !cPtOf(o.pt));
  check('one-parameter circle point (undecodable position) stays a bare Point(circle)',
    relationOnly.length > 0 && relationOnly.every(o => cExprOf(o.pt) === 'Point(' + o.circ + ')'),
    'relation-only=' + relationOnly.map(o => o.pt).join(','));
}

// --- one-parameter circle point: its value is not a decodable position (it does not match
//     the rendered angle in the corpus), so it must stay a bare Point(circle) with no
//     <coords> — constructed in memory so the check is exact. ---
{
  const sIR = { objects: [
    { id: 1, kind: 'free', parents: [], params: [], coords: { x: 100, y: 100 }, label: 'C', srcType: 0 },
    { id: 2, kind: 'free', parents: [], params: [], coords: { x: 250, y: 100 }, label: 'P', srcType: 0 },
    { id: 3, kind: 'circleOn', parents: [1, 2], params: [], label: '', srcType: 3 },
    { id: 4, kind: 'pointOnPath', parents: [3], params: [2.344061], label: 'Q', srcType: 15 },
  ], warnings: [] };
  const sx = unzip(irToGgb(sIR).buf).get('geogebra.xml').toString('utf8');
  const qExpr = (sx.match(/<expression label="Q" exp="([^"]*)"/) || [])[1];
  const qHasCoords = /<element type="point" label="Q">[\s\S]*?<coords /.test(sx);
  check('one-parameter circle point emitted as bare Point(circle), no guessed <coords>',
    /^Point\(.+\)$/.test(qExpr || '') && !qHasCoords, qExpr + (qHasCoords ? ' +coords' : ''));
}

// --- t21 = PolarTranslation (NOT a rotation): the image is the parent translated by a
//     fixed vector.  tag-2003 layout: +4 p0=-sinθ, +12 p1=cosθ, +32 d1=distance in file
//     units (the same units as coordinates, so it is scaled by SCALE/frame).  This also
//     guards the number formatter: GeoGebra reads 'e' as Euler's number, so "4.6e-17"
//     would be parsed as 4.6*e-17 — scientific notation must never be emitted. ---
{
  const buf = Buffer.alloc(60);
  buf.writeDoubleLE(96 / 2.54, 32);                  // d1 = 1 cm = 37.79527559055118 file units
  const sIR = { objects: [
    { id: 1, kind: 'free', parents: [], params: [], coords: { x: 100, y: 100 }, label: 'A', srcType: 0 },
    { id: 2, kind: 'implicitRotate', parents: [1], params: [-1, 6.123233995736766e-17, 90],
      label: 'A_2', srcType: 21, _raw: { paramRaw: buf } },
    { id: 3, kind: 'free', parents: [], params: [], coords: { x: 1e24, y: 0 }, label: 'B', srcType: 0 },
  ], warnings: [] };
  const sx = unzip(irToGgb(sIR).buf).get('geogebra.xml').toString('utf8');
  const e2 = (sx.match(/<expression label="A_2" exp="([^"]*)"/) || [])[1];
  check('t21 polar translation -> Translate by a fixed vector (θ=90°, 1cm -> (0,0.756))',
    e2 === 'Translate(A,Vector((0,0.755905511811)))', e2);
  const bCo = sx.match(/<element type="point" label="B">[\s\S]*?<coords x="([^"]*)" y="([^"]*)"/) || [];
  check('numbers never use scientific notation (GeoGebra reads e as Euler\'s number)',
    !/[0-9]e[-+]?[0-9]/i.test(e2 || '') && bCo[1] === '20000000000000000000000',
    'A_2=' + e2 + ' B.x=' + bCo[1]);
}

// --- t24 = FixedAngleMarkedDistance (verified 2026-10-03 with the user's control
//     sketches: .htm = Translation/FixedAngle/MarkedDistance(pre,dist,θ)).  2 parents
//     [preimage, distanceValue] + params (-sinθ, cosθ, θ); image = pre + v·(cosθ,−sinθ),
//     where the marked distance v is emitted as a numeric in GeoGebra units and is
//     therefore used verbatim (no SCALE factor). ---
{
  const sIR = { objects: [
    { id: 1, kind: 'free', parents: [], params: [], coords: { x: 100, y: 100 }, label: 'A', srcType: 0 },
    { id: 2, kind: 'free', parents: [], params: [], coords: { x: 300, y: 100 }, label: 'B', srcType: 0 },
    { id: 3, kind: 'segment', parents: [1, 2], params: [], label: '', srcType: 2 },
    { id: 4, kind: 'measureLengthSeg', parents: [3], params: [], label: '', srcType: 36 },
    { id: 5, kind: 'free', parents: [], params: [], coords: { x: 0, y: 0 }, label: 'P', srcType: 0 },
    { id: 6, kind: 'fixedAngleMarkedDistance', parents: [5, 4], params: [-1, 6.123233995736766e-17, 90],
      label: 'P_2', srcType: 24 },
  ], warnings: [] };
  const sx = unzip(irToGgb(sIR).buf).get('geogebra.xml').toString('utf8');
  const e6 = (sx.match(/<expression label="P_2" exp="([^"]*)"/) || [])[1];
  check('t24 fixed-angle + marked-distance -> Translate by the measured (unit-scaled) distance',
    /^Translate\(P,\(Length\([^)]+\)\)\*Vector\(\(0,1\)\)\)$/.test(e6 || ''), e6);
}

// --- a point on a *transformed* circle (the path is an affine image of a circle):
//     keep it constrained to (and animatable along) the transformed conic by emitting
//     Point(<conic>); the initial position is left to GeoGebra (the stored parameter is
//     in the base circle's frame, so deriving <coords> would need the composed transform). ---
{
  const sIR = { objects: [
    { id: 1, kind: 'free', parents: [], params: [], coords: { x: 0, y: 0 }, label: 'C', srcType: 0 },
    { id: 2, kind: 'free', parents: [], params: [], coords: { x: 100, y: 0 }, label: 'R', srcType: 0 },
    { id: 3, kind: 'circleOn', parents: [1, 2], params: [], label: 'c', srcType: 3 },
    { id: 4, kind: 'free', parents: [], params: [], coords: { x: 0, y: 0 }, label: 'O', srcType: 0 },
    { id: 5, kind: 'rotateImage', parents: [3, 4], params: [-1, 6.123233995736766e-17, 90], label: 'c2', srcType: 27 },
    { id: 6, kind: 'pointOnPath', parents: [5], params: [0.5], label: 'X', srcType: 15 },
  ], warnings: [] };
  const sx = unzip(irToGgb(sIR).buf).get('geogebra.xml').toString('utf8');
  const e6 = (sx.match(/<expression label="X_" exp="([^"]*)"/) || [])[1];
  check('t15 on a transformed circle -> Point(<transformed conic>)',
    e6 === 'Point(c2)', e6);
}

// --- a circle whose on-point (which fixes its radius) is itself a transformed point:
//     gspPosXY must resolve it so the circle point's position lands in <coords>. ---
{
  const sIR = { objects: [
    { id: 1, kind: 'free', parents: [], params: [], coords: { x: 0, y: 0 }, label: 'O', srcType: 0 },
    { id: 2, kind: 'free', parents: [], params: [], coords: { x: 200, y: 0 }, label: 'A', srcType: 0 },
    { id: 3, kind: 'free', parents: [], params: [], coords: { x: 200, y: 200 }, label: 'B', srcType: 0 },
    { id: 4, kind: 'translateImage', parents: [2, 1, 3], params: [], label: 'R', srcType: 16 },
    { id: 5, kind: 'circleOn', parents: [1, 4], params: [], label: 'c', srcType: 3 },
    { id: 6, kind: 'pointOnPath', parents: [5], params: [1, 0], label: 'X', srcType: 15 },
  ], warnings: [] };
  const sx = unzip(irToGgb(sIR).buf).get('geogebra.xml').toString('utf8');
  const m = sx.match(/<element type="point" label="X[^"]*">[\s\S]*?<coords x="([^"]*)" y="([^"]*)"/);
  check('circle point over a transformed radius point gets <coords>',
    !!m && /^8\.94/.test(m[1]), m ? (m[1] + ',' + m[2]) : 'no coords');
}

// --- t95 = a point on a path at a parameter given by a sibling value object
//     (verified with 滑块变速.gsp: [t94 path-position, segment] -> Point(seg, param)). ---
{
  const sIR = { objects: [
    { id: 1, kind: 'free', parents: [], params: [], coords: { x: 0, y: 0 }, label: 'A', srcType: 0 },
    { id: 2, kind: 'free', parents: [], params: [], coords: { x: 100, y: 0 }, label: 'B', srcType: 0 },
    { id: 3, kind: 'segment', parents: [1, 2], params: [], label: 's', srcType: 2 },
    { id: 4, kind: 'pointOnPath', parents: [3], params: [0.25], label: 'Q', srcType: 15 },
    { id: 5, kind: 'free', parents: [], params: [], coords: { x: 0, y: 100 }, label: 'L', srcType: 0 },
    { id: 6, kind: 'free', parents: [], params: [], coords: { x: 100, y: 100 }, label: 'M', srcType: 0 },
    { id: 7, kind: 'segment', parents: [5, 6], params: [], label: 't', srcType: 2 },
    { id: 8, kind: 'pathParam', parents: [4, 3], params: [], label: 'p', srcType: 94 },
    { id: 9, kind: 'pointAtParam', parents: [8, 7], params: [], label: 'R', srcType: 95 },
  ], warnings: [] };
  const sx = unzip(irToGgb(sIR).buf).get('geogebra.xml').toString('utf8');
  const e9 = (sx.match(/<expression label="R" exp="([^"]*)"/) || [])[1];
  check('t95 -> Point(segment, PathParameter(point))', e9 === 'Point(t,PathParameter(Q))', e9);
}

// --- t76 = a GSP iteration x_{k+1}=f(x_k): parents [preimage, image, ...], count at
//     tag-2314 offset 16, emitted as GeoGebra IterationList(f, iv, {start}, n). ---
{
  const it = Buffer.alloc(24); it.writeUInt32LE(5, 16);
  const sIR = { objects: [
    { id: 1, kind: 'free', parents: [], params: [], coords: { x: 0, y: 0 }, label: 'O', srcType: 0 },
    { id: 2, kind: 'free', parents: [], params: [], coords: { x: 200, y: 0 }, label: 'P', srcType: 0 },
    { id: 3, kind: 'rotateImage', parents: [2, 1], params: [-0.866025403784, 0.5, 60, 0], label: 'P_2', srcType: 27 },
    { id: 4, kind: 'iteration', parents: [2, 3, 3], params: [], label: '', srcType: 76, _raw: { rich: { 2314: it } } },
  ], warnings: [] };
  const sx = unzip(irToGgb(sIR).buf).get('geogebra.xml').toString('utf8');
  const m = sx.match(/<expression label="[^"]*" exp="IterationList\(([^"]*)\)" \/>/);
  check('t76 iteration -> IterationList(f, iv, {start}, n)',
    !!m && m[1] === 'Rotate(iv,60°,O),iv,{P},5', m ? m[1] : 'no iteration');
}

// --- t81 = the GSP "arc through three points" tool (user control sketch: clicking
//     O, P, Q stores [O,P,Q]); GeoGebra's CircularArc(P,Q,R) = arc P->R through Q. ---
{
  const sIR = { objects: [
    { id: 1, kind: 'free', parents: [], params: [], coords: { x: 0, y: 0 }, label: 'A', srcType: 0 },
    { id: 2, kind: 'free', parents: [], params: [], coords: { x: 100, y: 50 }, label: 'B', srcType: 0 },
    { id: 3, kind: 'free', parents: [], params: [], coords: { x: 60, y: 120 }, label: 'C', srcType: 0 },
    { id: 4, kind: 'arc3Points', parents: [1, 2, 3], params: [], label: 'k', srcType: 81 },
  ], warnings: [] };
  const sx = unzip(irToGgb(sIR).buf).get('geogebra.xml').toString('utf8');
  const e4 = (sx.match(/<expression label="k" exp="([^"]*)"/) || [])[1];
  check('t81 -> CircumcircularArc through three points', e4 === 'CircumcircularArc(A,B,C)', e4);
}

// --- TUI helpers (src/tui-util.js) and job pipeline (bin/tui.js) ---
check('tui: recognises .gsp/.ggb', U.isConvertible('a.gsp') && U.isConvertible('B.GGB') && !U.isConvertible('a.txt'));
check('tui: default output swaps the extension',
  U.defaultOutPath('C:\\x\\a.gsp', 'auto') === 'C:\\x\\a.ggb' && U.defaultOutPath('C:\\x\\a.ggb', 'gsp') === 'C:\\x\\a.gsp',
  U.defaultOutPath('C:\\x\\a.gsp', 'auto'));
check('tui: direction cycles auto->ggb->gsp',
  U.nextDirection('auto') === 'ggb' && U.nextDirection('ggb') === 'gsp' && U.nextDirection('gsp') === 'auto');
check('tui: CJK display width is 2 columns', U.dispWidth('中文') === 4 && U.dispWidth('ab') === 2);
check('tui: truncate/pad respect display width',
  U.dispWidth(U.truncate('中文abcdef', 5)) <= 5 && U.dispWidth(U.pad('中', 4)) === 4);
check('tui: list window stays inside the list',
  U.windowRange(3, 0, 5).join() === '0,3' && U.windowRange(10, 9, 3).join() === '7,10');
const bt = U.planBatch(path.join(root, 'ref-ctrl'), path.join(os.tmpdir(), 'gsp-conv-tui'), 'auto');
check('tui: batch planner picks up the control sketches',
  bt.length >= 10 && bt.every(j => /\.(ggb|gsp)$/i.test(j.out)), bt.length);

const tui = require('../bin/tui.js');
tui.state.to = 'auto'; tui.state.outMode = 'alongside';
const tj = tui.makeJobs({ kind: 'file', path: src });
check('tui: single-file job targets a .ggb next to the source',
  tj.length === 1 && /\.ggb$/i.test(tj[0].out), tj[0] && tj[0].out);
check('tui: every screen renders a full frame', (() => {
  tui.state.jobs = [{ in: src }]; tui.state.jobIndex = 0;
  return ['menu', 'browse', 'running', 'report', 'warnings', 'help']
    .every(sc => { tui.state.screen = sc; return tui.buildScreen(80, 24).length === 24; });
})());
check('tui: a narrow terminal still yields a full frame', tui.buildScreen(30, 10).length === 10);
check('tui: running screen tolerates a stale job index', (() => {
  tui.state.jobs = [{ in: src }]; tui.state.jobIndex = 99; tui.state.screen = 'running';
  const ok = tui.buildScreen(60, 20).length === 20;
  tui.state.screen = 'menu';
  return ok;
})());
const rec = tui.runOne({ in: src, out: path.join(os.tmpdir(), 'gsp-conv-tui-smoke.ggb') });
check('tui: runOne converts t.gsp to a real .ggb',
  rec.ok && fs.existsSync(rec.out) && fs.statSync(rec.out).size > 0, rec.error || rec.dir);
check('tui: runMerge combines a folder of .ggb into a multi-page .gsp', (() => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsp-conv-merge-'));
  try {
    if (!fs.copyFileSync || !rec.ok) return false;
    fs.copyFileSync(rec.out, path.join(dir, 'a.ggb'));
    fs.copyFileSync(rec.out, path.join(dir, 'b.ggb'));
    const rm = tui.runMerge(dir, path.join(dir, 'out.gsp'));
    return rm.ok && rm.pages === 2 && fs.existsSync(rm.out);
  } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* ignore */ } }
})(), 'runMerge');
try { fs.unlinkSync(rec.out); } catch (e) { /* ignore */ }

console.log(fails ? ('SMOKE FAILED (' + fails + ')') : 'SMOKE PASSED');
process.exit(fails ? 1 : 0);
