'use strict';
// Histogram the base-straight kind of perpLine/parallelLine objects across the corpus.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp.js');

const ROOT = process.argv[2] || 'D:/Sketchpad5';
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(ROOT);

const baseHist = {}, p0Hist = {};
for (const f of files) {
  let ir;
  try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if (o.kind !== 'perpLine' && o.kind !== 'parallelLine') continue;
    if (!o.parents || o.parents.length < 2) continue;
    const p0 = byId.get(o.parents[0]), p1 = byId.get(o.parents[1]);
    const k1 = p1 ? p1.kind : '(missing)';
    const k0 = p0 ? p0.kind : '(missing)';
    baseHist[k1] = (baseHist[k1] || 0) + 1;
    p0Hist[k0] = (p0Hist[k0] || 0) + 1;
  }
}
console.log('perpLine/parallelLine base (parents[1]) kinds:');
for (const [k, n] of Object.entries(baseHist).sort((a, b) => b[1] - a[1])) console.log('  ' + k + ': ' + n);
console.log('parents[0] kinds:');
for (const [k, n] of Object.entries(p0Hist).sort((a, b) => b[1] - a[1])) console.log('  ' + k + ': ' + n);
