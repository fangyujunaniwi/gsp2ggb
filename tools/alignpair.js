'use strict';
// Align a .gsp with its JavaSketchpad .htm export (both are in construction order)
// to help identify transform types (t21/t29/t33 vs JSP Rotation/Dilation/...).
//
// usage: node tools/alignpair.js <file.gsp> <file.htm>
//
// Prints two columns: GSP objects (id, type, kind, parents) and JSP objects
// (index, spec, variant, parents).  JavaSketchpad drops non-renderable objects
// (measures, buttons), so align by walking both in order and matching by eye.
const fs = require('fs');
const { gspToIR } = require('../src/gsp');
const { extractConstruction, parseConstruction } = require('../src/jsp');

const [gsp, htm] = process.argv.slice(2);
if (!gsp || !htm) { console.error('usage: node tools/alignpair.js <file.gsp> <file.htm>'); process.exit(2); }

const ir = gspToIR(fs.readFileSync(gsp));
const byId = new Map(ir.objects.map(o => [o.id, o]));
const gspRows = ir.objects.map(o => {
  const p = o.parents.map(id => { const q = byId.get(id); return q ? ('t' + q.srcType + '#' + q.id) : ('?' + id); }).join(',');
  const par = o.params && o.params.length ? ' params=[' + o.params.map(v => (+v).toFixed(4)).join(',') + ']' : '';
  return { id: o.id, line: 't' + o.srcType + ' ' + o.kind + (o.label ? ' "' + o.label + '"' : '') + (p ? '  <=[' + p + ']' : '') + par };
});

const raw = fs.readFileSync(htm);
let text = raw.toString('utf8');
if (/\uFFFD/.test(text)) { try { text = new TextDecoder('gbk').decode(raw); } catch { /* ignore */ } }
let construction = extractConstruction(text);
if (construction == null || construction.trim() === '') construction = text;
const jir = parseConstruction(construction);
const jspRows = jir.objects.map(o => ({
  id: o.index,
  line: o.spec + (o.variant && typeof o.variant === 'string' ? ' ' + o.variant : '') +
    (o.measureType != null ? ' <m' + o.measureType + '>' : '') +
    (o.parents.length ? '  <=[' + o.parents.join(',') + ']' : '') +
    (o.doubles.length ? ' d=[' + o.doubles.map(x => (typeof x === 'number' ? +x.toFixed(3) : x)).join(',') + ']' : '') +
    (o.strings.length ? ' s=' + JSON.stringify(o.strings.map(s => s.length > 40 ? s.slice(0, 37) + '...' : s)) : '')
}));

const n = Math.max(gspRows.length, jspRows.length);
console.log('GSP ' + gspRows.length + ' objects   |   JSP ' + jspRows.length + ' objects');
console.log('--- .gsp (id | type kind parents params) ---   --- .htm (idx | spec) ---');
for (let i = 0; i < n; i++) {
  const g = gspRows[i] ? (String(gspRows[i].id).padStart(4) + ' ' + gspRows[i].line) : '';
  const j = jspRows[i] ? (String(jspRows[i].id).padStart(4) + ' ' + jspRows[i].line) : '';
  console.log(g.padEnd(58) + ' | ' + j);
}
