const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');
let files=[];function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){let p=path.join(d,e.name);if(e.isDirectory())w(p);else if(/\.gsp$/i.test(e.name))files.push(p)}}w(process.argv[2]);
let shown=0;
for(const f of files){let ir;try{ir=gspToIR(fs.readFileSync(f))}catch{continue}const by=new Map(ir.objects.map(o=>[o.id,o]));
for(const o of ir.objects){if(o.srcType!==8)continue;const kinds=o.parents.map(i=>{const q=by.get(i);return q?('t'+q.srcType+(q.kind?q.kind:'')):'?'});
  const bad=kinds.filter(k=>!/t0free|t1midpoint|t15pointOnPath|t9intersectLL|t11|t12|t13|t14|t16|t27|t30|t34|t52|t54|t58|t37/.test(k));
  if(bad.length && shown<25){shown++;console.log('#'+o.id+' lab='+JSON.stringify(o.label)+' par=['+kinds.join(',')+'] {'+path.basename(f)+'}')}}}
console.log('shown',shown);
