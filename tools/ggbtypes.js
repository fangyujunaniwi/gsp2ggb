'use strict';
// List distinct <element type=...> across .ggb files, optionally dumping a type's XML.
const fs = require('fs');
const path = require('path');
const { unzip } = require('../src/zip');
const root = process.argv[2];
const want = process.argv[3] || null;
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.ggb$/i.test(e.name)) files.push(p); } })(root);
const types = new Map();
for (const f of files) {
  let xml; try { xml = unzip(fs.readFileSync(f)).get('geogebra.xml').toString('utf8'); } catch { continue; }
  for (const m of xml.matchAll(/<element\b([^>]*)>/g)) {
    const t = /type="([^"]*)"/.exec(m[1]);
    const ty = t ? t[1] : '?';
    types.set(ty, (types.get(ty) || 0) + 1);
    if (want && ty === want) {
      const i = m.index;
      const end = xml.indexOf('</element>', i);
      console.log('#### ' + path.basename(f));
      console.log(xml.slice(i, end + 10));
    }
  }
}
console.log('--- element types ---');
for (const [k, v] of [...types].sort((a, b) => b[1] - a[1])) console.log('  ' + k.padEnd(14) + v);
