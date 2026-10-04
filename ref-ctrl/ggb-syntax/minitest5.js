'use strict';
// Does GeoGebra's ParallelLine accept a <Segment> as the base, or only a <Line>?
const fs = require('fs');
const { zip } = require('../../src/zip.js');

const header = `<?xml version="1.0" encoding="utf-8"?>
<geogebra format="4.2" id="minitest5"  xsi:noNamespaceSchemaLocation="http://www.geogebra.org/ggb.xsd" xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
<gui><window width="1000" height="800" /><labelingStyle  val="3"/></gui>
<euclidianView>
	<size  width="1000" height="800"/>
	<coordSystem xZero="300" yZero="500" scale="50" yscale="50"/>
	<evSettings axes="true" grid="false" gridIsBold="false" pointCapturing="3" rightAngleStyle="2" checkboxSize="13" gridType="0"/>
	<axis id="0" show="true" label="" unitLabel="" tickStyle="1" showNumbers="true"/>
	<axis id="1" show="true" label="" unitLabel="" tickStyle="1" showNumbers="true"/>
</euclidianView>
<kernel><continuous val="false"/><decimals val="2"/><angleUnit val="degree"/><algebraStyle val="0"/><coordStyle val="0"/><angleFromInvTrig val="false"/></kernel>
<scripting blocked="false" disabled="false"/>
`;

const parts = [];
function pt(label, x, y) {
  parts.push(`<element type="point" label="${label}">\n\t<show object="true" label="true"/>\n\t<coords x="${x}" y="${y}" z="1"/>\n</element>`);
}
function obj(type, label, exp) {
  parts.push(`<expression label="${label}" exp="${exp}" />`);
  parts.push(`<element type="${type}" label="${label}">\n\t<show object="true" label="true"/>\n</element>`);
}

pt('A', 0, 0); pt('B', 4, 0); pt('P', 1, 3);
obj('segment', 'S', 'Segment(A,B)');
obj('line', 'L', 'Line(A,B)');
obj('vector', 'V', 'Vector(A,B)');
obj('line', 'T1', 'ParallelLine(P,S)');     // base = segment
obj('line', 'T2', 'ParallelLine(P,L)');     // base = line
obj('line', 'T3', 'PerpendicularLine(P,S)');// base = segment
obj('line', 'T4', 'ParallelLine(P,V)');     // base = vector

const body = `<construction title="" author="" date="">\n` + parts.join('\n') + `\n</construction>\n</geogebra>`;
fs.mkdirSync('out', { recursive: true });
const buf = zip([{ name: 'geogebra.xml', data: Buffer.from(header + body, 'utf8') }]);
fs.writeFileSync('out/minitest5.ggb', buf);
console.log('wrote out/minitest5.ggb (' + buf.length + ' bytes)');
