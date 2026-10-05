'use strict';
// Pick the Nth corpus file and dump the raw records of object #1..#K.
const fs = require('fs');
const path = require('path');
const { parseRecords, strAt } = require('../src/gsp.js');

const ROOT = process.argv[2] || 'D:/Sketchpad5';
const idx = Number(process.argv[3] || 2);
const K = Number(process.argv[4] || 4);
const files = [];
(function w(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) w(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(ROOT);
const pick = files[Math.floor(files.length / 6) * idx];
console.error('picked: ' + pick);

const recs = parseRecords(fs.readFileSync(pick));
let ord = 0, cur = null;
for (const r of recs) {
  if (r.tag === 2000) {
    ord++;
    cur = { ord, type: r.pay.readUInt16LE(0), recs: [] };
    continue;
  }
  if (!cur) continue;
  if (ord <= K) cur.recs.push(r.tag + ':' + r.pay.toString('hex').slice(0, 48));
  if (r.tag === 2007) {
    if (ord <= K) console.log('#' + cur.ord + ' t' + cur.type + '\n   ' + cur.recs.join('\n   '));
    cur = null;
  }
}
