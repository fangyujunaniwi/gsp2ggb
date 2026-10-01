'use strict';
// Diagnose t29/t33: list objects with marker kinds and whether the angle/ratio resolves,
// and the resulting skip/emit decision.
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const ggb = require('../src/ggb');
function walk(d, o) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, o); else if (/\.gsp$/i.test(e.name)) o.push(p); } return o; }
const N = parseInt(process.argv[2] || '3', 10);
const seen = { 29: 0, 33: 0 };
for (const f of walk((process.env.GSP_DIR || 'D:\\Sketchpad5'), [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if (o.srcType !== 29 && o.srcType !== 33) continue;
    const mk = byId.get(o.parents[2]);
    // only look at direct angle/ratio markers
    const interesting = (o.srcType === 29 && mk && (mk.srcType === 41 || mk.srcType === 120)) ||
      (o.srcType === 33 && mk && mk.srcType === 47);
    if (!interesting || seen[o.srcType] >= N) continue;
    seen[o.srcType]++;
    let plan;
    try { plan = ggb.planOf(o, byId); } catch (e) { plan = { err: String(e.message) }; }
    console.log('t' + o.srcType + ' #' + o.id + ' marker=t' + (mk ? mk.srcType : '?') +
      ' parents=[' + o.parents.map(id => { const q = byId.get(id); return q ? q.kind : '?'; }).join(',') + ']' +
      '  -> ' + JSON.stringify(plan && (plan.skip ? { skip: plan.skip } : { expr: plan.exprTpl, elem: plan.elem })));
  }
  if (seen[29] >= N && seen[33] >= N) break;
}