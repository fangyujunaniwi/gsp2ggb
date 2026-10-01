'use strict';
// List the smallest .gsp files that contain decodable t29 / t33 markers.
// usage: node test/find2933.js <corpusRoot>
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const { decodeExpr } = require('../src/expr');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p);
  }
  return out;
}
const found = [];
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  let n29 = 0, n33 = 0;
  for (const o of ir.objects) {
    if (o.srcType !== 29 && o.srcType !== 33) continue;
    const mk = byId.get(o.parents[2]);
    const pay = mk && mk._raw && mk._raw.rich && mk._raw.rich[2311];
    const dec = pay ? decodeExpr(pay, mk) : null;
    if (dec && dec.ok) { if (o.srcType === 29) n29++; else n33++; }
  }
  if (n29 || n33) found.push({ f, n29, n33, kb: fs.statSync(f).size / 1024 });
}
found.sort((a, b) => a.kb - b.kb);
for (const r of found.slice(0, 12))
  console.log(('t29=' + r.n29 + ' t33=' + r.n33).padEnd(18) + (r.kb.toFixed(1) + 'KB').padStart(9) + '  ' + r.f);
