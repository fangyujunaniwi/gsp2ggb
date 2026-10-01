'use strict';
// Dump t47 objects (parents, params, value, rich record tags) for one file.
// usage: node test/t47raw.js <file.gsp>
const fs = require('fs');
const { gspToIR } = require('../src/gsp');
const ir = gspToIR(fs.readFileSync(process.argv[2]));
const byId = new Map(ir.objects.map(o => [o.id, o]));
let n = 0;
for (const o of ir.objects) {
  if (o.srcType !== 47) continue;
  const P = o.parents.map(id => { const q = byId.get(id); return q ? (q.label || q.kind + '#' + q.id) : '#' + id; });
  const rich = (o._raw && o._raw.rich) ? Object.keys(o._raw.rich).join(',') : '';
  console.log('#' + o.id + ' label=' + JSON.stringify(o.label || '') +
    ' kind=' + o.kind + ' parents=[' + P.join(', ') + ']' +
    ' params=[' + (o.params || []).map(v => (+v).toFixed(5)).join(',') + ']' +
    ' value=' + JSON.stringify(o.value) + ' coords=' + JSON.stringify(o.coords) + ' rich=[' + rich + ']');
  const recs = (o._raw && o._raw.recs) || [];
  for (const r of recs) {
    if (r.tag === 2307) {
      let dec = null;
      try { dec = require('../src/expr').decodeExpr(r.pay, o); } catch (e) { dec = { ok: false, reason: e.message }; }
      console.log('   2307 len=' + r.pay.length + ' hex=' + r.pay.toString('hex') + '  decode=' + JSON.stringify(dec));
    }
  }
  if (++n >= 20) break;
}
