'use strict';
// List per-file: predef F-codes present + function names mentioned in captions.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');

function programOf(p) { for (let i = 0; i + 8 <= p.length; i++) { if (p[i] === 7 && p[i + 1] === 9 && p[i + 2] === 0 && p[i + 3] === 0) { const c = p.readUInt16LE(i + 12); if (c > 0 && c * 2 <= p.length) return p.subarray(p.length - c * 2); } } return null; }
function asciiRuns(buf, min = 3) { const out = []; let cur = ''; for (let i = 0; i < buf.length; i++) { const c = buf[i]; if (c >= 32 && c < 127) cur += String.fromCharCode(c); else { if (cur.length >= min) out.push(cur); cur = ''; } } if (cur.length >= min) out.push(cur); return out; }

const FUNCS = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'abs', 'sqrt', 'ln', 'log', 'round', 'trunc', 'sign', 'sgn', 'exp', 'floor', 'ceil'];
const root = process.argv[2];
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.gsp$/i.test(e.name)) files.push(p); } })(root);

const detail = [];
for (const f of files) {
  let ir, raw; try { raw = fs.readFileSync(f); ir = gspToIR(raw); } catch { continue; }
  const codes = new Set();
  for (const o of ir.objects) { const r = (o._raw.recs || []).find(r => r.tag === 2311); if (!r) continue; const pr = programOf(r.pay); if (!pr) continue; for (let i = 0; i + 1 < pr.length; i += 2) { const w = pr.readUInt16LE(i); if ((w >> 8) === 0x20) codes.add(w & 0xff); } }
  if (!codes.size) continue;
  const text = asciiRuns(raw).join(' ');
  const names = FUNCS.filter(fn => new RegExp('\\b' + fn + '\\s*\\(', 'i').test(text));
  if (names.length) detail.push({ f, codes: [...codes].sort((a, b) => a - b), names });
}
console.log('files:', detail.length);
for (const rec of detail) console.log(path.basename(rec.f).padEnd(26), 'codes=[' + rec.codes.join(',') + ']'.padEnd(3), 'names=' + rec.names.join(','));
