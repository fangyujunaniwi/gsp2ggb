// Scan a .gsp corpus for inline-text records (tag 2300) and report counts by
// object type.  These are the objects whose text is stored as plain UTF-8 and
// can be decoded directly.
// usage: node test/scan2300.js <root> [--show N]
'use strict';
const fs = require('fs');
const path = require('path');
const { parseRecords } = require('../src/gsp');

const root = process.argv[2];
const si = process.argv.indexOf('--show');
const SHOW = si >= 0 ? parseInt(process.argv[si + 1], 10) : 0;
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(root);

const byType = new Map();
let total = 0, filesWith = 0, shown = 0;
const samples = [];
for (const f of files) {
  let recs;
  try { recs = parseRecords(fs.readFileSync(f)); } catch { continue; }
  let type = -1, has = false;
  for (const r of recs) {
    if (r.tag === 2000) { type = r.pay.readUInt16LE(0); has = false; continue; }
    if (r.tag === 2300) {
      has = true;
      byType.set(type, (byType.get(type) || 0) + 1);
      total++;
      if (shown < SHOW) {
        const b = Buffer.from(r.pay);
        // text runs start after the serialized header; show printable/utf8 part
        const s = b.toString('utf8').replace(/[^\u0020-\u007e\u00a0-\uffff]/g, '.');
        samples.push(type + '  ' + path.basename(f) + '  ' + JSON.stringify(s.slice(0, 80)));
        shown++;
      }
    }
  }
  if (has) filesWith++;
}
console.log('files=' + files.length + '  filesWith2300=' + filesWith + '  total2300=' + total);
for (const [t, n] of [...byType.entries()].sort((a, b) => b[1] - a[1])) console.log('  t' + t + ' x' + n);
samples.forEach(s => console.log('  sample: ' + s));
