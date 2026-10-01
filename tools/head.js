// First N records of a .gsp. Usage: node head.js <file> [n]
const fs = require('fs');
const buf = fs.readFileSync(process.argv[2]);
const n = parseInt(process.argv[3] || '8');
let p = 4;
for (let i = 0; i < n && p + 8 <= buf.length; i++) {
  const len = buf.readUInt32LE(p), tag = buf.readUInt32LE(p + 4);
  const pay = buf.subarray(p + 8, p + 8 + Math.min(len, 40));
  console.log('@0x' + p.toString(16) + ' len=' + len + ' tag=' + tag + ' pay[' +
    Array.from(pay).map(b => b.toString(16).padStart(2, '0')).join(' ') + ']');
  if (p + 8 + len > buf.length) { console.log('  OVERRUN'); break; }
  p += 8 + len;
}
console.log('magic=' + buf.toString('latin1', 0, 4) + ' size=' + buf.length);
