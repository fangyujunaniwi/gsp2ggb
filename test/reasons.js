// Histogram of skip reasons grouped by source type.
// usage: node test/reasons.js <root> [typeFilter]
'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
const { irToGgb } = require('../src/ggb');
const root = process.argv[2];
const filt = process.argv[3] ? parseInt(process.argv[3], 10) : null;
const files = [];
(function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (/\.gsp$/i.test(e.name)) files.push(p); } })(root);
const hist = new Map();
for (const f of files) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  let r; try { r = irToGgb(ir); } catch { continue; }
  for (const w of r.warnings) {
    const m = /^skip #\d+ t(\d+) [^:]+: (.*)$/.exec(w);
    if (!m) continue;
    const t = parseInt(m[1], 10);
    if (filt !== null && t !== filt) continue;
    hist.set(t + ' | ' + m[2], (hist.get(t + ' | ' + m[2]) || 0) + 1);
  }
}
for (const [k, v] of [...hist.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log(v + '\t' + k);
