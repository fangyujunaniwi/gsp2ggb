'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp.js');
const ROOT = process.argv[2] || 'D:/Sketchpad5';
const idx = Number(process.argv[3] || 2);
const files = [];
(function w(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) w(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
})(ROOT);
const pick = files[Math.floor(files.length / 6) * idx];
const ir = gspToIR(fs.readFileSync(pick));
for (const o of ir.objects) {
  if (o.id > 8) break;
  console.log('#' + o.id + ' t' + o.srcType + ' kind=' + o.kind + ' label=' + JSON.stringify(o.label) +
    ' parents=' + JSON.stringify(o.parents) + ' params=' + JSON.stringify(o.params) +
    ' coords=' + JSON.stringify(o.coords));
}
