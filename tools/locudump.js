'use strict';
// locudump.js <file.gsp> — print every t35 locus with its traced/mover and the mover's host path.
const fs = require('fs');
const { gspToIR } = require('../src/gsp.js');
const ir = gspToIR(fs.readFileSync(process.argv[2]));
const by = new Map(ir.objects.map(o => [o.id, o]));
const d = id => { const o = by.get(id); return '#' + id + '(t' + (o ? o.srcType : '?') + ' ' + (o ? o.kind : '?') + ')'; };
for (const o of ir.objects.filter(x => x.srcType === 35)) {
  const mover = by.get(o.parents[2]);
  console.log('locus ' + d(o.id) + '  traced=' + d(o.parents[0]) + '  path=' + d(o.parents[1]) + '  mover=' + d(o.parents[2]) +
    (mover && mover.parents ? '  mover.host=' + d(mover.parents[0]) : ''));
}
