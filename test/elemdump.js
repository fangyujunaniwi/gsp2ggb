'use strict';
const fs = require('fs');
const { unzip } = require('../src/zip');
const buf = fs.readFileSync(process.argv[2]);
const e = unzip(buf);
const xml = e.get('geogebra.xml').toString('utf8');
for (const lab of (process.argv[3] || 'r,r_2,m_1,O_13,O_14,E_,F,O_10,O_11').split(',')) {
  const re = new RegExp('<element[^>]*label="' + lab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[\\s\\S]*?</element>');
  const m = xml.match(re);
  console.log('==== ' + lab + ' ====');
  console.log(m ? m[0] : '(not found)');
}
