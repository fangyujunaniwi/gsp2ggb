#!/usr/bin/env node
'use strict';
// gsp-conv TUI — a terminal UI built from Node's built-ins only (readline + ANSI).
// No third-party dependencies, matching the project constraint.
//
//   node bin/tui.js            interactive full-screen UI (TTY)
//   node bin/tui.js --help     usage
//
// When stdin/stdout are not a TTY (pipes, CI, redirected input) it falls back to a
// line-based numbered menu, so the same flows can be scripted.
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const { convertBuffer, convertManyToGsp } = require('../src/convert.js');
const U = require('../src/tui-util.js');

// --- colours -----------------------------------------------------------------
const useColor = !!process.stdout.isTTY && !process.env.NO_COLOR;
const S = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', rev: '\x1b[7m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
};
function st(text, ...codes) {
  if (!useColor) return text;
  return codes.map(c => S[c]).join('') + text + S.reset;
}

// --- state -------------------------------------------------------------------
const state = {
  screen: 'menu',          // menu | browse | running | report | warnings | help
  menuCursor: 0,
  to: 'auto',              // auto | ggb | gsp
  outMode: 'alongside',    // alongside | custom
  outDir: '',
  browse: { mode: 'file', dir: process.cwd(), entries: [], index: 0, error: null },
  jobs: [],
  results: [],
  repScroll: 0,
  message: '',
};

const MENU = [
  { key: 'file', label: () => '转换一个文件…' },
  { key: 'folder', label: () => '批量转换一个文件夹…' },
  { key: 'merge', label: () => '合并文件夹内 .ggb → 多页 .gsp…' },
  { key: 'dir', label: () => '方向：' + U.directionLabel(state.to) },
  { key: 'out', label: () => '输出：' + (state.outMode === 'alongside' ? '源文件旁' : (state.outDir || '（未选择）')) },
  { key: 'report', label: () => '查看上次报告' + (state.results.length ? '（' + state.results.length + ' 个文件）' : '') },
  { key: 'help', label: () => '帮助' },
  { key: 'quit', label: () => '退出' },
];

// --- rendering ---------------------------------------------------------------
function render() {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 24;
  const lines = buildScreen(cols, rows);
  let buf = '\x1b[?25l\x1b[H';
  for (let i = 0; i < rows; i++) {
    buf += '\x1b[2K' + U.clipLine(lines[i] || '', cols);
    if (i < rows - 1) buf += '\n';
  }
  process.stdout.write(buf);
}

function buildScreen(cols, rows) {
  let lines;
  if (state.screen === 'menu') lines = buildMenu(cols, rows);
  else if (state.screen === 'browse') lines = buildBrowse(cols, rows);
  else if (state.screen === 'running') lines = buildRunning(cols, rows);
  else if (state.screen === 'report') lines = buildReport(cols, rows, false);
  else if (state.screen === 'warnings') lines = buildReport(cols, rows, true);
  else lines = buildHelp(cols, rows);
  while (lines.length < rows) lines.push('');
  return lines.slice(0, rows);
}

function header(title, cols) {
  return [st(' gsp-conv · ' + title, 'bold', 'cyan'), ''];
}

function buildMenu(cols, rows) {
  const lines = header('几何画板 ⇄ GeoGebra', cols);
  lines.push(st('   方向 ' + U.directionLabel(state.to) + '   ·   输出 ' +
    (state.outMode === 'alongside' ? '源文件旁' : (state.outDir || '未选择')), 'dim'));
  lines.push('');
  const inner = Math.min(cols - 2, 56);
  MENU.forEach((m, i) => {
    const raw = (i === state.menuCursor ? ' ❯ ' : '   ') + m.label();
    lines.push(i === state.menuCursor ? st(U.pad(raw, inner), 'rev') : ' ' + U.truncate(raw, inner));
  });
  lines.push('');
  if (state.message) lines.push(st(' ' + state.message, 'yellow'));
  lines.push(st(' ↑↓ 移动   Enter 选择   q 退出', 'dim'));
  return lines;
}

