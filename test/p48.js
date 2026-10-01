const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');
let files=[];function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){let p=path.join(d,e.name);if(e.isDirectory())w(p);else if(/\.gsp$/i.test(e.name))files.push(p)}}w(process.argv[2]);
let shown=0;
for(const f of files){let ir;try{ir=gspToIR(fs.readFileSync(f))}catch{continue}const by=new Map(ir.objects.map(o=>[o.id,o]));
for(const o of ir.objects){if(o.srcType!==48)continue;if(o.parents.length)continue;const r=(o._raw&&o._raw.rich)||{};if(!r[2311])continue;
 if(shown<10){shown++;const b=Buffer.from(r[2311]);console.log('#'+o.id+' lab="'+o.label+'" len='+b.length+' ascii='+JSON.stringify(b.toString('latin1').replace(/[^\x20-\x7e]/g,'.')));console.log('   hex='+b.toString('hex'));}}}
console.log('zero-parent t48 with 2311:',shown);
