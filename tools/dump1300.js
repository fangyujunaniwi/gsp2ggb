// Dump the structure around a tag-1300 (embedded preview) record.
// usage: node dump1300.js <file.gsp>
'use strict';
const fs = require('fs');
const buf = fs.readFileSync(process.argv[2]);
console.log('file size = ' + buf.length + ' (0x' + buf.length.toString(16) + ')');
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function hex(b) { return b.toString('hex'); }

// find all PNG signatures
const pngs = [];
let i = buf.indexOf(PNG, 0);
while (i >= 0 && pngs.length < 10) { pngs.push(i); i = buf.indexOf(PNG, i + 1); }
console.log('PNG signatures at: ' + pngs.map(o => '0x' + o.toString(16)).join(', '));

// walk records, stop at first 1300
let off = 4, n = 0;
while (off + 8 <= buf.length) {
  const len = buf.readUInt32LE(off), tag = buf.readUInt32LE(off + 4);
  if (tag === 1300) {
    console.log('\nFOUND tag1300 at 0x' + off.toString(16) + ' len=' + len + ' (0x' + len.toString(16) + ')');
    console.log('  payloadStart   = 0x' + (off + 8).toString(16));
    console.log('  payloadEnd     = 0x' + (off + 8 + len).toString(16) + '   (next record per this len)');
    console.log('  bytes before rec (16): ' + hex(buf.subarray(off - 16, off)));
    console.log('  header bytes        : ' + hex(buf.subarray(off, off + 8)));
    console.log('  payload first 48    : ' + hex(buf.subarray(off + 8, off + 56)));
    console.log('  bytes at payloadEnd : ' + hex(buf.subarray(off + 8 + len, off + 8 + len + 48)));
    // nearest PNG
    const near = pngs.filter(o => o > off && o < off + 8 + len + 4096);
    for (const o of near) {
      console.log('  PNG @0x' + o.toString(16) + ' = payload+ ' + (o - (off + 8)) + ' ; 16 bytes before: ' +
        hex(buf.subarray(o - 16, o)));
      // IHDR width/height (PNG: 8 sig + 4 len + 4 'IHDR' + 4 w + 4 h)
      console.log('    IHDR w=' + buf.readUInt32BE(o + 16) + ' h=' + buf.readUInt32BE(o + 20));
    }
    // try guessing a nested length at payload start
    console.log('  payload u32@0=' + buf.readUInt32LE(off + 8) + ' u32@4=' + buf.readUInt32LE(off + 12) +
      ' u32@8=' + buf.readUInt32LE(off + 16) + ' u32@12=' + buf.readUInt32LE(off + 20) +
      ' u32@16=' + buf.readUInt32LE(off + 24));
    break;
  }
  if (len > 50000000 || off + 8 + len > buf.length) {
    console.log('\nSTOP: bad record at 0x' + off.toString(16) + ' len=' + len + ' tag=' + tag);
    console.log('  bytes here: ' + hex(buf.subarray(off, off + 48)));
    break;
  }
  off += 8 + len; n++;
  if (n > 200000) break;
}