'use strict';
// Shared conversion helpers — used by both the CLI (bin/cli.js) and the TUI (bin/tui.js).
// Kept dependency-free; the GSP writer is required lazily so a gsp->ggb run never loads it.
const { gspToIR } = require('./gsp.js');
const { irToGgb, irToGgbPages, ggbToIR } = require('./ggb.js');

// Convert an in-memory buffer.  `inExt` is '.gsp'/'.ggb'; `to` is 'ggb'|'gsp'|undefined.
// For a multi-page .gsp the gsp->ggb result carries `pages` = [{ name, buf, doc }] (one
// .ggb per sketch page); `out` is the first page for backward compatibility.
function convertBuffer(buf, inExt, to) {
  const dir = to || (inExt === '.gsp' ? 'ggb' : 'gsp');
  if (dir === 'ggb') {
    const ir = gspToIR(buf);
    if (ir.meta && ir.meta.sections && ir.meta.sections.length > 1) {
      const pages = irToGgbPages(ir);
      const first = pages[0] ? pages[0].doc : { warnings: [], stats: { planned: 0 }, xml: '', buf: Buffer.alloc(0) };
      return { dir: 'gsp -> ggb (multi-page)', pages, out: pages[0] ? pages[0].buf : first.buf, ir,
        warnings: first.warnings, total: ir.objects.length, emitted: first.stats.planned, xml: first.xml };
    }
    const r = irToGgb(ir);
    return { dir: 'gsp -> ggb', out: r.buf, ir, warnings: r.warnings, total: ir.objects.length, emitted: r.stats.planned, xml: r.xml };
  }
  const { irToGsp } = require('./ir2gsp.js');
  const ir = ggbToIR(buf);
  const r = irToGsp(ir);
  return { dir: 'ggb -> gsp', out: r.buf, ir, warnings: r.warnings, total: ir.objects.length, emitted: r.stats.planned };
}

// Combine several .ggb buffers into ONE multi-page .gsp (one section per input, in order).
// `items` = [{ buf, name }].
function convertManyToGsp(items) {
  const { irListToGsp } = require('./ir2gsp.js');
  const pages = items.map((it, i) => ({ ir: ggbToIR(it.buf), name: it.name || ('page' + (i + 1)) }));
  const r = irListToGsp(pages);
  return { dir: 'ggb -> gsp (multi-page)', out: r.buf, warnings: r.warnings,
    total: r.stats.total, emitted: r.stats.planned, pages: pages.length };
}

module.exports = { convertBuffer, convertManyToGsp };
