'use strict';
// Extract embedded PNGs from a .gsp and build a minimal .ggb with a GeoGebra <image> element,
// to discover the XML GeoGebra 5.4 accepts for images.
const fs = require('fs');
const { parseRecords } = require('../../src/gsp.js');
const { zip } = require('../../src/zip.js');

const recs = parseRecords(fs.readFileSync(process.argv[2]));
const png = recs.filter(r => r.tag === 1300).map(r => ({
  w: r.pay.readUInt32LE(0), h: r.pay.readUInt32LE(4), data: r.pay.subarray(8)
}));
console.log('images: ' + png.map(p => p.w + 'x' + p.h + '(' + p.data.length + 'B)').join(', '));

const header = `<?xml version="1.0" encoding="utf-8"?>
<geogebra format="4.2" id="imgtest"  xsi:noNamespaceSchemaLocation="http://www.geogebra.org/ggb.xsd" xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
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
const body = `<construction title="" author="" date="">
<element type="point" label="A">
	<show object="true" label="true"/>
	<coords x="0" y="0" z="1"/>
</element>
<element type="image" label="img">
	<show object="true" label="false"/>
	<file name="images/image1.png"/>
	<startPoint x="0" y="0" z="1"/>
	<corner x="4" y="2" z="1"/>
</element>
</construction>
</geogebra>`;

fs.mkdirSync('../../out', { recursive: true });
const entries = [{ name: 'geogebra.xml', data: Buffer.from(header + body, 'utf8') }];
png.forEach((p, i) => entries.push({ name: 'images/image' + (i + 1) + '.png', data: Buffer.from(p.data) }));
fs.writeFileSync('../../out/imgtest.ggb', zip(entries));
console.log('wrote out/imgtest.ggb');
