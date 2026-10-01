// Dump all sections with objects. Usage: node dump7.js <file> [outFile]
const fs = require('fs');
const file = process.argv[2], out = process.argv[3];
const buf = fs.readFileSync(file);
function strAt(pay, o) { const n = pay.readUInt16LE(o); return pay.toString('utf8', o + 2, o + 2 + n); }
let p = 4; const R = [];
while (p + 8 <= buf.length) { const len = buf.readUInt32LE(p), tag = buf.readUInt32LE(p + 4); R.push({ tag, pay: buf.subarray(p + 8, p + 8 + len) }); p += 8 + len; }
const sections = []; let cur = { name: '<hdr>', objs: [] };
for (const r of R) {
  if (r.tag === 1100) { sections.push(cur); cur = { name: strAt(r.pay, 0), raw: r.pay.subarray(0, 8), objs: [] }; }
  else if (r.tag === 2000) cur.objs.push({ type: r.pay.readUInt16LE(0), recs: [] });
  else if (cur.objs.length) cur.objs[cur.objs.length - 1].recs.push(r);
}
sections.push(cur);
const lines = [];
const hex = b => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join(' ');
sections.forEach((s, si) => {
  lines.push('### SEC' + si + ' "' + s.name + '" raw=' + (s.raw ? hex(s.raw) : '') + ' objs=' + s.objs.length);
  s.objs.forEach((o, i) => {
    let label = '', parents = [], extras = [];
    for (const r of o.recs) {
      if (r.tag === 2005) { try { label = strAt(r.pay, 22); } catch (e) {} }
      if (r.tag === 2002) { const c = r.pay.readUInt32LE(0); for (let k = 0; k < c; k++) parents.push(r.pay.readUInt32LE(4 + 4 * k)); }
      if (r.tag === 2003 && r.pay.length >= 4) { const v = []; for (let k = 4; k + 8 <= r.pay.length; k += 8) v.push(r.pay.readDoubleLE(k).toFixed(3)); extras.push('2003:' + v.join(',')); }
      if (r.tag === 2201 && r.pay.length >= 16) extras.push('xy=' + r.pay.readDoubleLE(0).toFixed(1) + ',' + r.pay.readDoubleLE(8).toFixed(1));
    }
    const pd = parents.map(pi => { const q = s.objs[pi - 1]; return q ? '#' + pi + 't' + q.type : '#' + pi + '?'; });
    lines.push('  loc' + (i + 1) + ' t=' + o.type + (label ? ' lbl=' + label : '') + (pd.length ? ' <-' + pd.join(',') : '') + (extras.length ? ' ' + extras.join(' ') : ''));
  });
});
const text = lines.join('\n');
if (out) fs.writeFileSync(out, text, 'utf8'); else process.stdout.write(text);
