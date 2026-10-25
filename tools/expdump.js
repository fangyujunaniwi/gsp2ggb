'use strict';
// expdump.js <file.ggb> <substr> — print <expression> lines containing substr + the
// definitions of every label referenced in those expressions.
const fs = require('fs');
const { unzip } = require('../src/zip.js');
const xml = unzip(fs.readFileSync(process.argv[2])).get('geogebra.xml').toString('utf8');
const needle = process.argv[3] || 'Locus';
const lines = [...xml.matchAll(/<expression\b[^>]*\/>/g)].map(m => m[0]);
const hits = lines.filter(l => l.indexOf(needle) >= 0);
const labels = new Set();
for (const h of hits) for (const m of h.matchAll(/[A-Za-z_][A-Za-z0-9_]*(?:_\d+)?/g)) labels.add(m[0]);
console.log('-- expressions containing ' + needle + ' (' + hits.length + ') --');
hits.slice(0, 10).forEach(h => console.log(h));
console.log('\n-- definitions of referenced labels --');
const elemRe = /<element\b[^>]*label="([^"]*)"[^>]*>[\s\S]*?<\/element>/g;
const shown = new Set();
for (const m of xml.matchAll(elemRe)) {
  if (!labels.has(m[1]) || shown.has(m[1])) continue;
  shown.add(m[1]);
  console.log(m[0].replace(/\t/g, ' ').replace(/\n\s*/g, ' ').slice(0, 300));
  const e = [...xml.matchAll(/<expression\b[^>]*label="([^"]*)"[^>]*\/>/g)].find(x => x[1] === m[1]);
  if (e) console.log('  ' + e[0]);
  console.log('');
}
