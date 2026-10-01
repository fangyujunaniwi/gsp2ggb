'use strict';
// Frame ratios restricted to files that actually contain functions (t72/t71/t78).
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const { sketchFrame } = require('../src/ggb');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
function walk(d, out) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p); } return out; }
const ratios = [];
const samples = [];
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  if (!ir.objects.some(o => o.srcType === 72 || o.srcType === 71 || o.srcType === 78)) continue;
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  let fr; try { fr = sketchFrame(ir, byId); } catch (e) { continue; }
  if (!fr) continue;
  const r = fr.uyLen / fr.uxLen;
  ratios.push(r);
  if (r < 0.4 || r > 2.5) samples.push(path.basename(f) + ' ratio=' + r.toFixed(3) + ' ux=' + fr.uxLen.toFixed(2) + ' uy=' + fr.uyLen.toFixed(2));
}
ratios.sort((a, b) => a - b);
const q = p => ratios.length ? ratios[Math.min(ratios.length - 1, Math.floor(p * ratios.length))].toFixed(3) : '-';
console.log('function files with frame=' + ratios.length);
console.log('ratio: min=' + (ratios[0] || 0).toFixed(3) + ' p10=' + q(0.1) + ' p25=' + q(0.25) + ' p50=' + q(0.5) + ' p75=' + q(0.75) + ' p90=' + q(0.9) + ' max=' + (ratios[ratios.length - 1] || 0).toFixed(3));
console.log('near-square (0.9..1.1): ' + ratios.filter(r => r > 0.9 && r < 1.1).length);
console.log('outliers (<0.4 or >2.5): ' + samples.length);
for (const s of samples.slice(0, 15)) console.log('  ' + s);
