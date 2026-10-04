'use strict';
const fs = require('fs');
const { unzip } = require('../src/zip.js');

const file = process.argv[2];
const xml = unzip(fs.readFileSync(file)).get('geogebra.xml').toString('utf8');

// list construction elements in order
const elems = [...xml.matchAll(/<element\s+type="([^"]*)"\s+label="([^"]*)"/g)];
console.log('total elements=' + elems.length);
for (let i = 0; i < elems.length; i++) {
  const start = elems[i].index;
  const end = i + 1 < elems.length ? elems[i + 1].index : Math.min(xml.length, start + 2000);
  const chunk = xml.slice(start, end);
  const expM = chunk.match(/<expression[^>]*exp="([^"]*)"/);
  const coordsM = chunk.match(/<coords[^>]*x="([^"]*)" y="([^"]*)"/);
  let extra = '';
  if (expM) extra = ' expr=' + expM[1].replace(/&quot;/g, '"').slice(0, 80);
  else if (coordsM) extra = ' coords=(' + coordsM[1] + ',' + coordsM[2] + ')';
  console.log('  ' + (i + 1) + '. [' + elems[i][1] + '] ' + elems[i][2] + extra);
}
