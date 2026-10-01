const fs=require('fs');
function readClass(f){const b=fs.readFileSync(f);let p=8;const cpCount=b.readUInt16BE(p);p+=2;const utf=[];for(let i=1;i<cpCount;i++){const tag=b[p];p++;if(tag===1){const len=b.readUInt16BE(p);p+=2;const s=b.toString('latin1',p,p+len);p+=len;utf.push({i,s});}else if(tag===7||tag===8||tag===16){p+=2;}else if(tag===15){p+=3;}else if(tag===3||tag===4||tag===9||tag===10||tag===11||tag===12||tag===17||tag===18){p+=4;}else if(tag===5||tag===6){p+=8;i++;}else{throw new Error('tag '+tag+' at '+p);}}
return utf;}
for(const f of process.argv.slice(2)){const utf=readClass(f);console.log('=== '+f+' count='+utf.length);for(const u of utf)console.log(u.i+': '+JSON.stringify(u.s));}
