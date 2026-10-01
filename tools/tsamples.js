'use strict';
// Sample t29 / t33 (and t28/t31) objects: label, parent kinds, marker label/kind, params.
const fs = require('fs'), path = require('path');
const { gspToIR, TYPES } = require('../src/gsp');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
const want = new Set((process.argv[3] || '29,33,28,31,21').split(',').map(Number));
function walk(dir, out) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p); } return out; }
const shown = new Map();
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if (!want.has(o.srcType)) continue;
    const n = shown.get(o.srcType) || 0;
    if (n >= 6) continue;
    const ps = o.parents.map(id => { const q = byId.get(id); return q ? (q.kind + '#' + q.id + '\u3010' + (q.label || '') + '\u3011') : ('?' + id); });
    const par = o.params && o.params.length ? ' params=[' + o.params.map(v => (+v).toFixed(4)).join(',') + ']' : '';
    console.log('t' + o.srcType + ' #' + o.id + ' "' + (o.label || '') + '" <= [' + ps.join(', ') + ']' + par + '   @ ' + path.basename(f));
    shown.set(o.srcType, n + 1);
  }
  if ([...want].every(t => (shown.get(t) || 0) >= 6)) break;
}
