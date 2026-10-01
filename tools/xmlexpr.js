'use strict';
// Print expression lines from a .ggb. usage: node tools/xmlexpr.js <file.ggb> [regex]
const fs = require('fs');
const { unzip } = require('../src/zip');
const entries = unzip(fs.readFileSync(process.argv[2]));
const xml = entries.get('geogebra.xml').toString('utf8');
const re = new RegExp(process.argv[3] || '.', 'i');
for (const m of xml.matchAll(/<expression[^>]*label="([^"]+)"[^>]*exp="([^"]*)"/g)) {
  const x = m[2].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  if (re.test(x)) console.log(m[1] + ' = ' + x);
}
