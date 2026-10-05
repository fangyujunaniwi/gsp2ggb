'use strict';
const fs = require('fs');
const { zip } = require('../../src/zip.js');
const header = `<?xml version="1.0" encoding="utf-8"?>
<geogebra format="4.2" id="minitest10"  xsi:noNamespaceSchemaLocation="http://www.geogebra.org/ggb.xsd" xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
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
pt('A', 0, 0); pt('B', 4, 0); pt('C', 2, 3); pt('D', 1, 1); pt('E', 3, 3);
obj('line', 'L', 'Line(A,C)');
obj('conic', 'ker', 'Circle(A,2)');
obj('numeric', 'n', '0.5');
obj('point', 'T1', 'Point(L)');
obj('point', 'T2', 'Point(ker,0.75 - n)');
obj('point', 'T3', 'Point(ker,0.5)');
obj('point', 'F', 'Point(ker,0.25)');
obj('point', 'G', 'Point(ker,0.5)');
obj('conic', 'T4', 'Arc(ker,T3,F)');
obj('point', 'T5', 'Translate(D,(Length(ker))*Vector((0,1)))');
const body = `<construction title="" author="" date="">\n` + parts.join('\n') + `\n</construction>\n</geogebra>`;
fs.mkdirSync('../../out', { recursive: true });
const buf = zip([{ name: 'geogebra.xml', data: Buffer.from(header + body, 'utf8') }]);
fs.writeFileSync('../../out/minitest10.ggb', buf);
console.log('wrote out/minitest10.ggb');
