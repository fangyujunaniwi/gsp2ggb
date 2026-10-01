'use strict';
// Compare headers/params of measure-related object types to spot a measureType field.
// usage: node test/meashdr.js <file.gsp>
const fs = require('fs');
const { gspToIR } = require('../src/gsp');
const ir = gspToIR(fs.readFileSync(process.argv[2]));
const byId = new Map(ir.objects.map(o => [o.id, o]));
const want = new Set([36, 37, 41, 47, 87, 113]);
const seen = {};
for (const o of ir.objects) {
  if (!want.has(o.srcType)) continue;
  const raw = o._raw;
  const key = o.srcType;
  seen[key] = (seen[key] || 0) + 1;
  if (seen[key] > 3) continue;
  const P = o.parents.map(id => { const q = byId.get(id); return q ? (q.kind + ':' + (q.label || '#' + q.id)) : '#' + id; });
  console.log('t' + o.srcType + ' #' + o.id + ' label=' + JSON.stringify(o.label || '') +
    ' hdr=' + (raw.hdr || Buffer.alloc(0)).toString('hex') +
    ' paramRaw=' + (raw.paramRaw ? raw.paramRaw.toString('hex') : '-') +
    ' parents=[' + P.join(', ') + ']');
}
