'use strict';
// kindscan.js <kind> [parentIndex] — over out/corpus/manifest.json sources, tally the kinds of
// the given parent of every object whose IR kind matches, and the emitted element type.
const fs = require('fs');
const { gspToIR } = require('../src/gsp.js');
const { elemTypeOf } = require('../src/ggb.js');

const kind = process.argv[2];
const pi = parseInt(process.argv[3] || '1', 10);
const manifest = JSON.parse(fs.readFileSync('out/corpus/manifest.json', 'utf8'));
const tally = new Map(), tallyElem = new Map();
let n = 0;
for (const f of manifest) {
  let ir;
  try { ir = gspToIR(fs.readFileSync(f.src)); } catch { continue; }
  const by = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if (o.kind !== kind) continue;
    const p = by.get((o.parents || [])[pi]);
    if (!p) continue;
    n++;
    tally.set(p.kind, (tally.get(p.kind) || 0) + 1);
    const et = elemTypeOf(p, by);
    tallyElem.set(et, (tallyElem.get(et) || 0) + 1);
  }
}
console.log(kind + ' parents[' + pi + '] total=' + n);
console.log('-- IR kinds --');
[...tally.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(String(v).padStart(5) + '  ' + k));
console.log('-- emitted elem types --');
[...tallyElem.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(String(v).padStart(5) + '  ' + k));
