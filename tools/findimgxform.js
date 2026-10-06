'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp.js');

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
let n = 0;
for (const f of files) {
  let ir;
  try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if (!XFORM.has(o.kind) || !o.parents || !o.parents.length) continue;
    const pre = byId.get(o.parents[0]);
    if (pre && pre.kind === 'image') {
      n++;
      if (n <= 12) console.log(path.basename(f) + '  #' + o.id + ' ' + o.kind + ' <- image #' + pre.id + ' t' + pre.srcType);
    }
  }
}
console.log('XFORM-of-picture objects in corpus: ' + n);
