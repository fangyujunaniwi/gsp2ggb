'use strict';
// corpuscheck.js — stratified sample of the .gsp corpus, converted to .ggb for open-rate testing.
// usage: node tools/corpuscheck.js <corpusRoot> [count]
// Writes out/corpus/<NNN>_<name>/page*.ggb and out/corpus/manifest.json
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp.js');
const { irToGgbPages } = require('../src/ggb.js');

const ROOT = process.argv[2] || 'D:/Sketchpad5';
const N = parseInt(process.argv[3] || '60', 10);
const OUT = path.join('out', 'corpus');

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(ROOT);
files.sort((a, b) => a.localeCompare(b));

if (files.length <= N) throw new Error('corpus too small: ' + files.length);
const picks = [];
for (let i = 0; i < N; i++) picks.push(files[Math.round((i + 0.5) * files.length / N) % files.length]);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const manifest = [];
picks.forEach((src, i) => {
  const tag = String(i + 1).padStart(3, '0') + '_' + path.basename(src, path.extname(src)).replace(/[^\w\u4e00-\u9fa5-]+/g, '_').slice(0, 40);
  const dir = path.join(OUT, tag);
  fs.mkdirSync(dir, { recursive: true });
  const rec = { i: i + 1, tag, src, pages: [], error: null };
  try {
    const ir = gspToIR(fs.readFileSync(src));
    const pages = irToGgbPages(ir);
    pages.forEach((p, j) => {
      const name = pages.length > 1 ? ('page' + (j + 1) + '.ggb') : 'page1.ggb';
      const file = path.join(dir, name);
      fs.writeFileSync(file, p.buf);
      const warns = (p.doc && p.doc.warnings) || [];
      rec.pages.push({
        file, name,
        total: (p.doc && p.doc.stats && p.doc.stats.total) || 0,
        planned: (p.doc && p.doc.stats && p.doc.stats.planned) || 0,
        warns: warns.length,
        skipWarns: warns.filter(w => /^skip /.test(w)).length,
        sampleWarns: warns.slice(0, 6),
      });
    });
  } catch (e) {
    rec.error = e.message;
  }
  manifest.push(rec);
  console.log(tag + '  pages=' + rec.pages.length + (rec.error ? ('  ERROR ' + rec.error) : ''));
});

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
const pages = manifest.reduce((s, m) => s + m.pages.length, 0);
console.log('\nsampled=' + manifest.length + ' files, pages=' + pages + ', convErrors=' + manifest.filter(m => m.error).length);
