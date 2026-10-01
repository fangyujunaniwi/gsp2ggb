// print expression lines matching a pattern from a .ggb
// usage: node test/inspect-xml.js <file.ggb> <regex>
const fs = require('fs');
const { unzip } = require('../src/zip');
const path = require('path');
const file = process.argv[2];
const re = new RegExp(process.argv[3] || '.', 'i');
const bytes = fs.readFileSync(file);
const entries = unzip(bytes);
const xml = (entries['geogebra.xml'] || entries['geogebra.xml'.toLowerCase()] || Object.values(entries)[0]);
const text = Buffer.isBuffer(xml) ? xml.toString('utf8') : String(xml);
for (const m of text.matchAll(/<expression[^>]*label="([^"]+)"[^>]*exp="([^"]*)"/g)) {
  const exp = m[2].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  if (re.test(exp)) console.log(m[1] + ' = ' + exp);
}
