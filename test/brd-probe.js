const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');
const f=process.argv[2];const ir=gspToIR(fs.readFileSync(f));const by=new Map(ir.objects.map(o=>[o.id,o]));
let shown={48:0,0:0,71:0,69:0};
for(const o of ir.objects){if(shown[o.srcType]===undefined||shown[o.srcType]>=3)continue;const rich=o._raw&&o._raw.rich;if(!rich||!rich[2311])continue;shown[o.srcType]++;const p=rich[2311];console.log('=== srcType',o.srcType,'kind',o.kind,'label',JSON.stringify(o.label),'len',p.length,'parents',o.parents.length);
console.log(p.subarray(0,Math.min(p.length,220)).toString('hex').replace(/(.{32})/g,'$1\n'));
console.log('ascii:',JSON.stringify(p.subarray(0,Math.min(p.length,220)).toString('latin1')));}
