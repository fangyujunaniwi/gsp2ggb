'use strict';
const fs = require('fs');
const { parseRecords, gspToIR } = require('../src/gsp.js');
const recs = parseRecords(fs.readFileSync(process.argv[2]));
const imgs = recs.filter(r => r.tag === 1300);
console.log('tag1300 count=' + imgs.length);
for (const r of imgs.slice(0, 3)) {
  console.log('  len=' + r.pay.length + ' hex=' + r.pay.subarray(0, 12).toString('hex') +
    ' w=' + r.pay.readUInt32LE(0) + ' h=' + r.pay.readUInt32LE(4));
}
const ir = gspToIR(fs.readFileSync(process.argv[2]));
console.log('meta.images=' + JSON.stringify((ir.meta.images || []).map(i => i.w + 'x' + i.h)));
