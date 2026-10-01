'use strict';
const tpl = require('../src/gsp-template.json');
const byType = new Map();
for (const k of Object.keys(tpl.skels)) {
  const s = tpl.skels[k];
  if (!byType.has(s.type)) byType.set(s.type, []);
  byType.get(s.type).push(s.variant);
}
for (const t of (process.argv[2] || '8,34,37,41,36,87,2,63,16,27,30,15,5,6,7,3,4,1,9,11,12,13,14,65').split(',').map(Number)) {
  console.log('t' + t + ' (' + (byType.get(t) || []).length + '): ' + JSON.stringify((byType.get(t) || []).slice(0, 8)));
}
console.log('total skel types: ' + byType.size);
