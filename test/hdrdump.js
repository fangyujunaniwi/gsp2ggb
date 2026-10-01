const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');
const f=process.argv[2];const ir=gspToIR(fs.readFileSync(f));const by=new Map(ir.objects.map(o=>[o.id,o]));
for(const o of ir.objects){if(![49,61,67,109,110,72].includes(o.srcType))continue;
 const h=o._raw.hdr;const u16=[];for(let i=0;i<28;i+=2)u16.push(h.readUInt16LE(i));
 console.log('#'+o.id+' t'+o.srcType+' lab='+JSON.stringify(o.label)+' par=['+o.parents.map(i=>by.get(i)?'t'+by.get(i).srcType:'?').join(',')+'] params=['+(o.params||[]).map(x=>x.toFixed(4)).join(',')+'] hdr16='+u16.join(','));
}
