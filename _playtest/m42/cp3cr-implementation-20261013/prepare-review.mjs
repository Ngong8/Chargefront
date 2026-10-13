// Targeted before/after sheets. Two compact contact pages/browser avoid loading
// the full image archive into model context; individual pairs remain full-size.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const {chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href);
const root=resolve('_playtest/m42/cp3cr-implementation-20261013'),out=resolve(root,'review');assert(!existsSync(out));mkdirSync(out);
const json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const sourceSha256=createHash('sha256').update(readFileSync('src/world/facility.js')).digest('hex');
const groups=[['01-intake',['H1','H3']],['02-real-cover',['H4','E2','E3']],['03-utility',['H6','H8','H9']],['04-overhead',['H5']],
    ['05-decon',['D1','D3']],['06-research',['R1','R2']],['07-security',['S0','S1']],['08-archive',['C1','C3']],
    ['09-turret-focus',['C4','C0']],['10-power',['P1','P3','P4']]];
const index=['# CP3-C-R implementation — targeted before / after evidence','',
    'Before is the inspected CP3-C working source 62f23aed; after is the approved corrective implementation. Before LEFT, after RIGHT.',
    'Normal gameplay lighting only, seed420042, FOV75, exposure .78, fog40–280, eight slots. E2/E3 use existing M4 emergency lighting.',
    'Player-height and useful elevated views, quiet setup teleports, HUD/viewmodel/squad hidden. This is composition evidence, not walking proof.',
    'Firefox reuses 19 matching inspected before images; its fresh before receipts independently sample the same source and camera poses.',
    '', '| View | Firefox before | Firefox after | Edge before | Edge after |','|---|---|---|---|---|'];
const summaries={checkpoint:'CP3-C-R',sourceSha256,browsers:{}};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{const page=await browser.newPage();
    async function compose(images,width=1600,cellHeight=480){return page.evaluate(async({images,width,cellHeight})=>{
        const cellWidth=width/2,canvas=document.createElement('canvas');canvas.width=width;canvas.height=cellHeight*Math.ceil(images.length/2);
        const ctx=canvas.getContext('2d');ctx.fillStyle='#11151d';ctx.fillRect(0,0,canvas.width,canvas.height);
        for(let i=0;i<images.length;i++){const image=new Image();image.src=images[i].src;await image.decode();const x=i%2*cellWidth,y=Math.floor(i/2)*cellHeight;
            ctx.drawImage(image,x,y+30,cellWidth,cellHeight-30);ctx.fillStyle='#e8eff6';ctx.font='17px sans-serif';ctx.fillText(images[i].label,x+8,y+22);}
        return canvas.toDataURL('image/png').split(',')[1];},{images,width,cellHeight});}
    const image=(stage,name,v)=>({label:(stage==='before'?'BEFORE':'AFTER')+' | '+v.id+' | '+v.mission+' | '+name,
        src:'data:image/png;base64,'+readFileSync(resolve(root,stage,name,v.file)).toString('base64')});
    for(const name of ['firefox','edge']){
        const before=json('before/'+name+'/manifest.json'),after=json('final/'+name+'/manifest.json');assert(after.passed);assert.equal(after.sourceSha256,sourceSha256);
        summaries.browsers[name]={seeds:after.seeds.map(r=>({seed:r.seed,...r.validation,solids:r.state.solids.length,map:r.state.map.length,slots:r.state.slots})),
            views:after.views.map(v=>{const b=before.views.find(r=>r.id===v.id);assert.deepEqual(v.camera,b.camera);assert.equal(v.fov,b.fov);
                return {id:v.id,mission:v.mission,callsBefore:b.render.calls,callsAfter:v.render.calls,trianglesDelta:v.render.triangles-b.render.triangles,programsBefore:b.programs,programsAfter:v.programs};})};
        for(const [label,ids]of groups){const selected=ids.map(id=>after.views.find(v=>v.id===id));const images=selected.flatMap(v=>['before','final'].map(s=>image(s,name,v)));
            const data=await compose(images);writeFileSync(resolve(out,label+'-'+name+'.png'),Buffer.from(data,'base64'));}
        const selections=[['contact-installations',['H1','H6','H5','D1','R2']],['contact-function',['S0','C1','C4','P4','E3']]];
        for(const [label,ids]of selections){const images=ids.flatMap(id=>{const v=after.views.find(v=>v.id===id);return ['before','final'].map(s=>image(s,name,v));});
            const data=await compose(images,1440,435);writeFileSync(resolve(out,label+'-'+name+'.png'),Buffer.from(data,'base64'));}
    }
}finally{await browser.close();}
for(const v of json('final/firefox/manifest.json').views)index.push(`| ${v.id} (${v.mission}) | [PNG](before/firefox/${v.file}) | [PNG](final/firefox/${v.file}) | [PNG](before/edge/${v.file}) | [PNG](final/edge/${v.file}) |`);
index.push('','## Detailed comparison sheets','','| Finding group | Firefox | Edge |','|---|---|---|');
for(const [label]of groups)index.push(`| ${label} | [pair](review/${label}-firefox.png) | [pair](review/${label}-edge.png) |`);
writeFileSync(resolve(root,'SCREENSHOT-INDEX.md'),index.join('\n')+'\n');writeFileSync(resolve(root,'visual-summary.json'),JSON.stringify(summaries,null,2));
console.log(JSON.stringify(summaries,null,2));
