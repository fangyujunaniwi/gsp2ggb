'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
function programOf(p) { for (let i = 0; i + 8 <= p.length; i++) { if (p[i] === 7 && p[i + 1] === 9 && p[i + 2] === 0 && p[i + 3] === 0) { const c = p.readUInt16LE(i + 12); if (c > 0 && c * 2 <= p.length) return p.subarray(p.length - c * 2); } } return null; }
const root = process.argv[2];
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.gsp$/i.test(e.name)) files.push(p); } })(root);
const groups = {};
for (const f of files) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  const codes = new Set();
  for (const o of ir.objects) { const r = (o._raw.recs || []).find(r => r.tag === 2311); if (!r) continue; const pr = programOf(r.pay); if (!pr) continue; for (let i = 0; i + 1 < pr.length; i += 2) { const w = pr.readUInt16LE(i); if ((w >> 8) === 0x20) codes.add(w & 0xff); } }
  if (!codes.size) continue;
  const k = [...codes].sort((a, b) => a - b).join(',');
  (groups[k] = groups[k] || []).push(path.basename(f));
}
for (const k of Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length)) {
  console.log(String(groups[k].length).padStart(4) + '  [' + k + ']  ' + groups[k].slice(0, 6).join(' , '));
}
