// Pack an extracted geogebra.xml back into a .ggb (using our zip writer).
// usage: node pack.js <in.xml> <out.ggb>
const fs = require('fs');
const { zip } = require('../src/zip.js');
const [inXml, out] = process.argv.slice(2);
const xml = fs.readFileSync(inXml);
fs.writeFileSync(out, zip([{ name: 'geogebra.xml', data: xml }]));
console.log('wrote ' + out + ' (' + xml.length + ' bytes xml)');
