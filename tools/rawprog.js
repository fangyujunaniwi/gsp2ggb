'use strict';
// Dump raw hex tokens for objects. Args: <fileOrPattern> <rootForSearch> [ids...]
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
function programOf(p) { for (let i = 0; i + 8 <= p.length; i++) { if (p[i] === 7 && p[i + 1] === 9 && p[i + 2] === 0 && p[i + 3] === 0) { const c = p.readUInt16LE(i + 12); if (c > 0 && c * 2 <= p.length) return { buf: p.subarray(p.length - c * 2), cnt: c }; } } return null; }
const arg = process.argv[2];
const ids = process.argv.slice(3).map(Number).filter(n => !Number.isNaN(n));
let file = arg;
if (!fs.existsSync(file)) {
  const files = [];
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.gsp$/i.test(e.name) && e.name.toLowerCase().includes(arg.toLowerCase())) files.push(p); } })((process.env.GSP_DIR || 'D:\\Sketchpad5'));
  file = files[0];
}
if (!file) { console.log('no file'); process.exit(1); }
console.log('FILE ' + file);
const ir = gspToIR(fs.readFileSync(file));
for (const o of ir.objects) {
  if (ids.length && !ids.includes(o.id)) continue;
  const r = (o._raw.recs || []).find(r => r.tag === 2311); if (!r) continue;
  const pr = programOf(r.pay); if (!pr) continue;
  console.log('#' + o.id + ' t' + o.srcType + ' label=' + JSON.stringify(o.label) + ' cnt=' + pr.cnt);
  let hex = '';
  for (let i = 0; i < pr.buf.length; i += 2) hex += pr.buf.readUInt16LE(i).toString(16).padStart(4, '0') + ' ';
  console.log('   ' + hex.trim());
}
