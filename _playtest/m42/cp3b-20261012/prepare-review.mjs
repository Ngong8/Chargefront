// Summarize completed receipts and compose untouched matched before/after PNGs.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const { chromium }=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href);
const root=resolve('_playtest/m42/cp3b-20261012'),out=resolve(root,'review');
assert(!existsSync(out),'Use a fresh review output');mkdirSync(out);
const json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const summary={checkpoint:'CP3-B',verdict:'engineering_pass_manual_review_pending',sourceSha256:createHash('sha256').update(readFileSync('src/world/facility.js')).digest('hex'),browsers:{}};
const index=['# CP3-B matched before / after screenshot index','',
    'Before is accepted CP2-R source 45c05f4. After is final CP3-B source. Same seed420042, camera, normal gameplay lighting, exposure .78 and fog 40–280.',
    'Normal player-eye captures hide HUD/viewmodel/squad and use quiet setup teleports. Two diagnostic mounting views supplement each browser. No proposed CP3-C/D content is shown.',
    '', '| View | Firefox before | Firefox after | Edge before | Edge after |','|---|---|---|---|---|'];
const firefox=json('final/firefox/manifest.json');
for(const v of firefox.views)index.push(`| ${v.label}${v.diagnostic?' (DIAGNOSTIC)':' (NORMAL)'} | [PNG](before/firefox/${v.file}) | [PNG](final/firefox/${v.file}) | [PNG](before/edge/${v.file}) | [PNG](final/edge/${v.file}) |`);
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{const page=await browser.newPage();for(const name of ['firefox','edge']){
    const before=json(`before/${name}/manifest.json`),after=json(`final/${name}/manifest.json`);
    assert(after.passed);assert.equal(after.sourceSha256,summary.sourceSha256);assert.deepEqual(after.errors,[]);
    const results=json(`regression-${name}/results-${name}.json`);assert(results.every(r=>r.status===0));
    const log=readFileSync(resolve(root,`regression-${name}/facility-regression-${name}.log`),'utf8');
    const stress=JSON.parse(log.split(/\r?\n/).find(l=>l.startsWith('A–E traversal ')).slice('A–E traversal '.length));
    const placement=json(`placement-${name}/environment-placement-${name}.json`),enclosure=json(`enclosure/facility-enclosure-${name}.json`);
    assert.deepEqual(placement.errors,[]);assert.deepEqual(enclosure.errors,[]);assert.equal(enclosure.doors.length,6);
    const comparison=after.views.map(v=>{const b=before.views.find(b=>b.file===v.file);return {file:v.file,diagnostic:v.diagnostic,
        callsBefore:b.render.calls,callsAfter:v.render.calls,callsDelta:v.render.calls-b.render.calls,trianglesDelta:v.render.triangles-b.render.triangles,
        programsBefore:b.programs,programsAfter:v.programs};});
    const regions=json(`regression-${name}/traversal-${name}-after-summary.json`).map(r=>({label:r.label,p95:r.summary.p95,worst:r.summary.worst,counters:r.summary.counters}));
    summary.browsers[name]={correctionsPassed:true,seeds:after.seeds.map(r=>({seed:r.seed,removed:r.validation.removedGrowth,signs:r.validation.signs,
        doorSweepHits:r.validation.doorSweepHits,solids:r.state.solids.length,map:r.state.map.length,slots:r.state.slots})),
        results,stress,regions,comparison,enclosure:{states:enclosure.states.map(r=>({mission:r.mission,closed:r.closed,live:r.live,exitClosed:r.liveWithExitClosed})),doors:enclosure.doors,walks:enclosure.walks},
        placement:{cases:placement.cases.length,baselineParity:placement.baselineParity,errors:placement.errors},
        normalTourPrograms:{before:Math.max(...before.views.filter(v=>!v.diagnostic).map(v=>v.programs)),after:Math.max(...after.views.filter(v=>!v.diagnostic).map(v=>v.programs))}};
    const groups=[['01-research-equipment',['R1-analysis-instrument-normal.png','R2-workstation-instrument-normal.png']],
        ['02-readout-security-desk',['R3-workstation-readout-normal.png','S1-desk-monitor-normal.png']],
        ['03-lab-signs',['R4-research-sign-normal.png','S2-security-sign-normal.png']],
        ['04-hall-signs',['H1-sensor-sign-normal.png','H2-supply-sign-normal.png']],
        ['05-mounts-normal',['V1-relay-mount-normal.png','D1-nozzle-mount-normal.png']],
        ['06-growth-exclusion',['D2-growth-exclusion-normal.png']],
        ['07-mounts-diagnostic',['V1-relay-mount-diagnostic.png','D1-nozzle-mount-diagnostic.png']]];
    for(const [label,files] of groups){const images=files.flatMap(file=>['before','final'].map(stage=>({
        label:`${stage==='before'?'BEFORE':'AFTER'} | ${file.replace('.png','')}`,
        src:'data:image/png;base64,'+readFileSync(resolve(root,stage,name,file)).toString('base64')})));
        const data=await page.evaluate(async images=>{const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=480*images.length/2;
            const ctx=canvas.getContext('2d');ctx.fillStyle='#10131c';ctx.fillRect(0,0,canvas.width,canvas.height);
            for(let i=0;i<images.length;i++){const im=new Image();im.src=images[i].src;await im.decode();const x=i%2*800,y=Math.floor(i/2)*480;
                ctx.drawImage(im,x,y+30,800,450);ctx.fillStyle='#e7eef4';ctx.font='17px sans-serif';ctx.fillText(images[i].label,x+8,y+22);}
            return canvas.toDataURL('image/png').split(',')[1];},images);
        const file=`${label}-${name}.png`;writeFileSync(resolve(out,file),Buffer.from(data,'base64'));index.push('');index.push(`- [${label} — ${name} comparison](review/${file})`);
    }
}}
finally{await browser.close();}
writeFileSync(resolve(root,'SCREENSHOT-INDEX.md'),index.join('\n')+'\n');writeFileSync(resolve(root,'validation-summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(summary.browsers).map(([name,r])=>[name,{stress:r.stress,normalTourPrograms:r.normalTourPrograms,
    regions:r.regions.filter(r=>['Facility interior','M4 service/exit'].includes(r.label)),comparison:r.comparison.filter(v=>!v.diagnostic)}])),null,2));
