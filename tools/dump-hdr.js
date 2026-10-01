// Dump header/tail bookkeeping records for several files to identify count fields.
const fs = require('fs');
const { parseRecords } = require('../src/gsp.js');
const files = process.argv.slice(2);
for (const f of files) {
  let recs;
  try { recs = parseRecords(fs.readFileSync(f)); } catch (e) { console.log(f + ' PARSE FAIL ' + e.message); continue; }
  const first = recs.findIndex(r => r.tag === 2000);
  const lastTag = recs.map(r => r.tag).lastIndexOf(2007);
  let n = 0;
  for (const r of recs) if (r.tag === 2000) n++;
  const hdr = recs.slice(0, first);
  const tail = recs.slice(lastTag + 1);
  const f1000 = hdr.find(r => r.tag === 1000);
  const t9000 = tail.find(r => r.tag === 9000);
  const t9005 = tail.find(r => r.tag === 9005);
  console.log('== ' + f.split('\\').pop() + '  objects=' + n + ' headerRecs=' + hdr.length + ' tailRecs=' + tail.length +
    ' size=' + fs.statSync(f).size);
  if (f1000) console.log('   tag1000 len=' + f1000.pay.length + ' hex=' + f1000.pay.toString('hex'));
  console.log('   tag9000=' + (t9000 ? t9000.pay.readUInt32LE(0) : '-') + '  tag9005=' + (t9005 ? t9005.pay.readUInt32LE(0) : '-'));
  console.log('   tail tags=' + tail.map(r => r.tag + ':' + r.pay.length).join(' '));
}
