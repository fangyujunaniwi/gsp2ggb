// Correlate bookkeeping fields with object statistics across sample files.
const fs = require('fs');
const path = require('path');
const { parseRecords } = require('../src/gsp.js');
const files = [];
function walk(d, depth) {
  if (depth > 5 || files.length > 4000) return;
  let es; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
  for (const e of es) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
}
walk((process.env.GSP_SAMPLES || 'D:/Sketchpad5/Samples'), 0);
console.log('objs\t9000\t9005\tlabeled\twithParents\tmeas\tt0\ttext\tt48\tplanes\tfile');
let shown = 0;
for (const f of files) {
  if (shown > 34) break;
  let recs; try { recs = parseRecords(fs.readFileSync(f)); } catch (e) { continue; }
  if (recs.some(r => r.tag === 1100)) continue; // normal files only
  const first = recs.findIndex(r => r.tag === 2000);
  const lastTag = recs.map(r => r.tag).lastIndexOf(2007);
  if (first < 0) continue;
  const hdr = recs.slice(0, first), tail = recs.slice(lastTag + 1);
  const f1000 = hdr.find(r => r.tag === 1000);
  const t9000 = tail.find(r => r.tag === 9000), t9005 = tail.find(r => r.tag === 9005);
  // object stats
  let objs = 0, labeled = 0, withParents = 0, meas = 0, t0 = 0, text = 0, t48 = 0, planes = 0;
  let cur = null;
  for (let i = first; i < recs.length; i++) {
    const r = recs[i];
    if (r.tag === 2000) { objs++; cur = { t: r.pay.readUInt16LE(0), lab: false, par: false }; if (cur.t === 0) t0++; if (cur.t === 48) t48++; continue; }
    if (!cur) continue;
    if (r.tag === 2005 && r.pay.length > 24) cur.lab = true;
    if (r.tag === 2002) cur.par = true;
    if (r.tag === 2307 || r.tag === 2308 || r.tag === 2309) meas++;
    if (r.tag === 2007) {
      if (cur.lab) labeled++;
      if (cur.par) withParents++;
      if ([47, 58, 65, 66, 87, 36, 37].includes(cur.t)) text++;
      cur = null;
    }
  }
  console.log([objs, t9000 ? t9000.pay.readUInt32LE(0) : '-', t9005 ? t9005.pay.readUInt32LE(0) : '-',
    labeled, withParents, meas, t0, text, t48, planes,
    f1000 ? ('1000=' + f1000.pay.toString('hex').slice(0, 72)) : 'no1000', path.basename(f)].join('\t'));
  shown++;
}
