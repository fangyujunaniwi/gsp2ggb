'use strict';
// Census of every record tag across the corpus: count, length range, a sample payload, and
// which object types it appears inside.
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

const stat = new Map(); // tag -> {n, min, max, sample, types:Map}
for (const f of files) {
  let recs;
  try { recs = parseRecords(fs.readFileSync(f)); } catch { continue; }
  let curType = null, inObj = false;
  for (const r of recs) {
    if (r.tag === 2000) { curType = r.pay.readUInt16LE(0); inObj = true; }
    let s = stat.get(r.tag);
    if (!s) { s = { n: 0, min: 1e9, max: 0, sample: null, types: new Set(), inObj: 0, top: 0 }; stat.set(r.tag, s); }
    s.n++;
    if (r.pay.length < s.min) s.min = r.pay.length;
    if (r.pay.length > s.max) s.max = r.pay.length;
    if (!s.sample) s.sample = r.pay;
    if (inObj) { s.inObj++; if (curType != null && !r.tag.toString().startsWith('2')) s.types.add(curType); }
    else s.top++;
    if (r.tag === 2007) { inObj = false; curType = null; }
  }
}
const rows = [...stat.entries()].sort((a, b) => a[0] - b[0]);
for (const [tag, s] of rows) {
  const hex = s.sample ? s.sample.toString('hex').slice(0, 40) : '';
  const asc = s.sample ? s.sample.toString('latin1').replace(/[^\x20-\x7e]/g, '.').slice(0, 30) : '';
  const ty = [...s.types].sort((x, y) => x - y).slice(0, 8).join(',');
  console.log('tag' + tag + ' n=' + s.n + ' len=' + s.min + (s.max !== s.min ? '..' + s.max : '') +
    ' loc=' + (s.top ? 'DOC' : 'obj#') + (s.top ? '' : '(' + ty + ')') +
    '\n   hex=' + hex + '  ascii="' + asc + '"');
}
