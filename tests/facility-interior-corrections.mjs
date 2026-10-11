// CP3-B: matched accepted-CP2-R snapshots/captures, exact collision/architecture
// preservation, mounted equipment/sign bounds, and multi-seed growth exclusion.
// Run --stage=before on the accepted source, then use a fresh after stage.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const { firefox, chromium } = await import(process.env.PLAYWRIGHT_PACKAGE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const ff = process.argv.includes('firefox'), name = ff ? 'firefox' : 'edge';
const stage = process.argv.find(a => a.startsWith('--stage='))?.slice(8) || 'after';
const root = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m42/cp3b-20261012');
const out = resolve(root, stage, name); assert(!existsSync(out), 'Choose a fresh stage'); mkdirSync(out, { recursive:true });
const source = readFileSync('src/world/facility.js','utf8');
if(stage==='before'&&!existsSync(resolve(root,'accepted-cp2r-facility.js')))writeFileSync(resolve(root,'accepted-cp2r-facility.js'),source);
const before = stage==='before' ? null : JSON.parse(readFileSync(resolve(root,'before',name,'manifest.json'),'utf8'));
const browser = await (ff ? firefox.launch({headless:true}) : chromium.launch({headless:true,
    executablePath:process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    args:['--allow-file-access-from-files','--enable-unsafe-swiftshader']}));
