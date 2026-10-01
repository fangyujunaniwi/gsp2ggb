'use strict';
// Tabulate reflectImage (t34) objects that planOf still skips as
// "reflection mirror unsupported", classified with the SAME helpers planOf uses.
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const { planOf, straightRef, elemTypeOf, isPointish, LINE_KINDS, XFORM_KINDS } = require('../src/ggb');

const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.gsp$/i.test(e.name)) out.push(p);
  }
  return out;
}
const files = walk(root, []);
const byReason = new Map(), byKind = new Map();
let refl = 0, ok = 0, fail = 0;
const samples = [];

for (const f of files) {
  let ir;
  try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) { o._byId = byId; o._unit = 'gsp'; }
  for (const o of ir.objects) {
    if (o.kind !== 'reflectImage') continue;
    refl++;
    const pl = planOf(o, byId);
    if (pl && !pl.skip) { ok++; continue; }
    if (!pl || pl.skip !== 'reflection mirror unsupported') continue;
    fail++;
    const mir = byId.get(o.parents[1]);
    const k = mir ? (mir.kind + '(t' + mir.srcType + ')') : 'missing';
    byKind.set(k, (byKind.get(k) || 0) + 1);
    let why = 'missing';
    if (mir) {
      if (isPointish(mir)) why = 'pointish(should-emit)';
      else if (elemTypeOf(mir, byId) === 'conic') why = 'conic(should-emit)';
      else if (straightRef(mir, byId, id => '{#' + id + '}')) why = 'straightRef-ok(should-emit)';
      else why = 'kind=' + mir.kind + '/t' + mir.srcType + ' mt=' + elemTypeOf(mir, byId);
    }
    byReason.set(why, (byReason.get(why) || 0) + 1);
    if (samples.length < 15) samples.push(f.replace(root, '') + ' :: #' + o.id + ' pre=' + (byId.get(o.parents[0]) || {}).kind + ' mir=' + k + ' why=' + why);
  }
}

console.log('files=' + files.length + '  reflectImage=' + refl + '  planOK=' + ok + '  skipMirror=' + fail);
const show = (t, m) => { console.log('\n-- ' + t + ' --'); [...m.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(v + '\t' + k)); };
show('failing mirror kinds', byKind);
show('true reason', byReason);
console.log('\n-- samples --'); samples.forEach(s => console.log(s));
