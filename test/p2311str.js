const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');
let files=[];function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){let p=path.join(d,e.name);if(e.isDirectory())w(p);else if(/\.gsp$/i.test(e.name))files.push(p)}}w(process.argv[2]);
let shown=0;const seen=new Set();
for(const f of files){let ir;try{ir=gspToIR(fs.readFileSync(f))}catch{continue}
for(const o of ir.objects){const r=(o._raw&&o._raw.rich)||{};if(!r[2311])continue;const b=Buffer.from(r[2311]);
 const s=b.toString('latin1');const runs=s.match(/[\x20-\x7e]{5,}/g)||[];
 for(const run of runs){if(/^[0-9a-f]{10,}$/i.test(run))continue;if(run==='<0>'||/^<[0-9]+>$/.test(run))continue;
  if(!seen.has(run)&&shown<30){seen.add(run);shown++;console.log('t'+o.srcType+' #'+o.id+' lab="'+o.label+'" run='+JSON.stringify(run));}}}}
console.log('runs:',shown);
