'use strict';
// Find files whose raw text mentions a named math function, print their predef code-set
// and the matching text snippets.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
function programOf(p) { for (let i = 0; i + 8 <= p.length; i++) { if (p[i] === 7 && p[i + 1] === 9 && p[i + 2] === 0 && p[i + 3] === 0) { const c = p.readUInt16LE(i + 12); if (c > 0 && c * 2 <= p.length) return p.subarray(p.length - c * 2); } } return null; }
function asciiRuns(buf, min = 2) { const out = []; let cur = ''; for (let i = 0; i < buf.length; i++) { const c = buf[i]; if (c >= 32 && c < 127) cur += String.fromCharCode(c); else { if (cur.length >= min) out.push(cur); cur = ''; } } if (cur.length >= min) out.push(cur); return out; }
const root = process.argv[2];
const re = new RegExp(process.argv[3], 'i');
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.gsp$/i.test(e.name)) files.push(p); } })(root);
for (const f of files) {
  let ir, raw; try { raw = fs.readFileSync(f); ir = gspToIR(raw); } catch { continue; }
  const codes = new Set();
  for (const o of ir.objects) { const r = (o._raw.recs || []).find(r => r.tag === 2311); if (!r) continue; const pr = programOf(r.pay); if (!pr) continue; for (let i = 0; i + 1 < pr.length; i += 2) { const w = pr.readUInt16LE(i); if ((w >> 8) === 0x20) codes.add(w & 0xff); } }
  if (!codes.size) continue;
  const runs = asciiRuns(raw).filter(s => re.test(s));
  if (!runs.length) continue;
  console.log(path.basename(f) + '  codes=[' + [...codes].sort((a, b) => a - b) + ']');
  console.log('    ' + [...new Set(runs)].slice(0, 6).join(' | ').slice(0, 300));
}
