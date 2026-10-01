'use strict';
// Dump the IR of one .gsp file given by explicit path.
const fs = require('fs');
const { gspToIR } = require('../src/gsp');
const { irToGgb, planOf } = require('../src/ggb');
const file = process.argv[2];
const buf = fs.readFileSync(file);
const ir = gspToIR(buf);
const byId = new Map(); for (const o of ir.objects) byId.set(o.id, o);
console.log('objects=' + ir.objects.length + '  warnings=' + JSON.stringify(ir.warnings || []));
for (const o of ir.objects) {
  let p; try { p = planOf(o, byId); } catch (e) { p = { skip: 'ERR ' + e.message }; }
  console.log('#' + o.id + ' t' + o.srcType + ' ' + o.kind + ' label=' + JSON.stringify(o.label || '')
    + ' coords=' + (o.coords ? JSON.stringify(o.coords) : '-')
    + ' unit=' + o._unit
    + ' parents=[' + o.parents.join(',') + ']'
    + ' -> ' + (p.skip ? ('SKIP ' + p.skip) : ('emit ' + p.elem + ' ' + (p.exprTpl || JSON.stringify(p.free || '')))));
}
const r = irToGgb(ir);
fs.writeFileSync('out/t_ir.xml', r.xml);
console.log('--- xml written out/t_ir.xml ; planned=' + r.stats.planned);
