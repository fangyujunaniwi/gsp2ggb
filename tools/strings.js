const fs = require('fs');
const f = process.argv[2];
const b = fs.readFileSync(f);
function runs(buf, uni) {
  const out = [];
  let s = -1;
  const isOk = c => (c >= 32 && c < 127) || (c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3000 && c <= 0x303f) || (c >= 0xff00 && c <= 0xffef) || c === 0x5f || c === 0x2e;
  if (uni) {
    for (let i = 0; i + 1 < buf.length; i += 2) {
      const c = buf[i] | (buf[i + 1] << 8);
      const ok = isOk(c);
      if (ok && s < 0) s = i;
      else if (!ok && s >= 0) { if (i - s >= 8) out.push(buf.toString('utf16le', s, i)); s = -1; }
    }
  } else {
    for (let i = 0; i < buf.length; i++) {
      const ok = isOk(buf[i]);
      if (ok && s < 0) s = i;
      else if (!ok && s >= 0) { if (i - s >= 5) out.push(buf.toString('latin1', s, i)); s = -1; }
    }
  }
  return out;
}
const kw = process.argv[3] ? new RegExp(process.argv[3], 'i') : null;
const seen = new Set();
for (const uni of [false, true]) {
  for (const r of runs(b, uni)) {
    if (kw && !kw.test(r)) continue;
    if (seen.has(r)) continue;
    seen.add(r);
    console.log((uni ? 'U16 ' : 'A8  ') + r);
  }
}
