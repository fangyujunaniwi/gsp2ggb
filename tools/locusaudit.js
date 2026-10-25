'use strict';
// locuaudit.js <file.ggb> — for every Locus(Q,P), check whether P is in Q's emitted dependency closure.
const fs = require('fs');
const { unzip } = require('../src/zip.js');
const xml = unzip(fs.readFileSync(process.argv[2])).get('geogebra.xml').toString('utf8');
const exprs = new Map();
for (const m of xml.matchAll(/<expression\b[^>]*label="([^"]*)"[^>]*exp="([^"]*)"/g))
  exprs.set(m[1], m[2].replace(/&quot;/g, '"'));
function closure(root) {
  const seen = new Set(), stack = [root];
  while (stack.length) {
    const l = stack.pop();
    if (seen.has(l)) continue;
    seen.add(l);
    const e = exprs.get(l) || '';
    for (const m of e.matchAll(/[A-Za-z_][A-Za-z0-9_]*(?:_\d+)?/g)) if (exprs.has(m[0])) stack.push(m[0]);
  }
  return seen;
}
let ok = 0, bad = 0;
for (const [lab, exp] of exprs) {
  const m = exp.match(/^Locus\(\s*([^,]+?)\s*,\s*([^,)]+?)\s*\)$/);
  if (!m) continue;
  const q = m[1], p = m[2];
  const hit = closure(q).has(p);
  if (hit) ok++; else { bad++; console.log('INVALID ' + lab + ' = ' + exp); }
}
console.log('\nlocus: valid=' + ok + ' invalid=' + bad);
