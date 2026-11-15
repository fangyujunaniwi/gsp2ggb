'use strict';
// locustest.js — build minimal .ggb files to determine GeoGebra's real Locus constraint.
// Each case defines a mover P on a circle and a traced Q with a different kind of
// dependency on P, then Locus(Q,P).  Whatever fails tells us the missing condition.
const fs = require('fs');
const { zip } = require('../src/zip.js');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const HEAD = `<?xml version="1.0" encoding="utf-8"?>
<geogebra format="5.0" version="5.4.930.2" app="classic" platform="d" id="mini-locus" xsi:noNamespaceSchemaLocation="https://www.geogebra.org/apps/xsd/ggb.xsd" xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<gui><window width="900" height="700"/><perspectives><perspective id="tmp"><panes><pane location="" divider="0.25" orientation="1"/></panes><views>
<view id="1" visible="true" inframe="false" stylebar="false" location="1" size="640" window="100,100,600,400"/>
<view id="2" visible="true" inframe="false" stylebar="false" location="3" size="240" tab="ALGEBRA" window="100,100,600,400"/>
</views><toolbar show="true" items="0 39 59 || 1 501 5 19 67 72" position="1" help="false"/><input show="true" cmd="true" top="algebra"/><dockBar show="true" east="true"/></perspective></perspectives><labelingStyle val="0"/><font size="16"/></gui>
<euclidianView><viewNumber viewNo="1"/><size width="900" height="700"/><coordSystem xZero="450" yZero="350" scale="60" yscale="60"/><evSettings axes="true" grid="false" gridIsBold="false" pointCapturing="3" rightAngleStyle="1" checkboxSize="26" gridType="0"/><axis id="0" show="true" label="" unitLabel="" tickStyle="1" showNumbers="true"/><axis id="1" show="true" label="" unitLabel="" tickStyle="1" showNumbers="true"/></euclidianView>
<kernel><continuous val="false"/><decimals val="2"/><angleUnit val="degree"/><algebraStyle val="0"/><coordStyle val="0"/></kernel>
<scripting blocked="false" disabled="false"/>
<construction title="" author="" date="">
`;

function build(defs) {
  let x = HEAD;
  for (const d of defs) {
    x += `<expression label="${esc(d.label)}" exp="${esc(d.exp)}" />\n`;
    x += `<element type="${d.type}" label="${esc(d.label)}">\n<show object="true" label="false"/>\n<objColor r="0" g="0" b="0" alpha="0"/>\n<layer val="0"/>\n<labelMode val="0"/>\n`;
    if (d.type === 'point') x += '<pointSize val="5"/>\n<pointStyle val="0"/>\n';
    x += '</element>\n';
  }
  x += '</construction>\n</geogebra>\n';
  return Buffer.from(x, 'utf8');
}

const C = { type: 'conic', label: 'c', exp: 'x^2+y^2=4' };

const cases = {
  // 1) Q depends on P directly (no intermediate path object).
  direct: [C,
    { type: 'point', label: 'P', exp: 'Point(c)' },
    { type: 'point', label: 'Q', exp: 'P+(1,0)' },
    { type: 'locus', label: 'L', exp: 'Locus(Q,P)' }],
  // 2) Q depends on P only through a segment whose endpoint is P (the 025 pattern).
  viapath: [C,
    { type: 'point', label: 'P', exp: 'Point(c)' },
    { type: 'segment', label: 's', exp: 'Segment(P,(3,0))' },
    { type: 'point', label: 'Q', exp: 'Point(s)' },
    { type: 'locus', label: 'L', exp: 'Locus(Q,P)' }],
  // 3) Q is an independent point on the same path as P (no dependency at all).
  samepath: [C,
    { type: 'point', label: 'P', exp: 'Point(c)' },
    { type: 'point', label: 'Q', exp: 'Point(c)' },
    { type: 'locus', label: 'L', exp: 'Locus(Q,P)' }],
};

for (const [name, defs] of Object.entries(cases)) {
  const out = 'out/locus_' + name + '.ggb';
  fs.writeFileSync(out, zip([{ name: 'geogebra.xml', data: build(defs) }]));
  console.log('wrote ' + out);
}
