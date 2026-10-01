// Full ordered object dump for a single .gsp file (samples = one construction, global ordinals).
// Usage: node dump6.js <file> [typeFilter] [maxLines]
const fs = require('fs');
const file = process.argv[2], typeF = (process.argv[3] === 'all' ? '' : process.argv[3]) || '', maxL = parseInt(process.argv[4] || '400');
const buf = fs.readFileSync(file);
function strAt(pay, o) { const n = pay.readUInt16LE(o); return pay.toString('utf8', o + 2, o + 2 + n); }
let p = 4; const objs = [];
while (p + 8 <= buf.length) {
  const len = buf.readUInt32LE(p), tag = buf.readUInt32LE(p + 4);
  if (p + 8 + len > buf.length) { console.log('OVERRUN @' + p + ' len=' + len + ' tag=' + tag); break; }
  const pay = buf.subarray(p + 8, p + 8 + len);
  if (tag === 2000) objs.push({ type: pay.readUInt16LE(0), recs: [], off: p });
  else if (objs.length) objs[objs.length - 1].recs.push({ tag, pay });
  p += 8 + len;
}
console.log('=== ' + file + ' objs=' + objs.length);
let n = 0;
objs.forEach((o, i) => {
  const t = o.type;
  if (typeF && String(t) !== typeF) return;
  let label = '', parents = [], extras = [];
  for (const r of o.recs) {
    if (r.tag === 2005) { try { label = strAt(r.pay, 22); } catch (e) {} }
    if (r.tag === 2002) { const c = r.pay.readUInt32LE(0); for (let k = 0; k < c; k++) parents.push(r.pay.readUInt32LE(4 + 4 * k)); }
    if (r.tag === 2201 && r.pay.length >= 16) extras.push('xy=(' + r.pay.readDoubleLE(0).toFixed(2) + ',' + r.pay.readDoubleLE(8).toFixed(2) + ')');
    if (r.tag === 2003 && r.pay.length >= 4) {
      const v = [];
      for (let k = 4; k + 8 <= r.pay.length && k < 36; k += 8) v.push(r.pay.readDoubleLE(k).toFixed(4));
      extras.push('2003[' + r.pay.readUInt32LE(0) + ':' + v.join(',') + ']');
    }
  }
  const pdesc = parents.map(pi => { const q = objs[pi - 1]; return q ? '#' + pi + '(t' + q.type + ')' : '#' + pi + '(?)'; });
  if (n++ >= maxL) return;
  console.log('#' + (i + 1) + ' t=' + t + (label ? ' lbl=' + label : '') + (parents.length ? ' <- ' + pdesc.join(',') : '') + (extras.length ? ' ' + extras.join(' ') : ''));
});
