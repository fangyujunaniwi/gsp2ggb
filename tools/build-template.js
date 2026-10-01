// Build a template library of real GSP object record-blocks per type (for ir2gsp cloning)
// plus header/tail records from a clean normal sample.
// usage: node build-template.js
const fs = require('fs');
const path = require('path');
const { parseRecords } = require('../src/gsp.js');

const out = { header: null, tail: null, skels: {} };
let files = 0, objs = 0;

function sig(recs) {
  const has = t => recs.some(r => r.tag === t);
  return (has(2201) ? 'P' : '-') + (has(2002) ? '2' : '-') + (has(2003) ? '3' : '-') +
    (has(2005) ? 'L' : '-') + (has(2311) ? 'F' : '-') + (has(2310) ? 'G' : '-') +
    (has(2309) ? '9' : '-') + (has(2307) ? '7' : '-') + (has(2308) ? '8' : '-') +
    (has(2306) ? '6' : '-') + (has(2211) ? 'E' : '-');
}

function processFile(buf) {
  const recs = parseRecords(buf);
  const sectioned = recs.some(r => r.tag === 1100);
  const first = recs.findIndex(r => r.tag === 2000);
  const lastTag = recs.map(r => r.tag).lastIndexOf(2007);
  if (first < 0 || lastTag < 0) return;
  if (!out.header && !sectioned) {
    out.header = recs.slice(0, first).map(r => ({ tag: r.tag, pay: r.pay.toString('hex') }));
    out.tail = recs.slice(lastTag + 1).map(r => ({ tag: r.tag, pay: r.pay.toString('hex') }));
  }
  let cur = null;
  for (let i = first; i < recs.length; i++) {
    const r = recs[i];
    if (r.tag === 2000) { cur = { type: r.pay.readUInt16LE(0), recs: [{ tag: 2000, pay: r.pay.toString('hex') }] }; continue; }
    if (!cur) continue;
    if (r.tag !== 1300) cur.recs.push({ tag: r.tag, pay: r.pay.toString('hex') });
    if (r.tag === 2007) {
      objs++;
      const v = sig(cur.recs);
      const key = cur.type + ':' + v;
      if (!out.skels[key]) out.skels[key] = { type: cur.type, variant: v, recs: cur.recs };
      cur = null;
    }
  }
  files++;
}

function walk(d, depth) {
  if (depth > 6) return;
  let ents;
  try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
  for (const e of ents) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else if (/\.gsp$/i.test(e.name)) {
      try { processFile(fs.readFileSync(p)); } catch (err) { /* skip unparsable */ }
    }
  }
}

// Header/tail MUST come from a clean, simple, known-good file.
try { processFile(fs.readFileSync('C:/Users/Admin/Desktop/未命名1.gsp')); } catch (e) {}
walk((process.env.GSP_SAMPLES || 'D:/Sketchpad5/Samples'), 0);
walk((process.env.GSP_TOOLS || 'D:/Sketchpad5/Tool Folder'), 0);
if (!out.header) {
  out.header = [{ tag: 903, pay: '' }];
  out.tail = [];
}
fs.writeFileSync(path.join(__dirname, '..', 'src', 'gsp-template.json'), JSON.stringify(out));
const types = [...new Set(Object.keys(out.skels).map(k => k.split(':')[0]))].map(Number).sort((a, b) => a - b);
console.log('files=' + files + ' objects=' + objs + ' skeletons=' + Object.keys(out.skels).length);
console.log('types=' + types.join(','));
console.log('header recs=' + out.header.length + ' tail recs=' + out.tail.length);
