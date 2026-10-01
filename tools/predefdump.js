'use strict';
// Dump decoded expression templates for objects whose program uses a chosen predefined code.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
const { decodeExpr, PREDEF } = require('../src/expr');
const root = process.argv[2], pat = process.argv[3], code = parseInt(process.argv[4] || '12', 10);
const all = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.gsp$/i.test(e.name) && e.name.toLowerCase().includes(pat.toLowerCase())) all.push(p);
  }
})(root);
console.log('predef[' + code + '] = ' + PREDEF[code] + '   files=' + all.length);
for (const f of all.slice(0, 3)) {
  const ir = gspToIR(fs.readFileSync(f));
  console.log('--- ' + f);
  for (const o of ir.objects) {
    const pay = o._raw && o._raw.rich && o._raw.rich[2311];
    if (!pay) continue;
    const d = decodeExpr(pay, o);
    const needle = code === 12 ? 'floor(abs(' : PREDEF[code];
    if (d.ok && d.exprTpl.includes(needle)) console.log('  #' + o.id + ' t' + o.srcType + ' [' + (o.label || '') + '] = ' + d.exprTpl);
  }
}
