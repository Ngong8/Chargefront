// CP3-C-R inspection only: current placements, no geometry/material/light edits.
// All writes stay in a fresh review-evidence directory. Product hashes are checked.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const {firefox,chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href);
const root=resolve('_playtest/m42/cp3cr-20261012'),raw=resolve(root,'current'),sheets=resolve(root,'review');
assert(!existsSync(raw)&&!existsSync(sheets),'Fresh evidence destinations only');mkdirSync(raw);mkdirSync(sheets);
const tracked=execFileSync('git',['ls-files','chargefront.html','src','tests','MILESTONE-4.2-ENVIRONMENT.md','Credits.txt','FACILITY-ARCHITECTURE.md'],{encoding:'utf8'}).trim().split(/\r?\n/);
tracked.push('tests/facility-interior-refinement.mjs');
const hashes=()=>Object.fromEntries(tracked.map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),before=hashes();
const report={checkpoint:'CP3-C-R inspection only',head,hashesBefore:before,seed:420042,views:[],errors:[],measurements:null};
const views=[
    ['H1','Hall intake player-height',[382.5,648.5,null],[386.2,648,1.35],'player-height'],
    ['H2','Hall intake side',[384,642,null],[386.4,646,1.25],'player-height side'],
    ['H3','Hall intake elevated',[382.5,647,4],[386.4,648,1.25],'elevated'],
    ['H4','Hall ground equipment',[342,651,null],[337,656,1.1],'player-height'],
    ['H5','Hall overhead pipe connections',[336,634,null],[340,628,7.4],'player-height upward'],
    ['V1','Vault housing player-height',[360,679,null],[360,682.5,6.8],'player-height upward'],
    ['V2','Vault rear feed side',[363,682.95,7.4],[360,682.85,7.55],'elevated side'],
    ['V3','Vault support side',[363,680.8,7.5],[360,682.5,8.15],'elevated side'],
    ['D1','Decon frame player-height',[360,693,null],[340,699,4],'player-height'],
    ['D2','Decon post rail floor junction',[344,699,null],[340,701,.35],'player-height side'],
    ['D3','Decon nozzle manifold side',[350,697,7],[360,698,8.25],'elevated side'],
    ['R1','Research bay player-height',[338,715,null],[331,711,3.8],'player-height'],
    ['R2','Research overlapping panel side',[332,718,4],[331,711,3.8],'elevated side'],
    ['R3','Research workstation top',[343,711,3.2],[338,710,1.45],'elevated'],
    ['S1','Security wall installation side',[388,719,null],[389.15,726,4.2],'player-height side'],
    ['S2','Security glass rail side',[388.3,723.8,5],[389.1,726,2.8],'elevated side'],
    ['S3','Security desktop top',[381.7,722,2.65],[383.7,722,1.45],'elevated'],
    ['C1','Containment lower archive layers',[400,790,4.4],[393,794,3.8],'elevated side'],
    ['C2','Containment pods and ground cover',[380,780,null],[376,782,2.3],'player-height'],
    ['C3','Containment wall support side',[333.5,777,null],[331.05,782,4.1],'player-height side'],
    ['P1','Power distribution player-height',[438,766.7,null],[439,769,4.4],'player-height'],
    ['P2','Power distribution wall side',[443,766.8,4.7],[439,769.15,4.4],'elevated side'],
    ['P3','Power feeder wall attachment',[431,767.5,8],[439,769.1,7.75],'elevated side'],
    ['P4','Power generators and aisle',[430,756,null],[434,764,2.1],'player-height'],
];
const browser=await firefox.launch({headless:true});const page=await browser.newPage({viewport:{width:1600,height:900}});
page.on('pageerror',e=>report.errors.push(e.message));
try {
    const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
    await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});
    await page.evaluate(()=>{const c=__cf,r=Math.random;Math.random=ChargefrontProgression.seedRandom(420042);
        try{c.resetCampaignProgress();assertStart();}finally{Math.random=r;}
        function assertStart(){if(!c.startMission('dead_signal','new_campaign'))throw Error('Fixture setup failed');}
        c.skipIntro();c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);c.completeMission();c.completeMission();c.clearTestEnemies();});
    await page.evaluate(()=>__cf.waitCombatPreparation());await page.waitForTimeout(1200);
    report.measurements=await page.evaluate(()=>{
        const c=__cf;c.scene.updateMatrixWorld(true);const rows=[];
        const add=o=>{if(!o.isMesh||!o.geometry.attributes.position)return;o.geometry.computeBoundingBox();
            if(o.name.endsWith('Labels'))return;
            for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){
                const matrix=o.matrixWorld.clone();if(o.isInstancedMesh){const local=matrix.clone();o.getMatrixAt(i,local);matrix.multiply(local);}
                const b=o.geometry.boundingBox.clone().applyMatrix4(matrix);const center=b.getCenter(c.camera.position.clone());
                if(center.x<329||center.x>451||center.y<617||center.y>796)continue;
                rows.push({name:o.name||'(unnamed)',instance:o.isInstancedMesh?i:null,geometry:o.geometry.type,parameters:o.geometry.parameters,
                    center:center.toArray(),min:b.min.toArray(),max:b.max.toArray(),color:o.material.color?.getHex(),opacity:o.material.opacity,
                    renderOrder:o.renderOrder,visible:o.visible});
            }};
        for(const o of c.scene.children)if(o.isMesh&&o.position.x>=329&&o.position.x<=451&&o.position.y>=617&&o.position.y<=796)add(o);
        for(const n of ['DeepLaboratory','InteriorIdentity'])c.scene.getObjectByName(n).traverse(add);
        const find=(name,x,y)=>rows.filter(r=>r.name===name&&Math.abs(r.center[0]-x)<.05&&Math.abs(r.center[1]-y)<.05);
        const overlap=(a,b)=>a&&b?[0,1,2].map(i=>Math.min(a.max[i],b.max[i])-Math.max(a.min[i],b.min[i])):null;
        const rawResearch=rows.find(r=>r.parameters?.width===.12&&r.parameters?.depth===4.8&&r.parameters?.height===2.8&&Math.abs(r.center[0]-331)<.05&&Math.abs(r.center[1]-711)<.05);
        const research=find('ResearchWallPanel',331.05,711)[0];
        const glass=rows.filter(r=>r.parameters?.width===.08&&r.parameters?.depth===6.4&&r.parameters?.height===4.1);
        const rail=rows.filter(r=>r.parameters?.width===.2&&r.parameters?.depth===6.5&&r.parameters?.height===.14);
        const deconRail=rows.filter(r=>r.parameters?.width===40&&r.parameters?.depth===.35&&r.parameters?.height===.35);
        const floorQueries=[[386.4,640],[386.4,646],[386.4,652],[386,650],[337,656],[347,714],[384,722],[434,764]].map(([x,y])=>({x,y,solid:c.insideSolid(x,y)}));
        return {objects:rows,researchPanelOverlap:overlap(rawResearch,research),researchLayers:[rawResearch,research],
            glass,glassRails:rail,deconCrossbars:deconRail,floorQueries,
            lightSlots:c.performanceInfo().budgetLights.slots,solids:c.solidsForTest().length,
            mapSegments:ChargefrontFacility.MAP_SEGMENTS.length+ChargefrontFacility.LAB_MAP_SEGMENTS.length,
            doors:c.facilityDoors.length,mission:c.missionId,playerEye:c.player.eye};
    });
    console.log('MEASUREMENTS',JSON.stringify({researchPanelOverlap:report.measurements.researchPanelOverlap,
        glass:report.measurements.glass.map(r=>({center:r.center,min:r.min,max:r.max})),
        glassRails:report.measurements.glassRails.map(r=>({center:r.center,min:r.min,max:r.max})),
        deconCrossbars:report.measurements.deconCrossbars.map(r=>({center:r.center,min:r.min,max:r.max})),
        floorQueries:report.measurements.floorQueries,playerEye:report.measurements.playerEye}));
    for(const [id,title,pos,target,angle]of views){
        await page.evaluate(({pos,target})=>{const c=__cf;c.pause(false);c.setHud(false);c.hideViewmodel(true);c.clearTestEnemies();
            c.move(pos[0]-c.player.pos.x,pos[1]-c.player.pos.y);c.setCoverPose([pos[0],pos[1],pos[2]??c.terrainHeight(pos[0],pos[1])+c.player.eye,...target]);
            for(const m of c.squad){m.pos.x=360;m.pos.y=580;m.mesh.visible=false;}document.querySelector('#cf-perf-diagnostics').style.display='none';},{pos,target});
        await page.waitForTimeout(1000);await page.waitForFunction(()=>{const c=__cf,s=c.scene.getObjectByName('LocalLightSlot0');return s.intensity>0&&s.position.distanceTo(c.camera.position)<55;},undefined,{timeout:20000});
        const receipt=await page.evaluate(()=>{const c=__cf;c.pause(true);c.render();window.__cp3crRender=true;
            const tick=()=>{if(!window.__cp3crRender)return;c.render();requestAnimationFrame(tick);};requestAnimationFrame(tick);
            return {camera:c.camera.position.toArray(),fov:c.camera.fov,exposure:c.renderer.toneMappingExposure,fog:[c.scene.fog.near,c.scene.fog.far],slots:c.performanceInfo().budgetLights.slots};});
        assert.equal(receipt.exposure,.78);assert.equal(receipt.slots,8);assert.deepEqual(receipt.fog,[40,280]);
        const file=id+'-current-normal.png';await page.screenshot({path:resolve(raw,file)});await page.evaluate(()=>{window.__cp3crRender=false;});
        report.views.push({id,title,angle,file,...receipt});console.log('CAPTURED',id,title);
    }
    assert.deepEqual(report.errors,[]);
}finally{await browser.close();report.hashesAfter=hashes();assert.deepEqual(report.hashesAfter,before,'Inspection changed product/test/documentation files');
    assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),head);report.productUnchanged=true;
    writeFileSync(resolve(root,'inspection.json'),JSON.stringify(report,null,2));}
