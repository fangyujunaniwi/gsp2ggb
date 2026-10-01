const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');
for(const f of process.argv.slice(2)){const ir=gspToIR(fs.readFileSync(f));const by=new Map(ir.objects.map(o=>[o.id,o]));
console.log('\n######## '+path.basename(f)+'  objects='+ir.objects.length);
for(const o of ir.objects){const tagl=o._raw.recs.map(r=>r.tag+(r.tag>=2306&&r.tag<=2314?'('+r.pay.length+')':'')).join(',');
console.log(`#${o.id} t${o.srcType} ${o.kind} lab=${JSON.stringify(o.label)} par=[${o.parents.map(i=>i+':t'+(by.get(i)?by.get(i).srcType:'?')).join(' ')}] coords=${o.coords?o.coords.x.toFixed(2)+','+o.coords.y.toFixed(2):'-'} par=${o.params.map(x=>+x.toFixed(4)).join(',')} recs=${tagl}`)}}
