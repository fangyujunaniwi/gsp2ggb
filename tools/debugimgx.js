'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp.js');
const { irToGgb } = require('../src/ggb.js');

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
  const hits = ir.objects.filter(o => XFORM.has(o.kind) && o.parents && byId.get(o.parents[0]) && byId.get(o.parents[0]).kind === 'image');
  if (!hits.length) continue;
  console.error('=== ' + path.basename(f) + ' (' + hits.length + ' hits)');
  const img = byId.get(hits[0].parents[0]);
  console.error('image #' + img.id + ' t' + img.srcType + ' dims=' + JSON.stringify(img.dims) + ' parents=' + JSON.stringify(img.parents) + ' matrix=' + JSON.stringify(img.matrix));
  for (const h of hits.slice(0, 3))
    console.error('xform #' + h.id + ' ' + h.kind + ' parents=' + JSON.stringify(h.parents) + ' params=' + JSON.stringify(h.params));
  process.env.GSP_DUMP_EXPR = '1';
  const r = irToGgb(ir);
  console.error('warnings: ' + r.warnings.filter(w => /'#' + img.id + '|' + hits[0].id + '|image|picture/i.test(w)).join(' | '));
  break;
}
