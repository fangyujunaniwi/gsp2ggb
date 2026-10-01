'use strict';
const fs = require('fs');
const { gspToIR } = require('../src/gsp');
const { irToGgb } = require('../src/ggb');
for (const f of process.argv.slice(2)) {
  const r = irToGgb(gspToIR(fs.readFileSync(f)));
  console.log('==== ' + f);
  for (const line of r.xml.split('\n')) {
    if (/type="text"/.test(line) || /<expression label="text/.test(line)) console.log(line.trim());
  }
}
