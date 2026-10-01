// Scan ground-truth geogebra.xml files: list command names, element types, dump sample blocks.
const fs = require('fs');
const dir = 'C:/Users/Admin/AppData/Local/Temp/gspwork';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.xml') && !f.includes('defaults'));
const cmds = new Map(), types = new Set();
for (const f of files) {
  const x = fs.readFileSync(dir + '/' + f, 'utf8');
  for (const m of x.matchAll(/<command name="([^"]+)"/g)) cmds.set(m[1], (cmds.get(m[1]) || 0) + 1);
  for (const m of x.matchAll(/<element type="([^"]+)"/g)) types.add(m[1]);
}
console.log('COMMANDS: ' + [...cmds.entries()].sort().map(([k, v]) => k + '(' + v + ')').join(', '));
console.log('TYPES: ' + [...types].sort().join(', '));
// dump sample blocks of interesting element types
for (const f of files) {
  const x = fs.readFileSync(dir + '/' + f, 'utf8');
  for (const m of x.matchAll(/<element type="(function|text|expression|list|angle|boolean|numeric)"[^>]*>[\s\S]*?<\/element>/g)) {
    if (m[1] === 'numeric' && !/expression|formula|command/i.test(m[0])) continue;
    console.log('---- ' + f + ' [' + m[1] + ']:\n' + m[0].slice(0, 1000));
  }
}
