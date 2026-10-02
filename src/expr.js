'use strict';
// Decoder for Geometer's Sketchpad `tag 2311` expression programs.
//
// A 2311 payload ends with a token program whose byte length is `COUNT * 2`,
// where COUNT is a u16 at offset 12 of the inner record that starts with
// `07 09 00 00`.  Each token is a little-endian u16 whose high byte is a class:
//
//   0x00  literal character: 0x00..0x09 digit, 0x0a '.', 0x0b '(', 0x0c ')',
//                            0x0d pi, 0x0e e, 0x0f independent variable x
//   0x01  angle-unit tag on the preceding number literal:
//                            payload 0 radians, 1 degrees, 2 directed degrees
//   0x02  distance-unit tag on the preceding number literal (value unchanged)
//   0x10  binary operator: 0 '+', 1 '-', 2 '*', 3 '/', 4 '^'
//   0x20  predefined function by index (see PREDEF)
//   0x60  reference to parent N (payload = 0-based parent index)
//   0x70  reference to parent N used as a function (payload = parent index)
//
// The program is the expression in **in-order** order with explicit
// parentheses.  Predefined/user functions are emitted as the function token,
// then their argument, then ')' (i.e. an implicit '(' follows the function).
//
// The function index table below was established from JSP ground truth,
// captions and the behaviour of the corpus (see HANDOFF.md):
//   F0=sin  F1=cos  F2=tan  F3=arcsin F4=arccos F5=arctan F6=abs F7=sqrt
//   F8=ln   F9=log10 F10=sgn F11=round F12=trunc
//
// Sketchpad's trigonometric functions use radians (e.g. `演奏原理` defines
// `sin(264*2*pi*x)` and `正弦型函数` uses `sin(2x+pi/3)`), so a degrees-unit
// literal is converted by multiplying by pi/180.

const PREDEF = {
  0: 'sin', 1: 'cos', 2: 'tan',
  3: 'asin', 4: 'acos', 5: 'atan',
  6: 'abs', 7: 'sqrt',
  8: 'ln', 9: 'log',
  10: 'sgn', 11: 'round', 12: 'trunc'
};

// GSP function name -> GeoGebra function name (only where they differ).
const GGB_FN = { trunc: 'trunc', sgn: 'sgn' };

function findProgram(pay) {
  for (let i = 0; i + 8 <= pay.length; i++) {
    if (pay[i] === 7 && pay[i + 1] === 9 && pay[i + 2] === 0 && pay[i + 3] === 0) {
      const cnt = pay.readUInt16LE(i + 12);
      if (cnt > 0 && cnt * 2 <= pay.length) return pay.subarray(pay.length - cnt * 2);
    }
  }
  return null;
}

function tokenize(buf, o) {
  const toks = [];
  const bad = reason => ({ ok: false, reason });
  for (let i = 0; i + 1 < buf.length; i += 2) {
    const w = buf.readUInt16LE(i), hi = w >> 8, lo = w & 0xff;
    if (hi === 0x00) {
      if (lo <= 9) toks.push({ t: 'digit', v: String(lo) });
      else if (lo === 0x0a) toks.push({ t: 'digit', v: '.' });
      else if (lo === 0x0b) toks.push({ t: 'lp' });
      else if (lo === 0x0c) toks.push({ t: 'rp' });
      else if (lo === 0x0d) toks.push({ t: 'const', v: 'pi' });
      else if (lo === 0x0e) toks.push({ t: 'const', v: 'e' });
      else if (lo === 0x0f) toks.push({ t: 'var' });
      else return bad('char 0x' + lo.toString(16));
    } else if (hi === 0x01) {
      if (lo === 0) toks.push({ t: 'unit', mul: '1' });            // radians
      else if (lo === 1 || lo === 2) toks.push({ t: 'unit', mul: 'pi / 180' }); // degrees
      else return bad('angle unit 0x' + w.toString(16));
    } else if (hi === 0x02) {
      toks.push({ t: 'unit', mul: '1' });                          // distance unit: value unchanged
    } else if (hi === 0x10) {
      const op = '+-*/^'[lo];
      if (!op) return bad('operator 0x' + w.toString(16));
      toks.push({ t: 'op', v: op });
    } else if (hi === 0x20) {
      const name = PREDEF[lo];
      if (!name) return bad('function F' + lo);
      toks.push({ t: 'fn', v: name });
      toks.push({ t: 'lp' });
    } else if (hi === 0x60) {
      const id = o.parents[lo];
      if (id === undefined) return bad('missing parent ref ' + lo);
      toks.push({ t: 'ref', id });
    } else if (hi === 0x70) {
      const id = o.parents[lo];
      if (id === undefined) return bad('missing function ref ' + lo);
      toks.push({ t: 'fnref', id });
      toks.push({ t: 'lp' });
    } else {
      return bad('token class 0x' + w.toString(16));
    }
  }
  return { ok: true, toks };
}

