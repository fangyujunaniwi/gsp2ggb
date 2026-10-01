// Scan a .gsp corpus for function(type 71)/plot(type 72) objects and dump their
// type-specific records (esp. tag 2311) as hex + doubles.
// usage: node scan7172.js [rootDir] [maxFiles]
'use strict';
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp.js');

const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
const maxFiles = parseInt(process.argv[3] || '400', 10);

function walk(dir, out) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.gsp$/i.test(e.name)) out.push(p);
  }
}

function hex(buf, max) {
  const n = Math.min(buf.length, max || 96);
  let s = '';
  for (let i = 0; i < n; i++) s += buf[i].toString(16).padStart(2, '0') + (i % 16 === 15 ? ' ' : '');
  return s + (buf.length > n ? ' ...(+' + (buf.length - n) + 'B)' : '');
}
function doubles(buf, off) {
  const out = [];
  for (let o = off || 0; o + 8 <= buf.length; o += 8) out.push(buf.readDoubleLE(o));
  return out;
}

const files = [];
walk(root, files);
console.log('found ' + files.length + ' .gsp files; scanning up to ' + maxFiles);

let hits = 0, parsed = 0, failed = 0;
const byType = {};
for (const f of files) {
  if (parsed + failed >= maxFiles) break;
  let ir;
  try { ir = gspToIR(fs.readFileSync(f)); parsed++; }
  catch (e) { failed++; continue; }
  const special = ir.objects.filter(o => o.srcType === 71 || o.srcType === 72);
  if (!special.length) continue;
  hits++;
  console.log('\n=== ' + f.replace(root, '') + '  (' + special.length + ' special) ===');
  for (const o of special) {
    byType[o.srcType] = (byType[o.srcType] || 0) + 1;
    const rich = (o._raw && o._raw.rich) || {};
    console.log('  #' + o.id + ' t' + o.srcType + ' label="' + o.label + '" parents=[' + o.parents + '] coords=' +
      (o.coords ? o.coords.x.toFixed(2) + ',' + o.coords.y.toFixed(2) : 'null') + ' params=[' + o.params.map(v => v.toFixed(4)).join(',') + ']');
    for (const k of Object.keys(rich).sort()) {
      const b = rich[k];
      console.log('      tag ' + k + ' (' + b.length + 'B) ' + hex(b));
      if (k === '2311') {
        console.log('        doubles@0:  ' + doubles(b, 0).map(v => v.toFixed(5)).join(', '));
        console.log('        doubles@8:  ' + doubles(b, 8).map(v => v.toFixed(5)).join(', '));
        console.log('        doubles@16: ' + doubles(b, 16).map(v => v.toFixed(5)).join(', '));
        console.log('        ascii: ' + JSON.stringify(b.toString('latin1')));
      }
    }
  }
  if (hits >= 12) break;
}
console.log('\n--- summary: parsed=' + parsed + ' failed=' + failed + ' filesWith71or72=' + hits +
  ' counts=' + JSON.stringify(byType));