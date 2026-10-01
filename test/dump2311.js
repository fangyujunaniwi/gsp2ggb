// dump tag-2311 payloads (and 2310/2307/2306/2309/2314) for objects, with labels/parents
// usage: node test/dump2311.js <file.gsp> [maxObjects]
const fs = require('fs');
const { gspToIR } = require('../src/gsp');
const ir = gspToIR(fs.readFileSync(process.argv[2]));
const by = new Map(ir.objects.map(o => [o.id, o]));
const max = parseInt(process.argv[3] || '999', 10);
let shown = 0;
for (const o of ir.objects) {
  if (shown >= max) break;
  const rich = (o._raw && o._raw.rich) || {};
  const keys = Object.keys(rich).filter(k => [2311, 2310, 2307, 2306, 2309, 2314, 2308, 2313, 2305].includes(parseInt(k, 10)));
  if (!keys.length) continue;
  shown++;
  console.log('#' + o.id + ' t' + o.srcType + ' lab="' + o.label + '" par=[' +
    o.parents.map(i => i + ':' + (by.get(i) ? 't' + by.get(i).srcType + '(' + by.get(i).kind + ')' : '?')).join(',') + ']');
  for (const k of keys) {
    const b = Buffer.from(rich[k]);
    console.log('    rich[' + k + '] len=' + b.length + ' : ' + b.toString('hex'));
    const ascii = b.toString('latin1').replace(/[^\x20-\x7e]/g, '.');
    console.log('      ascii: ' + ascii);
  }
}
