'use strict';
// Scan .gsp files for embedded pictures (tag 1300) and report the object types present.
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

let n = 0;
const typeHist = {};
for (const f of files) {
  let recs;
  try { recs = parseRecords(fs.readFileSync(f)); } catch { continue; }
  const img = recs.filter(r => r.tag === 1300);
  if (!img.length) continue;
  n++;
  // object types present in this file
  let ord = 0;
  const types = new Set();
  for (const r of recs) if (r.tag === 2000) { ord++; types.add(r.pay.readUInt16LE(0)); }
  for (const t of types) typeHist[t] = (typeHist[t] || 0) + 1;
  if (n <= 8) console.log(path.basename(f) + '  images=' + img.length + ' sizes=' + img.map(r => r.pay.length).join(',') + ' types=' + [...types].sort((a, b) => a - b).join(','));
}
console.log('files with embedded picture: ' + n + ' / ' + files.length);
const top = Object.entries(typeHist).sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log('object types in those files (type:files): ' + top.map(([k, v]) => k + ':' + v).join(' '));
