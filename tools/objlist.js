'use strict';
// List IR objects: #id t<srcType> kind  parents=[...]  params  xy  label
const fs = require('fs');
const { gspToIR } = require('../src/gsp');
const ir = gspToIR(fs.readFileSync(process.argv[2]));
const byId = new Map(ir.objects.map(o => [o.id, o]));
const kindOf = id => { const q = byId.get(id); return q ? (q.kind + '#' + q.id + (q.srcType != null ? '/t' + q.srcType : '')) : ('?' + id); };
for (const o of ir.objects) {
  const p = o.parents.map(kindOf).join(', ');
  const xy = o.coords ? (' xy=' + o.coords.x.toFixed(1) + ',' + o.coords.y.toFixed(1)) : '';
  const par = o.params && o.params.length ? (' params=[' + o.params.map(v => (+v).toFixed(4)).join(',') + ']') : '';
  console.log('#' + o.id + ' t' + o.srcType + ' ' + o.kind + (o.label ? ' "' + o.label + '"' : '') +
    (p ? '  <= [' + p + ']' : '') + xy + par);
}
if (ir.warnings.length) { console.log('-- warnings --'); ir.warnings.slice(0, 20).forEach(w => console.log(w)); }
