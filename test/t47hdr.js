'use strict';
// Tally t47 (and related) objects by header u1 and parent shape across the corpus.
// usage: node test/t47hdr.js <corpusRoot>
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p);
  }
  return out;
}
const tally = {}; // key = srcType|u1|shape
const POINTISH = new Set(['free', 'midpoint', 'pointOnPath', 'intersectLL', 'intersectLC1', 'intersectLC2',
  'intersectCC1', 'intersectCC2', 'foot', 'offsetPoint', 'shiftX', 'shiftY', 'rotateImage',
  'dilateImage', 'translateImage', 'plotPoint', 'implicitRotate']);
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if (o.srcType !== 47 && o.srcType !== 41 && o.srcType !== 113) continue;
    const raw = o._raw; const h = raw.hdr || Buffer.alloc(0);
    const f2 = h.length >= 4 ? h.readUInt16LE(2) : -1;
    const f4 = h.length >= 6 ? h.readUInt16LE(4) : -1;
    const f8 = h.length >= 10 ? h.readUInt16LE(8) : -1;
    const u1 = 'f2=' + f2 + ',f4=' + f4 + ',f8=' + f8;
    const P = o.parents.map(id => byId.get(id));
    let shape = 'other';
    if (P.length === 2 && P.every(q => q && q.kind === 'segment')) shape = 'seg2';
    else if (P.length === 3 && P.every(q => q && POINTISH.has(q.kind))) shape = 'pt3';
    else shape = 'p' + P.length;
    const key = 't' + o.srcType + '|u1=' + u1 + '|' + shape;
    tally[key] = (tally[key] || 0) + 1;
  }
}
for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(v + '\t' + k);
