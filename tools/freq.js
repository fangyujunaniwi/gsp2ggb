// Type frequency + child-tag shapes over a corpus of .gsp files.
// Usage: node freq.js <dir> [limit]
const fs = require('fs'), path = require('path');
const root = process.argv[2], limit = parseInt(process.argv[3] || '60');
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (e.name.toLowerCase().endsWith('.gsp')) out.push(f);
  }
  return out;
}
const files = walk(root);
const typeStat = new Map(); // type -> {n, shapes: Map(shapeKey, n), parentTypes: Map, examples:[]}
let okFiles = 0, failFiles = 0, totalObjs = 0;
const failures = [];
for (const f of files) {
  let buf;
  try { buf = fs.readFileSync(f); } catch (e) { continue; }
  try {
    const objs = [];
    let p = 4, prevTag = -1, cur = null;
    while (p + 8 <= buf.length) {
      const len = buf.readUInt32LE(p), tag = buf.readUInt32LE(p + 4);
      if (p + 8 + len > buf.length) throw new Error('overrun @' + p);
      const pay = buf.subarray(p + 8, p + 8 + len);
      if (tag === 2000) { cur = { type: pay.readUInt16LE(0), tags: [], parents: [] }; objs.push(cur); }
      else if (tag === 2007) cur = null;
      else if (cur) {
        cur.tags.push(tag);
        if (tag === 2002) { const n = pay.readUInt32LE(0); for (let k = 0; k < n; k++) cur.parents.push(pay.readUInt32LE(4 + 4 * k)); }
      }
      prevTag = tag; p += 8 + len;
    }
    okFiles++;
    totalObjs += objs.length;
    for (const o of objs) {
      if (!typeStat.has(o.type)) typeStat.set(o.type, { n: 0, shapes: new Map(), pTypes: new Map(), ex: [] });
      const s = typeStat.get(o.type);
      s.n++;
      const shape = o.tags.join(','); s.shapes.set(shape, (s.shapes.get(shape) || 0) + 1);
      for (const pi of o.parents) { const pt = objs[pi - 1] && objs[pi - 1].type; const k = pt === undefined ? '?' : pt; s.pTypes.set(k, (s.pTypes.get(k) || 0) + 1); }
      if (s.ex.length < 2 && o.parents.length <= 4) s.ex.push(f.split(path.sep).pop() + '#' + objs.indexOf(o) + '<-[' + o.parents.join(',') + ']');
    }
  } catch (e) { failFiles++; failures.push(f + ' :: ' + e.message); }
}
console.log('files=' + files.length + ' ok=' + okFiles + ' fail=' + failFiles + ' objs=' + totalObjs);
if (failures.length) { console.log('FAILURES:'); failures.slice(0, 15).forEach(x => console.log('  ' + x)); }
console.log('type    n      shapes                                parentTypes');
const sorted = [...typeStat.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, limit);
for (const [t, s] of sorted) {
  const shapes = [...s.shapes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2)
    .map(([k, v]) => (k || '(none)') + 'x' + v).join(' ');
  const pts = [...s.pTypes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([k, v]) => k + ':' + v).join(' ');
  console.log(String(t).padEnd(7) + String(s.n).padEnd(7) + shapes.padEnd(38) + pts);
}
