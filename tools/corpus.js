// Recursively convert/measure a GSP corpus while preserving its directory tree.
// usage: node tools/corpus.js <root> [--outdir <dir>] [--json <report.json>]
'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');
const { irToGgb } = require('../src/ggb');

const args = process.argv.slice(2);
const root = path.resolve(args[0] || '.');
const valueAfter = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const outdir = valueAfter('--outdir');
const jsonFile = valueAfter('--json');
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.gsp$/i.test(e.name)) files.push(p);
  }
}
walk(root);

const report = [];
let ok = 0, fail = 0, objects = 0, emitted = 0, warnings = 0;
for (let i = 0; i < files.length; i++) {
  const f = files[i];
  try {
    const ir = gspToIR(fs.readFileSync(f));
    const r = irToGgb(ir);
    const rel = path.relative(root, f).replace(/\.gsp$/i, '.ggb');
    if (outdir) {
      const dst = path.join(path.resolve(outdir), rel);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.writeFileSync(dst, r.buf);
    }
    ok++; objects += ir.objects.length; emitted += r.stats.planned; warnings += r.warnings.length;
    report.push({ file: path.relative(root, f), ok: true, objects: ir.objects.length,
      emitted: r.stats.planned, warnings: r.warnings.length });
  } catch (e) {
    fail++;
    report.push({ file: path.relative(root, f), ok: false, error: e.message });
  }
  if ((i + 1) % 100 === 0) process.stderr.write(`processed ${i + 1}/${files.length}\n`);
}
const summary = { root, files: files.length, ok, fail, objects, emitted, skipped: objects - emitted,
  warnings, emitRate: objects ? emitted / objects : 0 };
console.log(JSON.stringify(summary, null, 2));
if (jsonFile) fs.writeFileSync(jsonFile, JSON.stringify({ summary, files: report }, null, 2));
if (fail) process.exitCode = 1;
