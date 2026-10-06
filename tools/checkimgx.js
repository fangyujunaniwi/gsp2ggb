'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp.js');
const { irToGgbPages } = require('../src/ggb.js');
const { unzip } = require('../src/zip.js');

const XFORM = new Set(['translateImage', 'rotateImage', 'dilateImage', 'reflectImage',
  'markedAngleRotate', 'measuredAngleRotate', 'segRatioDilate', 'markedRatioDilate',
  'implicitRotate', 'fixedAngleMarkedDistance']);
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
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  if (!ir.objects.some(o => XFORM.has(o.kind) && o.parents && byId.get(o.parents[0]) && byId.get(o.parents[0]).kind === 'image')) continue;
  console.error('file: ' + path.basename(f));
  const pages = irToGgbPages(ir);
  const pg = pages.find(p => [...unzip(p.buf).keys()].some(n => n.startsWith('images/'))) || pages[0];
  fs.writeFileSync('out/imgx.ggb', pg.buf);
  const xml = unzip(pg.buf).get('geogebra.xml').toString('utf8');
  const imgs = xml.match(/<element type="image"[\s\S]*?<\/element>/g) || [];
  console.error('image elements: ' + imgs.length);
  for (const e of imgs.slice(0, 6)) console.error('  ' + e.replace(/\n\s*/g, ' ').slice(0, 200));
  break;
}
