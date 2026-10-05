'use strict';
// Use refimg.ggb's real geogebra.xml header (proven to open) + an image element whose corners
// are ABSOLUTE coords, to confirm the absolute-coordinate startPoint form is accepted.
const fs = require('fs');
const { unzip, zip } = require('../src/zip.js');
const { parseRecords } = require('../src/gsp.js');

const m = unzip(fs.readFileSync('refimg.ggb'));
const xml = m.get('geogebra.xml').toString('utf8');
const header = xml.slice(0, xml.indexOf('<construction'));
const png = parseRecords(fs.readFileSync('D:/Sketchpad5/Sample.gsp')).filter(r => r.tag === 1300)[0].pay.subarray(8);

const body = `<construction title="" author="" date="">
<element type="image" label="pic1">
	<file name="images/image1.png"/>
	<inBackground val="false"/>
	<startPoint number="0" x="0" y="0" z="1"/>
	<startPoint number="1" x="4" y="-2" z="1"/>
	<show object="true" label="true"/>
	<objColor r="0" g="0" b="0" alpha="1"/>
	<layer val="0"/>
	<labelMode val="0"/>
</element>
</construction>
</geogebra>
`;
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/imgtest2.ggb', zip([
  { name: 'geogebra.xml', data: Buffer.from(header + body, 'utf8') },
  { name: 'images/image1.png', data: Buffer.from(png) }
]));
console.log('wrote out/imgtest2.ggb');
