'use strict';
// Histogram of token codes by class across the corpus.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
function programOf(p) { for (let i = 0; i + 8 <= p.length; i++) { if (p[i] === 7 && p[i + 1] === 9 && p[i + 2] === 0 && p[i + 3] === 0) { const c = p.readUInt16LE(i + 12); if (c > 0 && c * 2 <= p.length) return p.subarray(p.length - c * 2); } } return null; }
const root = process.argv[2];
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.gsp$/i.test(e.name)) files.push(p); } })(root);
const H = {}; // class -> {payload:count}
let nobj = 0, nprog = 0;
for (const f of files) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  for (const o of ir.objects) { const r = (o._raw.recs || []).find(r => r.tag === 2311); if (!r) continue; nobj++; const pr = programOf(r.pay); if (!pr) continue; nprog++;
    for (let i = 0; i + 1 < pr.length; i += 2) { const w = pr.readUInt16LE(i); const hi = w >> 8, lo = w & 0xff; (H[hi] = H[hi] || {})[lo] = ((H[hi] || {})[lo] || 0) + 1; } }
}
console.log('2311 objects=' + nobj + ' withProgram=' + nprog);
for (const hi of Object.keys(H).map(Number).sort((a, b) => a - b)) {
  const ent = Object.entries(H[hi]).sort((a, b) => Number(a[0]) - Number(b[0]));
  console.log('class 0x' + hi.toString(16).padStart(2, '0') + '  ' + ent.map(([lo, n]) => lo + ':' + n).join(' '));
}
