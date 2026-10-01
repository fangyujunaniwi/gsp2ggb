'use strict';
// Dump gsp-template.json header/tail records with tag, length and a short hex preview.
const tpl = require('../src/gsp-template.json');
for (const part of ['header', 'tail']) {
  console.log('==== ' + part + ' (' + tpl[part].length + ' records)');
  for (const r of tpl[part]) {
    let hint = '';
    const b = Buffer.from(r.pay, 'hex');
    if (r.tag === 1000 && b.length >= 28) hint = ' objCount@24=' + b.readUInt32LE(24);
    if (r.tag === 1000) {
      hint += ' u32s=' + Array.from({ length: Math.min(b.length >> 2, 12) }, (_, i) => b.readUInt32LE(i * 4)).join(',');
    }
    if (b.length >= 16 && b.length <= 64) {
      const d = [];
      for (let i = 0; i + 8 <= b.length; i += 8) d.push(b.readDoubleLE(i).toFixed(2));
      hint += (hint ? ' ' : '') + 'dbl=[' + d.join(',') + ']';
    }
    console.log('tag=' + r.tag + ' len=' + b.length + ' ' + b.toString('hex').slice(0, 80) + hint);
  }
}
