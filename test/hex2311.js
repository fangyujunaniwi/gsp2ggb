// Hexdump the tag-2311 (and 2211/2307/2005) payloads of selected .gsp objects.
// usage: node test/hex2311.js <file.gsp> <id[,id...] | all> [tag]
'use strict';
const fs = require('fs');
const { gspToIR } = require('../src/gsp');

const file = process.argv[2];
const which = process.argv[3] || 'all';
const onlyTag = process.argv[4] ? parseInt(process.argv[4], 10) : null;
const ids = which === 'all' ? null : which.split(',').map(Number);

const ir = gspToIR(fs.readFileSync(file));
for (const o of ir.objects) {
  if (ids && !ids.includes(o.id)) continue;
  console.log('===== #' + o.id + ' t' + o.srcType + ' kind=' + o.kind +
    ' lab=' + JSON.stringify(o.label) + ' par=' + JSON.stringify(o.parents));
  {
    const h = Buffer.from(o._raw.hdr || []);
    console.log('  -- hdr(2000) len=' + h.length + ' ' +
      h.toString('hex').replace(/(.{8})/g, '$1 ').trimEnd());
  }
  for (const r of o._raw.recs) {
    if (onlyTag && r.tag !== onlyTag) continue;
    const b = Buffer.from(r.pay);
    console.log('  -- tag' + r.tag + ' len=' + b.length);
    for (let i = 0; i < b.length; i += 16) {
      const sl = b.subarray(i, i + 16);
      const hex = sl.toString('hex').replace(/(.{8})/g, '$1 ').trimEnd();
      const asc = sl.toString('latin1').replace(/[^\x20-\x7e]/g, '.');
      console.log('    ' + String(i).padStart(3) + ': ' + hex.padEnd(40) + '  ' + asc);
    }
  }
}
