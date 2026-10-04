'use strict';
// Isolate which GeoGebra commands are rejected.  Each test uses its own base objects
// so failures can't cascade.  Read the error dialog for the failing labels.
const fs = require('fs');
const { zip } = require('../../src/zip.js');

const header = `<?xml version="1.0" encoding="utf-8"?>
<geogebra format="4.2" id="minitest2"  xsi:noNamespaceSchemaLocation="http://www.geogebra.org/ggb.xsd" xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
<gui>
	<window width="1000" height="800" />
	<labelingStyle  val="3"/>
</gui>
<euclidianView>
	<size  width="1000" height="800"/>
	<coordSystem xZero="300" yZero="500" scale="50" yscale="50"/>
	<evSettings axes="true" grid="false" gridIsBold="false" pointCapturing="3" rightAngleStyle="2" checkboxSize="13" gridType="0"/>
	<axis id="0" show="true" label="" unitLabel="" tickStyle="1" showNumbers="true"/>
	<axis id="1" show="true" label="" unitLabel="" tickStyle="1" showNumbers="true"/>
</euclidianView>
<kernel>
	<continuous val="false"/>
	<decimals val="2"/>
	<angleUnit val="degree"/>
	<algebraStyle val="0"/>
	<coordStyle val="0"/>
	<angleFromInvTrig val="false"/>
</kernel>
<scripting blocked="false" disabled="false"/>
`;

const parts = [];
function pt(label, x, y, fixed) {
  parts.push(`<element type="point" label="${label}">\n\t<show object="true" label="true"/>\n\t<coords x="${x}" y="${y}" z="1"/>\n${fixed ? '\t<fixed val="true"/>\n' : ''}</element>`);
}
function obj(type, label, exp) {
  parts.push(`<expression label="${label}" exp="${exp}" />`);
  parts.push(`<element type="${type}" label="${label}">\n\t<show object="true" label="true"/>\n</element>`);
}

// base points
pt('A', 1, 2); pt('B', 3, 4); pt('C', 5, 1); pt('D', 2, 5); pt('O', 0, 0, true);
obj('line', 'L', 'Line(A,B)');
obj('segment', 'S', 'Segment(C,D)');
obj('conic', 'K', 'Circle(A,2)');
obj('function', 'f', 'x + 1');
obj('function', 'g', '-x + 5');
obj('line', 'x_', 'Line(O,O+(1,0))');

// candidate commands (independent)
obj('point', 'T01', 'Point(L)');
obj('point', 'T02', 'Point(S)');
obj('point', 'T03', 'Point(x_)');
obj('point', 'T04', 'Intersect(L,f)');
obj('point', 'T05', 'Intersect(L,f,1)');
obj('point', 'T06', 'Intersect(f,L,1)');
obj('point', 'T07', 'Intersect(f,g,1)');
obj('point', 'T08', 'Intersect(L,K,1)');
obj('line', 'T09', 'ParallelLine(C,S)');
obj('line', 'T10', 'PerpendicularLine(C,S)');
obj('point', 'T11', 'Intersect(S,f,1)');
obj('point', 'T12', 'Intersect(x_,f,1)');
obj('point', 'T13', 'Intersect(f,x_,1)');
obj('point', 'T14', 'Point(f)');
obj('point', 'T15', 'Point(L,0.5)');
obj('point', 'T16', 'ClosestPoint(L,C)');

const body = `<construction title="" author="" date="">\n` + parts.join('\n') + `\n</construction>\n</geogebra>`;
fs.mkdirSync('out', { recursive: true });
const buf = zip([{ name: 'geogebra.xml', data: Buffer.from(header + body, 'utf8') }]);
fs.writeFileSync('out/minitest2.ggb', buf);
console.log('wrote out/minitest2.ggb (' + buf.length + ' bytes)');
