'use strict';
// Dump IR of the Nth corpus file (same ordering used by the spot check).
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp.js');
const { irToGgb } = require('../src/ggb.js');

const ROOT = process.argv[2] || 'D:/Sketchpad5';
const idx = Number(process.argv[3] || 2);
const files = [];
(function w(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) w(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(ROOT);
const pick = files[Math.floor(files.length / 6) * idx + 0] || files[idx];
console.error('picked: ' + pick);
const ir = gspToIR(fs.readFileSync(pick));
const byId = new Map(ir.objects.map(o => [o.id, o]));
for (const o of ir.objects) {
  if (!o.parents || !o.parents.length) continue;
  const pk = o.parents.map(id => { const q = byId.get(id); return q ? q.kind : '?'; });
  if (pk.some(k => /Image|conic|circle|locus|arc/i.test(k)) || /Image/.test(o.kind))
    console.log('#' + o.id + ' t' + o.srcType + ' ' + o.kind + ' label=' + JSON.stringify(o.label) +
      ' parents=' + o.parents.map((id, i) => id + ':' + pk[i]).join(','));
}