function browseTitle(mode) {
  return mode === 'file' ? '选择一个 .gsp / .ggb 文件' :
    mode === 'folder' ? '选择要批量转换的文件夹' :
    mode === 'mergedir' ? '选择要合并的 .ggb 文件夹' : '选择输出文件夹';
}

function buildBrowse(cols, rows) {
  const b = state.browse;
  const lines = header(browseTitle(b.mode), cols);
  lines.push(st(' ' + U.truncate(b.dir, cols - 2), 'dim'));
  lines.push('');
  const height = Math.max(1, rows - 7);
  const inner = cols - 2;
  if (b.error) {
    lines.push(st('  无法读取目录：' + b.error, 'red'));
  } else if (!b.entries.length) {
    lines.push(st('  （空目录）', 'dim'));
  } else {
    const [s0, s1] = U.windowRange(b.entries.length, b.index, height);
    for (let i = s0; i < s1; i++) {
      const e = b.entries[i];
      const right = e.isDir ? '' : U.formatSize(e.size);
      let label = '  ' + e.name + (e.isDir ? '/' : '');
      label = U.pad(label, Math.max(1, inner - right.length)) + right;
      label = U.truncate(label, inner);
      if (i === b.index) lines.push(st(label, 'rev'));
      else if (e.isDir) lines.push(st(label, 'blue'));
      else if (e.convertible) lines.push(label);
      else lines.push(st(label, 'dim'));
    }
  }
  lines.push('');
  lines.push(st(b.mode === 'file'
    ? ' ↑↓ 移动   Enter 进入目录或选择文件   Backspace 上一级   Esc 取消'
    : ' ↑↓ 移动   Enter 进入目录   Space 选择当前目录   Backspace 上一级   Esc 取消', 'dim'));
  return lines;
}

function buildRunning(cols, rows) {
  const lines = header('转换中…', cols);
  lines.push('');
  const total = state.jobs.length;
  const idx = Number.isInteger(state.jobIndex) && state.jobIndex >= 0 && state.jobIndex < total ? state.jobIndex : 0;
  const cur = total ? state.jobs[idx] : null;
  lines.push('  ' + (cur ? (idx + 1) + ' / ' + total + '：' + U.truncate(path.basename(cur.in), Math.max(1, cols - 20)) : ''));
  lines.push('');
  for (let i = 0; i < state.results.length && i < rows - 6; i++) {
    const r = state.results[i];
    lines.push('  ' + (r.ok ? st('✓', 'green') : st('✗', 'red')) + ' ' + U.truncate(path.basename(r.in), Math.max(1, cols - 6)));
  }
  return lines;
}

function resultSummary() {
  const ok = state.results.filter(r => r.ok).length;
  const fail = state.results.length - ok;
  const objects = state.results.reduce((s, r) => s + (r.objects || 0), 0);
  const emitted = state.results.reduce((s, r) => s + (r.emitted || 0), 0);
  const warns = state.results.reduce((s, r) => s + r.warnings.length, 0);
  return { ok, fail, objects, emitted, warns };
}

