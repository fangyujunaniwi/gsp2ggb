const fs = require('fs');
const path = require('path');

function records(b) {
  const out = [];
  let p = 4;
  while (p + 8 <= b.length) {
    const len = b.readUInt32LE(p), tag = b.readUInt32LE(p + 4);
    if (p + 8 + len > b.length) break;
    out.push({ off: p, tag, pay: b.subarray(p + 8, p + 8 + len) });
    p += 8 + len;
  }
  return p === b.length ? out : null;
}

// group records into objects between tag 2000 and 2007
function objects(b) {
  const rs = records(b);
  if (!rs) return null;
  const objs = [];
  let cur = null;
  for (const r of rs) {
    if (r.tag === 2000) { cur = { hdr: r, kids: [] }; }
    else if (r.tag === 2007) { if (cur) { objs.push(cur); cur = null; } }
    else if (cur) cur.kids.push(r);
    else if (r.tag !== 900 && r.tag !== 901 && r.tag !== 902 && r.tag !== 903 &&
             r.tag !== 1000 && r.tag !== 1001 && r.tag !== 1006 && r.tag !== 1007) {
      // trailing/global records
      if (objs.length) objs[objs.length - 1].kids.push(r);
    }
  }
  return objs;
}

const roots = process.argv.slice(2);
let files = [];
for (const r of roots) {
  const st = fs.statSync(r);
  if (st.isDirectory()) {
    const walk = d => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.toLowerCase().endsWith('.gsp')) files.push(p);
      }
    };
    walk(r);
  } else files.push(r);
}
const limit = +(process.env.LIMIT || 0);
if (limit) files = files.slice(0, limit);

const byType = new Map();     // type -> {count, shapes:Set("tag:len"), examples:[]}
let total = 0, bad = 0;
for (const f of files) {
  let b;
  try { b = fs.readFileSync(f); } catch (e) { continue; }
  if (b.toString('latin1', 0, 4) !== 'GSP4') continue;
  const objs = objects(b);
  if (!objs) { bad++; continue; }
  for (const o of objs) {
    if (o.hdr.pay.length < 4) continue;
    total++;
    const t = o.hdr.pay.readUInt16LE(0);
    if (!byType.has(t)) byType.set(t, { count: 0, shapes: new Map(), ex: [] });
    const e = byType.get(t);
    e.count++;
    const shape = o.kids.map(k => k.tag + ':' + k.pay.length).join(',');
    if (!e.shapes.has(shape)) e.shapes.set(shape, 0);
    e.shapes.set(shape, e.shapes.get(shape) + 1);
    if (e.ex.length < 3) e.ex.push(path.basename(f));
  }
}
console.log('files=' + files.length + ' unparsed=' + bad + ' objects=' + total);
const rows = [...byType.entries()].sort((a, b) => b[1].count - a[1].count);
for (const [t, e] of rows) {
  const shapes = [...e.shapes.entries()].sort((a, b) => b[1] - a[1]);
  console.log('type ' + String(t).padStart(4) + '  n=' + String(e.count).padStart(6) + '  shapes=' + shapes.length);
  for (const [s, c] of shapes.slice(0, 4)) console.log('        ' + String(c).padStart(5) + '  ' + s);
}
