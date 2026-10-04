'use strict';
// Build a minimal .ggb exercising the suspect commands so we can see GeoGebra's errors.
const fs = require('fs');
const { zip } = require('../../src/zip.js');

const header = `<?xml version="1.0" encoding="utf-8"?>
<geogebra format="4.2" id="minitest"  xsi:noNamespaceSchemaLocation="http://www.geogebra.org/ggb.xsd" xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
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

const body = `<construction title="" author="" date="">
<element type="point" label="O">
	<show object="true" label="true"/>
	<coords x="0" y="0" z="1"/>
	<fixed val="true"/>
</element>
<expression label="x_" exp="Line(O,O+(1,0))" />
<element type="line" label="x_">
	<show object="true" label="false"/>
	<lineStyle thickness="3" type="0" typeHidden="1" opacity="255"/>
</element>
<expression label="f" exp="x + 1" />
<element type="function" label="f">
	<show object="true" label="false"/>
	<lineStyle thickness="3" type="0" typeHidden="1" opacity="255"/>
</element>
<expression label="B" exp="Intersect(x_,f,1)" />
<element type="point" label="B">
	<show object="true" label="false"/>
</element>
<expression label="P" exp="Point(x_)" />
<element type="point" label="P">
	<show object="true" label="false"/>
</element>
<expression label="Q" exp="Intersect(f,x_,1)" />
<element type="point" label="Q">
	<show object="true" label="false"/>
</element>
<expression label="seg" exp="Segment(O,B)" />
<element type="segment" label="seg">
	<show object="true" label="false"/>
</element>
<expression label="pl" exp="ParallelLine(O,seg)" />
<element type="line" label="pl">
	<show object="true" label="false"/>
</element>
</construction>
</geogebra>`;

fs.mkdirSync('out', { recursive: true });
const buf = zip([{ name: 'geogebra.xml', data: Buffer.from(header + body, 'utf8') }]);
fs.writeFileSync('out/minitest.ggb', buf);
console.log('wrote out/minitest.ggb (' + buf.length + ' bytes)');
