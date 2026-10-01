const fs = require('fs');
const b = fs.readFileSync(process.argv[2]);
const from = parseInt(process.argv[3], 16), to = parseInt(process.argv[4], 16);
for (let i = from; i < to; i += 8) {
  let s = '';
  for (let j = i; j < i + 8 && j < to; j++) s += j.toString(16).padStart(4, '0') + '=' + b[j].toString(16).padStart(2, '0') + '  ';
  console.log(s);
}
console.log('u32@0x45e=' + b.readUInt32LE(0x45e) + '  u32@0x462=' + b.readUInt32LE(0x462));
