'use strict';
const fs = require('fs');
const { parseRecords } = require('../src/gsp.js');

function dumpTag2316(path, label) {
  const recs = parseRecords(fs.readFileSync(path));
  console.log('===== ' + label);
  let ord = 0, cur = null;
  for (const r of recs) {
    if (r.tag === 2000) { ord++; cur = { ord, type: r.pay.readUInt16LE(0), hdr: r.pay.toString('hex'), recs: [] }; continue; }
    if (!cur) continue;
    if (r.tag !== 2316 && r.tag !== 2216 && r.tag !== 8004 && r.tag !== 9006 && r.tag !== 2007) continue;
    cur.recs.push('t' + r.tag + ':' + r.pay.toString('hex'));
    if (r.tag === 2007) {
      if (cur.recs.join('').includes('t2316')) {
        console.log('#' + cur.ord + ' t' + cur.type + '  hdr(2000)=' + cur.hdr);
        for (const s of cur.recs) console.log('    ' + s);
        if (ord > 200) break;
      }
      cur = null;
    }
  }
}
dumpTag2316(process.argv[2], 'A: ' + process.argv[2]);
dumpTag2316(process.argv[3], 'B: ' + process.argv[3]);
