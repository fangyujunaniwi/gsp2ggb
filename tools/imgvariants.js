'use strict';
// Census of every object that carries a tag-2316 size record: type, parent count, params.
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

const hist = new Map(); // type -> Map(parentCount -> n)
const samples = new Map();
for (const f of files) {
  let recs;
  try { recs = parseRecords(fs.readFileSync(f)); } catch { continue; }
  let cur = null;
  for (const r of recs) {
    if (r.tag === 2000) { cur = { type: r.pay.readUInt16LE(0), pc: 0, recs: [] }; continue; }
    if (!cur) continue;
    if (r.tag === 2002) cur.pc = r.pay.readUInt32LE(0);
    if (r.tag === 2316) cur.has2316 = true;
    if (r.tag === 2005) cur.label = r.pay.subarray(22 + 2, 22 + 2 + Math.min(r.pay.readUInt16LE(22), 30)).toString('latin1');
    cur.recs.push(r.tag);
    if (r.tag === 2007) {
      if (cur.has2316) {
        if (!hist.has(cur.type)) { hist.set(cur.type, new Map()); samples.set(cur.type, cur); }
        const m = hist.get(cur.type);
        m.set(cur.pc, (m.get(cur.pc) || 0) + 1);
      }
      cur = null;
    }
  }
}
for (const [t, m] of [...hist.entries()].sort((a, b) => a[0] - b[0])) {
  const s = samples.get(t);
  console.log('t' + t + '  parents: ' + [...m.entries()].map(([k, v]) => k + '->' + v).join(', ') +
    '  sample tags=' + s.recs.join(',') + '  label="' + (s.label || '') + '"');
}
