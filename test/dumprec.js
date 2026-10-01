// dump full raw record info for one object id in a file
// usage: node test\dumprec.js <file.gsp> <id>
const fs = require('fs');
const { gspToIR } = require('../src/gsp');
const ir = gspToIR(fs.readFileSync(process.argv[2]));
const id = parseInt(process.argv[3], 10);
const by = new Map(ir.objects.map(o => [o.id, o]));
const o = by.get(id);
for (const ob of ir.objects) {
  if (ob.id === id) {
    console.log('#' + ob.id + ' t' + ob.srcType + ' kind=' + ob.kind + ' lab="' + ob.label + '"');
    console.log('  parents=' + JSON.stringify(ob.parents) + '  params=' + JSON.stringify(ob.params));
    console.log('  coords=' + (ob.coords ? ob.coords.x + ',' + ob.coords.y : '-'));
    if (ob._raw) {
      console.log('  raw labels=' + JSON.stringify(ob._raw.labels));
      console.log('  raw rich keys=' + Object.keys(ob._raw.rich || {}).join(','));
      for (const [k, v] of Object.entries(ob._raw.rich || {}))
        console.log('    rich[' + k + '] = ' + Buffer.from(v).toString('hex'));
    }
  }
}
