// Scan a directory for .gsp files that fail record-chain parsing.
// Prints the error and the last records successfully read before the failure.
const fs = require('fs');
const path = require('path');
const { parseRecords } = require('../src/gsp.js');
const root = process.argv[2] || (process.env.GSP_SAMPLES || 'D:/Sketchpad5/Samples');
const files = [];
function walk(d, depth) {
  if (depth > 6) return;
  let es; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
  for (const e of es) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
}
walk(root, 0);
console.log('total gsp files=' + files.length);
let ok = 0, fail = 0;
const fails = [];
for (const f of files) {
  try { parseRecords(fs.readFileSync(f)); ok++; }
  catch (e) { fail++; fails.push({ f, msg: e.message }); }
}
console.log('ok=' + ok + ' fail=' + fail);
for (const x of fails.slice(0, 25)) {
  const buf = fs.readFileSync(x.f);
  // manually walk to the failure offset
  let off = 4, n = 0, lastRecs = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32LE(off), tag = buf.readUInt32LE(off + 4);
    if (len > 100000 || off + 8 + len > buf.length) break;
    lastRecs.push(tag + '(' + len + ')');
    off += 8 + len; n++;
    if (lastRecs.length > 10) lastRecs.shift();
  }
  console.log('\n' + x.f.split('\\').pop() + '  size=' + buf.length + '  msg=' + x.msg);
  console.log('   parsed 0x' + off.toString(16) + ' of 0x' + buf.length.toString(16) +
    '  last tags: ' + lastRecs.join(' '));
  console.log('   bytes @fail: ' + buf.subarray(off, off + 40).toString('hex'));
}
