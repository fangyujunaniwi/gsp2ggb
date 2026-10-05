'use strict';
const fs = require('fs');
const { gspToIR } = require('../src/gsp.js');
const ir = gspToIR(fs.readFileSync(process.argv[2]));
const byId = new Map(ir.objects.map(o => [o.id, o]));
for (const o of ir.objects) {
  if (o.kind !== 'image') continue;
  const par = (o.parents || []).map(id => id + ':' + (byId.get(id) ? byId.get(id).kind : '?'));
  console.log('#' + o.id + ' t' + o.srcType + ' image dims=' + JSON.stringify(o.dims) +
    ' imageIndex=' + o.imageIndex + ' label=' + JSON.stringify(o.label) +
    ' parents=[' + par.join(',') + ']');
}
console.log('section of each image above (0-based): printed via ir.meta.sections');
