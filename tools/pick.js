'use strict';
// Copy a few named corpus sketches to ASCII filenames for testing (avoids shell encoding issues).
const fs = require('fs'), path = require('path');
function walk(d, out) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p); } return out; }
const want = process.argv.slice(2);
const all = walk((process.env.GSP_DIR || 'D:\\Sketchpad5'), []);
let i = 0;
for (const w of want) {
  const hit = all.find(p => path.basename(p) === w);
  if (hit) { const dst = path.join('out', 'test' + i + '.gsp'); fs.copyFileSync(hit, dst); console.log(w + '  ->  ' + dst); i++; }
  else console.log(w + '  NOT FOUND');
}
