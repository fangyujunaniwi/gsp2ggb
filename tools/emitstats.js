// Per-type emit / skip statistics across a GSP corpus (no file output).
// usage: node tools/emitstats.js <root> [--top N]
'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
const { irToGgb } = require('../src/ggb');

const args = process.argv.slice(2);
const root = path.resolve(args[0] || '.');
const ti = args.indexOf('--top');
const TOP = ti >= 0 ? parseInt(args[ti + 1], 10) : 40;
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(root);

const byType = new Map();      // srcType -> {em, sk}
const byReason = new Map();    // reason -> count
let objects = 0, emitted = 0;
for (const f of files) {
  let ir;
  try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  let r;
  try { r = irToGgb(ir); } catch { continue; }
  objects += ir.objects.length;
  emitted += r.stats.planned;
  const skipped = new Set();
  for (const w of r.warnings) {
    const m = /^skip #(\d+) t(\d+) .*?: (.*)$/.exec(w);
    if (m) skipped.add(parseInt(m[1], 10));
    const m2 = /:\s(.*)$/.exec(w);
  }
  for (const w of r.warnings) {
    const m = /^skip #\d+ t\d+ [^:]+: (.*)$/.exec(w);
    if (m) byReason.set(m[1], (byReason.get(m[1]) || 0) + 1);
  }
  for (const o of ir.objects) {
    const t = byType.get(o.srcType) || { em: 0, sk: 0 };
    if (skipped.has(o.id)) t.sk++; else t.em++;
    byType.set(o.srcType, t);
  }
}
console.log('files=' + files.length + ' objects=' + objects + ' emitted=' + emitted +
  ' rate=' + (emitted / objects * 100).toFixed(2) + '%');
const rows = [...byType.entries()].map(([t, v]) => ({ t, ...v, n: v.em + v.sk }))
  .sort((a, b) => b.n - a.n);
console.log('\n=== by type (top ' + TOP + ') ===');
console.log('type\ttotal\temit\tskip');
for (const r of rows.slice(0, TOP)) console.log('t' + r.t + '\t' + r.n + '\t' + r.em + '\t' + r.sk);
console.log('\n=== skip reasons (top ' + TOP + ') ===');
for (const [k, v] of [...byReason.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP))
  console.log(v + '\t' + k);
