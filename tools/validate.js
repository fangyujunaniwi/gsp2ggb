// Extract geogebra.xml from a .ggb and write it next to it (for external XML validation).
const fs = require('fs');
const { unzip } = require('../src/zip.js');
const f = process.argv[2];
const out = process.argv[3] || (f + '.xml');
const m = unzip(fs.readFileSync(f));
if (!m.has('geogebra.xml')) { console.log('NO geogebra.xml'); process.exit(1); }
fs.writeFileSync(out, m.get('geogebra.xml'));
console.log('wrote ' + out + ' (' + m.get('geogebra.xml').length + ' bytes)');
