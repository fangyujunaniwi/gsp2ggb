'use strict';
// Copy the first page .ggb that contains an image to out/pageimg.ggb.
const fs = require('fs');
const path = require('path');
const { unzip } = require('../src/zip.js');
for (const f of fs.readdirSync(process.argv[2])) {
  const p = path.join(process.argv[2], f);
  if (!/\.ggb$/i.test(f)) continue;
  try {
    const m = unzip(fs.readFileSync(p));
    const imgs = [...m.keys()].filter(n => n.startsWith('images/'));
    if (imgs.length) {
      fs.copyFileSync(p, 'out/pageimg.ggb');
      console.log('page with images: ' + f + ' -> ' + imgs.join(', '));
      break;
    }
  } catch {}
}
