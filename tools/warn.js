'use strict';
const fs = require('fs');
const { gspToIR } = require('../src/gsp.js');
const { irToGgb } = require('../src/ggb.js');
const ir = gspToIR(fs.readFileSync(process.argv[2]));
console.log('objects=' + ir.objects.length);
const byId = new Map(ir.objects.map(o => [o.id, o]));
// plan each object (irToGgb prints warnings internally) — instead, mirror the planner warnings
const r = irToGgb(ir);
fs.writeFileSync('out/warnings.txt', 'objects=' + ir.objects.length + '\nwarnings=' + r.warnings.length + '\n' + r.warnings.join('\n') + '\n', 'utf8');
console.log('=== warnings (' + r.warnings.length + ') ===');
for (const w of r.warnings) console.log('  ' + w);
// Also: histogram of skipped source types
const skipHist = {};
for (const o of ir.objects) {
  // find warning lines mentioning this id
}
