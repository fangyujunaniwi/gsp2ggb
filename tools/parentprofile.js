'use strict';
// Parent-kind profile for selected types across the corpus.
const fs = require('fs'), path = require('path');
const { gspToIR, TYPES } = require('../src/gsp');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
const want = new Set((process.argv[3] || '5,6,7,34,63,15,3,64').split(',').map(Number));
function walk(dir, out) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p); } return out; }
const stat = new Map(); // type -> Map(signature -> count)
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if (!want.has(o.srcType)) continue;
    const sig = o.parents.map(id => { const q = byId.get(id); return q ? q.kind : 'null'; }).join(',');
    if (!stat.has(o.srcType)) stat.set(o.srcType, new Map());
    const m = stat.get(o.srcType);
    m.set(sig, (m.get(sig) || 0) + 1);
  }
}
for (const [t, m] of [...stat.entries()].sort((a, b) => a[0] - b[0])) {
  console.log('== t' + t + ' (' + (TYPES[t] ? TYPES[t].k : '?') + ')');
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([s, c]) => console.log('   ' + c + '\t[' + s + ']'));
}
