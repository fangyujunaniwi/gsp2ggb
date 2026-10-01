const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');
let files=[];function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){let p=path.join(d,e.name);if(e.isDirectory())w(p);else if(/\.gsp$/i.test(e.name))files.push(p)}}w(process.argv[2]);
const bypk={};
for(const f of files){let ir;try{ir=gspToIR(fs.readFileSync(f))}catch{continue}const by=new Map(ir.objects.map(o=>[o.id,o]));
for(const o of ir.objects){if(o.srcType!==15)continue;const q=by.get(o.parents[0]);if(!q)continue;const k=q.kind+'/t'+q.srcType;bypk[k]=bypk[k]||{n:0,samples:[]};bypk[k].n++;
if(bypk[k].samples.length<6)bypk[k].samples.push((o.params||[]).map(x=>+x.toFixed(4)).join(','));}}
for(const k of Object.keys(bypk).sort((a,b)=>bypk[b].n-bypk[a].n))console.log(k,bypk[k].n,'e.g.',bypk[k].samples.slice(0,4).join(' | '));
