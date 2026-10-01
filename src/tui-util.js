'use strict';
// Pure-ish helpers for the terminal UI (bin/tui.js).  No third-party dependencies.
// Everything here is independently testable (see test/smoke.js).
const fs = require('fs');
const path = require('path');

const CONVERTIBLE_RE = /\.(gsp|ggb)$/i;
function isConvertible(name) { return CONVERTIBLE_RE.test(name); }
function fileExt(p) { return path.extname(p).toLowerCase(); }
function otherExt(ext) { return ext === '.gsp' ? '.ggb' : ext === '.ggb' ? '.gsp' : ext; }
function targetExt(ext, to) { return to === 'ggb' ? '.ggb' : to === 'gsp' ? '.gsp' : otherExt(ext); }

// Where a single converted file goes when no explicit dir is given.
function defaultOutPath(input, to) {
  return input.replace(/\.(gsp|ggb)$/i, targetExt(fileExt(input), to));
}

function formatSize(n) {
  if (!n) return '';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}

// Directory listing for the picker: directories first, then files, both alpha-sorted.
// Hidden entries (dotfiles such as .git) are omitted.
function listDir(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (e) { return { error: e.message, entries: [] }; }
  const out = [];
  for (const e of entries) {
    if (e.name[0] === '.') continue;
    let size = 0;
    if (e.isFile()) { try { size = fs.statSync(path.join(dir, e.name)).size; } catch (e) { /* ignore */ } }
    out.push({ name: e.name, isDir: e.isDirectory(), size, convertible: e.isFile() && isConvertible(e.name) });
  }
  out.sort((a, b) => a.isDir !== b.isDir ? (a.isDir ? -1 : 1) : a.name.localeCompare(b.name));
  return { error: null, entries: out };
}

// Jobs for a batch folder conversion.
function planBatch(inputDir, outDir, to) {
  const jobs = [];
  for (const name of fs.readdirSync(inputDir)) {
    if (!CONVERTIBLE_RE.test(name)) continue;
    jobs.push({
      in: path.join(inputDir, name),
      out: path.join(outDir, name.replace(/\.(gsp|ggb)$/i, targetExt(fileExt(name), to))),
    });
  }
  return jobs;
}

const DIRECTIONS = ['auto', 'ggb', 'gsp'];
function directionLabel(to) { return to === 'ggb' ? 'GSP → GGB' : to === 'gsp' ? 'GGB → GSP' : '自动'; }
function nextDirection(to) { return DIRECTIONS[(DIRECTIONS.indexOf(to) + 1) % DIRECTIONS.length]; }

// Visible slice [start,end) of a list of `count` items with `height` rows around `index`.
function windowRange(count, index, height) {
  if (height >= count || height <= 0) return [0, count];
  let start = index - Math.floor((height - 1) / 2);
  if (start < 0) start = 0;
  if (start + height > count) start = count - height;
  return [start, start + height];
}

// --- East-Asian display width (CJK counts as 2 columns) ---
function cpWidth(cp) {
  if (cp === 0x200B || (cp >= 0x0300 && cp <= 0x036F)) return 0; // zero-width / combining
  return (cp >= 0x1100 && cp <= 0x115F) ||
    (cp >= 0x2E80 && cp <= 0x303E) ||
    (cp >= 0x3041 && cp <= 0x33FF) ||
    (cp >= 0x3400 && cp <= 0x4DBF) ||
    (cp >= 0x4E00 && cp <= 0x9FFF) ||
    (cp >= 0xA000 && cp <= 0xA4CF) ||
    (cp >= 0xAC00 && cp <= 0xD7A3) ||
    (cp >= 0xF900 && cp <= 0xFAFF) ||
    (cp >= 0xFE30 && cp <= 0xFE4F) ||
    (cp >= 0xFF00 && cp <= 0xFF60) ||
    (cp >= 0xFFE0 && cp <= 0xFFE6) ||
    (cp >= 0x1F300 && cp <= 0x1FAFF) ||
    (cp >= 0x20000 && cp <= 0x3FFFD) ? 2 : 1;
}
function dispWidth(s) {
  let w = 0;
  for (const ch of String(s)) w += cpWidth(ch.codePointAt(0));
  return w;
}
const ANSI_RE = /\x1b\[[0-9;?]*[A-Za-z]/g;
function visibleWidth(s) { return dispWidth(String(s).replace(ANSI_RE, '')); }

// Truncate to `width` display columns, appending an ellipsis when cut.
function truncate(s, width) {
  s = String(s);
  if (width <= 0) return '';
  if (dispWidth(s) <= width) return s;
  let out = '', w = 0;
  for (const ch of s) {
    const cw = cpWidth(ch.codePointAt(0));
    if (w + cw > width - 1) break;
    out += ch; w += cw;
  }
  return out + '…';
}
// Left-pad/right-pad to exactly `width` display columns.
function pad(s, width) {
  s = String(s);
  const w = dispWidth(s);
  if (w > width) return truncate(s, width);
  return s + ' '.repeat(width - w);
}
// Clip a possibly ANSI-coloured line to `width` display columns (escape-aware).
function clipLine(s, width) {
  s = String(s);
  if (visibleWidth(s) <= width) return s;
  let out = '', w = 0, i = 0;
  while (i < s.length) {
    const m = /^\x1b\[[0-9;?]*[A-Za-z]/.exec(s.slice(i));
    if (m) { out += m[0]; i += m[0].length; continue; }
    const cp = s.codePointAt(i);
    const cw = cpWidth(cp);
    if (w + cw > width - 1) break;
    const ch = String.fromCodePoint(cp);
    out += ch; w += cw; i += ch.length;
  }
  return out + '…';
}

function parentDir(dir) { const p = path.dirname(dir); return p === dir ? dir : p; }

module.exports = {
  isConvertible, defaultOutPath, formatSize, listDir, planBatch,
  directionLabel, nextDirection, windowRange,
  dispWidth, visibleWidth, truncate, pad, clipLine, parentDir,
  DIRECTIONS,
};
