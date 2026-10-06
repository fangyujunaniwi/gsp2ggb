'use strict';
const fs = require('fs');
const { parseRecords, strAt, gspToIR } = require('../src/gsp.js');

const buf = fs.readFileSync(process.argv[2]);
const recs = parseRecords(buf);
const hist = {};
for (const r of recs) hist[r.tag] = (hist[r.tag] || 0) + 1;
console.log('tag1204 (tool pages)=' + (hist[1204] || 0) + '  tag1100=' + (hist[1100] || 0) + '  tag1300=' + (hist[1300] || 0));
console.log('tags: ' + Object.keys(hist).map(Number).sort((a, b) => a - b).join(','));

const ir = gspToIR(buf);
const byId = new Map(ir.objects.map(o => [o.id, o]));
for (const id of [18, 19]) {
  const o = byId.get(id);
  if (!o) continue;
  console.log('#' + id + ' t' + o.srcType + ' ' + o.kind + ' label=' + JSON.stringify(o.label) +
    ' parents=[' + (o.parents || []).map(p => p + ':' + (byId.get(p) ? byId.get(p).kind + '/' + byId.get(p).srcType : '?')).join(',') + ']' +
    ' params=' + JSON.stringify(o.params));
}
// list all objects with srcType 32
console.log('--- all t32 ---');
for (const o of ir.objects) if (o.srcType === 32) console.log('#' + o.id + ' parents=' + JSON.stringify(o.parents));
