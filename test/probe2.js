const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');const {irToGgb}=require('../src/ggb');
let files=[];function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){let p=path.join(d,e.name);if(e.isDirectory())w(p);else if(/\.gsp$/i.test(e.name))files.push(p)}}w(process.argv[2]);
const r64={},r37={},r69={};
for(const f of files){let ir;try{ir=gspToIR(fs.readFileSync(f))}catch{continue}const by=new Map(ir.objects.map(o=>[o.id,o]));
let r;try{r=irToGgb(ir)}catch{continue}
const bad=new Set();for(const wm of r.warnings){const m=/^skip #(\d+) /.exec(wm);if(m)bad.add(+m[1]);}
for(const o of ir.objects){if(!bad.has(o.id))continue;
 const s=o.parents.map(i=>{const q=by.get(i);return q?('t'+q.srcType):'?'}).join(',');
 if(o.srcType===64){r64['['+s+']']=(r64['['+s+']']||0)+1;}
 if([36,37].includes(o.srcType)){r37['t'+o.srcType+'['+s+']']=(r37['t'+o.srcType+'['+s+']']||0)+1;}
 if(o.srcType===69){r69['['+s+']']=(r69['['+s+']']||0)+1;}
}}
const top=(x,n)=>Object.entries(x).sort((a,b)=>b[1]-a[1]).slice(0,n);
console.log('=== skipped t64 (radius) ===');for(const [k,v] of top(r64,6))console.log('  '+v+'  '+k);
console.log('=== skipped t36/t37 (measure) ===');for(const [k,v] of top(r37,6))console.log('  '+v+'  '+k);
console.log('=== skipped t69 (calc) ===');for(const [k,v] of top(r69,6))console.log('  '+v+'  '+k);
