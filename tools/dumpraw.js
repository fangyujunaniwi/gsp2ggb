'use strict';
// Dump raw records (tag/payload) for every object of one .gsp file.
const fs = require('fs');
const { gspToIR } = require('../src/gsp');
const { planOf } = require('../src/ggb');
const ir = gspToIR(fs.readFileSync(process.argv[2]));
const byId = new Map(); for (const o of ir.objects) byId.set(o.id, o);
for (const o of ir.objects) {
  const p = planOf(o, byId);
  console.log('==== t' + o.srcType + ' #' + o.id + ' "' + (o.label || '') + '" kind=' + o.kind
    + ' coords=' + (o.coords ? JSON.stringify(o.coords) : '-') + ' parents=[' + o.parents.join(',') + ']');
  if (o.params && o.params.length) console.log('   params=[' + o.params.map(v => (+v).toFixed(5)).join(', ') + ']');
  if (p && p.exprTpl) console.log('   emit ' + p.elem + ' = ' + p.exprTpl);
  if (o._raw && o._raw.recs) for (const r of o._raw.recs) {
    const hx = r.pay.length <= 96 ? r.pay.toString('hex') : r.pay.subarray(0, 96).toString('hex') + '...(' + r.pay.length + 'B)';
    console.log('   tag ' + r.tag + ' len=' + r.pay.length + '  ' + hx);
  }
}
