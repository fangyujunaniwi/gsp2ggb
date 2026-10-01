const fs=require('fs');
function readClass(f){const b=fs.readFileSync(f);let p=8;const cpCount=b.readUInt16BE(p);p+=2;const utf=[];const entries=[];for(let i=1;i<cpCount;i++){const tag=b[p];p++;if(tag===1){const len=b.readUInt16BE(p);p+=2;const s=b.toString('latin1',p,p+len);p+=len;utf.push({i,tag:'Utf8',s});}else if(tag===7||tag===8||tag===16){p+=2;}else if(tag===15){p+=3;}else if(tag===3||tag===4||tag===9||tag===10||tag===11||tag===12||tag===17||tag===18){p+=4;}else if(tag===5||tag===6){p+=8;i++;}else{throw new Error('tag '+tag+' at '+p);}}
return utf;}
const f=process.argv[2];
const utf=readClass(f);
console.log('=== UTF8 strings in '+f+' (count '+utf.length+') ===');
// print only plausible type/class names (capitalized identifiers) and interesting words
for(const u of utf){if(/^[A-Z][A-Za-z0-9_]{2,}$/.test(u.s)||/type|Type|object|Object|GObject|cons|Cons/.test(u.s))console.log(u.i+': '+u.s);}
