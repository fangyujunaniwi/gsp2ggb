#!/usr/bin/env node
// gsp-conv CLI — bidirectional The Geometer's Sketchpad (.gsp) <-> GeoGebra (.ggb).
//
//   node cli.js input.gsp                     -> input.ggb
//   node cli.js input.gsp -o out.ggb
//   node cli.js input.ggb                     -> input.gsp
//   node cli.js <dir> --outdir <dir>          -> batch convert every .gsp/.ggb
//   node cli.js input.gsp --to gsp            -> force direction
//   --quiet   only print errors
'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp.js');
const { irToGgb, ggbToIR } = require('../src/ggb.js');

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '-o' || t === '--out' || t === '--outdir') { a[t.replace(/^-+/, '')] = argv[++i]; }
    else if (t === '--to') { a.to = argv[++i]; }
    else if (t === '--quiet' || t === '-q') { a.quiet = true; }
    else if (t === '--json') { a.json = true; }
    else if (t === '-h' || t === '--help') { a.help = true; }
    else a._.push(t);
  }
  return a;
}

function convertBuffer(buf, inExt, to) {
  const dir = to || (inExt === '.gsp' ? 'ggb' : 'gsp');
  if (dir === 'ggb') {
    const ir = gspToIR(buf);
    const r = irToGgb(ir);
    return { dir: 'gsp -> ggb', out: r.buf, ir, warnings: r.warnings, total: ir.objects.length, emitted: r.stats.planned, xml: r.xml };
  }
  const { irToGsp } = require('../src/ir2gsp.js');
  const ir = ggbToIR(buf);
  const r = irToGsp(ir);
  return { dir: 'ggb -> gsp', out: r.buf, ir, warnings: r.warnings, total: ir.objects.length, emitted: r.stats.planned };
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.help || !a._.length) {
    console.log('usage: node cli.js <input.gsp|input.ggb|dir> [-o out] [--outdir dir] [--to ggb|gsp] [-q]');
    return;
  }
  const input = a._[0];
  const st = fs.statSync(input);
  const jobs = [];
  if (st.isDirectory()) {
    const outdir = a.outdir || a.out || a.o || path.join(input, 'converted');
    fs.mkdirSync(outdir, { recursive: true });
    for (const f of fs.readdirSync(input)) {
      const e = path.extname(f).toLowerCase();
      if (e === '.gsp' || e === '.ggb') jobs.push({ in: path.join(input, f), out: path.join(outdir, f.replace(/\.(gsp|ggb)$/i, e === '.gsp' ? '.ggb' : '.gsp')) });
    }
    console.log('batch: ' + jobs.length + ' file(s) -> ' + outdir);
  } else {
    const e = path.extname(input).toLowerCase();
    const def = a.to ? (a.to === 'ggb' ? '.ggb' : '.gsp') : (e === '.gsp' ? '.ggb' : '.gsp');
    const out = a.out || a.o || input.replace(/\.(gsp|ggb)$/i, def);
    jobs.push({ in: input, out });
  }

  let ok = 0, fail = 0;
  const report = [];
  for (const j of jobs) {
    try {
      const r = convertBuffer(fs.readFileSync(j.in), path.extname(j.in).toLowerCase(), a.to);
      fs.writeFileSync(j.out, r.out);
      ok++;
      const skipped = r.warnings.filter(w => /^skip /.test(w)).length;
      report.push({ in: j.in, out: j.out, dir: r.dir, objects: r.total, emitted: r.emitted, skipped });
      if (!a.quiet) {
        console.log((fail + ok) + ') ' + path.basename(j.in) + ' [' + r.dir + '] objects=' + r.total +
          ' emitted=' + r.emitted + ' skipped/warn=' + r.warnings.length);
        if (!a.json) r.warnings.slice(0, 8).forEach(w => console.log('     - ' + w));
        if (!a.json && r.warnings.length > 8) console.log('     ... +' + (r.warnings.length - 8) + ' more');
      }
    } catch (e) {
      fail++;
      console.log('FAIL ' + path.basename(j.in) + ': ' + e.message);
    }
  }
  console.log('\ndone: ' + ok + ' ok, ' + fail + ' failed' + (jobs.length > 1 ? ' of ' + jobs.length : ''));
  if (a.json) console.log(JSON.stringify(report, null, 2));
}
main();
