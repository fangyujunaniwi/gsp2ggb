// Attribute each skipped object once to its *root* cause (nearest directly-skipped ancestor).
// usage: node tools/cascade.js <root> [--top N]
'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
const { irToGgb } = require('../src/ggb');

const args = process.argv.slice(2);
const root = path.resolve(args[0] || '.');
const ti = args.indexOf('--top');
const TOP = ti >= 0 ? parseInt(args[ti + 1], 10) : 30;
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(root);

const direct = new Map();   // srcType -> directly skipped (own reason)
const cascade = new Map();  // srcType -> objects skipped only because of it
const reasonText = new Map(); // 'skip reason' text -> total (root cause), for reporting
for (const f of files) {
  let ir;
  try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  let r;
  try { r = irToGgb(ir); } catch { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  const reason = new Map(); // id -> reason text
  const blocker = new Map(); // id -> parent id named in cascade reason
  for (const w of r.warnings) {
    const m = /^skip #(\d+) t(\d+) [^:]+: (.*)$/.exec(w);
    if (!m) continue;
    const id = parseInt(m[1], 10), why = m[3];
    reason.set(id, why);
    const b = /depends on skipped object #(\d+)$/.exec(why);
    if (b) blocker.set(id, parseInt(b[1], 10));
  }
  const memo = new Map();
  const rootOf = id => {
    if (memo.has(id)) return memo.get(id);
    let res;
    if (!reason.has(id)) res = null;              // emitted
    else if (!blocker.has(id)) res = id;          // direct root
    else res = rootOf(blocker.get(id));
    memo.set(id, res);
    return res;
  };
  for (const o of ir.objects) {
    if (!reason.has(o.id)) continue;
    const rt = rootOf(o.id);
    const rtType = rt != null && byId.get(rt) ? byId.get(rt).srcType : -1;
    if (rt === o.id) direct.set(o.srcType, (direct.get(o.srcType) || 0) + 1);
    else cascade.set(rtType, (cascade.get(rtType) || 0) + 1);
    // tally root reason text
    const rtxt = (byId.get(rt) ? reason.get(rt) : '?') || '?';
    reasonText.set(rtxt, (reasonText.get(rtxt) || 0) + 1);
  }
}
const rows = [...new Set([...direct.keys(), ...cascade.keys()])].map(t =>
  ({ t, d: direct.get(t) || 0, c: cascade.get(t) || 0 }));
rows.sort((a, b) => (b.d + b.c) - (a.d + a.c));
console.log('=== root-cause leverage (each skipped object counted once) ===');
console.log('type\tdirect\tcascade\ttotal');
for (const r of rows.slice(0, TOP)) console.log('t' + r.t + '\t' + r.d + '\t' + r.c + '\t' + (r.d + r.c));
console.log('\n=== root skip reasons (top ' + TOP + ') ===');
for (const [k, v] of [...reasonText.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP))
  console.log(v + '\t' + k);