// Ordered per-section object dump for .gsp tool files.
// Usage: node dump4.js <file> [nameFilter]
const fs = require('fs');
const file = process.argv[2];
const filter = process.argv[3] || '';
const buf = fs.readFileSync(file);
function recs() {
  let p = 4, out = [];
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32LE(p), tag = buf.readUInt32LE(p + 4);
    out.push({ off: p, tag, plen: len, pay: buf.subarray(p + 8, p + 8 + len) });
    p += 8 + len;
  }
  return out;
}
function strAt(pay, o) {
  const n = pay.readUInt16LE(o); return pay.toString('utf8', o + 2, o + 2 + n);
}
function labelOf(pay) {
  // tag 2005: u16 f,u16,u16,i16 dx,i16 dy,6*u16,u16 strlen,str
  try { return strAt(pay, 22); } catch (e) { return '?'; }
}
const R = recs();
// sections delimited by tag 1100 (tool name)
const sections = [];
let cur = { name: '<header>', objs: [] };
for (const r of R) {
  if (r.tag === 1100) { sections.push(cur); cur = { name: strAt(r.pay, 0), objs: [] }; }
  else if (r.tag === 2000) {
    cur.objs.push({ type: r.pay.readUInt16LE(0), recs: [], off: r.off });
  }
  else if (r.tag === 2007) { /* end */ }
  else if (cur.objs.length) cur.objs[cur.objs.length - 1].recs.push(r);
}
sections.push(cur);
// global ordinal = position in concatenation of all sections' objs
let g = 0;
for (const s of sections) for (const o of s.objs) { o.gord = ++g; }
for (const s of sections) {
  if (!s.objs.length) continue;
  if (filter && !s.name.includes(filter)) continue;
  console.log('--- ' + s.name + ' (' + s.objs.length + ' objs) ---');
  s.objs.forEach((o, i) => {
    let label = '', parents = [];
    for (const r of o.recs) {
      if (r.tag === 2005) { try { label = strAt(r.pay, 22); } catch (e) {} }
      if (r.tag === 2002) { const n = r.pay.readUInt32LE(0); for (let k = 0; k < n; k++) parents.push(r.pay.readUInt32LE(4 + 4 * k)); }
    }
    const desc = parents.map(pi => {
      let po = s.objs[pi - 1]; // construction-local 1-based ordinal
      if (!po) po = (() => { const so = sections.find(ss => ss.objs.some(x => x.gord === pi)); return so && so.objs.find(x => x.gord === pi); })();
      if (!po) return '#' + pi + '(?)';
      let pl = ''; for (const r of po.recs) if (r.tag === 2005) { try { pl = strAt(r.pay, 22); } catch (e) {} }
      return '#' + pi + '(t' + po.type + (pl ? ':' + pl : '') + ')';
    });
    const extra = o.recs.filter(r => r.tag === 2201 || r.tag === 2003 || r.tag === 2311)
      .map(r => ' ' + r.tag + '[' + Array.from(r.pay.subarray(0, Math.min(r.pay.length, 24))).map(b => b.toString(16).padStart(2, '0')).join(' ') + ']');
    console.log('  #' + o.gord + ' loc' + (i + 1) + ' type=' + o.type + (label ? ' lbl=' + label : '') +
      (parents.length ? ' <- ' + desc.join(',') : '') + extra.join(''));
  });
}
