// JavaSketchpad text reader.
//
// A sketch exported by Sketchpad as a JavaSketchpad web page carries the whole
// construction as a plain-text `Construction` parameter inside the .htm:
//
//   <PARAM NAME=Construction VALUE="
//     {1} Point(310,195)[color(109,116,114)];
//     {2} UnitPoint(1,28.3465)[color(109,116,114)];
//     {7} Function(15,170,'y = f(x) = ...', '1 x @sin_ @sgn_ 1 + / ')()[black];
//     ...">
//
// This is the same grammar parsed by jsp5.jar (com.keypress.Gobjects.Sketch
// .parseConstruction), reverse-engineered by CFR-decompiling the shipped applet.
// Unlike the .gsp binary, the text keeps expression strings, labels and measure
// metadata in the clear, so it is the ground truth for the currently unreadable
// `tag 2311` object graph.
//
// `{n}` markers are pure comments (the parser skips them); object order equals
// construction order and parent indices are 1-based ordinals in that order.
'use strict';

// decode the handful of entities an HTML exporter may apply to the value
function decodeEntities(s) {
  return s.replace(/&(amp|lt|gt|quot|apos|nbsp|#39|#x27);/g, (m, e) => {
    switch (e) {
      case 'amp': return '&';
      case 'lt': return '<';
      case 'gt': return '>';
      case 'quot': return '"';
      case 'apos': case '#39': case '#x27': return "'";
      case 'nbsp': return ' ';
      default: return m;
    }
  });
}

