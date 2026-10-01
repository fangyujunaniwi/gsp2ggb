// Dump the child records of one object ordinal (1-based, global).
const fs = require('fs');
const { parseRecords, strAt } = require('../src/gsp.js');
const buf = fs.readFileSync(process.argv[2]);
const ords = process.argv.slice(3).map(x => parseInt(x, 10));
const recs = parseRecords(buf);
let n = 0, target = false;
for (const r of recs) {
  if (r.tag === 2000) {
    n++;
    target = ords.includes(n);
    if (target) console.log('OBJ#' + n + ' type=' + r.pay.readUInt16LE(0) + ' hdr=' + r.pay.toString('hex'));
  }
  if (!target) continue;
  if (!r.tag) continue;
  if (r.tag === 2007) { console.log('  [2007 end len=' + r.pay.length + ']'); target = false; continue; }
  let extra = '';
  if (r.tag === 2005) extra = ' lbl="' + strAt(r.pay, 22) + '"';
  if (r.tag === 2002) {
    const c = r.pay.readUInt32LE(0);
    const ps = []; for (let i = 0; i < c; i++) ps.push(r.pay.readUInt32LE(4 + i * 4));
    extra = ' parents=[' + ps + ']';
  }
  if (r.tag === 2003) {
    const ds = []; for (let o = 4; o + 8 <= r.pay.length; o += 8) ds.push(r.pay.readDoubleLE(o).toFixed(4));
    if (r.pay.length >= 4) extra = ' echo=' + r.pay.readUInt32LE(0) + ' doubles=[' + ds.join(', ') + ']';
    else extra = ' u16s=[' + Array.from({ length: r.pay.length >> 1 }, (_, i) => r.pay.readUInt16LE(i * 2)).join(',') + ']';
  }
  if (r.tag === 2201 && r.pay.length >= 16) extra = ' xy=' + r.pay.readDoubleLE(0).toFixed(2) + ',' + r.pay.readDoubleLE(8).toFixed(2);
  if (r.tag === 2311 || r.tag === 2211 || r.tag === 2309 || r.tag === 2308 || r.tag === 2307 || r.tag === 2306 || r.tag === 2310 || r.tag === 2304) {
    // try to show embedded ASCII/UTF-16 strings + leading ints
    const s = r.pay.toString('latin1');
    const strs = (s.match(/[\x20-\x7e]{4,}/g) || []).slice(0, 6);
    const u16s = []; for (let i = 0; i + 2 <= Math.min(r.pay.length, 24); i += 2) u16s.push(r.pay.readUInt16LE(i));
    extra = ' u16s=' + u16s.join(',') + ' ascii=' + JSON.stringify(strs);
  }
  console.log('  [' + r.tag + '] len=' + r.pay.length + extra + ' hex=' + r.pay.subarray(0, 120).toString('hex'));
}
