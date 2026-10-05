'use strict';
// Find objects whose records contain an image's dimensions (the tag-1300 8-byte header),
// which is how the image object should reference its bitmap.
const fs = require('fs');
const { parseRecords } = require('../src/gsp.js');

const recs = parseRecords(fs.readFileSync(process.argv[2]));
// collect image dimension headers
const dims = recs.filter(r => r.tag === 1300).map(r => ({
  w: r.pay.readUInt32LE(0), h: r.pay.readUInt32LE(4)
}));
console.log('tag1300 dims: ' + dims.map(d => d.w + 'x' + d.h).join(', '));

let ord = 0, cur = null;
for (const r of recs) {
  if (r.tag === 2000) { ord++; cur = { ord, type: r.pay.readUInt16LE(0), recs: [] }; continue; }
  if (!cur) continue;
  for (const d of dims) {
    const lo = Buffer.alloc(8); lo.writeUInt32LE(d.w, 0); lo.writeUInt32LE(d.h, 4);
    const hi = Buffer.alloc(8); hi.writeUInt32LE(d.h, 0); hi.writeUInt32LE(d.w, 4);
    if (r.pay.includes(lo) || r.pay.includes(hi))
      cur.recs.push('tag' + r.tag + '[' + r.pay.length + ']:' + r.pay.toString('hex').slice(0, 48) + '  matches ' + d.w + 'x' + d.h);
  }
  if (r.tag === 2007) {
    if (cur.recs.length) console.log('#' + cur.ord + ' t' + cur.type + '  ' + cur.recs.join('  '));
    cur = null;
  }
}
