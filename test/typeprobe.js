// Probe construction shape of selected GSP types across a corpus.
// usage: node test/typeprobe.js <root> <type[,type...]> [--show N]
'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
const root = process.argv[2];
const types = process.argv[3].split(',').map(Number);
const si = process.argv.indexOf('--show');
const SHOW = si >= 0 ? parseInt(process.argv[si + 1], 10) : 12;
const files = [];
(function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p); else if (/\.gsp$/i.test(e.name)) files.push(p); } })(root);

const stats = new Map();
for (const f of files) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  const by = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if (!types.includes(o.srcType)) continue;
    let s = stats.get(o.srcType);
    if (!s) { s = { n: 0, arity: {}, pt: {}, pos: [], rich: {}, samples: [] }; stats.set(o.srcType, s); }
    s.n++;
    s.arity[o.parents.length] = (s.arity[o.parents.length] || 0) + 1;
    o.parents.forEach((id, i) => {
      const p = by.get(id); const k = 't' + (p ? p.srcType : '?');
      s.pt[k] = (s.pt[k] || 0) + 1;
      s.pos[i] = s.pos[i] || {};
      s.pos[i][k] = (s.pos[i][k] || 0) + 1;
    });
    for (const tag of Object.keys(o._raw.rich || {})) s.rich['r' + tag] = (s.rich['r' + tag] || 0) + 1;
    if (s.samples.length < SHOW) {
      s.samples.push(path.basename(f) + ' #' + o.id + ' lab=' + JSON.stringify(o.label) +
        ' par=[' + o.parents.map(id => { const p = by.get(id); return id + ':t' + (p ? p.srcType : '?'); }).join(',') + ']' +
        ' params=[' + o.params.map(x => +x.toFixed(5)).join(',') + ']' +
        ' rich=[' + Object.keys(o._raw.rich || {}).join(',') + ']');
    }
  }
}
for (const t of types) {
  const s = stats.get(t);
  if (!s) { console.log('TYPE ' + t + ': none'); continue; }
  console.log('TYPE ' + t + '  n=' + s.n + '  arity=' + JSON.stringify(s.arity));
  console.log('  parents=' + JSON.stringify(s.pt) + '  rich=' + JSON.stringify(s.rich));
  s.pos.forEach((m, i) => {
    const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 12)
      .map(([k, v]) => k + ':' + v).join(' ');
    console.log('  pos[' + i + ']=' + top);
  });
  s.samples.forEach(x => console.log('  ' + x));
}
