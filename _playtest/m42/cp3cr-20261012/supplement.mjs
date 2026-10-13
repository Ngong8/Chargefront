// Targeted follow-up to two genuine source/bounds concerns, inspection only.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const {firefox,chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href);
const root=resolve('_playtest/m42/cp3cr-20261012'),out=resolve(root,'supplement-current');
assert(!existsSync(out),'Fresh supplementary output required');mkdirSync(out);
const initial=JSON.parse(readFileSync(resolve(root,'inspection.json'),'utf8'));
const hashes=()=>Object.fromEntries(Object.keys(initial.hashesBefore).map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));
assert.deepEqual(hashes(),initial.hashesBefore,'Repository changed since the saved inspection');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),initial.head);
const report={checkpoint:'CP3-C-R inspection supplement',head:initial.head,hashesBefore:hashes(),errors:[],views:[]};
const poses=[
    ['H6','Utility gauge player-height',[336,626,null],[336,623.6,1.8],'player-height'],
    ['H7','Utility gauge side',[339,623,2.6],[336,623.5,1.9],'elevated side'],
    ['H8','Isolated service pipe',[340,643,null],[336,644,3],'player-height'],
    ['C4','Turret base and head',[345,743,null],[342,744,1],'player-height'],
    ['C5','Turret base side',[344.5,745,2.3],[342,744,.8],'elevated side'],
];
const browser=await firefox.launch({headless:true}),page=await browser.newPage({viewport:{width:1600,height:900}});
page.on('pageerror',e=>report.errors.push(e.message));
try {
    const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
    await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});
    await page.evaluate(()=>{const c=__cf,r=Math.random;Math.random=ChargefrontProgression.seedRandom(420042);
        try{c.resetCampaignProgress();if(!c.startMission('dead_signal','new_campaign'))throw Error('Fixture setup failed');}finally{Math.random=r;}
        c.skipIntro();c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);c.completeMission();c.completeMission();c.clearTestEnemies();});
    await page.evaluate(()=>__cf.waitCombatPreparation());await page.waitForTimeout(1200);
    report.turret=await page.evaluate(()=>{const c=__cf;c.scene.updateMatrixWorld(true);
        const t=c.campaignContent.lab.turret;
        return t.group.children.filter(o=>o.isMesh).map(o=>{o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
            return {geometry:o.geometry.type,parameters:o.geometry.parameters,position:o.position.toArray(),min:b.min.toArray(),max:b.max.toArray(),head:o===t.head};});});
    for(const [id,title,pos,target,angle]of poses){
        await page.evaluate(({pos,target})=>{const c=__cf;c.pause(false);c.setHud(false);c.hideViewmodel(true);c.clearTestEnemies();
            c.move(pos[0]-c.player.pos.x,pos[1]-c.player.pos.y);c.setCoverPose([pos[0],pos[1],pos[2]??c.terrainHeight(pos[0],pos[1])+c.player.eye,...target]);
            for(const m of c.squad){m.pos.x=360;m.pos.y=580;m.mesh.visible=false;}document.querySelector('#cf-perf-diagnostics').style.display='none';},{pos,target});
        await page.waitForTimeout(1000);await page.waitForFunction(()=>{const c=__cf,s=c.scene.getObjectByName('LocalLightSlot0');return s.intensity>0&&s.position.distanceTo(c.camera.position)<55;},undefined,{timeout:20000});
        const receipt=await page.evaluate(()=>{const c=__cf;c.pause(true);c.render();window.__cp3crSupplement=true;
            const tick=()=>{if(!window.__cp3crSupplement)return;c.render();requestAnimationFrame(tick);};requestAnimationFrame(tick);
            return {camera:c.camera.position.toArray(),fov:c.camera.fov,exposure:c.renderer.toneMappingExposure,fog:[c.scene.fog.near,c.scene.fog.far],slots:c.performanceInfo().budgetLights.slots};});
        assert.equal(receipt.slots,8);assert.equal(receipt.exposure,.78);assert.deepEqual(receipt.fog,[40,280]);
        const file=id+'-current-normal.png';await page.screenshot({path:resolve(out,file)});await page.evaluate(()=>{window.__cp3crSupplement=false;});
        report.views.push({id,title,angle,file,...receipt});console.log('CAPTURED',id,title);
    }
    assert.deepEqual(report.errors,[]);
}finally{await browser.close();report.hashesAfter=hashes();assert.deepEqual(report.hashesAfter,initial.hashesBefore);
    report.productUnchanged=true;writeFileSync(resolve(root,'supplement.json'),JSON.stringify(report,null,2));}
