// Rebuild a GSP with byte patches to records.
// usage: node rebuild.js <src> <out> [tag<N> off<O>=<u32value>]...
const fs = require('fs');
const { parseRecords } = require('../src/gsp.js');
const [src, out, ...specs] = process.argv.slice(2);
const recs = parseRecords(fs.readFileSync(src));
for (const s of specs) {
  const m = /^tag(\d+)\s+off(\d+)=(\d+)$/.exec(s.trim());
  if (!m) { console.log('bad spec ' + s); continue; }
  const [, tag, off, val] = m;
  const r = recs.find(x => x.tag === +tag);
  if (!r) { console.log('tag ' + tag + ' not found'); continue; }
  if (+off + 4 > r.pay.length) { console.log('tag ' + tag + ' off ' + off + ' OOB (len ' + r.pay.length + ')'); continue; }
  r.pay.writeUInt32LE(+val >>> 0, +off);
  console.log('tag' + tag + ' off' + off + ' -> ' + val);
}
const parts = [Buffer.from('GSP4', 'latin1')];
for (const r of recs) { const h = Buffer.alloc(8); h.writeUInt32LE(r.pay.length, 0); h.writeUInt32LE(r.tag, 4); parts.push(h, r.pay); }
fs.writeFileSync(out, Buffer.concat(parts));
console.log('wrote ' + out);
