'use strict';
// For t29/t33 objects, expand the marker (parents[2]) one level to see whether it
// derives from an angle (3 points) or a ratio/segments.
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
function walk(dir, out) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p); } return out; }
const shown = { 29: 0, 33: 0 };
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if ((o.srcType !== 29 && o.srcType !== 33) || shown[o.srcType] >= 5) continue;
    const mk = byId.get(o.parents[2]);
    const mkp = mk ? mk.parents.map(id => { const q = byId.get(id); return q ? q.kind : '?'; }).join(',') : '-';
    const mkpp = mk ? mk.parents.map(id => { const q = byId.get(id); return q ? (q.label || q.kind) : '?'; }).join(',') : '-';
    console.log('t' + o.srcType + ' #' + o.id + ' pre=' + (byId.get(o.parents[0]) || {}).kind +
      ' ctr=' + (byId.get(o.parents[1]) || {}).kind +
      ' | marker #' + (mk ? mk.id : '?') + ' t' + (mk ? mk.srcType : '?') + ' ' + (mk ? mk.kind : '?') +
      ' "' + (mk ? mk.label : '') + '" markerParents=[' + mkp + '] [' + mkpp + ']  @ ' + path.basename(f));
    shown[o.srcType]++;
  }
  if (shown[29] >= 5 && shown[33] >= 5) break;
}
