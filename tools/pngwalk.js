// Parse embedded PNG chunks to find their exact end offsets, then compare with
// the record boundaries the standard framing implies. Helps fix tag-1300 framing.
// usage: node pngwalk.js <file.gsp>
'use strict';
const fs = require('fs');
const buf = fs.readFileSync(process.argv[2]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngEnd(start) {
  let p = start + 8;
  for (;;) {
    if (p + 8 > buf.length) return -1;
    const len = buf.readUInt32BE(p);
    const type = buf.toString('latin1', p + 4, p + 8);
    p += 12 + len;
    if (type === 'IEND') return p;
    if (p > buf.length) return -1;
  }
}

// collect all PNGs
const pngs = [];
for (let o = buf.indexOf(PNG, 0); o >= 0 && pngs.length < 30; o = buf.indexOf(PNG, o + 1)) {
  pngs.push({ o, end: pngEnd(o) });
}
console.log('PNGs:');
for (const g of pngs) console.log('  @0x' + g.o.toString(16) + ' end=0x' + g.end.toString(16) + ' len=' + (g.end - g.o));

// walk and, at each 1300, show computed boundaries vs actual next record / PNG end
let off = 4, n = 0;
while (off + 8 <= buf.length) {
  const len = buf.readUInt32LE(off), tag = buf.readUInt32LE(off + 4);
  if (tag === 1300) {
    const ps = off + 8;
    const pe = ps + len;
    const w = buf.readUInt32LE(ps), h = buf.readUInt32LE(ps + 4);
    const png = buf.indexOf(PNG, ps);
    const pend = png >= 0 ? pngEnd(png) : -1;
    console.log('\ntag1300 @0x' + off.toString(16) + ' len=' + len + ' payload=[0x' + ps.toString(16) + ',0x' + pe.toString(16) + ') w=' + w + ' h=' + h);
    console.log('  png@0x' + png.toString(16) + ' pngEnd=0x' + pend.toString(16) + ' pngLen=' + (pend - png));
    console.log('  payloadLen=' + len + '  (w/h=8 + png=' + (pend - png) + ') => needLen=' + (8 + pend - png) + ' diff=' + (len - (8 + pend - png)));
    console.log('  implied-next by len    = 0x' + pe.toString(16));
    console.log('  implied-next by pngEnd = 0x' + pend.toString(16));
    console.log('  bytes at implied-next-by-len  : ' + buf.toString('hex', pe, pe + 24));
    console.log('  bytes at implied-next-by-pngEnd: ' + buf.toString('hex', pend, pend + 24));
    // if pngEnd is authoritative, real next record header:
    if (pend > 0) {
      console.log('  next rec if pngEnd: len=' + buf.readUInt32LE(pend) + ' tag=' + buf.readUInt32LE(pend + 4) +
        '   (=0x' + buf.readUInt32LE(pend + 4).toString(16) + ')');
    }
    off = pe; n++;
    continue;
  }
  if (len > 100000 || off + 8 + len > buf.length) {
    console.log('\nSTOP bad rec @0x' + off.toString(16) + ' len=' + len + ' tag=' + tag);
    console.log('  ' + buf.toString('hex', off, off + 48));
    break;
  }
  off += 8 + len; n++;
  if (n > 300000) break;
}