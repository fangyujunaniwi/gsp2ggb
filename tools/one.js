'use strict';
// Convert the first .gsp under <root> whose name contains <pattern>; dump expression/element summary.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
const { irToGgb } = require('../src/ggb');
const root = process.argv[2], pat = process.argv[3];
const out = process.argv[4] || 'out/one.ggb';
const all = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.gsp$/i.test(e.name) && e.name.toLowerCase().includes(pat.toLowerCase())) all.push(p); } })(root);
if (!all.length) { console.log('not found'); process.exit(1); }
const found = all[0];
const ir = gspToIR(fs.readFileSync(found));
const r = irToGgb(ir);
fs.writeFileSync(out, r.buf);
fs.writeFileSync(out.replace(/\.ggb$/, '.xml'), r.xml);
console.log('file   ' + found);
console.log('stats  ' + JSON.stringify(r.stats));
const cnt = {};
for (const m of r.xml.matchAll(/<element type="([^"]*)"/g)) cnt[m[1]] = (cnt[m[1]] || 0) + 1;
console.log('elems  ' + JSON.stringify(cnt));
const exprs = (r.xml.match(/exp="[^"]*"/g) || []).map(s => s.slice(5, -1));
const interesting = exprs.filter(s => /[a-z]{2,}/.test(s));
console.log('nontrivial expressions (' + interesting.length + '):');
for (const s of interesting.slice(0, 50)) console.log('   ' + s);
