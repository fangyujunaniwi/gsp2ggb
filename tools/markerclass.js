'use strict';
// Classify t29/t33 (3-parent transforms) by what their marker subtree depends on:
//   angle    -> reaches t41/t113/t120 (angle objects/measure)
//   length   -> reaches t36/t37 (segment length / point distance)
//   calc     -> reaches t94 (unknown calc) / t48 text only
//   other
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
function walk(dir, out) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p); } return out; }
const ANGLE = new Set([41, 113, 120]);
const LEN = new Set([36, 37]);
const stats = { 29: {}, 33: {} };
let shown = 0;
for (const f of walk((process.env.GSP_DIR || 'D:\\Sketchpad5'), [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if (o.srcType !== 29 && o.srcType !== 33) continue;
    const seen = new Set(); let hasA = false, hasL = false, has94 = false;
    (function dfs(id) { if (seen.has(id)) return; seen.add(id); const q = byId.get(id); if (!q) return; if (ANGLE.has(q.srcType)) hasA = true; if (LEN.has(q.srcType)) hasL = true; if (q.srcType === 94) has94 = true; for (const p of q.parents) dfs(p); })(o.parents[2]);
    const cls = hasA ? 'angle' : (hasL ? 'length' : (has94 ? 'calc94' : 'other'));
    stats[o.srcType][cls] = (stats[o.srcType][cls] || 0) + 1;
  }
}
console.log('t29 marker classes:', stats[29]);
console.log('t33 marker classes:', stats[33]);