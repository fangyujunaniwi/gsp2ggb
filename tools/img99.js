'use strict';
// Dump every t99 (image) object fully: parents, params, dims, label, all records.
const fs = require('fs');
const { parseRecords, strAt } = require('../src/gsp.js');

const recs = parseRecords(fs.readFileSync(process.argv[2]));
let ord = 0, cur = null;
for (const r of recs) {
  if (r.tag === 2000) { ord++; cur = { ord, type: r.pay.readUInt16LE(0), recs: [] }; continue; }
  if (!cur) continue;
  if (cur.type !== 99 && cur.type !== 85 && cur.type !== 100 && cur.type !== 108 && cur.type !== 96 && cur.type !== 122) { if (r.tag === 2007) cur = null; continue; }
  cur.recs.push(r);
  if (r.tag === 2007) {
    console.log('#' + cur.ord + ' t' + cur.type);
    for (const q of cur.recs) {
      let extra = '';
      if (q.tag === 2002) { const n = q.pay.readUInt32LE(0); const ids = []; for (let i = 0; i < n; i++) ids.push(q.pay.readUInt32LE(4 + 4 * i)); extra = ' parents=' + JSON.stringify(ids); }
      if (q.tag === 2003) {
        const d = [];
        for (let i = 0; i + 8 <= q.pay.length; i += 8) d.push(q.pay.readDoubleLE(i));
        extra = ' doubles=' + JSON.stringify(d);
      }
      if (q.tag === 2316) extra = ' dims=' + q.pay.readUInt32LE(0) + 'x' + q.pay.readUInt32LE(4);
      if (q.tag === 2005) extra = ' label=' + JSON.stringify(strAt(q.pay, 22));
      console.log('   tag' + q.tag + '[' + q.pay.length + ']' + extra + '  hex=' + q.pay.toString('hex').slice(0, 56));
    }
    cur = null;
  }
}