function parse(toks) {
  let p = 0;
  const peek = () => toks[p];
  const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
  const refs = [];
  const render = node => {
    switch (node.k) {
      case 'raw': return node.v;
      case 'var': return 'x';
      case 'ref': refs.push(node.id); return '{#' + node.id + '}';
      case 'neg': return '(-' + render(node.a) + ')';
      case 'fn': {
        // GeoGebra has no `trunc`; truncation toward zero is sgn(x)*floor(abs(x)).
        if (node.name === 'trunc') { const a = render(node.a); return '(sgn(' + a + ') * floor(abs(' + a + ')))'; }
        return node.name + '(' + render(node.a) + ')';
      }
      case 'op': {
        const higher = c => c.k === 'op' && (PREC[c.op] > PREC[node.op] ||
          (PREC[c.op] === PREC[node.op] && node.op !== '^' && c.op !== node.op));
        const l = higher(node.l) ? '(' + render(node.l) + ')' : render(node.l);
        const r = higher(node.r) || (node.op === '^' && node.r.k === 'op') ? '(' + render(node.r) + ')' : render(node.r);
        return l + ' ' + node.op + ' ' + r;
      }
    }
    throw new Error('bad node');
  };
  const parseExpr = minPrec => {
    let left = parseUnary();
    for (;;) {
      const t = peek();
      if (!t || t.t !== 'op') break;
      const prec = PREC[t.v];
      if (prec === undefined || prec < minPrec) break;
      p++;
      const right = parseExpr(t.v === '^' ? prec : prec + 1);
      left = { k: 'op', op: t.v, l: left, r: right };
    }
    return left;
  };
  const parseUnary = () => {
    const t = peek();
    if (t && t.t === 'op' && (t.v === '-' || t.v === '+')) {
      p++;
      // Unary minus binds looser than '^' but tighter than '*'/'/': -x^2 is -(x^2),
      // not (-x)^2.
      const a = parseExpr(PREC['^']);
      return t.v === '-' ? { k: 'neg', a } : a;
    }
    return parsePrimary();
  };
  const applyUnits = node => {
    while (peek() && peek().t === 'unit') {          // unit tag converts the literal
      const u = peek(); p++;
      if (u.mul !== '1') node = { k: 'op', op: '*', l: node, r: { k: 'raw', v: u.mul } };
    }
    return node;
  };
  const parsePrimary = () => {
    const t = peek();
    if (!t) throw new Error('unexpected end');
    if (t.t === 'digit') {
      let s = '';
      while (peek() && peek().t === 'digit') { s += peek().v; p++; }
      if (s === '.' || s === '') throw new Error('bad number');
      return applyUnits({ k: 'raw', v: s });
    }
    if (t.t === 'const') { p++; return applyUnits({ k: 'raw', v: t.v }); }
    if (t.t === 'var') { p++; return { k: 'var' }; }
    if (t.t === 'ref') { p++; return { k: 'ref', id: t.id }; }
    if (t.t === 'lp') { p++; const e = parseExpr(0); if (!peek() || peek().t !== 'rp') throw new Error('missing )'); p++; return e; }
    if (t.t === 'fn' || t.t === 'fnref') {
      let name;
      if (t.t === 'fn') name = PREDEF[t.v] || t.v;
      else { name = '{#' + t.id + '}'; refs.push(t.id); }
      p++;
      if (!peek() || peek().t !== 'lp') throw new Error('missing (');
      p++;
      const arg = parseExpr(0);
      if (!peek() || peek().t !== 'rp') throw new Error('missing )');
      p++;
      return { k: 'fn', name, a: arg };
    }
    throw new Error('unexpected ' + t.t);
  };
  const ast = parseExpr(0);
  if (p !== toks.length) throw new Error('trailing tokens');
  return { ast, render, refs };
}

// Public: decode a 2311 payload into a GeoGebra-style infix template.
// Returns { ok:true, exprTpl, args } or { ok:false, reason }.
function decodeExpr(pay, o) {
  const prog = findProgram(pay);
  if (!prog) return { ok: false, reason: 'no expression program' };
  const tk = tokenize(prog, o);
  if (!tk.ok) return tk;
  let parsed;
  try { parsed = parse(tk.toks); } catch (e) { return { ok: false, reason: 'parse: ' + e.message }; }
  const text = parsed.render(parsed.ast);
  const args = [...new Set(parsed.refs)];
  return { ok: true, exprTpl: text, args, count: prog.length / 2 };
}

module.exports = { decodeExpr, findProgram, PREDEF, GGB_FN };
