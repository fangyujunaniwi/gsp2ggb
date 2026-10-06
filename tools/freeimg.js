'use strict';
// Find the first GSP free picture (t0 carrying tag2316 + tag9006) and dump its records.
const fs = require('fs');
const path = require('path');
const { parseRecords } = require('../src/gsp.js');

const ROOT = process.argv[2] || 'D:/Sketchpad5';
const files = [];
(function w(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) w(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(ROOT);

for (const f of files) {
  let recs;
  try { recs = parseRecords(fs.readFileSync(f)); } catch { continue; }
  let cur = null;
  for (const r of recs) {
    if (r.tag === 2000) { cur = { type: r.pay.readUInt16LE(0), recs: [], has2316: false, has9006: false }; continue; }
    if (!cur) continue;
    if (r.tag === 2316) cur.has2316 = true;
    if (r.tag === 9006) cur.has9006 = true;
    if (r.tag === 2005) cur.label = r.pay.subarray(24, 24 + Math.min(r.pay.readUInt16LE(22), 30)).toString('latin1');
    cur.recs.push(r);
    if (r.tag === 2007) {
      if (cur.type === 0 && cur.has2316 && cur.has9006) {
        console.log('file: ' + path.basename(f));
        for (const q of cur.recs) {
          let extra = '';
          if (q.tag === 2003 || q.tag === 2216) {
            const d = []; for (let i = 0; i + 8 <= q.pay.length; i += 8) d.push(+q.pay.readDoubleLE(i).toFixed(4));
            extra = ' doubles=' + JSON.stringify(d);
          }
          if (q.tag === 2316) extra = ' dims=' + q.pay.readUInt32LE(0) + 'x' + q.pay.readUInt32LE(4);
          console.log('  tag' + q.tag + '[' + q.pay.length + ']' + extra + ' hex=' + q.pay.toString('hex').slice(0, 56));
        }
        process.exit(0);
      }
      cur = null;
    }
  }
}
console.log('none found');
