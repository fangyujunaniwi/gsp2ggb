// Walk records applying known one-byte pad rules with verbose logging, to diagnose
// remaining desyncs. Mirrors src/gsp.js logic.
// usage: node walkfix.js <file.gsp>
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

let off = 4, n = 0, count1300 = 0;
const hist = [];
while (off + 8 <= buf.length) {
  const len = buf.readUInt32LE(off), tag = buf.readUInt32LE(off + 4);
  hist.push({ off, tag, len });
  if (hist.length > 10) hist.shift();
  if (tag === 1300) {
    count1300++;
    const ps = off + 8;
    const png = buf.indexOf(PNG, ps);
    const pend = png >= 0 ? pngEnd(png) : -1;
    const storedEnd = ps + len;
    const t1 = storedEnd + 4 + 4 <= buf.length ? buf.readUInt32LE(storedEnd + 4) : -1;
    const t2 = storedEnd + 5 + 4 <= buf.length ? buf.readUInt32LE(storedEnd + 5) : -1;
    console.log('#1300 @0x' + off.toString(16) + ' len=' + len + ' ps=0x' + ps.toString(16) +
      ' storedEnd=0x' + storedEnd.toString(16) + ' pngEnd=' + (pend > 0 ? '0x' + pend.toString(16) : 'none') +
      (pend > 0 ? ' pngEnd-storeEnd=' + (pend - storedEnd) : '') +
      '  t1=' + t1 + '(0x' + (t1 >>> 0).toString(16) + ') t2=' + t2 + '(0x' + (t2 >>> 0).toString(16) + ')');
    // decide pad same as src
    let p = storedEnd;
    if (p + 1 === buf.length && buf[p] === 0x00) p += 1;
    else if (p + 9 <= buf.length && buf.readUInt32LE(p + 4) >= 0x10000 && buf.readUInt32LE(p + 5) < 0x10000) p += 1;
    const skipped = p - storedEnd;
    console.log('   -> pad skipped=' + skipped + ' next@0x' + p.toString(16) +
      ' nextLen=' + buf.readUInt32LE(p) + ' nextTag=' + buf.readUInt32LE(p + 4));
    off = p; n++;
    continue;
  }
  if (tag === 9009) {
    const storedEnd = off + 8 + len;
    let p = storedEnd;
    if (p + 9 <= buf.length && buf.readUInt32LE(p + 4) >= 0x10000 &&
        buf.readUInt32LE(p + 5) < 0x10000) p++;
    if (p !== storedEnd) console.log('#9009 @0x' + off.toString(16) + ' len=' + len +
      ' -> pad skipped=1 next@0x' + p.toString(16) + ' nextLen=' + buf.readUInt32LE(p) +
      ' nextTag=' + buf.readUInt32LE(p + 4));
    off = p; n++;
    continue;
  }
  if (off + 8 + len > buf.length) {
    console.log('\nOVERRUN @0x' + off.toString(16) + ' len=' + len + ' tag=' + tag + ' (0x' + (tag >>> 0).toString(16) + ') remain=' + (buf.length - off - 8));
    console.log('  bytes: ' + buf.toString('hex', off, off + 48));
    break;
  }
  if (len > 2000000) {
    console.log('\nHUGE @0x' + off.toString(16) + ' len=' + len + ' tag=' + tag);
    console.log('  bytes: ' + buf.toString('hex', off, off + 48));
    break;
  }
  off += 8 + len; n++;
  if (n > 300000) break;
}
console.log('\nended @0x' + off.toString(16) + ' of 0x' + buf.length.toString(16) + ' records=' + n + ' 1300count=' + count1300 +
  ' trailing=' + (buf.length - off));
