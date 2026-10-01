// Build a hybrid geogebra.xml: header (settings) from one file, construction body from another.
// usage: node hybrid.js <headerDonor.xml> <bodyDonor.xml> <out.xml>
const fs = require('fs');
const H = fs.readFileSync(process.argv[2], 'utf8');
const B = fs.readFileSync(process.argv[3], 'utf8');
const out = process.argv[4];
const iH = H.indexOf('<construction');
const iB = B.indexOf('<construction');
const iE = B.lastIndexOf('</construction>');
if (iH < 0 || iB < 0 || iE < 0) { console.log('skip: missing construction'); process.exit(1); }
const header = H.slice(0, iH);
const body = B.slice(iB, iE + '</construction>'.length);
fs.writeFileSync(out, header + body + '\n</geogebra>\n');
console.log('wrote ' + out);
