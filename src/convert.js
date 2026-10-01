'use strict';
// Shared conversion helpers — used by both the CLI (bin/cli.js) and the TUI (bin/tui.js).
// Kept dependency-free; the GSP writer is required lazily so a gsp->ggb run never loads it.
const { gspToIR } = require('./gsp.js');
const { irToGgb, ggbToIR } = require('./ggb.js');

// Convert an in-memory buffer.  `inExt` is '.gsp'/'.ggb'; `to` is 'ggb'|'gsp'|undefined.
function convertBuffer(buf, inExt, to) {
  const dir = to || (inExt === '.gsp' ? 'ggb' : 'gsp');
  if (dir === 'ggb') {
    const ir = gspToIR(buf);
    const r = irToGgb(ir);
    return { dir: 'gsp -> ggb', out: r.buf, ir, warnings: r.warnings, total: ir.objects.length, emitted: r.stats.planned, xml: r.xml };
  }
  const { irToGsp } = require('./ir2gsp.js');
  const ir = ggbToIR(buf);
  const r = irToGsp(ir);
  return { dir: 'ggb -> gsp', out: r.buf, ir, warnings: r.warnings, total: ir.objects.length, emitted: r.stats.planned };
}

module.exports = { convertBuffer };
