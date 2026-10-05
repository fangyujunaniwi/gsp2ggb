'use strict';
const fs = require('fs');
const { unzip } = require('../src/zip.js');
const xml = unzip(fs.readFileSync(process.argv[2])).get('geogebra.xml').toString('utf8');
const i = xml.indexOf('type="image"');
console.log(i < 0 ? 'no image element' : xml.slice(i - 60, i + 500));
