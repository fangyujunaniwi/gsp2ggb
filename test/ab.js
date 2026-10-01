// A/B: compare emitted counts with FixedText decoding enabled vs disabled.
'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
const { irToGgb } = require('../src/ggb');

const root = process.argv[2];
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(root);

let a = 0, b = 0, both = [];
for (const f of files) {
  let ir;
  try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  let r1, r2;
  try { r1 = irToGgb(ir); } catch { continue; }
  // revert to pre-change behaviour for type-0 FixedText objects
  for (const o of ir.objects) {
    if (o.srcType === 0 && o.msg) { o.kind = 'free'; o.msg = undefined; }
  }
  try { r2 = irToGgb(ir); } catch { continue; }
  a += r1.stats.planned; b += r2.stats.planned;
  if (r1.stats.planned !== r2.stats.planned)
    both.push([path.basename(f), r1.stats.planned, r2.stats.planned]);
}
console.log('withFixedText=' + a + '  without=' + b + '  delta=' + (a - b));
both.slice(0, 40).forEach(x => console.log('  ' + x[0] + '  new=' + x[1] + ' old=' + x[2]));
console.log('files differing: ' + both.length);
