// Existing M4-only debris placement, inspection only. No proposed corrections.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const {firefox,chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href);
const root=resolve('_playtest/m42/cp3cr-20261012'),out=resolve(root,'emergency-current');assert(!existsSync(out));mkdirSync(out);
const initial=JSON.parse(readFileSync(resolve(root,'inspection.json'),'utf8'));
const hashes=()=>Object.fromEntries(Object.keys(initial.hashesBefore).map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));
assert.deepEqual(hashes(),initial.hashesBefore);
const report={checkpoint:'CP3-C-R M4 inspection only',errors:[],views:[],debris:[]};
const browser=await firefox.launch({headless:true}),page=await browser.newPage({viewport:{width:1600,height:900}});page.on('pageerror',e=>report.errors.push(e.message));
try {
    const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
    await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});
    await page.evaluate(()=>{const c=__cf,r=Math.random;Math.random=ChargefrontProgression.seedRandom(420042);
        try{c.resetCampaignProgress();c.startMission('dead_signal','new_campaign');}finally{Math.random=r;}
        c.skipIntro();c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);c.completeMission();c.completeMission();c.completeMission();c.clearTestEnemies();});
    await page.evaluate(()=>__cf.waitCombatPreparation());await page.waitForTimeout(1200);
    report.debris=await page.evaluate(()=>{const c=__cf;c.scene.updateMatrixWorld(true);const rows=[];
        c.scene.getObjectByName('ContainmentEmergency').traverse(o=>{if(!o.isMesh||o.geometry.parameters?.width!==5.5||o.geometry.parameters?.depth!==.7)return;
            o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
            rows.push({position:o.position.toArray(),rotation:o.rotation.toArray(),min:b.min.toArray(),max:b.max.toArray(),solidAtCenter:c.insideSolid(o.position.x,o.position.y),
                shotAt1m:c.probeBlocked(o.position.x-2,o.position.y,1,o.position.x+2,o.position.y,1)});});return rows;});
    const poses=[['E1','Containment doorway wreckage',[399,750,null],[405,758,.65],'player-height'],
        ['E2','M4 service route debris',[421,751,null],[415,752,.9],'player-height'],
        ['E3','M4 threshold debris profile',[418,754,3],[415,752,.5],'elevated side']];
    for(const [id,title,pos,target,angle]of poses){
        await page.evaluate(({pos,target})=>{const c=__cf;c.pause(false);c.setHud(false);c.hideViewmodel(true);c.clearTestEnemies();
            c.move(pos[0]-c.player.pos.x,pos[1]-c.player.pos.y);c.setCoverPose([pos[0],pos[1],pos[2]??c.terrainHeight(pos[0],pos[1])+c.player.eye,...target]);
            for(const m of c.squad){m.pos.x=360;m.pos.y=580;m.mesh.visible=false;}document.querySelector('#cf-perf-diagnostics').style.display='none';},{pos,target});
        await page.waitForTimeout(1000);await page.waitForFunction(()=>{const c=__cf,s=c.scene.getObjectByName('LocalLightSlot0');return s.intensity>0&&s.position.distanceTo(c.camera.position)<55;},undefined,{timeout:20000});
        const receipt=await page.evaluate(()=>{const c=__cf;c.pause(true);c.render();window.__cp3crEmergency=true;
            const tick=()=>{if(!window.__cp3crEmergency)return;c.render();requestAnimationFrame(tick);};requestAnimationFrame(tick);
            return {camera:c.camera.position.toArray(),mission:c.missionId,exposure:c.renderer.toneMappingExposure,fog:[c.scene.fog.near,c.scene.fog.far],slots:c.performanceInfo().budgetLights.slots};});
        assert.equal(receipt.mission,'break_contact');assert.equal(receipt.slots,8);assert.equal(receipt.exposure,.78);assert.deepEqual(receipt.fog,[40,280]);
        const file=id+'-current-m4.png';await page.screenshot({path:resolve(out,file)});await page.evaluate(()=>{window.__cp3crEmergency=false;});report.views.push({id,title,angle,file,...receipt});
    }
    assert.deepEqual(report.errors,[]);
}finally{await browser.close();report.hashesAfter=hashes();assert.deepEqual(report.hashesAfter,initial.hashesBefore);report.productUnchanged=true;writeFileSync(resolve(root,'emergency.json'),JSON.stringify(report,null,2));}
const composer=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{const page=await composer.newPage();const images=report.views.map(v=>({label:v.id+' | '+v.angle+' | CURRENT M4',src:'data:image/png;base64,'+readFileSync(resolve(out,v.file)).toString('base64')}));
    const data=await page.evaluate(async images=>{const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=1068;const ctx=canvas.getContext('2d');ctx.fillStyle='#11151c';ctx.fillRect(0,0,1800,1068);
        for(let i=0;i<images.length;i++){const im=new Image();im.src=images[i].src;await im.decode();const x=i%2*900,y=Math.floor(i/2)*534;ctx.drawImage(im,x,y+28,900,506);ctx.fillStyle='#e8edf4';ctx.font='18px sans-serif';ctx.fillText(images[i].label,x+8,y+21);}return canvas.toDataURL('image/png').split(',')[1];},images);
    writeFileSync(resolve(root,'review','E-emergency-current.png'),Buffer.from(data,'base64'));
}finally{await composer.close();}
console.log('PASS M4 inspection, product unchanged',JSON.stringify(report.debris));
