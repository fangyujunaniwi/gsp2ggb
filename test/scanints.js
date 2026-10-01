const fs=require('fs'),path=require('path');
const base="D:/Backup/Documents/gsp2ggb/ref-ctrl/jar";
function readInts(buf){let p=8;const c=buf.readUInt16BE(p);p+=2;const ints=[];for(let i=1;i<c;i++){const t=buf[p++];
 if(t===1){const l=buf.readUInt16BE(p);p+=2+l;}
 else if(t===3){ints.push(buf.readInt32BE(p));p+=4;}
 else if(t===4){p+=4;}
 else if(t===5||t===6){p+=8;i++;}
 else if(t===7||t===8||t===16||t===19||t===20){p+=2;}
 else if(t===15){p+=3;}
 else if(t===9||t===10||t===11||t===12||t===17||t===18){p+=4;}
 else throw new Error('tag '+t);}
 return ints;}
function walk(d,out){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f,out);else if(f.endsWith('.class'))out.push(f);}return out;}
const files=walk(base,[]);
for(const f of files){let ints;try{ints=readInts(fs.readFileSync(f))}catch{continue}
 const hasT=[8,15,16,17,21,27,29,30,33,34,41,47,48,58,61,62,64,71,72,75,77,90,94,95].filter(t=>ints.includes(t));
 if(ints.includes(2311)||hasT.length>=10)console.log(path.basename(f)+'  ints=['+[...new Set(ints)].sort((a,b)=>a-b).join(',')+']');}
