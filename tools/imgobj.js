'use strict';
// Dump objects of the picture-only types with their raw records.
const fs = require('fs');
const { parseRecords } = require('../src/gsp.js');

const TARGET = new Set((process.argv[3] || '85,96,99,100,108,122').split(',').map(Number));
const recs = parseRecords(fs.readFileSync(process.argv[2]));
let ord = 0, cur = null;
for (const r of recs) {
  if (r.tag === 2000) { ord++; cur = { ord, type: r.pay.readUInt16LE(0), recs: [] }; continue; }
  if (!cur) continue;
  if (TARGET.has(cur.type)) {
    const hex = r.pay.toString('hex').slice(0, 60);
    const a = r.pay.toString('latin1').replace(/[^\x20-\x7e]/g, '.');
    const run = (a.match(/[ -~]{3,}/g) || []).join('|');
    cur.recs.push('tag' + r.tag + '[' + r.pay.length + ']' + (run ? ' "' + run.slice(0, 40) + '"' : ' ' + hex));
  }
  if (r.tag === 2007) {
    if (TARGET.has(cur.type)) console.log('#' + cur.ord + ' t' + cur.type + ': ' + cur.recs.join('  '));
    cur = null;
  }
}
