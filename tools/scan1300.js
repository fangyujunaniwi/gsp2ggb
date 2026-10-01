// Diagnose tag-1300 (embedded PNG) framing: find the first failing .gsp under a root, then scan it.
const fs = require('fs');
const path = require('path');
const { parseRecords } = require('../src/gsp.js');
const root = process.argv[2] || (process.env.GSP_SAMPLES || 'D:/Sketchpad5/Samples');
const wantIdx = process.argv[3] ? parseInt(process.argv[3], 10) : 0;
const files = [];
function walk(d, depth) {
  if (depth > 6 || files.length > 2000) return;
  let es; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
  for (const e of es) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
}
walk(root, 0);
const fails = [];
for (const f of files) { try { parseRecords(fs.readFileSync(f)); } catch (e) { fails.push({ f, msg: e.message }); } }
console.log('files=' + files.length + ' fails=' + fails.length);
const target = fails[wantIdx];
if (!target) { console.log('no fail at index ' + wantIdx); process.exit(0); }
console.log('TARGET ' + path.basename(target.f) + '  ' + target.msg);
const buf = fs.readFileSync(target.f);
const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pngs = []; let i = 0;
while ((i = buf.indexOf(sig, i)) >= 0) { pngs.push(i); i++; }
console.log('PNG sigs: ' + pngs.map(x => '0x' + x.toString(16)).join(' '));
let off = 4, n = 0;
while (off + 8 <= buf.length) {
  const len = buf.readUInt32LE(off), tag = buf.readUInt32LE(off + 4);
  const ok = len <= 20000000 && off + 8 + len <= buf.length;
  console.log('@0x' + off.toString(16) + ' len=' + len + ' tag=' + tag + (ok ? '' : '  <-- BAD'));
  if (!ok) { console.log('   bytes: ' + buf.subarray(off, off + 48).toString('hex')); break; }
  if (tag === 1300) console.log('   1300 head: ' + buf.subarray(off + 8, off + 8 + 32).toString('hex'));
  off += 8 + len; n++;
  if (n > 500) break;
  if (tag === 9000 || tag === 901) break;
}
