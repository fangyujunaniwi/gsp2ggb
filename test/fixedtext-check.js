'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
const root = process.argv[2];
const files = [];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(/\.gsp$/i.test(e.name))files.push(p);}})(root);
let ft = 0, ftCoords = 0, ftNumeric = 0, otherTypeText = 0, samples = [];
for (const f of files) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  for (const o of ir.objects) {
    const has2300 = (o._raw.recs || []).some(r => r.tag === 2300);
    if (!has2300) continue;
    if (o.srcType === 0) {
      ft++;
      if (o.coords) ftCoords++;
      if (o._raw.rich && o._raw.rich[2311]) ftNumeric++;
      if (samples.length < 8) samples.push(path.basename(f) + '  ' + JSON.stringify(o.msg));
    } else otherTypeText++;
  }
}
console.log('type0+2300=' + ft + '  withCoords=' + ftCoords + '  alsoHas2311=' + ftNumeric + '  otherTypes=' + otherTypeText);
samples.forEach(s => console.log('  ' + s));
