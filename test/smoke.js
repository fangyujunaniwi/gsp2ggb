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
check('A sits on f as (x, f(x))', /^\(.*,f\(.*\)\)$/.test(exprOf('A') || ''), exprOf('A'));
check('A on the correct domain point (slope AC ~ sqrt(3))', (() => {
  const m = (exprOf('A') || '').match(/^\(([-0-9.eE]+),f\(/);
  if (!m) return false;
  const xA = +m[1], f = Math.sqrt(3);
  const slope = (f - 0) / (xA - 0);          // C = (0,0)
  return Math.abs(slope - f) < 0.01;
})(), exprOf('A'));
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

console.log(fails ? ('SMOKE FAILED (' + fails + ')') : 'SMOKE PASSED');
process.exit(fails ? 1 : 0);
