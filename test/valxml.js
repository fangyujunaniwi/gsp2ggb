const fs=require('fs');
const xml=fs.readFileSync(process.argv[2],'utf8');
const re=/<expression label="([^"]*)" exp="([^"]*)"\s*\/>/g;
const labels=new Set();const exprs=[];let m;
while((m=re.exec(xml))){labels.add(m[1]);exprs.push([m[1],m[2].replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')]);}
console.log('labels='+labels.size+' expressions='+exprs.length);
const dups={};for(const [l] of exprs){dups[l]=(dups[l]||0)+1;}
const dupList=Object.entries(dups).filter(x=>x[1]>1);console.log('duplicate labels='+dupList.length, dupList.slice(0,5));
// dependency graph
const dep=new Map();
for(const [l,e] of exprs){const s=new Set();for(const lab of labels){if(lab!==l && new RegExp('(^|[^A-Za-z0-9_])'+lab.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^A-Za-z0-9_]|$)').test(e))s.add(lab);}dep.set(l,s);}
// detect cycles
const color=new Map();const stack=[];let cycles=0;
function dfs(n){color.set(n,1);stack.push(n);for(const d of (dep.get(n)||[])){if(!labels.has(d))continue;if(color.get(d)===1){cycles++;if(cycles<=3)console.log('CYCLE: '+stack.slice(stack.indexOf(d)).join(' -> ')+' -> '+d);}else if(!color.get(d))dfs(d);}color.set(n,2);stack.pop();}
for(const [l] of exprs)if(!color.get(l))dfs(l);
console.log('cycles='+cycles);
// check unresolved refs
let unresolved=0;for(const [l,e] of exprs){/* expressions may use built-in names; report only obvious undefined single-letter refs is hard */}
