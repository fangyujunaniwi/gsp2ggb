const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');
let files=[];function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){let p=path.join(d,e.name);if(e.isDirectory())w(p);else if(/\.gsp$/i.test(e.name))files.push(p)}}w(process.argv[2]);
const pk={};const labels={};let n=0;const samp=[];
for(const f of files){let ir;try{ir=gspToIR(fs.readFileSync(f))}catch{continue}const by=new Map(ir.objects.map(o=>[o.id,o]));
for(const o of ir.objects){if(o.srcType!==58)continue;n++;const q=by.get(o.parents[0]);const k=q?q.kind:'?';pk[k]=(pk[k]||0)+1;
 labels[o.label]=(labels[o.label]||0)+1;
 if(samp.length<20){const flag=(o._raw&&o._raw.rich&&o._raw.rich[2309])?Buffer.from(o._raw.rich[2309]).readUInt32LE(0):'-';samp.push(path.basename(f)+' #'+o.id+' lab="'+o.label+'" p0='+k+' flag2309='+flag+' params='+(o.params||[]).join(','));}}}
console.log('t58 total',n);
console.log('p0 kinds:',Object.entries(pk).sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0]+'='+x[1]).join(' '));
console.log('labels:',Object.entries(labels).sort((a,b)=>b[1]-a[1]).slice(0,12).map(x=>JSON.stringify(x[0])+'='+x[1]).join(' '));
console.log(samp.join('\n'));
