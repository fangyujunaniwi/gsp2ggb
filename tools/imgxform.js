'use strict';
// Test whether GeoGebra 5.4 accepts transforming an <image> (Translate/Rotate/Dilate/Reflect).
const fs = require('fs');
const { unzip, zip } = require('../src/zip.js');
const ref = unzip(fs.readFileSync('refimg.ggb'));
const header = ref.get('geogebra.xml').toString('utf8').split('<construction')[0];
const png = fs.existsSync('refimg.ggb') ? [...ref.keys()].find(n => /\.png$/.test(n) && !/thumbnail/.test(n)) : null;
const pngData = png ? ref.get(png) : null;

const body = `<construction title="" author="" date="">
<element type="point" label="A"><show object="true" label="true"/><coords x="0" y="0" z="1"/></element>
<element type="point" label="B"><show object="true" label="true"/><coords x="3" y="-2" z="1"/></element>
<element type="image" label="pic">
	<file name="images/image1.png"/><inBackground val="false"/>
	<startPoint number="0" exp="A"/><startPoint number="1" exp="B"/>
	<show object="true" label="false"/>
</element>
<expression label="T" exp="Translate(pic,Vector((2,1)))" />
<element type="image" label="T"><show object="true" label="false"/></element>
<expression label="R" exp="Rotate(pic,90&#176;,A)" />
<element type="image" label="R"><show object="true" label="false"/></element>
<expression label="D" exp="Dilate(pic,2,A)" />
<element type="image" label="D"><show object="true" label="false"/></element>
<expression label="F" exp="Reflect(pic,Line(A,B))" />
<element type="image" label="F"><show object="true" label="false"/></element>
</construction>
</geogebra>
`;
fs.writeFileSync('out/imgxform.ggb', zip([
  { name: 'geogebra.xml', data: Buffer.from(header + body, 'utf8') },
  { name: 'images/image1.png', data: pngData }
]));
console.log('wrote out/imgxform.ggb (png=' + png + ')');
