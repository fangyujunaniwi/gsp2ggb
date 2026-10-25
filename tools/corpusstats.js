'use strict';
// corpusstats.js — summarise out/corpus (manifest) and, if present, results.tsv failures.
const fs = require('fs');
const path = require('path');

const DIR = path.join('out', 'corpus');
const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));

let pages = 0, total = 0, planned = 0, warns = 0, skips = 0;
const cats = new Map();
function bump(k) { cats.set(k, (cats.get(k) || 0) + 1); }

for (const f of manifest) {
  for (const p of f.pages) {
    pages++; total += p.total; planned += p.planned; warns += p.warns; skips += p.skipWarns;
    for (const w of p.sampleWarns || []) {
      const m = w.match(/(?:^skip )?#\d+ (t\d+)(?: [a-z]+)?: (.*)$/s);
      if (!m) { bump('other: ' + w.slice(0, 60)); continue; }
      let reason = m[2];
      reason = reason.replace(/^[^:]{0,60}?: /, '');   // drop leading detail
      reason = reason.replace(/\d+(\.\d+)?/g, '#').slice(0, 70);
      bump(m[1] + '  ' + reason);
    }
  }
}

console.log('files=' + manifest.length + '  pages=' + pages + '  objects=' + total + '  planned=' + planned);
console.log('warnings=' + warns + '  skipWarnings=' + skips);
console.log('\n-- warning categories (sampled, first 6 per page) --');
[...cats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)
  .forEach(([k, v]) => console.log(String(v).padStart(4) + '  ' + k));

const resFile = path.join(DIR, 'results.tsv');
if (!fs.existsSync(resFile)) { console.log('\n(results.tsv not ready)'); process.exit(0); }

const byFile = new Map();
for (const f of manifest) for (const p of f.pages) {
  byFile.set(p.file.replace(/\\/g, '/').replace(/^out\/corpus\//, ''), { f, p });
}
let done = 0, bad = 0, missing = 0;
const badRows = [];
for (const line of fs.readFileSync(resFile, 'utf8').split(/\r?\n/)) {
  if (!line || /^n\t/.test(line)) continue;
  const c = line.split('\t');
  if (c.length < 4) continue;
  done++;
  const key = c[1].replace(/\\/g, '/');
  if (c[3] !== 'True') continue;
  bad++;
  const hit = byFile.get(key);
  badRows.push({ key, ok: c[2], rec: hit });
}
console.log('\n-- open check --');
console.log('checked=' + done + '  err=True=' + bad + '  rate=' + (done ? (100 * bad / done).toFixed(1) : '-') + '%');
for (const r of badRows) {
  const p = r.rec && r.rec.p, f = r.rec && r.rec.f;
  console.log('\nFAIL ' + r.key + (f ? '  (' + f.src + ')' : ''));
  if (p) console.log('  objects=' + p.total + ' planned=' + p.planned + ' warns=' + p.warns);
  if (p) for (const w of p.sampleWarns) console.log('   - ' + w.slice(0, 120));
}
