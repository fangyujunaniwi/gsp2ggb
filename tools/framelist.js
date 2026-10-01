'use strict';
// List function sketches that get a frame (single coordsys, sane aspect), with their ratio.
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const { sketchFrame } = require('../src/ggb');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
function walk(d, out) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p); } return out; }
const rows = [];
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  if (!ir.objects.some(o => o.srcType === 72 || o.srcType === 71 || o.srcType === 78)) continue;
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  let fr; try { fr = sketchFrame(ir, byId); } catch (e) { continue; }
  if (!fr) continue;
  rows.push({ f, r: fr.uyLen / fr.uxLen, n: ir.objects.length });
}
rows.sort((a, b) => Math.abs(Math.log(a.r)) - Math.abs(Math.log(b.r)));
for (const x of rows) console.log(x.r.toFixed(3) + '  obj=' + String(x.n).padStart(4) + '  ' + path.basename(x.f));
