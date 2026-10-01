'use strict';
// Correlate JSP postfix token streams with the 2311 inorder code stream.
const fs = require('fs');
const path = require('path');
const { gspToIR } = require('../src/gsp');

// --- tokenize a JSP postfix expression string ---
function tokenize(s) {
  const toks = [];
  let i = 0;
  const pre = ['sin_', 'cos_', 'abs_', 'sqrt', 'ln__', 'rond', 'trnc', 'acos', 'asin', 'atan', 'log_', 'sgn_', 'tan_'];
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    if (c === 'x') { toks.push({ t: 15 }); i++; continue; }
    if (c >= 'A' && c <= 'Z') { toks.push({ t: 12, idx: c.charCodeAt(0) - 65 }); i++; continue; }
    if (c === '@' && s.startsWith('@f', i)) { toks.push({ t: 14, idx: s.charCodeAt(i + 2) - 65 }); i += 3; continue; }
    if (c === '@') {
      const sub = s.substr(i + 1, 4);
      const op = pre.indexOf(sub) + 1;
      toks.push({ t: 8, op }); i += 5; continue;
    }
    if ('+-*/^'.includes(c)) { toks.push({ t: '+-*/^'.indexOf(c) + 1 }); i++; continue; }
    if (c === '!') { toks.push({ t: 9 }); i++; continue; }
    if (c === '#') { toks.push({ t: 13 }); i += 3; continue; }
    // number
    let j = i; let num = '';
    while (j < s.length && (/[0-9.]/.test(s[j]))) { num += s[j]; j++; }
    toks.push({ t: 11, v: parseFloat(num) }); i = j;
  }
  return toks;
}

const ARITY = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 8: 1, 9: 1, 14: 1, 11: 0, 12: 0, 13: 0, 15: 0 };

function buildTree(toks) {
  const st = [];
  for (const tk of toks) {
    const a = ARITY[tk.t];
    if (a === 0) st.push({ tok: tk });
    else if (a === 1) { const x = st.pop(); st.push({ tok: tk, a: x }); }
    else { const r = st.pop(), l = st.pop(); st.push({ tok: tk, l, r }); }
  }
  return st[0];
}

const PREC = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 8: 4, 9: 4, 14: 4 };
function inorder(n, parentPrec, isRight) {
  if (!n.tok) return [];
  const tk = n.tok;
  if (ARITY[tk.t] === 0) return [tk];
  if (ARITY[tk.t] === 1) {
    // unary applies to child. GSP emits: predef -> "f ( child )"; funcref -> "fN child )"
    const inner = inorder(n.a, 99, false);
    if (tk.t === 8) return [tk, { t: 7 }].concat(inner, [{ t: 10 }]);
    if (tk.t === 14) return [tk].concat(inner, [{ t: 10 }]);
    return [tk].concat(inner);
  }
  const p = PREC[tk.t];
  const left = inorder(n.l, p, false);
  const right = inorder(n.r, p, true);
  const needL = (n.l.tok && PREC[n.l.tok.t] !== undefined && PREC[n.l.tok.t] < p);
  const needR = (n.r.tok && PREC[n.r.tok.t] !== undefined && (PREC[n.r.tok.t] < p || (PREC[n.r.tok.t] === p && (tk.t === 2 || tk.t === 4))));
  const out = [];
  if (needL) out.push({ t: 7 });
  out.push(...left);
  if (needL) out.push({ t: 10 });
  out.push(tk);
  if (needR) out.push({ t: 7 });
  out.push(...right);
  if (needR) out.push({ t: 10 });
  return out;
}

function sym(tk) {
  if (tk.t === 15) return 'x';
  if (tk.t === 11) return String(tk.v);
  if (tk.t === 12) return String.fromCharCode(65 + tk.idx);
  if (tk.t === 14) return '@f' + String.fromCharCode(65 + tk.idx);
  if (tk.t === 8) return '{f' + tk.op + '}';
  if (tk.t === 7) return '(';
  if (tk.t === 10) return ')';
  if (tk.t === 9) return '!';
  return '+-*/^'[tk.t - 1];
}

// --- 2311 program extraction ---
function programOf(rec) {
  const p = rec.pay;
  // find inner 07 09 00 00
  for (let i = 0; i + 8 <= p.length; i++) {
    if (p[i] === 7 && p[i + 1] === 9 && p[i + 2] === 0 && p[i + 3] === 0) {
      const len = p.readUInt32LE(i + 4);
      // COUNT is a u16 at i+12 (after len and the constant 48)
      const cnt = p.readUInt16LE(i + 12);
      if (cnt * 2 <= p.length) {
        const start = p.length - cnt * 2;
        return { len, cnt, codes: p.subarray(start) };
      }
    }
  }
  return null;
}

function codesToSymbols(buf) {
  const out = [];
  for (let i = 0; i + 1 < buf.length; i += 2) {
    const w = buf.readUInt16LE(i);
    const hi = w >> 8, lo = w & 0xff;
    if (hi === 0x00) out.push(lo === 0x0f ? 'x' : '#' + lo);
    else if (hi === 0x10) out.push('op' + lo);
    else if (hi === 0x60) out.push(String.fromCharCode(65 + lo));
    else if (hi === 0x70) out.push('@f' + String.fromCharCode(65 + lo));
    else out.push('?' + w.toString(16));
  }
  return out;
}

const gsp = process.argv[2];
const json = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const ir = gspToIR(fs.readFileSync(gsp));
const byId = new Map(ir.objects.map(o => [o.id, o]));

for (const o of json.objects) {
  if (o.spec !== 'Function' && o.spec !== 'Calculate') continue;
  const formula = (o.strings && o.strings.length > 1) ? o.strings[1] : (o.strings[0] || '');
  const go = byId.get(o.index);
  if (!go) { console.log('#' + o.index + ' Function/Calculate: no gsp obj'); continue; }
  const rec = go._raw.recs.find(r => r.tag === 2311);
  if (!rec) { console.log('#' + o.index + ' no 2311'); continue; }
  const pr = programOf(rec);
  const toks = tokenize(formula);
  const tree = buildTree(toks);
  const io = inorder(tree);
  console.log('==== #' + o.index + ' ' + o.spec + '  parents=' + JSON.stringify(o.parents) + '  formula=[' + formula.trim() + ']');
  console.log('  POSTFIX:', toks.map(sym).join(' '));
  console.log('  INORDER:', io.map(sym).join(' '));
  if (pr) {
    console.log('  CODES  :', codesToSymbols(pr.codes).join(' '));
    console.log('  (len=' + pr.len + ' cnt=' + pr.cnt + ')');
  }
}