function buildReport(cols, rows, warningsOnly) {
  const s = resultSummary();
  const lines = header(warningsOnly ? '警告明细' : '转换报告', cols);
  lines.push('  成功 ' + st(String(s.ok), 'green') + '   失败 ' + st(String(s.fail), s.fail ? 'red' : 'dim') +
    '   对象 ' + s.objects + '（发射 ' + s.emitted + '）   警告 ' + s.warns);
  lines.push('');
  const body = [];
  if (warningsOnly) {
    state.results.forEach(r => {
      r.warnings.forEach(w => body.push(st('  [' + path.basename(r.in) + '] ', 'dim') + w));
      if (r.error) body.push(st('  [' + path.basename(r.in) + '] ERROR ' + r.error, 'red'));
    });
    if (!body.length) body.push(st('  （无警告）', 'dim'));
  } else {
    state.results.forEach(r => {
      const tag = r.ok ? st('  ✓ ', 'green') : st('  ✗ ', 'red');
      body.push(tag + U.truncate(path.basename(r.in), cols - 10) +
        st('  ' + (r.dir || r.error || '') + (r.ok
          ? '  objects=' + r.objects + ' emitted=' + r.emitted + (r.pages ? ' pages=' + r.pages : '')
          : ''), 'dim'));
      r.warnings.slice(0, 3).forEach(w => body.push(st('      - ' + U.truncate(w, cols - 9), 'dim')));
      if (r.warnings.length > 3) body.push(st('      … +' + (r.warnings.length - 3) + ' 条', 'dim'));
    });
    if (!body.length) body.push(st('  （还没有转换）', 'dim'));
  }
  const height = Math.max(1, rows - 6);
  const max = Math.max(0, body.length - height);
  if (state.repScroll > max) state.repScroll = max;
  if (state.repScroll < 0) state.repScroll = 0;
  for (let i = 0; i < height; i++) lines.push(body[state.repScroll + i] || '');
  lines.push('');
  const shownTo = Math.min(body.length, state.repScroll + height);
  const scrollInfo = body.length > height ? (' ' + (state.repScroll + 1) + '-' + shownTo + '/' + body.length + '   ') : ' ';
  lines.push(st(scrollInfo + (warningsOnly ? '↑↓/PgUp/PgDn 滚动   Esc 返回'
    : '↑↓/PgUp/PgDn 滚动   w 警告明细   o 打开输出目录   Esc 返回'), 'dim'));
  return lines;
}

function buildHelp(cols, rows) {
  const lines = header('帮助', cols);
  const help = [
    '  这是一个纯 Node（无第三方依赖）的终端界面，封面：',
    '',
    '  • 转换一个文件     选择 .gsp 或 .ggb，自动决定方向（可用「方向」强制）。',
    '  • 批量转换文件夹   目录内所有 .gsp/.ggb 一起转换；输出默认到 <目录>/converted。',
    '  • 合并            把一个文件夹里的多个 .ggb 合成一个多页 .gsp（每文件一页）。',
    '  • 方向             自动 / GSP → GGB / GGB → GSP。',
    '  • 输出             源文件旁，或自选一个输出目录。多页 .gsp 会每页导出一个 .ggb（同名文件夹内）。',
    '',
    '  文件浏览：↑↓ 移动、Home/End 首尾、Enter 进入目录、Backspace 上一级；',
    '            文件模式下 Enter 选择文件；文件夹/合并/输出模式下 Space 选择当前目录。',
    '  报告页：↑↓/PgUp/PgDn 滚动、w 查看警告明细、o 在资源管理器中打开输出目录。',
    '',
    '  非交互（管道/CI）时会退化为逐行编号菜单，同样可脚本化。',
    '  命令行等价用法见 bin/cli.js 或 README。',
  ];
  help.forEach(h => lines.push(h));
  lines.push('');
  lines.push(st(' Esc / Enter 返回', 'dim'));
  return lines;
}

// --- actions -----------------------------------------------------------------
function flash(msg) { state.message = msg; }

function startBrowse(mode) {
  state.screen = 'browse';
  state.browse.mode = mode;
  loadDir(state.browse.dir);
}

function loadDir(dir) {
  const r = U.listDir(dir);
  state.browse.dir = dir;
  state.browse.entries = r.entries;
  state.browse.error = r.error;
  state.browse.index = 0;
}

function enterDir(name) {
  loadDir(path.join(state.browse.dir, name));
}

function makeJobs(sel) {
  if (sel.kind === 'file') {
    const out = state.outMode === 'custom' && state.outDir
      ? path.join(state.outDir, path.basename(U.defaultOutPath(sel.path, state.to)))
      : U.defaultOutPath(sel.path, state.to);
    return [{ in: sel.path, out }];
  }
  const outDir = state.outMode === 'custom' && state.outDir ? state.outDir : path.join(sel.path, 'converted');
  return U.planBatch(sel.path, outDir, state.to);
}

