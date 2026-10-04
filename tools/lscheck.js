'use strict';
// Flag lowercase GeoGebra *command* names used in expression strings (commands are
// case-sensitive and must be Capitalized; lowercase math *functions* like sqrt/sin are fine).
const fs = require('fs');
const src = fs.readFileSync(process.argv[2] || 'src/ggb.js', 'utf8');
const cmds = ['angle', 'length', 'area', 'perimeter', 'radius', 'circumference', 'distance',
  'midpoint', 'segment', 'circle', 'line', 'ray', 'arc', 'intersect', 'translate', 'rotate',
  'dilate', 'reflect', 'polygon', 'vector', 'point', 'slope', 'element', 'sequence', 'iteration',
  'iterationlist', 'locus', 'tangent', 'normal', 'center', 'vertex', 'side', 'cross', 'dot',
  'unitvector', 'closestpoint', 'perpendicularline', 'anglebisector', 'derivative', 'integral',
  'product', 'append', 'insert', 'remove', 'first', 'last', 'take', 'reverse', 'sort', 'unique',
  'join', 'flatten', 'zip', 'map', 'curve', 'polar', 'conic', 'tool', 'min', 'max', 'if'];
const lines = src.split(/\r?\n/);
const hits = [];
for (let i = 0; i < lines.length; i++) {
  const code = lines[i].split('//')[0];
  for (const c of cmds) {
    const re = new RegExp("[^A-Za-z0-9_']" + c + '\\(');
    if (re.test(code)) { hits.push((i + 1) + ': ' + lines[i].trim()); break; }
  }
}
console.log('suspicious lowercase command calls: ' + hits.length);
for (const h of hits) console.log('  ' + h);
