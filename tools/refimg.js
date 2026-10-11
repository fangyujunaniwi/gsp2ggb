'use strict';
const fs = require('fs');
const { unzip } = require('../src/zip.js');
const xml = unzip(fs.readFileSync('refimg.ggb')).get('geogebra.xml').toString('utf8');
for (const m of xml.matchAll(/<element type="point" label="([^"]*)"[^>]*>([\s\S]*?)<\/element>/g)) {
  const c = m[2].match(/<coords x="([^"]*)" y="([^"]*)" z="([^"]*)"/);
  if (c) console.log('point ' + m[1] + ' = (' + c[1] + ', ' + c[2] + ')');
}
const i = xml.indexOf('type="image"');
console.log('--- image ---');
console.log(xml.slice(i - 30, i + 460).replace(/\s+/g, ' '));
