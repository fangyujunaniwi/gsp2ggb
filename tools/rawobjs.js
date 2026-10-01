'use strict';
// Raw object list straight from records: ordinal, type, tag2002 parent ordinals, label.
const fs = require('fs');
const { parseRecords, strAt } = require('../src/gsp');
const recs = parseRecords(fs.readFileSync(process.argv[2]));
let n = 0, cur = null;
for (const r of recs) {
  if (r.tag === 1100) { console.log('--- SECTION: ' + r.pay.toString('utf8').replace(/\0+$/, '')); }
  if (r.tag === 2000) { n++; cur = { n, type: r.pay.readUInt16LE(0), parents: [], label: '' }; }
  else if (cur && r.tag === 2002) {
    const c = r.pay.readUInt32LE(0);
    for (let i = 0; i < c; i++) cur.parents.push(r.pay.readUInt32LE(4 + i * 4));
  } else if (cur && r.tag === 2005) cur.label = strAt(r.pay, 22);
  else if (cur && r.tag === 2007) {
    console.log('#' + cur.n + ' t' + cur.type + (cur.label ? ' "' + cur.label + '"' : '') +
      '  parents=[' + cur.parents.join(',') + ']');
    cur = null;
  }
}
