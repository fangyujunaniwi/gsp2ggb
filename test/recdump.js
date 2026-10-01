const fs=require('fs');const {gspToIR}=require('../src/gsp');
const f=process.argv[2];const want=(process.argv[3]||'').split(',').map(Number);
const ir=gspToIR(fs.readFileSync(f));
for(const o of ir.objects){if(want.length&&!want.includes(o.id))continue;
 console.log('===== #'+o.id+' t'+o.srcType+' lab='+JSON.stringify(o.label)+' par='+JSON.stringify(o.parents));
 for(const r of o._raw.recs){const h=Buffer.from(r.pay);const ascii=h.toString('latin1').replace(/[^\x20-\x7e]/g,'.');
  console.log('  tag'+r.tag+' len='+h.length+' hex='+h.toString('hex').slice(0,160));console.log('         asc='+ascii.slice(0,90));}}
