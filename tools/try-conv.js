// Quick gsp -> ggb smoke test + round-trip read-back.
const fs = require('fs');
const { gspToIR } = require('../src/gsp.js');
const { irToGgb, ggbToIR } = require('../src/ggb.js');

const src = process.argv[2], out = process.argv[3] || 'out.ggb';
const ir = gspToIR(fs.readFileSync(src));
const r = irToGgb(ir);
fs.writeFileSync(out, r.buf);
fs.writeFileSync(out + '.xml', r.xml);
console.log('== ' + src);
console.log('objects=' + ir.objects.length + ' emitted=' + r.stats.planned + ' warnings=' + r.warnings.length);
r.warnings.slice(0, 100).forEach(w => console.log('  W ' + w));
// round-trip
const back = ggbToIR(r.buf);
console.log('read-back objects=' + back.objects.length);
back.objects.slice(0, 25).forEach(o => console.log(
  '  ' + o.ggbType + ' ' + (o.label || '?') +
  (o.expr ? '  exp=' + o.expr : '') +
  (o.cmd ? '  cmd=' + o.cmd.name + '[' + o.cmd.args.join(',') + ']' : '') +
  (o.coords ? '  xy=' + o.coords.x.toFixed(2) + ',' + o.coords.y.toFixed(2) : '') +
  (o.value !== null ? '  val=' + o.value : '') +
  '  parents=' + JSON.stringify(o.parents)));
