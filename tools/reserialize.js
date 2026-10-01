// Parse a GSP and re-serialize it unchanged; report byte-identity / first difference.
const fs = require('fs');
const { parseRecords } = require('../src/gsp.js');
function serialize(recs) {
  const parts = [Buffer.from('GSP4', 'latin1')];
  for (const r of recs) {
    const h = Buffer.alloc(8);
    h.writeUInt32LE(r.pay.length, 0);
    h.writeUInt32LE(r.tag, 4);
    parts.push(h, r.pay);
  }
  return Buffer.concat(parts);
}
const src = process.argv[2];
const buf = fs.readFileSync(src);
const recs = parseRecords(buf);
const out = serialize(recs);
console.log('in=' + buf.length + ' out=' + out.length + ' identical=' + buf.equals(out));
if (!buf.equals(out)) {
  const n = Math.min(buf.length, out.length);
  for (let i = 0; i < n; i++) if (buf[i] !== out[i]) { console.log('first diff @0x' + i.toString(16) + ' in=' + buf[i] + ' out=' + out[i]); break; }
}
console.log('records=' + recs.length + ' tags=' + recs.map(r => r.tag).join(','));