const page = await browser.newPage({viewport:{width:1600,height:900}}), errors=[];
page.on('pageerror',e=>errors.push(e.message));
const report={stage,browser:name,sourceSha256:createHash('sha256').update(source).digest('hex'),seeds:[],views:[],errors};
async function load(seed){
    const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
    await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});
    await page.evaluate(seed=>{const c=__cf,previous=Math.random;Math.random=ChargefrontProgression.seedRandom(seed);
        try{c.resetCampaignProgress();if(!c.startMission('dead_signal','new_campaign'))throw Error('Campaign setup failed');}
        finally{Math.random=previous;}c.skipIntro();c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);
        c.completeMission();c.completeMission();c.clearTestEnemies();},seed);
    await page.evaluate(()=>__cf.waitCombatPreparation());await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(()=>__cf.missionId),'sample_zero');
}
async function snapshot(){const state=await page.evaluate(()=>{
    const c=__cf;c.scene.updateMatrixWorld(true);const all=[];c.scene.traverse(o=>{if(o.isMesh)all.push(o);});
    const mutable=o=>/^CP3B/.test(o.name)||['ResearchInstrument','ResearchReadout'].includes(o.name)||
        (o.geometry.type==='PlaneGeometry'&&[[331.18,630],[388.82,626],[331,710],[389,717]].some(([x,y])=>o.position.x===x&&o.position.y===y))||
        ([714,722].includes(o.position.y)&&[347,348].includes(o.position.x)&&!o.name&&o.geometry.parameters?.height<1)||
        ([710,728].includes(o.position.y)&&[338,341].includes(o.position.x)&&!o.name&&o.geometry.parameters?.height<=1)||
        (o.position.x===383.7&&[712,722].includes(o.position.y))||(o.position.x===335.7&&o.position.y===718);
    const mesh=o=>({name:o.name,parameters:o.geometry.parameters,position:o.position.toArray(),rotation:o.rotation.toArray(),scale:o.scale.toArray(),
        instances:o.isInstancedMesh?Array.from(o.instanceMatrix.array):null});
    const bounds=o=>{o.geometry.computeBoundingBox();const boxes=[];
        for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){const m=o.matrixWorld.clone();if(o.isInstancedMesh){const a=m.clone();o.getMatrixAt(i,a);m.multiply(a);}
            const b=o.geometry.boundingBox.clone().applyMatrix4(m);boxes.push({name:o.name,min:b.min.toArray(),max:b.max.toArray()});}return boxes;};
    const lab=[];c.campaignContent.lab.root.traverse(o=>{if(o.isMesh&&!mutable(o)&&o!==c.campaignContent.lab.field&&o!==c.campaignContent.lab.turret.head)lab.push(mesh(o));});
    const core=['FacilityHallRoof','FacilityVaultRoof','ResearchCeiling','ContainmentCeiling','EmergencyPassageCeiling','HallEastPerimeterWall',
        'ContainmentNorthReturnWall','LabSouthReturnWallWest','LabSouthReturnWallEast','FacilityRoofCoping','FacilityCraneMast','FacilityNameSign','FacilityEmergencyExitSign','FacilityExitIdentifier'];
    const growth=all.filter(o=>o.geometry.type==='SphereGeometry'&&o.material.color?.getHex()===0xcc44ff)
        .map(o=>({position:o.position.toArray(),radius:o.geometry.parameters.radius}));
    const sourceLights=[];c.scene.traverse(o=>{if(!o.isPointLight||o.userData.budgetMode!=='campaign')return;
        const p=o.getWorldPosition(c.camera.position.clone());if(p.x<295||p.x>465||p.y<600||p.y>800)return;
        sourceLights.push({position:p.toArray(),color:o.color.getHex(),intensity:o.intensity,range:o.distance,decay:o.decay,shadow:o.castShadow});});
    const signs=all.filter(o=>o.geometry.type==='PlaneGeometry'&&mutable(o)).map(o=>({name:o.name,position:o.position.toArray(),
        normal:new c.camera.position.constructor(0,0,1).applyQuaternion(o.quaternion).toArray(),...bounds(o)[0]}));
    const equipment=all.filter(o=>mutable(o)&&o.geometry.type!=='PlaneGeometry').flatMap(bounds);
    const relay=all.filter(o=>o.position.y===682.5&&[350,360,370].includes(o.position.x)).map(mesh);
    const nozzle=all.filter(o=>o.geometry.type==='CylinderGeometry'&&o.position.y===698&&[348,360,372].includes(o.position.x)).map(mesh);
    const exterior=[];c.scene.getObjectByName('FacilityExterior').traverse(o=>{if(o.isMesh)exterior.push(mesh(o));});
    const shots=[];for(const y of [714,722])for(const z of [.5,1,1.3,1.62,1.7,2.1])shots.push({room:'analysis',y,z,blocked:c.probeBlocked(344,y,z,350,y,z)});
    for(const y of [712,722])for(const z of [.5,1.3,1.55,1.62,1.7,2.8])shots.push({room:'security',y,z,blocked:c.probeBlocked(380,y,z,386.1,y,z)});
    for(const y of [710,728])for(const z of [1.3,1.55,1.62,1.7])shots.push({room:'workstation',y,z,blocked:c.probeBlocked(335,y,z,341,y,z)});
    return {solids:c.solidsForTest().map(({x0,y0,x1,y1,topY,bottomY,overhead,portal})=>({x0,y0,x1,y1,topY,bottomY,overhead:!!overhead,portal:portal||null})),
        map:[...ChargefrontFacility.MAP_SEGMENTS,...ChargefrontFacility.LAB_MAP_SEGMENTS],sections:c.facilitySections(),
        core:core.map(n=>mesh(c.scene.getObjectByName(n))),portals:all.filter(o=>o.name==='DoorPortalBatch').map(mesh),
        doors:c.facilityDoors.map(d=>({id:d.id,base:d.base,axis:d.axis,top:d.solid.topY,panels:d.panels.map(p=>({offC:p.offC,offO:p.offO,shape:p.g.children[0].geometry.parameters}))})),
        lab,exterior,relay,nozzle,growth,sourceLights,signs,equipment,shots,slots:c.performanceInfo().budgetLights.slots,
        budgetTotal:c.performanceInfo().budgetLights.total,exposure:c.renderer.toneMappingExposure,fog:[c.scene.fog.near,c.scene.fog.far]};
});return JSON.parse(JSON.stringify(state));}
const overlapsDecon=p=>p.position[0]+p.radius>=330&&p.position[0]-p.radius<=390&&p.position[1]+p.radius>=690&&p.position[1]-p.radius<=704;
function validate(current,baseline){
    for(const key of ['solids','map','sections','core','portals','doors','lab','exterior','relay','nozzle','shots','slots','budgetTotal','exposure','fog'])
        assert.deepEqual(current[key],baseline[key],'Accepted preservation failed: '+key);
    const removed=baseline.growth.filter(overlapsDecon);
    assert.deepEqual(current.growth,baseline.growth.filter(p=>!overlapsDecon(p)),'Legitimate growth changed or interior patch remains');
    const lights=baseline.sourceLights.filter(l=>!removed.some(p=>Math.abs(p.position[0]-l.position[0])<1e-6&&Math.abs(p.position[1]-l.position[1])<1e-6&&l.color===0xaa44ff));
    // animateSpecimenTube uses the existing 3.7 +/- .7 time pulse. Compare its
    // fixed source definition, and bound both samples instead of comparing time.
    const lightDefinition=l=>{if(l.position.join(',')==='360,773.16,2.88'){
        assert(l.intensity>=3&&l.intensity<=4.4);return {...l,intensity:'existing 3.7 +/- .7 pulse'};}return l;};
    assert.deepEqual(current.sourceLights.map(lightDefinition),lights.map(lightDefinition),'Lighting changed beyond excluded interior growth source');
    assert.equal(current.solids.length,329);assert.equal(current.map.length,30);assert.equal(current.slots,8);assert.equal(current.doors.length,6);
    assert.equal(current.signs.length,4);for(const s of current.signs){assert(s.max[2]<8,'Sign ceiling clipping');
        assert(s.max[1]-s.min[1]>3&&s.max[2]-s.min[2]<1.3,'Sign not horizontal/natural');
        assert((s.position[0]<360?s.normal[0]:-s.normal[0])>.999,'Sign not inward facing');}
    const named=n=>current.equipment.filter(b=>b.name===n), eps=1e-5;
    const supported=(device,surface)=>device.min[2]>=surface.min[2]-eps&&device.min[2]<=surface.max[2]+eps&&
        device.min[0]>=surface.min[0]-eps&&device.max[0]<=surface.max[0]+eps&&device.min[1]>=surface.min[1]-eps&&device.max[1]<=surface.max[1]+eps;
    for(const y of [714,722]){const top=named('CP3BAnalysisTop').find(b=>Math.abs((b.min[1]+b.max[1])/2-y)<.01);
        assert(Math.abs(top.min[2]-1.15)<eps);const instrument=named('CP3BAnalysisInstrument').find(b=>Math.abs((b.min[1]+b.max[1])/2-y)<.01);
        assert(supported(instrument,top),'Analysis instrument unsupported');assert(instrument.max[2]<=1.28);
        for(const b of current.equipment.filter(b=>['ResearchInstrument','ResearchReadout'].includes(b.name)))assert(b.max[2]<=1.28);}
    for(const y of [710,728]){const top=named('CP3BWorkstationTop').find(b=>Math.abs((b.min[1]+b.max[1])/2-y)<.01);
        const instrument=named('CP3BWorkstationInstrument').find(b=>Math.abs((b.min[1]+b.max[1])/2-y)<.01);
        assert(Math.abs(top.min[2]-1.4)<eps);assert(supported(instrument,top));assert(instrument.max[2]<=1.53);}
    for(const y of [712,722]){const base=named('CP3BSecurityDisplayBase').find(b=>Math.abs((b.min[1]+b.max[1])/2-y)<.01);
        const screen=named('CP3BSecurityDisplay').find(b=>Math.abs((b.min[1]+b.max[1])/2-y)<.01);
        assert(Math.abs(base.min[2]-1.4)<eps);assert(supported(screen,base));assert(screen.max[2]<1.5);}
    const screen=named('CP3BResearchWorkstationScreen')[0];assert(screen.max[0]>336.25&&screen.max[2]<=1.35,'Readout buried or above cover');
    assert.equal(named('CP3BRelayHanger').length,6);for(const b of named('CP3BRelayHanger')){assert(b.min[2]<=7.7+eps&&b.min[2]>7.65);assert(b.max[2]>=8.92-eps);}
    const manifold=named('CP3BDeconManifold')[0];assert(Math.abs(manifold.min[2]-8.25)<eps);assert.equal(named('CP3BDeconHanger').length,3);
    for(const b of named('CP3BDeconHanger'))assert(b.min[2]<=manifold.max[2]+eps&&b.max[2]>=8.92-eps);
    for(const b of current.equipment.filter(b=>/CeilingMount/.test(b.name)))assert(b.max[2]<=9.001&&b.min[2]>8.9);
    // Added correction meshes must never intersect a door's full panel travel.
    const hits=[];for(const b of current.equipment.filter(b=>/^CP3B/.test(b.name)))for(const d of current.doors)for(const p of d.panels){
        const ax=d.axis==='x',span=ax?p.shape.width:p.shape.depth,a0=Math.min(p.offC,p.offO)-span/2,a1=Math.max(p.offC,p.offO)+span/2;
        const s=ax?[d.base[0]+a0,d.base[1]-.16,d.base[0]+a1,d.base[1]+.16]:[d.base[0]-.16,d.base[1]+a0,d.base[0]+.16,d.base[1]+a1];
        if(b.min[2]<8.2&&b.max[2]>0&&b.min[0]<s[2]&&b.max[0]>s[0]&&b.min[1]<s[3]&&b.max[1]>s[1])hits.push(b.name+':'+d.id);}
    assert.deepEqual(hits,[],'Correction intersects panel sweep');return {removedGrowth:removed,doorSweepHits:hits,signs:current.signs};
}
const views=[
    ['R1-analysis-instrument',[352,714,null],[348,714,1.3]],
    ['R2-workstation-instrument',[344,710,null],[338.8,710,1.55]],
    ['R3-workstation-readout',[341,718,null],[336.3,718,1.02]],
    ['R4-research-sign',[340,710,null],[331,710,6.5]],
    ['S1-desk-monitor',[380.5,722,null],[383.7,722,1.55]],
    ['S2-security-sign',[380,717,null],[389,717,6.5]],
    ['H1-sensor-sign',[337,630,null],[331.45,630,5.95]],
    ['H2-supply-sign',[382,626,null],[388.55,626,5.95]],
    ['V1-relay-mount',[360,674,null],[360,682.5,8]],
    ['D1-nozzle-mount',[362,697,null],[360,698,8.25]],
    ['D2-growth-exclusion',[382,697,null],[388.149,699.746,.8]],
];
async function capture(label,pos,target,diagnostic=false){
    await page.evaluate(({pos,target,diagnostic})=>{const c=__cf;c.pause(false);c.setHud(false);c.hideViewmodel(true);c.clearTestEnemies();
        c.move(pos[0]-c.player.pos.x,pos[1]-c.player.pos.y);c.setCoverPose([pos[0],pos[1],pos[2]??c.terrainHeight(pos[0],pos[1])+c.player.eye,...target]);
        for(const m of c.squad){m.pos.x=360;m.pos.y=580;m.mesh.visible=false;}document.querySelector('#cf-perf-diagnostics').style.display='none';
        if(diagnostic&&!window.__cp3bFill){const h=c.scene.children.find(o=>o.isHemisphereLight),d=c.scene.children.find(o=>o.isDirectionalLight);
            const a=new h.constructor(0xa9c8dd,0x242033,.62),b=new d.constructor(0xb8cee0,.36);b.position.set(120,-80,180);a.castShadow=b.castShadow=false;
            c.scene.add(a,b);window.__cp3bFill=[a,b];}for(const l of window.__cp3bFill||[])l.visible=diagnostic;
    },{pos,target,diagnostic});await page.waitForTimeout(1000);
    await page.waitForFunction(()=>{const c=__cf,s=c.scene.getObjectByName('LocalLightSlot0');return s.intensity>0&&s.position.distanceTo(c.camera.position)<55;},undefined,{timeout:20000});
    const receipt=await page.evaluate(()=>{const c=__cf;c.pause(true);c.render();window.__cp3bRender=true;
        const r=()=>{if(!window.__cp3bRender)return;c.render();requestAnimationFrame(r);};requestAnimationFrame(r);
        return {camera:c.camera.position.toArray(),exposure:c.renderer.toneMappingExposure,fog:[c.scene.fog.near,c.scene.fog.far],
            slots:c.performanceInfo().budgetLights,render:c.performanceInfo().render,programs:c.renderer.info.programs.length};});
    const file=label+(diagnostic?'-diagnostic':'-normal')+'.png';await page.screenshot({path:resolve(out,file)});await page.evaluate(()=>{window.__cp3bRender=false;});
    report.views.push({label,file,diagnostic,...receipt});console.log('CAPTURED',stage,name,file);
}
try{
    for(const seed of [0,1,2147483647,4294967295,420042]){
        await load(seed);const state=await snapshot();const row={seed,state};
        report.seeds.push(row);
        if(before)row.validation=validate(state,before.seeds.find(s=>s.seed===seed).state);
        console.log('CHECK',stage,name,'seed',seed,'growth',state.growth.length);
    }
    for(const [label,pos,target]of views)await capture(label,pos,target);
    for(const [label,pos,target]of views.filter(([l])=>l.startsWith('V1')||l.startsWith('D1')))await capture(label,pos,target,true);
    assert.deepEqual(errors,[]);report.passed=true;console.log('PASS CP3-B corrections',stage,name);
}finally{writeFileSync(resolve(out,'manifest.json'),JSON.stringify(report,null,2));await browser.close();}
