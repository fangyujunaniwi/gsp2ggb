'use strict';
// Dump 2311 expression programs for files matching a basename pattern under a root.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');

function programOf(p) { for (let i = 0; i + 8 <= p.length; i++) { if (p[i] === 7 && p[i + 1] === 9 && p[i + 2] === 0 && p[i + 3] === 0) { const c = p.readUInt16LE(i + 12); if (c > 0 && c * 2 <= p.length) return p.subarray(p.length - c * 2); } } return null; }
function sym(buf) { const o = []; for (let i = 0; i + 1 < buf.length; i += 2) { const w = buf.readUInt16LE(i); const hi = w >> 8, lo = w & 0xff;
  if (hi === 0) o.push(lo === 0x0f ? 'x' : (lo === 0x0b ? '(' : (lo === 0x0c ? ')' : '#' + lo)));
  else if (hi === 0x10) o.push('+-*/^'[lo]);
  else if (hi === 0x20) o.push('F' + lo);
  else if (hi === 0x60) o.push(String.fromCharCode(65 + lo));
  else if (hi === 0x70) o.push('@f' + String.fromCharCode(65 + lo));
  else o.push('?' + w.toString(16)); } return o.join(' '); }

const root = process.argv[2];
const pats = process.argv.slice(3).map(s => s.toLowerCase());
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.gsp$/i.test(e.name) && pats.some(pt => e.name.toLowerCase().includes(pt))) files.push(p); } })(root);

for (const f of files) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { console.log('ERR ' + f + ' ' + e.message); continue; }
  console.log('######## ' + path.basename(f) + '   (' + f + ')');
  for (const o of ir.objects) {
    const r = (o._raw.recs || []).find(r => r.tag === 2311); if (!r) continue;
    const pr = programOf(r.pay); if (!pr) continue;
    console.log('  #' + o.id + ' t' + o.srcType + ' label=' + JSON.stringify(o.label) + ' par=[' + o.parents.join(',') + ']');
    console.log('     ' + sym(pr));
  }
}
