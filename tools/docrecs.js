'use strict';
// Dump document-level (tag < 2000) records of a .gsp: tag, length, short hex, ascii.
const fs = require('fs');
const { parseRecords } = require('../src/gsp');
const buf = fs.readFileSync(process.argv[2]);
const recs = parseRecords(buf);
for (const r of recs) {
  if (r.tag >= 2000) continue;
  const hx = r.pay.length <= 48 ? r.pay.toString('hex') : r.pay.subarray(0, 48).toString('hex') + '...';
  const asc = r.pay.toString('latin1').replace(/[^\x20-\x7e]/g, '.');
  console.log('tag ' + r.tag + ' len=' + r.pay.length + '  ' + hx + (r.pay.length <= 48 ? '  | ' + asc : ''));
}