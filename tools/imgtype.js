'use strict';
// Which object type (tag-2000 u16) appears in picture files but (almost) never elsewhere?
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

const withImg = {}, withoutImg = {};
for (const f of files) {
  let recs;
  try { recs = parseRecords(fs.readFileSync(f)); } catch { continue; }
  const has = recs.some(r => r.tag === 1300);
  const tgt = has ? withImg : withoutImg;
  for (const r of recs) if (r.tag === 2000) { const t = r.pay.readUInt16LE(0); tgt[t] = (tgt[t] || 0) + 1; }
}
const types = new Set([...Object.keys(withImg), ...Object.keys(withoutImg)]);
const rows = [...types].map(t => ({ t: +t, w: withImg[t] || 0, wo: withoutImg[t] || 0 }));
rows.sort((a, b) => (b.w / (b.w + b.wo)) - (a.w / (a.w + a.wo)));
console.log('type | in-picture-files | in-other-files | ratio');
for (const r of rows) {
  const ratio = r.w / (r.w + r.wo);
  if (ratio > 0.6 || r.t > 95) console.log('  ' + r.t + ' | ' + r.w + ' | ' + r.wo + ' | ' + ratio.toFixed(2));
}