// Pull the Construction applet parameter out of a JavaSketchpad .htm/.html.
// Handles `NAME=Construction` / `NAME="Construction"`, any attribute case and
// multi-line values.  Returns null when no such parameter exists.
//
// We anchor on the `NAME=Construction` attribute (not the bare word, which also
// occurs in ordinary page text) and then take the VALUE that follows it.  The
// value is read up to its matching quote so '>' characters inside expressions
// do not terminate it early.
function extractConstruction(html) {
  const nm = /name\s*=\s*["']?Construction["']?/i.exec(html);
  if (!nm) return null;
  const from = nm.index + nm[0].length;
  const vm = /value\s*=\s*(["'])/i.exec(html.slice(from));
  if (!vm) return null;
  const q = vm[1];
  const start = from + vm.index + vm[0].length;
  const end = html.indexOf(q, start);
  if (end < 0) return null;
  return decodeEntities(html.slice(start, end));
}

// Ordered format-attribute tokens, mirroring Sketch.parseFormatAttributes.
// Each entry: [name, argSpec?] where argSpec is [numDoubles, numStrings].
const FORMAT_TOKENS = [
  ['hidden'], ['red'], ['blue'], ['magenta'], ['cyan'], ['green'], ['black'], ['white'], ['yellow'],
  ['hairline'], ['thin'], ['mediumLine'], ['thick'],
  ['solid'], ['dashed'], ['dotted'], ['dot'],
  ['small'], ['mediumPoint'], ['large'], ['medium'],
  ['layer', [1, 0]], ['image', [0, 1]], ['traced'],
  ['color', [3, 0]], ['label', [0, 1]], ['auto'], ['suffix', [0, 1]],
  ['justifyLeft'], ['justifyRight'], ['justifyCenter'],
  ['size', [1, 0]], ['plain'], ['bold'], ['italic'], ['font', [0, 1]], ['digits', [1, 0]]
];

class JspParser {
  constructor(text) {
    this.s = (text || '').replace(/^\uFEFF/, '');
    this.len = this.s.length;
    this.i = 0;
    this.warnings = [];
  }

  // mirrors Sketch.eatWhiteSpace: skip spaces/newlines/CR (and tabs), and
  // recursively skip `{...}` markers.
  skipWS() {
    for (;;) {
      while (this.i < this.len) {
        const c = this.s.charAt(this.i);
        if (c === ' ' || c === '\n' || c === '\r' || c === '\t') this.i++;
        else break;
      }
      if (this.s.charAt(this.i) === '{') {
        while (this.i < this.len && this.s.charAt(this.i++) !== '}') { /* skip */ }
        continue;
      }
      break;
    }
  }

  wordFrom() {
    this.skipWS();
    const start = this.i;
    while (this.i < this.len && this.s.charAt(this.i) !== ' ') this.i++;
    return this.s.slice(start, this.i);
  }

  match(q) {
    if (this.s.startsWith(q, this.i)) { this.i += q.length; return true; }
    return false;
  }

  eat(q) {
    if (!this.match(q)) {
      throw new Error('expected "' + q + '" but found "' + this.wordFrom() + '" @' + this.i);
    }
  }

  readInt(term) {
    this.skipWS();
    const t = this.s.indexOf(term, this.i);
    if (t < 0) throw new Error('expected int, found "' + this.wordFrom() + '"');
    const v = parseInt(this.s.slice(this.i, t).trim(), 10);
    this.i = t + term.length;
    return v;
  }

  readDouble(term) {
    this.skipWS();
    const t = this.s.indexOf(term, this.i);
    if (t < 0) throw new Error('expected double, found "' + this.wordFrom() + '"');
    const v = parseFloat(this.s.slice(this.i, t).trim());
    this.i = t + term.length;
    return v;
  }

  // fixed-arity argument list: (parents..., doubles..., 'strings'...)
  readSpec(nP, nD, nS) {
    this.skipWS(); this.eat('(');
    const parents = nP > 0 ? new Array(nP) : null;
    const doubles = nD > 0 ? new Array(nD) : null;
    const strings = nS > 0 ? new Array(nS) : null;
    for (let k = 1; k <= nP; k++) {
      this.skipWS();
      parents[k - 1] = this.readInt(k === nP ? (nD + nS === 0 ? ')' : ',') : ',');
    }
    for (let k = 1; k <= nD; k++) {
      this.skipWS();
      doubles[k - 1] = this.readDouble(k === nD + nS ? ')' : ',');
    }
    for (let k = 1; k <= nS; k++) {
      this.skipWS(); this.eat("'");
      let out = ''; let pending = false;
      while (this.i < this.len) {
        const c = this.s.charAt(this.i);
        if (c === "'") {
          if (!pending) pending = true;
          else { out += "'"; pending = false; }
        } else {
          if (pending) break;
          out += c;
        }
        this.i++;
      }
      strings[k - 1] = out;
      this.skipWS();
      if (k < nS) this.eat(',');
      this.skipWS();
      if (k === nS) this.eat(')');
    }
    return { parents, doubles, strings };
  }

  // variable-length parent list, e.g. Polygon / Function / Calculate tails
  readVarSpec(okayEmpty) {
    this.skipWS(); this.eat('(');
    const old = this.i;
    const stop = this.s.indexOf(')', this.i);
    let numParents = okayEmpty ? 0 : 1;
    for (;;) {
      const aComma = this.s.indexOf(',', this.i);
      if (aComma === -1 && this.i !== stop && numParents === 0) { numParents++; break; }
      if (aComma === -1 || this.i === stop) break;
      if (aComma !== -1 && okayEmpty && numParents === 0) numParents = 1;
      if (aComma < this.i || aComma > stop) break;
      this.i = aComma + 1; numParents++;
    }
    if (numParents === 0 && okayEmpty) {
      this.skipWS(); this.eat(')');
      return [];
    }
    const parents = new Array(numParents);
    this.i = old;
    for (let k = 0; k < numParents; k++) {
      this.skipWS();
      parents[k] = this.readInt(k === numParents - 1 ? ')' : ',');
    }
    return parents;
  }

  readOneFormat() {
    for (const [name, argSpec] of FORMAT_TOKENS) {
      const save = this.i;
      if (!this.match(name)) continue;
      if (!argSpec) return { name };
      const r = this.readSpec(0, argSpec[0], argSpec[1]);
      return { name, doubles: r.doubles || undefined, strings: r.strings || undefined };
    }
    // unknown token: consume one word (mirrors the reference parser)
    return { name: 'unknown', value: this.wordFrom() };
  }

  // parses the inside of [ ... ] after '[' has already been matched
  readFormatBody() {
    const attrs = [];
    for (;;) {
      this.skipWS();
      attrs.push(this.readOneFormat());
      if (this.match(',')) continue;
      break;
    }
    this.skipWS(); this.eat(']');
    return attrs;
  }

  // one construction object, returns a record with raw 1-based parent indices
  parseObject(index) {
    const start = this.i;
    this.skipWS();
    const marker = this.s.slice(start, this.i).match(/\{(\d+)\}/);

    let spec = null, variant = null, parents = null, doubles = null, strings = null;
    let measureType = null;

    const fixed = (name, nP, nD, nS, extra) => {
      spec = name;
      const r = this.readSpec(nP, nD, nS);
      parents = r.parents; doubles = r.doubles; strings = r.strings;
      if (extra && extra.measureType != null) measureType = extra.measureType;
      if (extra && extra.variant) variant = extra.variant;
    };

    const m = (q) => this.match(q);

    if (m('Point on object')) fixed('Point on object', 1, 1, 0, { variant: 'on-object' });
    else if (m('Point')) fixed('Point', 0, 2, 0);
    else if (m('Midpoint')) fixed('Midpoint', 1, 0, 0);
    else if (m('Segment')) fixed('Segment', 2, 0, 0);
    else if (m('Ray')) fixed('Ray', 2, 0, 0);
    else if (m('Line')) fixed('Line', 2, 0, 0);
    else if (m('Circle')) {
      if (m(' by radius')) fixed('Circle', 2, 0, 0, { variant: 'by-radius' });
      else if (m(' interior')) fixed('Circle', 1, 0, 0, { variant: 'interior' });
      else fixed('Circle', 2, 0, 0, { variant: 'center-point' });
    }
    else if (m('Intersect')) {
      if (m('1')) fixed('Intersect', 2, 0, 0, { variant: '1' });
      else if (m('2')) fixed('Intersect', 2, 0, 0, { variant: '2' });
      else fixed('Intersect', 2, 0, 0, { variant: 'linear' });
    }
    else if (m('Perpendicular')) fixed('Perpendicular', 2, 0, 0);
    else if (m('Parallel')) fixed('Parallel', 2, 0, 0);
    else if (m('Bisector')) fixed('Bisector', 3, 0, 0);
    else if (m('Polygon')) { spec = 'Polygon'; parents = this.readVarSpec(false); }
    else if (m('Reflection')) fixed('Reflection', 2, 0, 0);
    else if (m('Dilation')) {
      if (m('/3PtRatio')) fixed('Dilation', 5, 0, 0, { variant: '/3PtRatio' });
      else if (m('/SegmentRatio')) fixed('Dilation', 4, 0, 0, { variant: '/SegmentRatio' });
      else if (m('/MarkedRatio')) fixed('Dilation', 3, 0, 0, { variant: '/MarkedRatio' });
      else fixed('Dilation', 2, 1, 0, { variant: '/ratio' });
    }
    else if (m('Rotation/MeasuredAngle')) fixed('Rotation', 3, 0, 0, { variant: '/MeasuredAngle' });
    else if (m('Rotation/MarkedAngle')) fixed('Rotation', 5, 0, 0, { variant: '/MarkedAngle' });
    else if (m('Rotation')) fixed('Rotation', 2, 1, 0, { variant: '/angle' });
    else if (m('PlotXY')) fixed('PlotXY', 3, 0, 0);
    else if (m('PlotFixedXY')) fixed('PlotFixedXY', 1, 2, 0);
    else if (m('Translation')) {
      if (m('/MarkedAngle/FixedDistance')) fixed('Translation', 2, 1, 0, { variant: '/MarkedAngle/FixedDistance' });
      else if (m('/FixedAngle/MarkedDistance')) fixed('Translation', 2, 1, 0, { variant: '/FixedAngle/MarkedDistance' });
      else if (m('/MarkedAngle/MarkedDistance')) fixed('Translation', 3, 0, 0, { variant: '/MarkedAngle/MarkedDistance' });
      else fixed('Translation', 1, 2, 0, { variant: '/xy' });
    }
    else if (m('PolarTranslation')) fixed('PolarTranslation', 1, 2, 0);
    else if (m('VectorTranslation')) fixed('VectorTranslation', 3, 0, 0);
    else if (m('Locus')) fixed('Locus', 3, 1, 0);
    else if (m('ImageOnPoint')) fixed('ImageOnPoint', 1, 0, 1);
    else if (m('ImageBetweenPoints')) fixed('ImageBetweenPoints', 2, 0, 1);
    else if (m('Image')) fixed('Image', 0, 2, 1);
    else if (m('MoveButton')) {
      spec = 'MoveButton';
      const r = this.readSpec(0, 3, 1);
      doubles = r.doubles; strings = r.strings;
      parents = this.readVarSpec(false);
    }
    else if (m('AnimateButton')) {
      spec = 'AnimateButton';
      const r = this.readSpec(0, 2, 1);
      doubles = r.doubles; strings = r.strings;
      parents = this.readVarSpec(false);
      // trailing per-pair speeds + two flag arrays
      const numPairs = parents.length / 2;
      const sp = this.readSpec(0, numPairs, 0);
      doubles = (doubles || []).concat(sp.doubles || []);
      const f1 = this.readSpec(0, numPairs, 0);
      const f2 = this.readSpec(0, numPairs, 0);
      variant = { speeds: sp.doubles, flagsA: f1.doubles, flagsB: f2.doubles };
    }
    else if (m('ShowButton')) { spec = 'ShowButton'; const r = this.readSpec(0, 2, 1); doubles = r.doubles; strings = r.strings; parents = this.readVarSpec(false); }
    else if (m('HideButton')) { spec = 'HideButton'; const r = this.readSpec(0, 2, 1); doubles = r.doubles; strings = r.strings; parents = this.readVarSpec(false); }
    else if (m('ToggleVisibilityButton')) { spec = 'ToggleVisibilityButton'; const r = this.readSpec(0, 2, 1); doubles = r.doubles; strings = r.strings; parents = this.readVarSpec(false); }
    else if (m('SimultaneousButton')) { spec = 'SimultaneousButton'; const r = this.readSpec(0, 2, 1); doubles = r.doubles; strings = r.strings; parents = this.readVarSpec(false); }
    else if (m('AxisX')) fixed('AxisX', 1, 0, 0);
    else if (m('AxisY')) fixed('AxisY', 1, 0, 0);
    else if (m('UnitPoint')) fixed('UnitPoint', 1, 1, 0);
    else if (m('SquareUnitPoint')) fixed('SquareUnitPoint', 1, 0, 0);
    else if (m('RectangularUnitPoint')) fixed('RectangularUnitPoint', 1, 1, 0);
    else if (m('HorizontalAxis')) fixed('HorizontalAxis', 2, 0, 0);
    else if (m('VerticalAxis')) fixed('VerticalAxis', 2, 0, 0);
    else if (m('Parameter')) {
      spec = 'Parameter';
      const r = this.readSpec(0, 3, 1);
      doubles = r.doubles; strings = r.strings;
    }
    else if (m('Length')) fixed('Length', 1, 2, 1, { measureType: 1 });
    else if (m('Angle')) fixed('Angle', 3, 2, 1, { measureType: 12, variant: 'directed-or-abs' });
    else if (m('Perimeter') || m('Circumference')) fixed('Perimeter', 1, 2, 1, { measureType: 4 });
    else if (m('Area')) fixed('Area', 1, 2, 1, { measureType: 6 });
    else if (m('Radius')) fixed('Radius', 1, 2, 1, { measureType: 9 });
    else if (m('Ratio/Segments')) fixed('Ratio/Segments', 2, 2, 1, { measureType: 8 });
    else if (m('Ratio/Points')) fixed('Ratio/Points', 3, 2, 1, { measureType: 11 });
    else if (m('Slope')) fixed('Slope', 1, 2, 1, { measureType: 7 });
    else if (m('Distance')) fixed('Distance', 2, 2, 1, { measureType: '2-or-3' });
    else if (m('Calculate')) {
      spec = 'Calculate';
      const r = this.readSpec(0, 2, 2);
      doubles = r.doubles; strings = r.strings;
      parents = this.readVarSpec(true);
    }
    else if (m('FunctionPlot')) fixed('FunctionPlot', 2, 4, 0);
    else if (m('Function')) {
      spec = 'Function';
      const r = this.readSpec(0, 2, 2);
      doubles = r.doubles; strings = r.strings;
      parents = this.readVarSpec(true);
      variant = { label: r.strings && r.strings[0], expr: r.strings && r.strings[1] };
    }
    else if (m('Origin&Unit')) fixed('Origin&Unit', 2, 0, 0);
    else if (m('UnitCircle')) fixed('UnitCircle', 1, 0, 0);
    else if (m('Coordinates')) fixed('Coordinates', 2, 2, 1);
    else if (m('Abscissa')) fixed('Abscissa', 2, 2, 1, { measureType: 13 });
    else if (m('Ordinate')) fixed('Ordinate', 2, 2, 1, { measureType: 14 });
    else if (m('CoordinateDistance')) fixed('CoordinateDistance', 3, 2, 1, { measureType: 15 });
    else if (m('CoordSysByAxes')) fixed('CoordSysByAxes', 2, 0, 0);
    else if (m('FixedPoint')) fixed('FixedPoint', 0, 2, 0);
    else if (m('DriverPoint')) fixed('DriverPoint', 3, 0, 0);
    else if (m('PeggedText')) fixed('PeggedText', 2, 0, 0);
    else if (m('ConcatText')) { spec = 'ConcatText'; const r = this.readSpec(0, 2, 0); doubles = r.doubles; parents = this.readVarSpec(false); }
    else if (m('FixedText')) fixed('FixedText', 0, 2, 1);
    else if (m('Colorized_')) {
      if (m('Spectrum')) fixed('Colorized_Spectrum', 2, 3, 0, { variant: 'Spectrum' });
      else if (m('Grayscale')) fixed('Colorized_Grayscale', 2, 3, 0, { variant: 'Grayscale' });
      else if (m('RGB')) fixed('Colorized_RGB', 4, 3, 0, { variant: 'RGB' });
      else if (m('HSV')) fixed('Colorized_HSV', 4, 3, 0, { variant: 'HSV' });
      else throw new Error('unknown Colorized specifier "' + this.wordFrom() + '"');
    }
    else {
      throw new Error('unknown object specifier "' + this.wordFrom() + '" @' + this.i);
    }

    this.skipWS();
    let format = null;
    if (this.match('[')) format = this.readFormatBody();
    this.skipWS();
    this.eat(';');

    return {
      index,
      marker: marker ? parseInt(marker[1], 10) : null,
      spec,
      variant: variant || null,
      parents: parents || [],
      doubles: doubles || [],
      strings: strings || [],
      format,
      measureType,
      raw: this.s.slice(start, this.i).trim()
    };
  }

  parse() {
    const objects = [];
    const warnings = this.warnings;
    this.skipWS();
    while (this.i < this.len) {
      // stop at a clean end (some exporters append trailing markup)
      const c = this.s.charAt(this.i);
      if (c === '<' || c === '\0') break;
      const before = this.i;
      let rec;
      try {
        rec = this.parseObject(objects.length + 1);
      } catch (e) {
        warnings.push('object#' + (objects.length + 1) + ': ' + e.message);
        break;
      }
      objects.push(rec);
      if (this.i <= before) break;   // safety: no progress
      this.skipWS();
    }
    return { objects, warnings };
  }
}

// Convenience: text -> IR-ish structure.
function parseConstruction(text) {
  return new JspParser(text).parse();
}

module.exports = { extractConstruction, parseConstruction, decodeEntities, JspParser };
