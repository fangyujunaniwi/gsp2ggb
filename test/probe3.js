const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');
let files=[];function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){let p=path.join(d,e.name);if(e.isDirectory())w(p);else if(/\.gsp$/i.test(e.name))files.push(p)}}w(process.argv[2]);
const want=new Set([33,34,38,113,120,41,77,90,94]);
const seen={};
for(const f of files){let ir;try{ir=gspToIR(fs.readFileSync(f))}catch(e){continue}const by=new Map(ir.objects.map(o=>[o.id,o]));
for(const o of ir.objects){if(!want.has(o.srcType))continue;seen[o.srcType]=(seen[o.srcType]||0);if(seen[o.srcType]>=8)continue;seen[o.srcType]++;
try{
const pt=o.parents.map(i=>{const q=by.get(i);return i+':t'+(q?q.srcType:'?')+(q&&q.label?'('+q.label+')':'')+(q&&q.coords?'@'+q.coords.x.toFixed(0)+','+q.coords.y.toFixed(0):'')+(q&&q.kind?'['+q.kind+']':'')}).join(' ');
const ri=o._raw&&o._raw.rich;const tags=ri?Object.keys(ri).join(','):'';
console.log('t'+o.srcType+' #'+o.id+' lab='+JSON.stringify(o.label)+' par=['+pt+'] par='+o.params.map(x=>+x.toFixed(3)).join(',')+' rich=['+tags+'] {'+path.basename(f)+'}');
}catch(e){console.log('ERR t'+o.srcType+' #'+o.id+' '+e.message)}}}
console.log('seen',JSON.stringify(seen));
