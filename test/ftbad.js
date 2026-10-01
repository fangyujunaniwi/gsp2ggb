'use strict';
const fs = require('fs');
const { gspToIR } = require('../src/gsp');
const file = process.argv[2];
const ir = gspToIR(fs.readFileSync(file));
let shown = 0;
for (const o of ir.objects) {
  if (o.srcType !== 0) continue;
  const r = (o._raw.recs || []).find(x => x.tag === 2300);
  if (!r) continue;
  if (!/[\u0000-\u0008\u000b-\u001f]/.test(o.msg)) continue;
  const b = Buffer.from(r.pay);
  console.log('===== #' + o.id + ' lab=' + JSON.stringify(o.label) + ' msg=' + JSON.stringify(o.msg));
  for (let i = 0; i < b.length; i += 16) {
    const sl = b.subarray(i, i + 16);
    console.log('  ' + String(i).padStart(3) + ': ' + sl.toString('hex').replace(/(.{8})/g, '$1 ').trimEnd() +
      '  ' + sl.toString('latin1').replace(/[^\x20-\x7e]/g, '.'));
  }
  if (++shown >= 6) break;
}
