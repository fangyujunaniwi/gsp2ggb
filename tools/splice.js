// Splice object blocks from a source file into a donor's header/tail (keeping donor metadata).
// usage: node splice.js <donor> <source> <out> <mode:empty|objs> [ordinals...]
const fs = require('fs');
const { parseRecords } = require('../src/gsp.js');
const [donor, source, out, mode, ...rest] = process.argv.slice(2);

function split(recs) {
  const first = recs.findIndex(r => r.tag === 2000);
  const lastTag = recs.map(r => r.tag).lastIndexOf(2007);
  return { header: recs.slice(0, first), tail: recs.slice(lastTag + 1), body: recs.slice(first, lastTag + 1) };
}
function blocks(body) {
  const out = []; let cur = null;
  for (const r of body) {
    if (r.tag === 2000) cur = [];
    if (!cur) continue;
    cur.push(r);
    if (r.tag === 2007) { out.push(cur); cur = null; }
  }
  return out;
}
function wrap(recs) {
  const parts = [Buffer.from('GSP4', 'latin1')];
  for (const r of recs) { const h = Buffer.alloc(8); h.writeUInt32LE(r.pay.length, 0); h.writeUInt32LE(r.tag, 4); parts.push(h, r.pay); }
  return Buffer.concat(parts);
}
const D = split(parseRecords(fs.readFileSync(donor)));
const S = split(parseRecords(fs.readFileSync(source)));
let chosen = [];
if (mode === 'objs') {
  const bs = blocks(S.body);
  chosen = rest.length ? rest.map(n => bs[+n - 1]).filter(Boolean).flat() : bs.flat();
}
const recs = [...D.header, ...chosen, ...D.tail];
const cnt = chosen.filter(r => r.tag === 2000).length;
const c = recs.find(r => r.tag === 1000);
if (c && c.pay.length >= 28) c.pay.writeUInt32LE(cnt, 24);
const t = [...recs].reverse().find(r => r.tag === 9000);
if (t && t.pay.length >= 4) t.pay.writeUInt32LE(cnt, 0);
fs.writeFileSync(out, wrap(recs));
console.log('wrote ' + out + ' objects=' + cnt);
