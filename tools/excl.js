'use strict';
// For a predef code, find files whose predef code-set is EXACTLY {code} and dump
// their labeled objects with decoded programs, to infer the function.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
function programOf(p) { for (let i = 0; i + 8 <= p.length; i++) { if (p[i] === 7 && p[i + 1] === 9 && p[i + 2] === 0 && p[i + 3] === 0) { const c = p.readUInt16LE(i + 12); if (c > 0 && c * 2 <= p.length) return p.subarray(p.length - c * 2); } } return null; }
function sym(buf) { const o = []; for (let i = 0; i + 1 < buf.length; i += 2) { const w = buf.readUInt16LE(i); const hi = w >> 8, lo = w & 0xff;
  if (hi === 0) o.push(lo === 0x0f ? 'x' : (lo === 0x0b ? '(' : (lo === 0x0c ? ')' : (lo === 0x0a ? '.' : (lo === 0x0d ? 'pi' : (lo === 0x0e ? 'e' : '#' + lo))))));
  else if (hi === 0x10) o.push('+-*/^?'[lo]);
  else if (hi === 0x20) o.push('F' + lo);
  else if (hi === 0x60) o.push(String.fromCharCode(65 + lo));
  else if (hi === 0x70) o.push('@f' + String.fromCharCode(65 + lo));
  else o.push('?' + w.toString(16)); } return o.join(' '); }

const root = process.argv[2];
const want = parseInt(process.argv[3], 10);
const maxFiles = parseInt(process.argv[4] || '5', 10);
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.gsp$/i.test(e.name)) files.push(p); } })(root);

let shown = 0;
for (const f of files) {
  if (shown >= maxFiles) break;
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  const codes = new Set(); const objs = [];
  for (const o of ir.objects) { const r = (o._raw.recs || []).find(r => r.tag === 2311); if (!r) continue; const pr = programOf(r.pay); if (!pr) continue; for (let i = 0; i + 1 < pr.length; i += 2) { const w = pr.readUInt16LE(i); if ((w >> 8) === 0x20) codes.add(w & 0xff); } objs.push({ o, pr }); }
  if (codes.size !== 1 || !codes.has(want)) continue;
  // only show if it has at least one labeled object
  const labeled = objs.filter(x => x.o.label);
  if (!labeled.length) continue;
  console.log('#### ' + path.basename(f));
  for (const { o, pr } of labeled.slice(0, 14)) console.log('   t' + o.srcType + ' ' + JSON.stringify(o.label) + ' : ' + sym(pr));
  shown++;
}