// Compose existing captures only. No proposed correction is shown in any image.
const composer=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const index=['# CP3-C-R placement-inspection screenshot index','','Current source, not corrected mock-ups. All additional views use normal gameplay lighting; no fill, cutaway or material changes.','Firefox155, seed420042, FOV75, exposure .78, fog40–280, eight slots. HUD/viewmodel/squad hidden; setup camera teleports, not walking proof.','Player-height views use the actual player eye. Elevated/side views are explicitly labeled.','','## New targeted sheets',''];
try{const page=await composer.newPage();for(const [letter,room] of [['H','Hall'],['V','Vault'],['D','Decon'],['R','Research'],['S','Security'],['C','Containment'],['P','Power']]){
    const selected=report.views.filter(v=>v.id.startsWith(letter));const images=selected.map(v=>({label:v.id+' | '+v.angle+' | CURRENT',src:'data:image/png;base64,'+readFileSync(resolve(raw,v.file)).toString('base64')}));
    const data=await page.evaluate(async images=>{const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=534*Math.ceil(images.length/2);
        const ctx=canvas.getContext('2d');ctx.fillStyle='#11151c';ctx.fillRect(0,0,canvas.width,canvas.height);
        for(let i=0;i<images.length;i++){const image=new Image();image.src=images[i].src;await image.decode();const x=i%2*900,y=Math.floor(i/2)*534;
            ctx.drawImage(image,x,y+28,900,506);ctx.fillStyle='#e8edf4';ctx.font='18px sans-serif';ctx.fillText(images[i].label,x+8,y+21);}
        return canvas.toDataURL('image/png').split(',')[1];},images);
    const file=letter+'-'+room.toLowerCase()+'-current.png';writeFileSync(resolve(sheets,file),Buffer.from(data,'base64'));index.push(`- [${room} — current placement angles](review/${file})`);
}}
finally{await composer.close();}
index.push('','## Individual close-ups','','| ID | Subject | Angle | PNG |','|---|---|---|---|');for(const v of report.views)index.push(`| ${v.id} | ${v.title} | ${v.angle} | [PNG](current/${v.file}) |`);
index.push('','## Reused CP3-C evidence','','[Full existing CP3-C index](../cp3c-20261012/SCREENSHOT-INDEX-final-verified.md). The right-hand AFTER columns show the same current product source.');
writeFileSync(resolve(root,'SCREENSHOT-INDEX.md'),index.join('\n')+'\n');
console.log('PASS inspection: product hashes unchanged; 24 normal close-ups, seven sheets');
