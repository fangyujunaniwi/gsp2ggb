'use strict';
// Probe frames with extreme uy/ux ratios to see whether the unit points are being read right.
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const { sketchFrame } = require('../src/ggb');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
const want = process.argv[3] || 'extreme';
function walk(d, out) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p); } return out; }
let shown = 0;
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  let fr; try { fr = sketchFrame(ir, byId); } catch (e) { continue; }
  if (!fr) continue;
  const r = fr.uyLen / fr.uxLen;
  const extreme = (want === 'extreme') ? (r < 0.3 || r > 3) : true;
  if (!extreme || shown >= 6) continue;
  shown++;
  console.log('==== ' + path.basename(f) + '  ratio=' + r.toFixed(4) + '  uxLen=' + fr.uxLen.toFixed(3) + ' uyLen=' + fr.uyLen.toFixed(3));
  const cs = ir.objects.find(o => o.srcType === 61);
  for (const axId of cs.parents) {
    const ax = byId.get(axId);
    if (!ax) continue;
    const ps = ax.parents.map(id => { const q = byId.get(id); return q ? ('t' + q.srcType + '/#' + q.id + (q.params && q.params.length ? ' params=' + q.params.map(v => (+v).toFixed(2)).join(',') : '')) : ('?' + id); });
    console.log('   axis #' + ax.id + ' label=' + JSON.stringify(ax.label) + ' parents=[' + ps.join('  ') + ']');
  }
}
