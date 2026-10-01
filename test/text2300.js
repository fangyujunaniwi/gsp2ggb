// Experiment: decode tag-2300 inline text payloads and try markup stripping.
'use strict';
const fs = require('fs');
const { gspToIR } = require('../src/gsp');

const file = process.argv[2];
const ids = (process.argv[3] || 'all').split(',');
const ir = gspToIR(fs.readFileSync(file));

function decode2300(pay) {
  const b = Buffer.from(pay);
  // skip 12-byte serialized header + 6-byte ids, text starts at 18
  let s = b.subarray(18).toString('utf8');
  s = s.split('\u0000')[0];              // markup+text is NUL-terminated
  const raw = s;

  // GSP rich-text markup: codes look like "<T23x" (text run, content follows until
  // the matching '>'), "<VL"/"<H"/"<SR1G1L100" (containers, followed by nested '<').
  // A code ends at the first 'x' (inclusive) or at the next '<'/'>'.
  let out = '', tags = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '<') {
      let j = i + 1, code = '<';
      while (j < s.length && s[j] !== '<' && s[j] !== '>') {
        code += s[j];
        if (s[j] === 'x') { j++; break; }
        j++;
      }
      tags.push(code);
      i = j - 1;
    } else if (c === '>') {
      // stray tag terminator
    } else {
      out += c;
    }
  }
  return { raw, tags, strip: out };
}

for (const o of ir.objects) {
  if (ids[0] !== 'all' && !ids.includes(String(o.id))) continue;
  const r = (o._raw.recs || []).find(x => x.tag === 2300);
  if (!r) continue;
  const d = decode2300(r.pay);
  console.log('===== #' + o.id + ' t' + o.srcType + ' lab=' + JSON.stringify(o.label));
  console.log('  raw  : ' + JSON.stringify(d.raw));
  console.log('  strip: ' + JSON.stringify(d.strip));
  console.log('  tags : ' + JSON.stringify(d.tags));
}
