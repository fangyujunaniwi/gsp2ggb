const fs=require('fs');const {gspToIR}=require('../src/gsp');
const f=process.argv[2];const ir=gspToIR(fs.readFileSync(f));const by=new Map(ir.objects.map(o=>[o.id,o]));
for(const o of ir.objects){const ch=Object.keys((o._raw&&o._raw.rich)||{}).join(',');
 console.log('#'+o.id+' t'+o.srcType+' kind='+o.kind+' lab='+JSON.stringify(o.label)+' par=['+o.parents.map(i=>i+':'+(by.get(i)?'t'+by.get(i).srcType:':?')).join(',')+'] params=['+(o.params||[]).map(x=>x.toFixed?x.toFixed(3):x).join(',')+'] rich='+ch);}
