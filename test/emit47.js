'use strict';
// Find files where a t33 marker resolved to a 3-point ratio (emitted If(Dot(...))).
// usage: node test/emit47.js <corpusRoot> [maxFiles]
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const { irToGgb } = require('../src/ggb');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
const MAX = parseInt(process.argv[3] || '10', 10);
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p);
  }
  return out;
}
let shown = 0, total = 0;
for (const f of walk(root, [])) {
  let ir, r;
  try { ir = gspToIR(fs.readFileSync(f)); r = irToGgb(ir); } catch { continue; }
  for (const o of ir.objects) {
    if (o.srcType !== 33) continue;
    // re-plan just this object's expression by scanning warnings/elements is awkward;
    // instead re-run planOf via irToGgb output is not exposed, so detect via IR structure.
  }
  // detect via emitted XML expressions
  const hit = (r.xml || '').match(/Dilate\([^"]*If\(Dot/);
  if (hit) {
    total++;
    if (shown < MAX) {
      const m = (r.xml.match(/exp="([^"]*If\(Dot[^"]*)"/) || [])[1];
      console.log(path.basename(f) + '  ->  ' + (m || '?').replace(/&quot;/g, '"'));
      shown++;
    }
  }
}
console.log('files with If(Dot) dilation: ' + total);
