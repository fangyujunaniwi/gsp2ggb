// Extract and parse the JavaSketchpad `Construction` text from an exported
// Sketchpad web page (.htm/.html).  Also accepts a plain text file that is
// already just the construction string.
//
// usage:
//   node tools/jspextract.js page.htm                 -> human summary
//   node tools/jspextract.js page.htm --json          -> JSON IR to stdout
//   node tools/jspextract.js page.htm --out out.json  -> write JSON to file
//   node tools/jspextract.js page.htm --raw           -> do not HTML-decode
//   node tools/jspextract.js page.htm -q              -> suppress summary header
'use strict';
const fs = require('fs');
const path = require('path');
const { extractConstruction, parseConstruction } = require('../src/jsp');

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('-'));
const flag = (n) => args.includes(n);
const optVal = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

if (!file) {
  console.error('usage: node tools/jspextract.js <page.htm|construction.txt> [--json] [--out f] [--raw] [-q]');
  process.exit(2);
}

const raw = fs.readFileSync(file);
// GSP exports the page as GBK on Chinese systems; fall back to utf8.
let text = raw.toString('utf8');
if (/[\uFFFD]/.test(text)) {
  try { text = new TextDecoder('gbk').decode(raw); } catch { /* keep utf8 */ }
}

let construction = extractConstruction(text);
let fromHtml = true;
if (construction == null || construction.trim() === '') {
  // not an HTML export: assume the whole file is the construction
  construction = text;
  fromHtml = false;
}
if (flag('--raw')) {
  // extractConstruction already decoded; re-extract without decoding if asked
  const m = text.match(/value\s*=\s*(["'])([\s\S]*?)\1/i);
  if (fromHtml && m) construction = m[2];
}

const ir = parseConstruction(construction);

if (flag('--json') || optVal('--out')) {
  const out = {
    source: fromHtml ? 'jsp-html' : 'jsp-text',
    file: path.resolve(file),
    objectCount: ir.objects.length,
    objects: ir.objects,
    warnings: ir.warnings
  };
  const json = JSON.stringify(out, null, 2);
  const outFile = optVal('--out');
  if (outFile) { fs.writeFileSync(outFile, json); if (!flag('-q')) console.log('wrote ' + outFile); }
  else console.log(json);
} else {
  if (!flag('-q')) {
    console.log('== ' + file + '  (' + (fromHtml ? 'html Construction param' : 'raw construction') + ')');
    console.log('objects=' + ir.objects.length + ' warnings=' + ir.warnings.length);
  }
  for (const o of ir.objects) {
    let line = '#' + o.index + (o.marker && o.marker !== o.index ? '(m' + o.marker + ')' : '') + ' ' + o.spec;
    if (o.variant && typeof o.variant === 'string') line += ' ' + o.variant;
    if (o.measureType != null) line += ' <m' + o.measureType + '>';
    if (o.parents.length) line += ' par=[' + o.parents.join(',') + ']';
    if (o.doubles.length) line += ' d=[' + o.doubles.map(x => (typeof x === 'number' ? +x.toFixed(4) : x)).join(',') + ']';
    if (o.strings.length) line += ' s=' + JSON.stringify(o.strings.map(s => s.length > 60 ? s.slice(0, 57) + '...' : s));
    if (o.format) line += ' ' + JSON.stringify(o.format.map(a => a.name));
    console.log(line);
  }
  ir.warnings.forEach(w => console.log('  W ' + w));
}
