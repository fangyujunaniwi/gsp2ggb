'use strict';
// Find the first .gsp containing a FREE picture (0-parent image), generate it, save the page
// that contains the image to out/freeimg.ggb, and report.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp.js');
const { irToGgbPages } = require('../src/ggb.js');
const { unzip } = require('../src/zip.js');

const ROOT = process.argv[2] || 'D:/Sketchpad5';
const files = [];
(function w(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) w(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(ROOT);

for (const f of files) {
  let ir;
  try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  const free = ir.objects.filter(o => o.kind === 'image' && (o.parents || []).length === 0);
  if (!free.length) continue;
  console.log('file: ' + path.basename(f) + '  free-pictures=' + free.length +
    '  sample dims=' + JSON.stringify(free[0].dims) + ' matrix=' + JSON.stringify(free[0].matrix));
  const pages = irToGgbPages(ir);
  const pg = pages.find(p => [...unzip(p.buf).keys()].some(n => n.startsWith('images/')));
  if (pg) { fs.writeFileSync('out/freeimg.ggb', pg.buf); console.log('wrote out/freeimg.ggb (page "' + (pg.name || '') + '")'); }
  break;
}
