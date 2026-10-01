'use strict';
// Scan corpus: find 2311 expression programs containing predef-function codes (0x20xx),
// and print the owning object's label plus all text-ish strings in the file.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');

const root = process.argv[2];
const limit = parseInt(process.argv[3] || '40', 10);

function programOf(p) {
  for (let i = 0; i + 8 <= p.length; i++) {
    if (p[i] === 7 && p[i + 1] === 9 && p[i + 2] === 0 && p[i + 3] === 0) {
      const cnt = p.readUInt16LE(i + 12);
      if (cnt > 0 && cnt * 2 <= p.length) return p.subarray(p.length - cnt * 2);
    }
  }
  return null;
}

function asciiRuns(buf, min = 3) {
  const out = []; let cur = '';
  for (let i = 0; i < buf.length; i++) { const c = buf[i]; if (c >= 32 && c < 127) cur += String.fromCharCode(c); else { if (cur.length >= min) out.push(cur); cur = ''; } }
  if (cur.length >= min) out.push(cur);
  return out;
}

const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.gsp$/i.test(e.name)) files.push(p); } })(root);

let printed = 0;
const hist = {};
for (const f of files) {
  if (printed >= limit) break;
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  let codes = [];
  for (const o of ir.objects) {
    const r = (o._raw.recs || []).find(r => r.tag === 2311);
    if (!r) continue;
    const pr = programOf(r.pay);
    if (!pr) continue;
    for (let i = 0; i + 1 < pr.length; i += 2) {
      const w = pr.readUInt16LE(i);
      if ((w >> 8) === 0x20) { codes.push(w & 0xff); hist[w & 0xff] = (hist[w & 0xff] || 0) + 1; }
    }
  }
  if (!codes.length) continue;
  const runs = asciiRuns(fs.readFileSync(f)).filter(s => /[a-zA-Z]{2,}\(|[a-z]{3,}\(/i.test(s) || /\b(sin|cos|tan|abs|sqrt|round|sign|log|ln)\b/i.test(s));
  console.log('#### ' + path.basename(f) + '   predefLow=' + JSON.stringify([...new Set(codes)]));
  if (runs.length) console.log('     strings: ' + runs.slice(0, 25).join(' | '));
  printed++;
}
console.log('\n=== predef low-byte histogram over first ' + printed + ' files ===');
console.log(JSON.stringify(hist));
