'use strict';
// Extract every warning-producing string literal from src/ggb.js (and gsp.js).
const fs = require('fs');
for (const file of ['src/ggb.js', 'src/gsp.js']) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split(/\r?\n/);
  console.log('===== ' + file);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/warn:\s*'/.test(l) || /\bskip\(/.test(l) || /warnings\.push\(/.test(l) || /return skip\(/.test(l)) {
      // print the line with a marker
      console.log((i + 1) + ': ' + l.trim());
    }
  }
}
