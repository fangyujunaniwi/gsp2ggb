// Patch the idx-th double in object <ord>'s record with tag <tag> (skips u32 echo).
// usage: node patch-double.js <src> <out> <ord> <tag> <doubleIdx> <newValue>
const fs = require('fs');
const { parseRecords } = require('../src/gsp.js');
const [src, out, ordS, tagS, idxS, valS] = process.argv.slice(2);
const buf = fs.readFileSync(src);
const ord = +ordS, tag = +tagS, idx = +idxS, val = +valS;
const recs = parseRecords(buf);
let n = 0, target = false, patched = false;
for (const r of recs) {
  if (r.tag === 2000) { n++; target = (n === ord); }
  if (!target) continue;
  if (r.tag === tag) {
    const abs = r.off + 8 + 4 + idx * 8;
    if (abs + 8 <= buf.length) {
      const old = buf.readDoubleLE(abs);
      buf.writeDoubleLE(val, abs);
      patched = true;
      console.log('patched obj#' + ord + ' tag' + tag + ' double#' + idx + ' @0x' + abs.toString(16) + '  ' + old + ' -> ' + val);
    }
    break;
  }
  if (r.tag === 2007) break;
}
if (!patched) console.log('NOT FOUND');
fs.writeFileSync(out, buf);
