'use strict';
const fs = require('fs');
const { zip } = require('../../src/zip.js');
const header = `<?xml version="1.0" encoding="utf-8"?>
<geogebra format="4.2" id="minitest9"  xsi:noNamespaceSchemaLocation="http://www.geogebra.org/ggb.xsd" xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
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
function num(label, exp) {
  parts.push(`<expression label="${label}" exp="${exp}" />`);
  parts.push(`<element type="numeric" label="${label}">\n\t<show object="true" label="true"/>\n</element>`);
}
num('s1', 'sqrt(2)');
num('s2', 'abs(-2)');
num('s3', 'ln(2)');
num('s4', 'Min(1, Max(0, 0.5))');
num('s5', 'exp(1)');
const body = `<construction title="" author="" date="">\n` + parts.join('\n') + `\n</construction>\n</geogebra>`;
fs.mkdirSync('out', { recursive: true });
const buf = zip([{ name: 'geogebra.xml', data: Buffer.from(header + body, 'utf8') }]);
fs.writeFileSync('out/minitest9.ggb', buf);
console.log('wrote out/minitest9.ggb');
