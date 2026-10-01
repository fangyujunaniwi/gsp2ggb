// Raw child-record hex dump for specific object ordinals. Usage: node dump8.js <file> <ordinals e.g. 2,3,6,7,8,13>
const fs = require('fs');
const buf = fs.readFileSync(process.argv[2]);
const want = new Set(process.argv[3].split(',').map(Number));
function strAt(pay, o) { const n = pay.readUInt16LE(o); return pay.toString('utf8', o + 2, o + 2 + n); }
const hex = b => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join(' ');
let p = 4; let idx = 0; let cur = null;
const out = [];
while (p + 8 <= buf.length) {
  const len = buf.readUInt32LE(p), tag = buf.readUInt32LE(p + 4);
  if (p + 8 + len > buf.length) break;
  const pay = buf.subarray(p + 8, p + 8 + len);
  if (tag === 2000) { idx++; cur = { idx, type: pay.readUInt16LE(0), hdr: pay, recs: [] }; if (want.has(idx)) out.push(cur); }
  else if (tag === 2007) cur = null;
  else if (cur && want.has(cur.idx)) cur.recs.push({ tag, pay });
  p += 8 + len;
}
for (const o of out) {
  console.log('#' + o.idx + ' type=' + o.type + ' hdr[' + hex(o.hdr) + ']');
  for (const r of o.recs) {
    let extra = '';
    if (r.tag === 2005) { try { extra = ' "' + strAt(r.pay, 22) + '"'; } catch (e) {} }
    if (r.tag === 1100 || r.tag === 2311 || r.tag === 2307 || r.tag === 2308 || r.tag === 2309 || r.tag === 2300) {
      try { extra = ' "' + r.pay.toString('utf8').replace(/[^\x20-\x7e一-鿿]/g, '.') + '"'; } catch (e) {}
    }
    console.log('  tag' + r.tag + ' len=' + r.pay.length + ' [' + hex(r.pay.subarray(0, Math.min(96, r.pay.length))) + ']' + extra);
  }
}
