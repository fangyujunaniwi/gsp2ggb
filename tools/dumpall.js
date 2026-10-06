'use strict';
const fs = require('fs');
const { gspToIR } = require('../src/gsp.js');
const ir = gspToIR(fs.readFileSync(process.argv[2]));
const byId = new Map(ir.objects.map(o => [o.id, o]));
const refBy = new Map();
for (const o of ir.objects) for (const p of (o.parents || [])) {
  if (!refBy.has(p)) refBy.set(p, []);
  refBy.get(p).push(o.id);
}
for (const o of ir.objects) {
  console.log('#' + o.id + ' t' + o.srcType + ' ' + o.kind + ' label=' + JSON.stringify(o.label) +
    ' parents=[' + (o.parents || []).join(',') + ']' +
    ' refBy=[' + (refBy.get(o.id) || []).join(',') + ']');
}
