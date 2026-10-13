// Compact indexed paired evidence: publish eight sheets/browser, not the archive.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const {chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href);
const root=resolve('_playtest/m42/cp3c-20261012'),stage=process.argv[2]||'checked',out=resolve(root,'review-'+stage);
assert(!existsSync(out),'Fresh review output required');mkdirSync(out);
const json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const summary={checkpoint:'CP3-C',stage,verdict:'engineering_validation_in_progress',sourceSha256:createHash('sha256').update(readFileSync('src/world/facility.js')).digest('hex'),browsers:{}};
const index=['# CP3-C matched before / after evidence','','Accepted CP3-B baseline `c0bb414`. Normal gameplay lighting only; eight slots, FOV75, exposure .78, fog40–280.','Quiet setup teleports; HUD/viewmodel/squad hidden. These captures are composition evidence, not walking proof.','Seed420042 except R0 uses seed0. Before is always left; after is right.','','| View | Firefox before | Firefox after | Edge before | Edge after |','|---|---|---|---|---|'];
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const groups=[['01-hall',['H1-intake','H2-hall-axis']],['02-vault',['V1-relay']],['03-decon',['D1-process','D2-nozzle-mount']],
    ['04-research',['R1-analysis','R2-workstation']],['05-security',['S1-surveillance','S2-desktop']],['06-containment',['C1-sample-composition','C2-archive']],
    ['07-power',['P1-generator','P2-distribution']],['08-research-growth',['R0-growth-exclusion']]];
try {const page=await browser.newPage();for(const name of ['firefox','edge']) {
    const before=json('before/'+name+'/manifest.json'),after=json(stage+'/'+name+'/manifest.json');assert(after.passed);assert.equal(after.sourceSha256,summary.sourceSha256);
    summary.browsers[name]={passed:after.passed,errors:after.errors,seeds:after.seeds.map(r=>({seed:r.seed,...r.validation,solids:r.state.solids.length,map:r.state.map.length,slots:r.state.slots})),
        views:after.views.map(v=>{const b=before.views.find(b=>b.file===v.file);assert.deepEqual(v.camera,b.camera);return {file:v.file,seed:v.seed,callsBefore:b.render.calls,callsAfter:v.render.calls,trianglesDelta:v.render.triangles-b.render.triangles,programsBefore:b.programs,programsAfter:v.programs};})};
    for(const [label,ids] of groups) {
        const images=ids.flatMap(id=>['before',stage].map(s=>({label:(s==='before'?'BEFORE':'AFTER')+' | '+id+' | '+name,
            src:'data:image/png;base64,'+readFileSync(resolve(root,s,name,id+'-normal.png')).toString('base64')})));
        const data=await page.evaluate(async images=>{const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=480*images.length/2;
            const ctx=canvas.getContext('2d');ctx.fillStyle='#10131c';ctx.fillRect(0,0,canvas.width,canvas.height);
            for(let i=0;i<images.length;i++){const im=new Image();im.src=images[i].src;await im.decode();const x=i%2*800,y=Math.floor(i/2)*480;
                ctx.drawImage(im,x,y+30,800,450);ctx.fillStyle='#e7eef4';ctx.font='17px sans-serif';ctx.fillText(images[i].label,x+8,y+22);}return canvas.toDataURL('image/png').split(',')[1];},images);
        const file=label+'-'+name+'.png';writeFileSync(resolve(out,file),Buffer.from(data,'base64'));
    }
}} finally {await browser.close();}
for(const v of json(stage+'/firefox/manifest.json').views) index.push(`| ${v.label} | [PNG](before/firefox/${v.file}) | [PNG](${stage}/firefox/${v.file}) | [PNG](before/edge/${v.file}) | [PNG](${stage}/edge/${v.file}) |`);
index.push('','## Paired review sheets','','| Area | Firefox | Edge |','|---|---|---|');
for(const [label] of groups) index.push(`| ${label} | [comparison](review-${stage}/${label}-firefox.png) | [comparison](review-${stage}/${label}-edge.png) |`);
writeFileSync(resolve(root,'SCREENSHOT-INDEX-'+stage+'.md'),index.join('\n')+'\n');writeFileSync(resolve(root,'visual-summary-'+stage+'.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary.browsers,null,2));
