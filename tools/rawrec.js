'use strict';
// Print raw records (2002 parents / 2005 label) for objects at given ordinals.
const fs = require('fs');
const { parseRecords, strAt } = require('../src/gsp.js');

const buf = fs.readFileSync(process.argv[2]);
const want = new Set((process.argv[3] || '').split(',').map(Number));
const recs = parseRecords(buf);
let ord = 0, cur = null;
for (const r of recs) {
  if (r.tag === 2000) {
    ord++;
    cur = { ord, type: r.pay.readUInt16LE(0), hdr: r.pay.toString('hex').slice(0, 20), parents: [], label: '' };
    continue;
  }
  if (!cur) continue;
  if (r.tag === 2002) {
    const n = r.pay.readUInt32LE(0);
    for (let i = 0; i < n; i++) cur.parents.push(r.pay.readUInt32LE(4 + 4 * i));
  } else if (r.tag === 2005) {
    cur.label = strAt(r.pay, 22);
  }
  if (r.tag === 2007) {
    if (want.has(cur.ord)) {
      console.log('#' + cur.ord + ' t' + cur.type + ' label=' + JSON.stringify(cur.label) +
        ' parents=' + JSON.stringify(cur.parents) + ' hdr=' + cur.hdr);
    }
    cur = null;
  }
}
