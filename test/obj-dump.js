const fs=require('fs');const {gspToIR}=require('../src/gsp');
const ir=gspToIR(fs.readFileSync(process.argv[2]));let n=0;
for(const o of ir.objects){if(o.srcType!==48)continue;if(++n>4)break;console.log('\n### t48 #'+o.id+' kind='+o.kind+' label='+JSON.stringify(o.label)+' parents='+o.parents.length);
for(const r of o._raw.recs){let extra='';if(r.tag===2311||r.tag===2306||r.tag===2307||r.tag===2308||r.tag===2309||r.tag===2310){extra=' ascii='+JSON.stringify(r.pay.toString('latin1').slice(0,80))}console.log('  tag',r.tag,'len',r.pay.length,r.pay.subarray(0,Math.min(r.pay.length,64)).toString('hex'),extra)}}
