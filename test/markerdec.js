'use strict';
// Classify t29/t33 markers (parents[2]) by how their tag-2311 program decodes,
// to decide which can be safely used as a GeoGebra angle / dilation factor.
// usage: node test/markerdec.js <corpusRoot>
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
const isAngleObj = o => o && (o.srcType === 41 || o.srcType === 113 || o.srcType === 120);

const cat = {
  29: { decoded: 0, angleRef: 0, hasX: 0, hasPiOrDeg: 0, other: 0, none: 0 },
  33: { decoded: 0, ratio2: 0, inv: 0, hasX: 0, hasAngleFn: 0, other: 0, none: 0 },
};
const ex = { 29: { angleRef: [], other: [] }, 33: { ratio2: [], inv: [], other: [] } };
const push = (a, s) => { if (a.length < 4) a.push(s); };

for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if (o.srcType !== 29 && o.srcType !== 33) continue;
    const mk = byId.get(o.parents[2]);
    const pay = mk && mk._raw && mk._raw.rich && mk._raw.rich[2311];
    const dec = pay ? decodeExpr(pay, mk) : null;
    const c = cat[o.srcType];
    if (!(dec && dec.ok)) { c.none++; continue; }
    c.decoded++;
    const t = dec.exprTpl;
    const hasX = /(^|[^A-Za-z0-9_])x([^A-Za-z0-9_]|$)/.test(t);
    if (o.srcType === 29) {
      const m = /^\{#(\d+)\}$/.exec(t);
      if (m && isAngleObj(byId.get(parseInt(m[1], 10)))) { c.angleRef++; push(ex[29].angleRef, t + ' @' + path.basename(f)); }
      else if (hasX) c.hasX++;
      else if (/pi|180/.test(t)) { c.hasPiOrDeg++; push(ex[29].other, t + ' @' + path.basename(f)); }
      else { c.other++; push(ex[29].other, t + ' @' + path.basename(f)); }
    } else {
      if (/^\{#\d+\} \/ \{#\d+\}$/.test(t)) { c.ratio2++; push(ex[33].ratio2, t); }
      else if (/^1 \/ \{#\d+\}$/.test(t)) { c.inv++; push(ex[33].inv, t); }
      else if (hasX) c.hasX++;
      else if (/Angle|sin|cos|tan/.test(t)) { c.hasAngleFn++; }
      else { c.other++; push(ex[33].other, t + ' @' + path.basename(f)); }
    }
  }
}
console.log('t29:', JSON.stringify(cat[29]));
console.log('  angleRef samples:', ex[29].angleRef.join(' | '));
console.log('  other samples   :', ex[29].other.slice(0, 6).join(' | '));
console.log('t33:', JSON.stringify(cat[33]));
console.log('  ratio2 samples:', ex[33].ratio2.join(' | '));
console.log('  inv samples   :', ex[33].inv.join(' | '));
console.log('  other samples :', ex[33].other.slice(0, 6).join(' | '));
