const fs = require('fs');

function chain(b, start) {
  let p = start, n = 0;
  while (p + 8 <= b.length) {
    const len = b.readUInt32LE(p);
    if (len > b.length) return { p, n, why: 'len>filesize len=' + len };
    if (p + 8 + len > b.length) return { p, n, why: 'overruns eof len=' + len };
    n++;
    p += 8 + len;
  }
  if (p === b.length) return { p, n, why: 'EOF-EXACT' };
  return { p, n, why: 'trailing ' + (b.length - p) + ' bytes' };
}

const file = process.argv[2];
const b = fs.readFileSync(file);
console.log('file=' + file + ' len=' + b.length);
const results = [];
for (let o = 0; o <= 0x200; o++) {
  const r = chain(b, o);
  results.push([r.n, o, r.why, r.p]);
}
results.sort((x, y) => y[0] - x[0]);
for (const [n, o, why, p] of results.slice(0, 12)) {
  console.log('start=0x' + o.toString(16) + '  records=' + n + '  end=0x' + p.toString(16) + '  ' + why);
}
