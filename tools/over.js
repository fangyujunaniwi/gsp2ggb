// Show bytes around a record-chain overrun. Usage: node over.js <file>
const fs = require('fs');
const buf = fs.readFileSync(process.argv[2]);
let p = 4, n = 0;
while (p + 8 <= buf.length) {
  const len = buf.readUInt32LE(p), tag = buf.readUInt32LE(p + 4);
  if (p + 8 + len > buf.length) {
    console.log('overrun @0x' + p.toString(16) + ' len=' + len + ' tag=' + tag + ' remaining=' + (buf.length - p));
    const s = Math.max(0, p - 32);
    console.log('context [' + s + '..' + Math.min(buf.length, p + 64) + ']:');
    for (let q = s; q < Math.min(buf.length, p + 64); q += 16) {
      const row = [];
      for (let k = q; k < Math.min(buf.length, q + 16); k++) row.push(buf[k].toString(16).padStart(2, '0'));
      console.log('  ' + q.toString(16).padStart(6, '0') + '  ' + row.join(' '));
    }
    break;
  }
  p += 8 + len; n++;
}
console.log('records=' + n + ' endedAt=0x' + p.toString(16) + ' filesize=' + buf.length);
