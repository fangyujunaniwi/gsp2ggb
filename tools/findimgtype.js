'use strict';
const fs = require('fs');
const path = require('path');
const { parseRecords, gspToIR } = require('../src/gsp.js');
const { irToGgb, irToGgbPages } = require('../src/ggb.js');
const { unzip } = require('../src/zip.js');

const ROOT = process.argv[2] || 'D:/Sketchpad5';
const want = Number(process.argv[3] || 85);
const files = [];
(function w(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) w(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(ROOT);

for (const f of files) {
  let recs;
  try { recs = parseRecords(fs.readFileSync(f)); } catch { continue; }
  if (!recs.some(r => r.tag === 2000 && r.pay.readUInt16LE(0) === want)) continue;
  const ir = gspToIR(fs.readFileSync(f));
  const imgs = ir.objects.filter(o => o.kind === 'image');
  const pages = irToGgbPages(ir);
  const withImg = pages.find(p => [...unzip(p.buf).keys()].some(n => n.startsWith('images/')));
  console.log('file: ' + path.basename(f) + '  image-objects=' + imgs.length +
    '  pages=' + pages.length + '  page-with-image=' + (withImg ? withImg.name : '(none)'));
  for (const o of imgs.slice(0, 6)) console.log('   #' + o.id + ' t' + o.srcType + ' parents=' + JSON.stringify(o.parents) + ' dims=' + JSON.stringify(o.dims));
  if (withImg) { fs.writeFileSync('out/t' + want + '.ggb', withImg.buf); console.log('wrote out/t' + want + '.ggb'); break; }
}
