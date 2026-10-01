'use strict';
// Measure how many tag-2311 expression programs decode with src/expr.js.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
const { decodeExpr } = require('../src/expr');

const root = process.argv[2];
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.gsp$/i.test(e.name)) files.push(p); } })(root);

let total = 0, ok = 0;
const byType = {}; const reasons = {}; const samples = [];
for (const f of files) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  for (const o of ir.objects) {
    const pay = o._raw && o._raw.rich && o._raw.rich[2311]; if (!pay) continue;
    total++;
    const r = decodeExpr(pay, o);
    const key = 't' + o.srcType;
    byType[key] = byType[key] || { total: 0, ok: 0 };
    byType[key].total++;
    if (r.ok) { ok++; byType[key].ok++; if (samples.length < 12 && o.srcType === 48) samples.push(key + ' [' + o.label + '] => ' + r.exprTpl); }
    else reasons[r.reason] = (reasons[r.reason] || 0) + 1;
  }
}
console.log('2311 objects=' + total + '  decoded=' + ok + ' (' + (100 * ok / total).toFixed(1) + '%)');
console.log('--- by type ---');
for (const k of Object.keys(byType).sort((a, b) => byType[b].total - byType[a].total)) console.log('  ' + k.padEnd(6) + byType[k].ok + '/' + byType[k].total);
console.log('--- failure reasons ---');
for (const k of Object.keys(reasons).sort((a, b) => reasons[b] - reasons[a])) console.log('  ' + String(reasons[k]).padStart(7) + '  ' + k);
console.log('--- samples ---');
for (const s of samples) console.log('  ' + s);
