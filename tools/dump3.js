const fs = require('fs');

function records(b) {
  const out = [];
  let p = 4;
  while (p + 8 <= b.length) {
    const len = b.readUInt32LE(p), tag = b.readUInt32LE(p + 4);
    if (p + 8 + len > b.length) return null;
    out.push({ off: p, tag, pay: b.subarray(p + 8, p + 8 + len) });
    p += 8 + len;
  }
  return p === b.length ? out : null;
}

// find longest valid utf8 CJK/ascii run in buffer
function utf8Runs(buf) {
  const out = [];
  const s = buf.toString('utf8');
  const re = /[ -~　-鿿鿿＀-￯][ -~　-鿿＀-￯　-〿]*/g;
  let m;
  while ((m = re.exec(s))) {
    const t = m[0].trim();
    if (/[一-鿿]/.test(t) && t.length >= 2) out.push(t);
  }
  return out;
}

const f = process.argv[2];
const b = fs.readFileSync(f);
console.log('=== ' + f + ' len=' + b.length);
const rs = records(b);
if (!rs) { console.log('PARSE FAIL'); process.exit(1); }
let cur = null, idx = 0;
const objs = [];
for (const r of rs) {
  if (r.tag === 2000) { cur = { n: objs.length + 1, type: r.pay.length >= 2 ? r.pay.readUInt16LE(0) : -1, kids: [] }; }
  else if (r.tag === 2007) { if (cur) { objs.push(cur); cur = null; } }
  else if (cur) cur.kids.push(r);
}
// print records that contain CJK, with their enclosing object
let oi = 0;
for (const r of rs) {
  const t = utf8Runs(r.pay);
  if (t.length) {
    console.log('off=0x' + r.off.toString(16) + ' tag=' + r.tag + ' len=' + r.pay.length + '  TEXT: ' + JSON.stringify(t.join(' | ')));
  }
}
console.log('--- objects: ' + objs.length);
const tally = {};
for (const o of objs) {
  const shape = o.kids.map(k => k.tag + ':' + k.pay.length).join(',');
  const key = o.type + '  [' + shape + ']';
  tally[key] = (tally[key] || 0) + 1;
}
for (const k of Object.keys(tally)) console.log('   ' + String(tally[k]).padStart(4) + '  ' + k);
