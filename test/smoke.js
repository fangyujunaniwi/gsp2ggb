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
const rec = tui.runOne({ in: src, out: path.join(os.tmpdir(), 'gsp-conv-tui-smoke.ggb') });
check('tui: runOne converts t.gsp to a real .ggb',
  rec.ok && fs.existsSync(rec.out) && fs.statSync(rec.out).size > 0, rec.error || rec.dir);
try { fs.unlinkSync(rec.out); } catch (e) { /* ignore */ }

console.log(fails ? ('SMOKE FAILED (' + fails + ')') : 'SMOKE PASSED');
process.exit(fails ? 1 : 0);
