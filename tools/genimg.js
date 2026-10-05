'use strict';
const fs = require('fs');
const { gspToIR } = require('../src/gsp.js');
const { irToGgb, irToGgbPages } = require('../src/ggb.js');
const { unzip } = require('../src/zip.js');

const ir = gspToIR(fs.readFileSync(process.argv[2]));
console.log('images in file: ' + (ir.meta.images || []).map(i => i.w + 'x' + i.h).join(', '));
const pages = irToGgbPages(ir);
console.log('pages: ' + pages.length);
pages.forEach((p, i) => {
  const entries = [...unzip(p.buf).keys()];
  const imgs = entries.filter(n => n.startsWith('images/'));
  if (imgs.length) console.log('  page' + (i + 1) + ' (' + (p.name || '') + '): ' + imgs.join(', '));
});
