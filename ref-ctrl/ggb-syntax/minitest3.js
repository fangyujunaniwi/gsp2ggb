'use strict';
// Distinguish: is the failure the label "x_" or the definition "Line(O,O+(1,0))?
const fs = require('fs');
const { zip } = require('../../src/zip.js');

const header = `<?xml version="1.0" encoding="utf-8"?>
<geogebra format="4.2" id="minitest3"  xsi:noNamespaceSchemaLocation="http://www.geogebra.org/ggb.xsd" xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
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
function pt(label, x, y, fixed) {
  parts.push(`<element type="point" label="${label}">\n\t<show object="true" label="true"/>\n\t<coords x="${x}" y="${y}" z="1"/>\n${fixed ? '\t<fixed val="true"/>\n' : ''}</element>`);
}
function obj(type, label, exp) {
  parts.push(`<expression label="${label}" exp="${exp}" />`);
  parts.push(`<element type="${type}" label="${label}">\n\t<show object="true" label="true"/>\n</element>`);
}

pt('O', 0, 0, true);
pt('A', 2, 0);
obj('function', 'f', 'x + 1');
obj('line', 'x_', 'Line(O,O+(1,0))');     // axis-style definition, reserved label
obj('line', 'w', 'Line(O,O+(1,0))');      // axis-style definition, normal label
obj('line', 'v', 'Line(O,A)');            // normal definition, normal label

// 4 tests only (dialog shows ~4 rows)
obj('point', 'T1', 'Point(v)');           // normal line, Point
obj('point', 'T2', 'Point(w)');           // O+(1,0) definition, Point
obj('point', 'T3', 'Point(x_)');          // reserved label, Point
obj('point', 'T4', 'Intersect(v,f,1)');   // normal line, Intersect

const body = `<construction title="" author="" date="">\n` + parts.join('\n') + `\n</construction>\n</geogebra>`;
fs.mkdirSync('out', { recursive: true });
const buf = zip([{ name: 'geogebra.xml', data: Buffer.from(header + body, 'utf8') }]);
fs.writeFileSync('out/minitest3.ggb', buf);
console.log('wrote out/minitest3.ggb (' + buf.length + ' bytes)');
