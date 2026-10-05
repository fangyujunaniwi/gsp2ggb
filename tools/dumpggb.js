'use strict';
const fs = require('fs');
const { unzip } = require('../src/zip.js');
const m = unzip(fs.readFileSync(process.argv[2]));
console.log('ZIP entries: ' + [...m.keys()].join(', '));
const xml = m.get('geogebra.xml').toString('utf8');
const hi = xml.indexOf('<geogebra');
console.log('--- geogebra tag ---\n' + xml.slice(hi, xml.indexOf('>', hi) + 1));
const i = xml.indexOf('type="image"');
if (i < 0) { console.log('no image element'); process.exit(0); }
console.log('--- image element context ---');
console.log(xml.slice(Math.max(0, i - 120), i + 800));
for (const mm of xml.matchAll(/<expression[^>]*>/g)) if (/image/i.test(mm[0])) console.log('EXPR ' + mm[0]);
