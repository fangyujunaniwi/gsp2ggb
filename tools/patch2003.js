// Patch a double in an object's tag-2003 payload. Usage: node patch2003.js <in> <out> <ordinal> <doubleValue>
const fs = require('fs');
const [inp, outp, ordS, valS] = process.argv.slice(2);
const buf = fs.readFileSync(inp);
let p = 4, idx = 0, done = false;
while (p + 8 <= buf.length) {
  const len = buf.readUInt32LE(p), tag = buf.readUInt32LE(p + 4);
  if (p + 8 + len > buf.length) break;
  if (tag === 2000) idx++;
  if (tag === 2003 && idx === parseInt(ordS)) {
    if (len < 12) { console.error('payload too small: ' + len); process.exit(1); }
    const old = buf.readDoubleLE(p + 8 + 4);
    buf.writeDoubleLE(parseFloat(valS), p + 8 + 4);
    console.log('patched obj#' + ordS + ' tag2003 double: ' + old + ' -> ' + valS);
    done = true; break;
  }
  p += 8 + len;
}
if (!done) { console.error('object/2003 not found'); process.exit(1); }
fs.writeFileSync(outp, buf);
console.log('wrote ' + outp);
