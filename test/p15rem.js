const fs=require('fs'),path=require('path');const {gspToIR}=require('../src/gsp');
let files=[];function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){let p=path.join(d,e.name);if(e.isDirectory())w(p);else if(/\.gsp$/i.test(e.name))files.push(p)}}w(process.argv[2]);
const handled=new Set(['segment','line2pt','perpLine','parallelLine','angleBisector','circleOn','circleRadiusSeg','circleRadiusObj','polygon','translateImage','rotateImage','dilateImage','reflectImage']);
const h={};
for(const f of files){let ir;try{ir=gspToIR(fs.readFileSync(f))}catch{continue}const by=new Map(ir.objects.map(o=>[o.id,o]));
for(const o of ir.objects){if(o.srcType!==15)continue;const q=by.get(o.parents[0]);if(!q){h['<none>']=(h['<none>']||0)+1;continue}
 const key=q.kind+'(t'+q.srcType+')';if(handled.has(q.kind))continue;h[key]=(h[key]||0)+1;}}
for(const k of Object.keys(h).sort((a,b)=>h[b]-h[a]))console.log(h[k]+'\t'+k);
