'use strict';
// Isolate the 2311 token program by comparing records of known formulas.
const fs = require('fs');
const { gspToIR } = require('../src/gsp');
const g = process.argv[2];
const ir = gspToIR(fs.readFileSync(g));
const byId = new Map(ir.objects.map(o => [o.id, o]));
function hex(id) { const o = byId.get(id); const r = o._raw.recs.find(r => r.tag === 2311); return r ? r.pay.toString('hex') : null; }
const ids = process.argv.slice(3).map(Number);
const hx = {};
for (const id of ids) hx[id] = hex(id);
// longest common suffix of two hex strings, aligned on bytes
function lcsuffix(a, b) {
  const A = Buffer.from(a, 'hex'), B = Buffer.from(b, 'hex');
  let n = 0;
  while (n < A.length && n < B.length && A[A.length - 1 - n] === B[B.length - 1 - n]) n++;
  return A.subarray(A.length - n).toString('hex');
}
if (ids.length >= 2) {
  for (let i = 0; i + 1 < ids.length; i++) {
    const s = lcsuffix(hx[ids[i]], hx[ids[i + 1]]);
    console.log('common suffix #' + ids[i] + ' & #' + ids[i + 1] + ' : ' + (s.length / 2) + ' bytes');
    console.log('   ' + s.replace(/(..)/g, '$1 ').trim());
  }
}
console.log('\n--- full payloads ---');
for (const id of ids) {
  const b = Buffer.from(hx[id], 'hex');
  console.log('#' + id + ' (' + b.length + 'B):');
  console.log('   ' + b.toString('hex').replace(/(..)/g, '$1 ').trim());
}