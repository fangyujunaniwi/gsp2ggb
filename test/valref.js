const fs=require('fs');
const xml=fs.readFileSync(process.argv[2],'utf8');
const labels=new Set();
for(const m of xml.matchAll(/<element type="[^"]*" label="([^"]*)"/g))labels.add(m[1]);
const exprs=[];function dec(s){return s.replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
for(const m of xml.matchAll(/<expression label="([^"]*)" exp="([^"]*)"\s*\/>/g))exprs.push([m[1],dec(m[2])]);
const builtins=new Set(['x','y','z','cos','sin','tan','sqrt','abs','exp','ln','log','pi','e','Distance','Segment','Line','Circle','Midpoint','PerpendicularLine','ParallelLine','AngleBisector','Angle','Intersect','Point','Length','Slope','Translate','Rotate','Dilate','Reflect','Polygon','Vector','Foot','Element','Vertex','Radius','Area','Perimeter','min','max','round','floor','ceil','if','sinh','cosh','tanh','atan','asin','acos','atan2','undefined','true','false','Cone','Sphere']);
const undecl={};
for(const [l,e] of exprs){for(const id of (e.match(/[A-Za-z_][A-Za-z0-9_']*/g)||[])){if(builtins.has(id))continue;if(!labels.has(id))undecl[id]=(undecl[id]||0)+1;}}
const arr=Object.entries(undecl).sort((a,b)=>b[1]-a[1]);
console.log('elements(+expr labels)='+labels.size+' undefined identifiers='+arr.length);
for(const [k,v] of arr.slice(0,25))console.log('  '+v+'  '+k);
