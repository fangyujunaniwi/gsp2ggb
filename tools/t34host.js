'use strict';
// Sample reflectImage mirrors whose elemTypeOf is 'segment' but straightRef fails.
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const { planOf, straightRef, elemTypeOf, isPointish } = require('../src/ggb');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
function walk(dir, out) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p); } return out; }
let shown = 0;
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) { o._byId = byId; o._unit = 'gsp'; }
  for (const o of ir.objects) {
    if (o.kind !== 'reflectImage' || o.parents.length < 2) continue;
    const pl = planOf(o, byId);
    if (!pl || pl.skip !== 'reflection mirror unsupported') continue;
    const mir = byId.get(o.parents[1]);
    if (!mir || mir.kind !== 'reflectImage' || straightRef(mir, byId, id => '{#' + id + '}')) continue;
    if (shown++ >= 8) break;
    console.log('== ' + f.replace(root, '') + '   reflect #' + o.id);
    // dump the mirror chain
    let c = mir, g = 0;
    while (c && g++ < 8) {
      const ps = c.parents.map(id => { const q = byId.get(id); return q ? (q.kind + '#' + q.id + '/t' + q.srcType) : ('?' + id); });
      console.log('   #' + c.id + '/t' + c.srcType + ' ' + c.kind + '  parents=[' + ps.join(', ') + ']');
      c = byId.get(c.parents[1]);
    }
  }
  if (shown >= 8) break;
}
console.log('shown=' + shown);
