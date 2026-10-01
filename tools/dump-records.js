const fs = require('fs');
const file = process.argv[2];
const start = parseInt(process.argv[3] || '4', 16);
const b = fs.readFileSync(file);
let p = start, i = 0;
const TAGS = {};
while (p + 8 <= b.length && i < 400) {
  const len = b.readUInt32LE(p);
  const tag = b.readUInt32LE(p + 4);
  if (p + 8 + len > b.length) { console.log('BREAK at 0x' + p.toString(16) + ' len=' + len); break; }
  const pay = b.subarray(p + 8, p + 8 + len);
  const hex = Array.from(pay.subarray(0, 48)).map(x => x.toString(16).padStart(2, '0')).join(' ');
  let txt = '';
  try { txt = pay.toString('utf8').replace(/[^\x20-\x7e]/g, '.').slice(0, 60); } catch (e) {}
  console.log('#' + String(i).padStart(3) + ' 0x' + p.toString(16).padStart(4, '0') +
    '  tag=' + String(tag).padStart(6) + '  len=' + String(len).padStart(4) + '  ' + hex + '   |' + txt + '|');
  TAGS[tag] = (TAGS[tag] || 0) + 1;
  p += 8 + len; i++;
}
console.log('--- end 0x' + p.toString(16) + ' filelen=' + b.length + ' consumed=' + (b.length - p));
console.log('--- tag histogram:');
for (const k of Object.keys(TAGS).sort((a, b2) => +a - +b2)) console.log('    ' + k + ' : ' + TAGS[k]);