function runOne(job) {
  const rec = { in: job.in, out: job.out, ok: false, error: null, dir: '', objects: 0, emitted: 0, warnings: [] };
  try {
    const buf = fs.readFileSync(job.in);
    const r = convertBuffer(buf, path.extname(job.in).toLowerCase(), state.to === 'auto' ? undefined : state.to);
    if (r.pages && r.pages.length > 1) {
      // multi-page .gsp -> one .ggb per page, in a folder next to the source
      const folder = job.out.replace(/\.(gsp|ggb)$/i, '');
      fs.mkdirSync(folder, { recursive: true });
      const used = new Set();
      for (const p of r.pages) {
        let base = String(p.name || 'page').replace(/[\\/:*?"<>|]/g, '_').trim() || 'page';
        let nm = base;
        for (let k = 2; used.has(nm); k++) nm = base + '_' + k;
        used.add(nm);
        fs.writeFileSync(path.join(folder, nm + '.ggb'), p.buf);
      }
      rec.ok = true; rec.dir = r.dir; rec.objects = r.total; rec.emitted = r.emitted;
      rec.pages = r.pages.length; rec.outFolder = folder; rec.warnings = r.warnings;
      return rec;
    }
    fs.mkdirSync(path.dirname(job.out), { recursive: true });
    fs.writeFileSync(job.out, r.out);
    rec.ok = true; rec.dir = r.dir; rec.objects = r.total; rec.emitted = r.emitted; rec.warnings = r.warnings;
  } catch (e) {
    rec.error = e.message;
  }
  return rec;
}

// Combine every .ggb in a folder into one multi-page .gsp (see cli.js --merge).
function runMerge(inDir, outFile) {
  const rec = { in: inDir, out: outFile, ok: false, error: null, dir: 'ggb → gsp（多页）', objects: 0, emitted: 0, warnings: [] };
  try {
    const names = fs.readdirSync(inDir).filter(f => /\.ggb$/i.test(f)).sort();
    if (!names.length) throw new Error('该目录下没有 .ggb 文件');
    const items = names.map(f => ({ buf: fs.readFileSync(path.join(inDir, f)), name: path.basename(f, path.extname(f)) }));
    const r = convertManyToGsp(items);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, r.out);
    rec.ok = true; rec.objects = r.total; rec.emitted = r.emitted;
    rec.pages = r.pages; rec.warnings = r.warnings;
  } catch (e) { rec.error = e.message; }
  return rec;
}

function startJobs(jobs) {
  if (!jobs.length) { flash('该目录下没有 .gsp/.ggb 文件'); state.screen = 'menu'; return; }
  state.jobs = jobs;
  state.results = [];
  state.jobIndex = 0;
  state.screen = 'running';
  render();
  for (let i = 0; i < jobs.length; i++) {
    state.jobIndex = i;
    render();
    state.results.push(runOne(jobs[i]));
  }
  state.repScroll = 0;
  state.screen = 'report';
  render();
}

function runSelection(sel) {
  state.message = '';
  if (sel.kind === 'merge') {
    const outDir = state.outMode === 'custom' && state.outDir ? state.outDir : path.dirname(sel.path);
    const outFile = path.join(outDir, path.basename(sel.path) + '.gsp');
    state.results = [runMerge(sel.path, outFile)];
    state.repScroll = 0;
    state.screen = 'report';
    return render();
  }
  startJobs(makeJobs(sel));
}

function openOutputDir() {
  const dirs = state.results.filter(r => r.ok).map(r => path.dirname(r.out));
  const dir = dirs[dirs.length - 1];
  if (!dir) { flash('还没有输出目录'); return; }
  const cmd = process.platform === 'win32' ? 'explorer' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  try { spawn(cmd, [dir], { detached: true, stdio: 'ignore' }).unref(); }
  catch (e) { flash('打开失败：' + e.message); }
}

// --- key handling ------------------------------------------------------------
function onKey(str, key) {
  if (!key) return;
  if (key.ctrl && key.name === 'c') return quit();
  const name = key.name;
  if (state.screen === 'menu') return onMenuKey(name);
  if (state.screen === 'browse') return onBrowseKey(name);
  if (state.screen === 'running') return; // ignore during conversion
  if (state.screen === 'report' || state.screen === 'warnings') return onReportKey(name);
  if (state.screen === 'help') { if (name === 'escape' || name === 'return' || name === 'q') { state.screen = 'menu'; render(); } return; }
}

function onMenuKey(name) {
  if (name === 'up' || name === 'k') state.menuCursor = (state.menuCursor - 1 + MENU.length) % MENU.length;
  else if (name === 'down' || name === 'j') state.menuCursor = (state.menuCursor + 1) % MENU.length;
  else if (name === 'return' || name === 'space') {
    const it = MENU[state.menuCursor];
    state.message = '';
    if (it.key === 'file') startBrowse('file');
    else if (it.key === 'folder') startBrowse('folder');
    else if (it.key === 'merge') startBrowse('mergedir');
    else if (it.key === 'dir') state.to = U.nextDirection(state.to);
    else if (it.key === 'out') {
      if (state.outMode === 'alongside') { state.outMode = 'custom'; startBrowse('outdir'); }
      else state.outMode = 'alongside';
    } else if (it.key === 'report') { state.screen = 'report'; state.repScroll = 0; }
    else if (it.key === 'help') state.screen = 'help';
    else if (it.key === 'quit') return quit();
  } else if (name === 'q') return quit();
  render();
}

function onBrowseKey(name) {
  const b = state.browse;
  if (name === 'escape' || name === 'q') { state.screen = 'menu'; return render(); }
  if (name === 'up' || name === 'k') { if (b.entries.length) b.index = (b.index - 1 + b.entries.length) % b.entries.length; return render(); }
  if (name === 'down' || name === 'j') { if (b.entries.length) b.index = (b.index + 1) % b.entries.length; return render(); }
  if (name === 'home') { b.index = 0; return render(); }
  if (name === 'end') { if (b.entries.length) b.index = b.entries.length - 1; return render(); }
  if (name === 'backspace') { loadDir(U.parentDir(b.dir)); return render(); }
  if (name === 'space' && b.mode !== 'file') {
    if (b.mode === 'folder') return runSelection({ kind: 'folder', path: b.dir });
    if (b.mode === 'mergedir') return runSelection({ kind: 'merge', path: b.dir });
    state.outDir = b.dir; state.outMode = 'custom'; state.screen = 'menu'; return render();
  }
  if (name === 'return') {
    const e = b.entries[b.index];
    if (!e) return;
    if (e.isDir) return enterDir(e.name), render();
    if (b.mode === 'file' && e.convertible) return runSelection({ kind: 'file', path: path.join(b.dir, e.name) });
    if (b.mode !== 'file') { flash('请选择文件夹（对当前目录按 Space，或进入子目录）'); return render(); }
    flash('只能转换 .gsp / .ggb 文件');
    return render();
  }
  render();
}

function onReportKey(name) {
  if (name === 'escape') { state.screen = 'menu'; state.repScroll = 0; return render(); }
  if (name === 'up' || name === 'k') { state.repScroll--; return render(); }
  if (name === 'down' || name === 'j') { state.repScroll++; return render(); }
  if (name === 'home') { state.repScroll = 0; return render(); }
  if (name === 'end') { state.repScroll = 1e9; return render(); }
  if (name === 'pageup') { state.repScroll -= 10; return render(); }
  if (name === 'pagedown') { state.repScroll += 10; return render(); }
  if (name === 'w') { state.screen = state.screen === 'warnings' ? 'report' : 'warnings'; state.repScroll = 0; return render(); }
  if (name === 'o') { openOutputDir(); return render(); }
}

function quit() {
  try { if (process.stdin.isTTY) process.stdin.setRawMode(false); } catch (e) { /* ignore */ }
  process.stdout.write('\x1b[?25h\x1b[0m\x1b[2J\x1b[H');
  process.exit(0);
}

function startInteractive() {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('keypress', onKey);
  process.stdout.on('resize', render);
  process.on('exit', () => { try { process.stdout.write('\x1b[?25h\x1b[0m'); } catch (e) { /* ignore */ } });
  render();
}

// --- non-TTY fallback (line based, scriptable) -------------------------------
function stripQuotes(s) { return String(s || '').trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1'); }

function lineMode() {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  const lines = [];
  let closed = false;
  let wake = null;
  const poke = () => { if (wake) { const w = wake; wake = null; w(); } };
  rl.on('line', l => { lines.push(l); poke(); });
  rl.on('close', () => { closed = true; poke(); });
  // Queue every line, so piped input is never lost even though the stream can end
  // before the next question is asked.  Returns null at EOF.
  const ask = async q => {
    process.stdout.write(q);
    while (!lines.length && !closed) await new Promise(r => { wake = r; });
    if (!lines.length) return null;
    return stripQuotes(lines.shift());
  };
  (async () => {
    for (;;) {
      console.log('');
      console.log('gsp-conv TUI(非交互) 方向=' + U.directionLabel(state.to) +
        ' 输出=' + (state.outMode === 'alongside' ? '源文件旁' : (state.outDir || '未选择')));
      console.log('  1) 转换一个文件');
      console.log('  2) 批量转换一个文件夹');
      console.log('  3) 切换方向');
      console.log('  4) 设置输出目录');
      console.log('  5) 查看上次报告');
      console.log('  6) 合并 .ggb 文件夹 → 多页 .gsp');
      console.log('  0) 退出');
      const c = await ask('选择> ');
      if (c === null || c === '0' || c === 'q' || c === '') break;
      if (c === '3') { state.to = U.nextDirection(state.to); continue; }
      if (c === '4') { const d = await ask('输出目录> '); if (d === null) break; state.outDir = d; state.outMode = d ? 'custom' : 'alongside'; continue; }
      if (c === '5') { printReport(); continue; }
      if (c === '6') {
        const d = await ask('含 .ggb 的文件夹> ');
        if (d === null) break;
        if (!d || !fs.existsSync(d)) { console.log('路径不存在：' + d); continue; }
        const outDir = state.outMode === 'custom' && state.outDir ? state.outDir : path.dirname(d);
        const outFile = path.join(outDir, path.basename(d) + '.gsp');
        const rec = runMerge(d, outFile);
        state.results = [rec];
        console.log((rec.ok ? '  ok   ' : '  FAIL ') + path.basename(d) + ' -> ' + outFile +
          (rec.ok ? ' pages=' + rec.pages + ' emitted=' + rec.emitted : ': ' + rec.error));
        continue;
      }
      if (c === '1' || c === '2') {
        const p = await ask(c === '1' ? '文件路径> ' : '文件夹路径> ');
        if (p === null) break;
        if (!p) continue;
        if (!fs.existsSync(p)) { console.log('路径不存在：' + p); continue; }
        const jobs = makeJobs(c === '1' ? { kind: 'file', path: p } : { kind: 'folder', path: p });
        if (!jobs.length) { console.log('该目录下没有 .gsp/.ggb 文件'); continue; }
        state.results = [];
        jobs.forEach(j => {
          const rec = runOne(j);
          state.results.push(rec);
          console.log((rec.ok ? '  ok   ' : '  FAIL ') + path.basename(rec.in) +
            (rec.ok ? '  [' + rec.dir + '] objects=' + rec.objects + ' emitted=' + rec.emitted +
              ' warnings=' + rec.warnings.length + (rec.pages ? ' pages=' + rec.pages : '') : ': ' + rec.error));
        });
        printReport();
      }
    }
    rl.close();
    process.exit(0);
  })();
}

function printReport() {
  if (!state.results.length) { console.log('（还没有转换）'); return; }
  const s = resultSummary();
  console.log('报告：成功 ' + s.ok + ' 失败 ' + s.fail + ' 对象 ' + s.objects + ' 发射 ' + s.emitted + ' 警告 ' + s.warns);
  state.results.forEach(r => r.warnings.forEach(w => console.log('  [warn] ' + path.basename(r.in) + ' ' + w)));
}

function printHelp() {
  console.log('gsp-conv TUI — 纯 Node 终端界面');
  console.log('  node bin/tui.js          # 交互式界面（需要 TTY）');
  console.log('  node bin/tui.js --help   # 本帮助');
  console.log('  node bin/cli.js ...      # 命令行等价用法');
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('-h') || argv.includes('--help')) return printHelp();
  if (process.stdin.isTTY && process.stdout.isTTY) startInteractive();
  else lineMode();
}

if (require.main === module) main();

module.exports = { buildScreen, state, makeJobs, runOne, runMerge, MENU };
