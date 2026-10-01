'use strict';
// Audit sketch-frame detection across a corpus: how many files define a custom coordinate
// system, how many yield a usable frame, and whether the axes are axis-aligned / square.
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const { sketchFrame } = require('../src/ggb');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
function walk(d, out) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p); } return out; }
let files = 0, withCs = 0, framed = 0, square = 0, skew = 0, bad = 0;
let fnFiles = 0, fnWithCs = 0, nonFnCs = 0;
const ratios = [];
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  files++;
  const hasCs = ir.objects.some(o => o.srcType === 61);
  const hasFn = ir.objects.some(o => o.srcType === 72 || o.srcType === 71 || o.srcType === 78);
  if (hasFn) { fnFiles++; if (hasCs) fnWithCs++; }
  if (hasCs && !hasFn) nonFnCs++;
  if (!hasCs) continue;
  withCs++;
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  let fr; try { fr = sketchFrame(ir, byId); } catch (e) { fr = null; }
  if (!fr) { bad++; continue; }
  framed++;
  const skewv = Math.abs(fr.Ux.x * fr.Uy.x + fr.Ux.y * fr.Uy.y) / (fr.uxLen * fr.uyLen);
  if (skewv > 0.01) skew++;
  const r = fr.uyLen / fr.uxLen;
  ratios.push(r);
  if (Math.abs(r - 1) < 0.02) square++;
}
ratios.sort((a, b) => a - b);
const q = p => ratios.length ? ratios[Math.min(ratios.length - 1, Math.floor(p * ratios.length))].toFixed(3) : '-';
console.log('files=' + files + '  with coordsys=' + withCs + '  framed=' + framed + '  unframed=' + bad);
console.log('function files=' + fnFiles + '  of which with coordsys=' + fnWithCs + '  coordsys-only files=' + nonFnCs);
console.log('frame: square(ux~uy)=' + square + '  skewed(non-orthogonal)=' + skew);
console.log('uy/ux ratio quantiles: min=' + (ratios[0] || 0).toFixed(3) + ' p10=' + q(0.1) + ' p50=' + q(0.5) + ' p90=' + q(0.9) + ' max=' + (ratios[ratios.length - 1] || 0).toFixed(3));
