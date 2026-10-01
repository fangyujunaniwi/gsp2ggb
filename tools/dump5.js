// Dump full tag-2000 headers of objects in a section. Usage: node dump5.js <file> <sectionFilter> [typeFilter]
const fs = require('fs');
const file = process.argv[2], filter = process.argv[3] || '', typeF = process.argv[4];
const buf = fs.readFileSync(file);
function strAt(pay, o) { const n = pay.readUInt16LE(o); return pay.toString('utf8', o + 2, o + 2 + n); }
let p = 4; const R = [];
while (p + 8 <= buf.length) { const len = buf.readUInt32LE(p), tag = buf.readUInt32LE(p + 4); R.push({ tag, pay: buf.subarray(p + 8, p + 8 + len) }); p += 8 + len; }
const sections = []; let cur = { name: '<hdr>', objs: [] };
for (const r of R) {
  if (r.tag === 1100) { sections.push(cur); cur = { name: strAt(r.pay, 0), objs: [] }; }
  else if (r.tag === 2000) cur.objs.push({ hdr: r.pay, recs: [], loc: cur.objs.length + 1 });
  else if (cur.objs.length) cur.objs[cur.objs.length - 1].recs.push(r);
}
sections.push(cur);
const hex = b => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join(' ');
for (const s of sections) {
  if (!s.objs.length || !s.name.includes(filter)) continue;
  console.log('--- ' + s.name);
  for (const o of s.objs) {
    const t = o.hdr.readUInt16LE(0);
    if (typeF && String(t) !== typeF) continue;
    let label = '', parents = [], childTags = o.recs.map(r => r.tag);
    for (const r of o.recs) {
      if (r.tag === 2005) { try { label = strAt(r.pay, 22); } catch (e) {} }
      if (r.tag === 2002) { const n = r.pay.readUInt32LE(0); for (let k = 0; k < n; k++) parents.push(r.pay.readUInt32LE(4 + 4 * k)); }
    }
    console.log('  loc' + o.loc + ' t=' + t + (label ? ' lbl=' + label : '') + ' hdr[' + hex(o.hdr) + ']' +
      (parents.length ? ' <- ' + parents.join(',') : '') + ' tags[' + childTags.join(',') + ']');
  }
}
