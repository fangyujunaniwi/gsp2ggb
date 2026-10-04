'use strict';
const fs = require('fs');
const { unzip } = require('../src/zip.js');

const file = process.argv[2];
const xml = unzip(fs.readFileSync(file)).get('geogebra.xml').toString('utf8');
const out = 'out/_dump.xml';
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync(out, xml);

// expression tags in document order
const exps = [...xml.matchAll(/<expression\b[^>]*\/>/g)];
console.log('expression tags=' + exps.length);
let n = 0;
for (const m of exps) {
  const a = {};
  for (const mm of m[0].matchAll(/(\w+)="([^"]*)"/g)) a[mm[1]] = mm[2];
  n++;
  console.log('  ' + n + '. ' + (a.label || '?') + ' := ' + (a.exp || '').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
}
console.log('written ' + out);
