// Minimal JVM .class constant-pool / member dumper (no external deps).
// usage: node tools/classdump.js <class file | dir> [--ints] [--strings] [--methods]
'use strict';
const fs = require('fs');
const path = require('path');

function readCP(buf) {
  let p = 8; // magic + minor + major
  const count = buf.readUInt16BE(p); p += 2;
  const cp = new Array(count);
  for (let i = 1; i < count; i++) {
    const tag = buf[p++];
    switch (tag) {
      case 1: { const len = buf.readUInt16BE(p); p += 2; cp[i] = { tag, utf8: buf.toString('utf8', p, p + len) }; p += len; break; }
      case 3: { cp[i] = { tag, int: buf.readInt32BE(p) }; p += 4; break; }
      case 4: { cp[i] = { tag, float: buf.readFloatBE(p) }; p += 4; break; }
      case 5: { cp[i] = { tag, long: buf.readBigInt64BE(p) }; p += 8; i++; break; }
      case 6: { cp[i] = { tag, double: buf.readDoubleBE(p) }; p += 8; i++; break; }
      case 7: case 8: case 16: case 19: case 20: { cp[i] = { tag, a: buf.readUInt16BE(p) }; p += 2; break; }
      case 9: case 10: case 11: case 12: case 17: case 18: { cp[i] = { tag, a: buf.readUInt16BE(p), b: buf.readUInt16BE(p + 2) }; p += 4; break; }
      case 15: { cp[i] = { tag, a: buf[p++], b: buf.readUInt16BE(p) }; p += 2; break; }
      default: throw new Error('bad cp tag ' + tag + ' at ' + (p - 1));
    }
  }
  return { cp, p };
}
function utf(cp, i) { const e = cp[i]; return e && e.tag === 1 ? e.utf8 : '?'; }

function dumpFile(file, opts) {
  const buf = fs.readFileSync(file);
  const { cp, p } = readCP(buf);
  let q = p;
  const access = buf.readUInt16BE(q); q += 2;
  const thisClass = buf.readUInt16BE(q); q += 2;
  const superClass = buf.readUInt16BE(q); q += 2;
  const ifcCount = buf.readUInt16BE(q); q += 2; q += ifcCount * 2;
  const name = utf(cp, cp[thisClass] ? cp[thisClass].a : 0);
  const superName = utf(cp, cp[superClass] ? cp[superClass].a : 0);
  console.log('==== ' + name + '  extends ' + superName + '  [' + path.basename(file) + ']');
  if (opts.ints) {
    const ints = [];
    for (let i = 1; i < cp.length; i++) if (cp[i] && cp[i].tag === 3) ints.push(cp[i].int);
    if (ints.length) console.log('  int-consts: ' + [...new Set(ints)].sort((a, b) => a - b).join(', '));
  }
  if (opts.strings) {
    const strs = [];
    for (let i = 1; i < cp.length; i++) if (cp[i] && cp[i].tag === 1) strs.push(cp[i].utf8.replace(/\n/g, '\\n'));
    console.log('  utf8: ' + [...new Set(strs)].join(' | '));
  }
  const fn = buf.readUInt16BE(q); q += 2;
  for (let i = 0; i < fn; i++) { q += 6; const ac = buf.readUInt16BE(q); q += 2; for (let j = 0; j < ac; j++) { q += 2; const l = buf.readUInt32BE(q); q += 4 + l; } }
  const mn = buf.readUInt16BE(q); q += 2;
  if (opts.methods) {
    console.log('  methods:');
    for (let i = 0; i < mn; i++) {
      const macc = buf.readUInt16BE(q); q += 2;
      const nm = utf(cp, buf.readUInt16BE(q)); q += 2;
      const de = utf(cp, buf.readUInt16BE(q)); q += 2;
      const ac = buf.readUInt16BE(q); q += 2;
      console.log('    ' + nm + ' ' + de + '');
      for (let j = 0; j < ac; j++) { q += 2; const l = buf.readUInt32BE(q); q += 4 + l; }
      void macc;
    }
  }
}

const args = process.argv.slice(2);
const target = args[0];
const opts = { ints: args.includes('--ints'), strings: args.includes('--strings'), methods: args.includes('--methods') };
if (!opts.ints && !opts.strings && !opts.methods) { opts.ints = opts.strings = opts.methods = true; }
const files = [];
const st = fs.statSync(target);
if (st.isDirectory()) {
  (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.class')) files.push(f); } })(target);
} else files.push(target);
for (const f of files) { try { dumpFile(f, opts); } catch (e) { console.log('!! ' + path.basename(f) + ': ' + e.message); } }
