'use strict';
// Dump raw record tags/payloads for the first N objects of a given srcType,
// to decode types whose semantics are unknown (e.g. t21).
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
const wantType = parseInt(process.argv[3] || '21', 10);
const maxN = parseInt(process.argv[4] || '4', 10);
function walk(dir, out) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p); } return out; }
let shown = 0;
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if (o.srcType !== wantType || shown >= maxN) continue;
    shown++;
    const raw = o._raw;
    const ps = o.parents.map(id => { const q = byId.get(id); return q ? (q.kind + '#' + q.id + '["' + (q.label || '') + '"]') : ('?' + id); });
    console.log('==== t' + o.srcType + ' #' + o.id + ' "' + (o.label || '') + '" @ ' + path.basename(f));
    console.log('   parents=[' + ps.join(', ') + ']');
    console.log('   params=[' + (o.params || []).map(v => (+v).toFixed(4)).join(',') + ']');
    if (raw && raw.recs) {
      for (const r of raw.recs) {
        const hx = r.pay.length <= 64 ? r.pay.toString('hex') : r.pay.subarray(0, 64).toString('hex') + '...(' + r.pay.length + 'B)';
        console.log('   tag ' + r.tag + ' len=' + r.pay.length + '  ' + hx);
      }
    }
  }
  if (shown >= maxN) break;
}