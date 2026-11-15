'use strict';
// elemtypes.js <file.ggb> [label,label,...] [regex] — element type + expression per label;
// optionally dump expressions matching regex.
const fs = require('fs');
const { unzip } = require('../src/zip.js');
const xml = unzip(fs.readFileSync(process.argv[2])).get('geogebra.xml').toString('utf8');
const types = new Map();
for (const m of xml.matchAll(/<element\b[^>]*type="([^"]*)"\s+label="([^"]*)"/g)) types.set(m[2], m[1]);
const exprs = new Map();
for (const m of xml.matchAll(/<expression\b[^>]*label="([^"]*)"[^>]*exp="([^"]*)"/g)) exprs.set(m[1], m[2]);
const want = (process.argv[3] || '').split(',').filter(Boolean);
for (const l of want) console.log(l.padEnd(9) + (types.get(l) || '?').padEnd(10) + (exprs.get(l) || '<none>'));
if (process.argv[4]) {
  const re = new RegExp(process.argv[4]);
  console.log('\n-- expressions matching ' + process.argv[4] + ' --');
  for (const [l, e] of exprs) if (re.test(e)) console.log((types.get(l) || '?').padEnd(10) + l + ' = ' + e.slice(0, 140));
}
