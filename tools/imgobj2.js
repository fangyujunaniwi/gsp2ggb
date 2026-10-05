'use strict';
// For each picture-only type, find the first corpus file containing it and dump one object.
const fs = require('fs');
const path = require('path');
const { parseRecords } = require('../src/gsp.js');

const ROOT = process.argv[2] || 'D:/Sketchpad5';
const TARGETS = (process.argv[3] || '85,96,99,100,108,122').split(',').map(Number);
const files = [];
(function w(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) w(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(ROOT);

const done = new Set();
for (const f of files) {
  if (done.size === TARGETS.length) break;
  let recs;
  try { recs = parseRecords(fs.readFileSync(f)); } catch { continue; }
  const present = new Set(recs.filter(r => r.tag === 2000).map(r => r.pay.readUInt16LE(0)));
  const want = TARGETS.filter(t => present.has(t) && !done.has(t));
  if (!want.length) continue;
  let ord = 0, cur = null;
  for (const r of recs) {
    if (r.tag === 2000) { ord++; cur = { ord, type: r.pay.readUInt16LE(0), recs: [] }; continue; }
    if (!cur) continue;
    if (want.includes(cur.type)) {
      const a = r.pay.toString('latin1').replace(/[^\x20-\x7e]/g, '.');
      const run = (a.match(/[ -~]{3,}/g) || []).join('|');
      cur.recs.push('t' + r.tag + '[' + r.pay.length + ']' + (run ? '"' + run.slice(0, 36) + '"' : ':' + r.pay.toString('hex').slice(0, 40)));
    }
    if (r.tag === 2007) {
      if (want.includes(cur.type) && !done.has(cur.type)) {
        done.add(cur.type);
        console.log('type ' + cur.type + '  (' + path.basename(f) + ' #' + cur.ord + ')');
        console.log('   ' + cur.recs.join('\n   '));
      }
      cur = null;
    }
  }
}
if (done.size < TARGETS.length) console.log('missing types: ' + TARGETS.filter(t => !done.has(t)).join(','));