const composer=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try {const page=await composer.newPage();for(const letter of ['H','C']){
    const images=report.views.filter(v=>v.id.startsWith(letter)).map(v=>({label:v.id+' | '+v.angle+' | CURRENT',src:'data:image/png;base64,'+readFileSync(resolve(out,v.file)).toString('base64')}));
    const data=await page.evaluate(async images=>{const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=534*Math.ceil(images.length/2);const ctx=canvas.getContext('2d');ctx.fillStyle='#11151c';ctx.fillRect(0,0,canvas.width,canvas.height);
        for(let i=0;i<images.length;i++){const im=new Image();im.src=images[i].src;await im.decode();const x=i%2*900,y=Math.floor(i/2)*534;ctx.drawImage(im,x,y+28,900,506);ctx.fillStyle='#e8edf4';ctx.font='18px sans-serif';ctx.fillText(images[i].label,x+8,y+21);}return canvas.toDataURL('image/png').split(',')[1];},images);
    const file=letter==='H'?'H-service-supplement.png':'C-turret-supplement.png';assert(!existsSync(resolve(root,'review',file)));writeFileSync(resolve(root,'review',file),Buffer.from(data,'base64'));
}}finally{await composer.close();}
const rows=initial.measurements.objects;
const near=(a,b)=>Math.abs(a-b)<.05;
const at=(name,x,y)=>rows.find(r=>(!name||r.name===name)&&near(r.center[0],x)&&near(r.center[1],y));
const shape=(w,d,h,x,y)=>rows.find(r=>r.parameters?.width===w&&r.parameters?.depth===d&&r.parameters?.height===h&&near(r.center[0],x)&&near(r.center[1],y));
const overlap=(a,b)=>[0,1,2].map(i=>Math.min(a.max[i],b.max[i])-Math.max(a.min[i],b.min[i]));
const head=report.turret.find(r=>r.head),base=report.turret.find(r=>r.geometry==='CylinderGeometry'&&r.parameters.height===.5);
const sourceGenVent=shape(.8,.12,1.2,432.6,761.94),genFace=at('ServiceGeneratorFace',434,761.95);
const archiveRaw=shape(6,.12,2.8,392,793.95),archiveFace=at('ContainmentFarWall',393,794.05);
const summaries={
    sourceSha256:initial.hashesBefore['src/world/facility.js'],productUnchanged:true,
    hallLongScreen:shape(.12,4.6,.7,386.2,646),hallHost:shape(.9,2,1.1,386.4,646),
    hallWarning:shape(.12,3.4,1.1,388,650),hallToppled:shape(1.8,2.5,1.2,337,656),
    hallGauge:rows.filter(r=>r.geometry==='CylinderGeometry'&&near(r.center[0],336)&&(near(r.center[1],623.6)||near(r.center[1],623.4))),
    hallServicePipe:rows.find(r=>r.geometry==='CylinderGeometry'&&r.parameters.height===8&&near(r.center[0],336)&&near(r.center[1],644)),
    researchPanelOverlap:initial.measurements.researchPanelOverlap,
    archivePanelOverlap:overlap(archiveRaw,archiveFace),archiveLayers:[archiveRaw,archiveFace],
    rearGeneratorVentFaceOverlap:overlap(sourceGenVent,genFace),rearGeneratorLayers:[sourceGenVent,genFace],
    turretHeadBaseGap:head.min[2]-base.max[2],turretBase:base,turretHead:head,
    floorQueries:initial.measurements.floorQueries,glassRails:initial.measurements.glassRails,
    supportGaps:{hallRack:389-at('InteriorIdentityBatch',388.75,648)?.max[0],
        researchWest:at('ResearchWallPanel',331.05,711).min[0]-330.7,
        deconWest:at('DeconWallPanel',331.05,695).min[0]-330.7,
        securityMonitor:389.3-at('SecurityMonitor',388.93,716).max[0],
        containmentWest:at('ContainmentWallPanel',331.05,782).min[0]-330.7,
        archiveUpper:794.3-at('ArchiveMonitorBay',394,794.03).max[1],powerBus:769.3-at('PowerBus',439,769.05).max[1]},
    invariants:{solids:initial.measurements.solids,map:initial.measurements.mapSegments,doors:initial.measurements.doors,slots:initial.measurements.lightSlots},
};
writeFileSync(resolve(root,'MEASUREMENTS.json'),JSON.stringify(summaries,null,2));
console.log('MEASURED',JSON.stringify({supportGaps:summaries.supportGaps,archiveOverlap:summaries.archivePanelOverlap,rearGeneratorOverlap:summaries.rearGeneratorVentFaceOverlap,turretGap:summaries.turretHeadBaseGap}));
console.log('PASS restart recovery and supplementary inspection: all product/test/documentation hashes unchanged');
