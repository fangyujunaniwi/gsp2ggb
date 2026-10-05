'use strict';
// Find picture objects in a .gsp: print objects whose records carry a string that looks like an
// image name / URL (the gImage serialization), plus the tag-1300 embedded PNG sizes.
const fs = require('fs');
const { parseRecords } = require('../src/gsp.js');

const buf = fs.readFileSync(process.argv[2]);
const recs = parseRecords(buf);
console.log('tag1300 images: ' + recs.filter(r => r.tag === 1300).map(r => r.pay.length).join(','));
let ord = 0, cur = null;
for (const r of recs) {
  if (r.tag === 2000) {
    ord++;
    cur = { ord, type: r.pay.readUInt16LE(0), recs: [] };
    continue;
  }
  if (!cur) continue;
  // collect printable ascii runs / probable names from each record
  const ascii = r.pay.toString('latin1').replace(/[^\x20-\x7e]/g, '.');
  const run = (ascii.match(/[ -~]{4,}/g) || []).slice(0, 3).join(' | ');
  if (run) cur.recs.push(r.tag + '="' + run.slice(0, 60) + '"');
  if (r.tag === 2007) {
    if (cur.recs.length) console.log('#' + cur.ord + ' t' + cur.type + '  ' + cur.recs.join('  '));
    cur = null;
  }
}
