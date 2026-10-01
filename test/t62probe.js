const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');
const ir=gspToIR(fs.readFileSync("D:\\Program Files (x86)\\Sketchpad5\\Sample.gsp"));let n=0;
for(const o of ir.objects){if(o.srcType!==62)continue;if(n++>6)break;const ri=o._raw.rich||{};const tags=Object.keys(ri);
console.log('#'+o.id+' lab='+JSON.stringify(o.label)+' par='+o.parents.length+' rich=['+tags.map(t=>t+':'+(ri[t]?ri[t].length:0)).join(', ')+'] bt='+(ri[2310]?JSON.stringify(ri[2310].toString('latin1').slice(0,40)):'-'))}
