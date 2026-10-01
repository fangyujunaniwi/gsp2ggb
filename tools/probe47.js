'use strict';
// Find t47 objects whose parents are exactly two segments (candidate Ratio/Segments measure).
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
function walk(d, o) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, o); else if (/\.gsp$/i.test(e.name)) o.push(p); } return o; }
let n = 0;
for (const f of walk((process.env.GSP_DIR || 'D:\\Sketchpad5'), [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    const P = o.parents.map(id => byId.get(id)).filter(Boolean);
    if (o.srcType === 47 && P.length === 2 && P.every(q => q.srcType === 2)) {
      console.log('t47 #' + o.id + ' label=' + JSON.stringify(o.label) + ' <= [' + P.map(q => q.kind).join(',') + '] params=[' + (o.params || []).map(v => (+v).toFixed(3)).join(',') + '] @ ' + path.basename(f));
      if (++n >= 8) process.exit(0);
    }
  }
}
console.log('found', n);