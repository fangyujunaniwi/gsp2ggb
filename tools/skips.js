'use strict';
// Convert the first .gsp matching <pattern> and report per-type skip reasons and decoded t48/t0 expressions.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
const { irToGgb, planOf, toGgb } = require('../src/ggb');
const { decodeExpr } = require('../src/expr');
const root = process.argv[2], pat = process.argv[3];
const all = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.gsp$/i.test(e.name) && e.name.toLowerCase().includes(pat.toLowerCase())) all.push(p); } })(root);
const f = all[0];
const ir = gspToIR(fs.readFileSync(f));
const byId = new Map(); for (const o of ir.objects) byId.set(o.id, o);
console.log('file ' + f);
const reasons = new Map();
for (const o of ir.objects) {
  let p; try { p = planOf(o, byId); } catch (e) { p = { skip: 'ERR ' + e.message }; }
  if (p.skip) { const k = 't' + o.srcType + ': ' + p.skip; reasons.set(k, (reasons.get(k) || 0) + 1); }
}
for (const [k, v] of [...reasons].sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log('  ' + String(v).padStart(5) + '  ' + k);
// dump decoded expressions for t48 that are skipped
console.log('--- skipped t48/t71 decoded expressions ---');
let n = 0;
for (const o of ir.objects) {
  if (o.srcType !== 48 && o.srcType !== 71 && o.srcType !== 78) continue;
  let p; try { p = planOf(o, byId); } catch { continue; }
  if (!p.skip) continue;
  const pay = o._raw && o._raw.rich && o._raw.rich[2311];
  const d = pay ? decodeExpr(pay, o) : null;
  console.log('  #' + o.id + ' t' + o.srcType + ' [' + (o.label || '') + '] parents=[' + o.parents.join(',') + '] skip=' + p.skip + ' expr=' + (d ? (d.ok ? d.exprTpl : 'FAIL ' + d.reason) : 'none'));
  if (++n >= 12) break;
}
