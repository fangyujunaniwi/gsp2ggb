'use strict';
// Profile t47 (ratio measure): parent shapes overall, and specifically as t33/t29 markers.
// usage: node test/probe47.js <corpusRoot>
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p);
  }
  return out;
}
const shape = {};                      // parent-kind signature -> count (all t47)
const asMarker = { 33: {}, 29: {} };   // t33/t29 marker parent-shape -> count
const samples3 = [];
const allParams = [];
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  const sig = P => P.map(q => q ? (q.kind + ':t' + q.srcType) : '?').join(',');
  for (const o of ir.objects) {
    if (o.srcType === 47) {
      const P = o.parents.map(id => byId.get(id));
      const s = sig(P);
      shape[s] = (shape[s] || 0) + 1;
      if (P.length >= 3 && P.every(q => q && q.kind === 'free')) {
        if (samples3.length < 8) samples3.push('#' + o.id + ' label=' + JSON.stringify(o.label || '') +
          ' <= [' + P.map(q => q.label || q.kind + '#' + q.id).join(', ') + '] params=[' +
          (o.params || []).map(v => (+v).toFixed(4)).join(',') + '] @ ' + path.basename(f));
      }
    }
    if ((o.srcType === 29 || o.srcType === 33) && o.parents.length >= 3) {
      const mk = byId.get(o.parents[2]);
      if (mk && mk.srcType === 47) {
        const P = mk.parents.map(id => byId.get(id));
        const s = sig(P);
        asMarker[o.srcType][s] = (asMarker[o.srcType][s] || 0) + 1;
      }
    }
  }
}
console.log('=== all t47 parent shapes (top 15) ===');
for (const [k, v] of Object.entries(shape).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(v + '\t' + k);
console.log('\n=== t47 as t33 marker ==='); console.log(JSON.stringify(asMarker[33]));
console.log('=== t47 as t29 marker ==='); console.log(JSON.stringify(asMarker[29]));
console.log('\n=== t47 3-point samples ==='); for (const s of samples3) console.log(s);
