'use strict';
// Count perp/parallelLine (t5/t6) whose base parent is a circle.
const fs = require('fs'), path = require('path');
const { gspToIR } = require('../src/gsp');
const root = process.argv[2] || (process.env.GSP_DIR || 'D:\\Sketchpad5');
const CIRC = new Set(['circleOn', 'circleRadiusSeg', 'circleRadiusObj']);
const XFORM = new Set(['translateImage', 'rotateImage', 'dilateImage', 'reflectImage']);
function walk(dir, out) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, out); else if (/\.gsp$/i.test(e.name)) out.push(p); } return out; }
let tot = 0, circBase = 0, circXform = 0, segBase = 0, otherBase = 0;
const ex = [];
for (const f of walk(root, [])) {
  let ir; try { ir = gspToIR(fs.readFileSync(f)); } catch (e) { continue; }
  const byId = new Map(ir.objects.map(o => [o.id, o]));
  for (const o of ir.objects) {
    if (o.srcType !== 5 && o.srcType !== 6) continue;
    if (o.parents.length < 2) continue;
    tot++;
    const base = byId.get(o.parents[1]);
    if (!base) { otherBase++; continue; }
    if (CIRC.has(base.kind)) { circBase++; if (ex.length < 6) ex.push(f.replace(root, '') + ' t' + o.srcType + ' base=#' + base.id + '/' + base.kind); }
    else if (XFORM.has(base.kind)) {
      let c = base, g = 0; while (c && XFORM.has(c.kind) && g++ < 12) c = byId.get(c.parents[0]);
      if (c && CIRC.has(c.kind)) { circXform++; if (ex.length < 6) ex.push(f.replace(root, '') + ' t' + o.srcType + ' baseXform->' + c.kind); }
      else segBase++;
    } else if (base.kind === 'segment' || base.kind === 'line2pt' || base.kind === 'perpLine' || base.kind === 'parallelLine' || base.kind === 'angleBisector' || base.kind === 'axis') segBase++;
    else otherBase++;
  }
}
console.log('total t5/t6=' + tot + '  straightBase=' + segBase + '  circleBase=' + circBase + '  xformCircleBase=' + circXform + '  otherBase=' + otherBase);
ex.forEach(s => console.log('  ' + s));
