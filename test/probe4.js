const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');
let files=[];function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){let p=path.join(d,e.name);if(e.isDirectory())w(p);else if(/\.gsp$/i.test(e.name))files.push(p)}}w(process.argv[2]);
const want=new Set([21,17,33,29,24,47,77,75,32,35]);
const kids=new Map();
let out=[];
for(const f of files){let ir;try{ir=gspToIR(fs.readFileSync(f))}catch{continue}const by=new Map(ir.objects.map(o=>[o.id,o]));
const ch=new Map();for(const o of ir.objects)for(const p of o.parents){const a=ch.get(p)||[];a.push(o);ch.set(p,a);}
for(const o of ir.objects){if(!want.has(o.srcType))continue;
  const labd = o.label && o.label.length ? true : false;
  const pcl = o.parents.map(i=>by.get(i)?('t'+by.get(i).srcType+(by.get(i).label?'('+by.get(i).label+')':'')):'?').join(',');
  const ccl = (ch.get(o.id)||[]).slice(0,5).map(c=>'t'+c.srcType+(c.label?'('+c.label+')':'')).join(',');
  if(labd) out.push('t'+o.srcType+' #'+o.id+' lab='+JSON.stringify(o.label)+' par=['+pcl+'] kids=['+ccl+'] par='+o.params.map(x=>+x.toFixed(3)).join(',')+' {'+path.basename(f)+'}');
}}
console.log(out.slice(0,60).join('\n'));
console.log('labelled count',out.length);
