'use strict';
// Dump IR objects of one section (page) of a .gsp.
const fs = require('fs');
const { gspToIR } = require('../src/gsp.js');

const ir = gspToIR(fs.readFileSync(process.argv[2]));
const sec = Number(process.argv[3] || 0);
console.log('sections=' + ir.meta.sections.length + '  showing section=' + sec);
for (const o of ir.objects) {
  if ((o.section || 0) !== sec) continue;
  const extra = [];
  if (o.params && o.params.length) extra.push('params=' + JSON.stringify(o.params));
  if (o.coords) extra.push('coords=' + JSON.stringify(o.coords));
  console.log('#' + o.id + ' t' + o.srcType + ' ' + o.kind + ' label=' + JSON.stringify(o.label) +
    ' parents=' + JSON.stringify(o.parents || []) + ' ' + extra.join(' '));
}
