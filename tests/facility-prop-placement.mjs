// CP3-C-R: immutable current-CP3-C preservation, cover consistency and contacts.
// The existing gameplay/enclosure/placement suites remain independent and unchanged.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const {firefox,chromium}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const name=process.argv.includes('firefox')?'firefox':'edge',stage=process.argv.find(a=>a.startsWith('--stage='))?.slice(8)||'final';
const priority0=process.argv.includes('--priority0'),noCaptures=process.argv.includes('--no-captures');
const root=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m42/cp3cr-implementation-20261013'),out=resolve(root,stage,name);
assert(!existsSync(out),'Fresh stage required');mkdirSync(out,{recursive:true});
const source=readFileSync('src/world/facility.js','utf8'),sha=createHash('sha256').update(source).digest('hex');
if(stage==='before'&&!existsSync(resolve(root,'before-facility.js')))writeFileSync(resolve(root,'before-facility.js'),source);
const baseline=stage==='before'?null:JSON.parse(readFileSync(resolve(root,'before',name,'manifest.json'),'utf8'));
const report={checkpoint:'CP3-C-R',stage,browser:name,priority0,sourceSha256:sha,seeds:[],views:[],errors:[]};
const browser=await(name==='firefox'?firefox.launch({headless:true}):chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files','--enable-unsafe-swiftshader']}));
const page=await browser.newPage({viewport:{width:1600,height:900}});page.on('pageerror',e=>report.errors.push(e.message));
async function load(seed){const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
    await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});
    await page.evaluate(seed=>{const original=CanvasRenderingContext2D.prototype.fillText;window.__placementPlateText={};
        CanvasRenderingContext2D.prototype.fillText=function(...args){if(this.canvas.width===512&&this.canvas.height===4096)window.__placementPlateText[Math.floor(args[2]/96)]=String(args[0]);return original.apply(this,args);};
        const c=__cf,r=Math.random;Math.random=ChargefrontProgression.seedRandom(seed);try{c.resetCampaignProgress();if(!c.startMission('dead_signal','new_campaign'))throw Error('Setup failed');}finally{Math.random=r;}
        c.skipIntro();c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);c.completeMission();c.completeMission();c.clearTestEnemies();},seed);
    await page.evaluate(()=>__cf.waitCombatPreparation());await page.waitForTimeout(1200);}
async function snapshot(){return JSON.parse(JSON.stringify(await page.evaluate(()=>{
    const c=__cf,lab=c.campaignContent.lab;c.scene.updateMatrixWorld(true);const objects=[];
    const add=o=>{if(o.isMesh&&!objects.includes(o))objects.push(o);};
    for(const o of c.scene.children)if(o.isMesh&&o.position.x>=329&&o.position.x<=451&&o.position.y>=617&&o.position.y<=796)add(o);
    for(const n of ['DeepLaboratory','InteriorIdentity','FacilityExterior'])c.scene.getObjectByName(n).traverse(add);
    const near=(a,b)=>Math.abs(a-b)<.05;
    const box=(o,w,d,h)=>o.geometry.parameters?.width===w&&o.geometry.parameters?.depth===d&&o.geometry.parameters?.height===h;
    const mutableNames=new Set(['DeconWallPanel','DeconStatus','ResearchWallPanel','ResearchFarWall','ResearchUpperReturn',
        'SecurityMonitor','SecurityStatus','ContainmentWallPanel','ContainmentFarWall','ArchiveMonitorBay','ContainmentWallRib',
        'PowerBus','PowerBusStatus','PowerWallPanel','PowerWallHousing','CP3CHallpale','CP3CHalldark','CP3CHallsteel','CP3CHallLabels',
        'CP3CContainmentLabels','CP3CPowerdark','CP3CPowerpale','CP3CPowerLabels']);
    const mutable=o=>{const p=o.geometry.parameters||{},x=o.position.x,y=o.position.y;
        if(o.name.startsWith('CP3CR')||mutableNames.has(o.name))return true;
        if(o.name==='InteriorIdentityBatch'&&(box(o,.9,2,1.1)||(p.depth===3.2&&p.height===2.7&&p.width>=.15&&p.width<.34)))return true;
        if(box(o,.12,4.6,.7)&&near(x,386.2)&&near(y,646))return true;
        if(box(o,1.8,2.5,1.2)&&near(x,337)&&near(y,656))return true;
        if(box(o,.12,3.4,1.1)&&[332,388].some(a=>near(x,a)))return true;
        if(box(o,.13,.28,.9)&&[332.07,387.93].some(a=>near(x,a)))return true;
        if(p.radiusTop===.09&&p.height===8&&near(x,336)&&near(y,644))return true;
        if(p.radiusTop===.16&&p.height===56&&near(x,360))return true;
        if(near(x,336)&&[623.4,623.6].some(a=>near(y,a))&&[.03,.06].includes(p.height))return true;
        if(box(o,40,.35,.35)&&near(x,360)&&[695,701].some(a=>near(y,a)))return true;
        if(box(o,.12,4.8,2.8)&&near(x,331)&&[711,726].some(a=>near(y,a)))return true;
        if(box(o,.08,6.4,4.1)&&near(x,389.18))return true;
        if(box(o,.2,6.5,.14)&&near(x,389))return true;
        if(box(o,6,.12,2.8)&&near(y,793.95))return true;
        if(box(o,.8,.12,1.2)&&near(y,761.94))return true;
        if(p.radiusTop===.75&&p.radiusBottom===1&&p.height===.5)return true;
        return false;};
    const mesh=o=>({name:o.name,geometry:o.geometry.type,parameters:o.geometry.parameters,position:o.position.toArray(),rotation:o.rotation.toArray(),scale:o.scale.toArray(),
        count:o.isInstancedMesh?o.count:1,instances:o.isInstancedMesh?Array.from(o.instanceMatrix.array).slice(0,o.count*16):null,
        color:Array.isArray(o.material)?o.material.map(m=>m.color.getHex()):o.material.color?.getHex(),castShadow:o.castShadow,receiveShadow:o.receiveShadow,
        vertices:o.name.endsWith('Labels')?Array.from(o.geometry.attributes.position.array):null});
    const bounds=o=>{o.geometry.computeBoundingBox();const rows=[];
        if(o.name.endsWith('Labels')){const a=o.geometry.attributes.position;for(let i=0;i<a.count;i+=6){const pts=[];for(let j=0;j<6;j++)pts.push(new c.camera.position.constructor().fromBufferAttribute(a,i+j));
            const b=o.geometry.boundingBox.clone().setFromPoints(pts).applyMatrix4(o.matrixWorld);rows.push({name:o.name,index:i/6,min:b.min.toArray(),max:b.max.toArray()});}return rows;}
        for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){const m=o.matrixWorld.clone();if(o.isInstancedMesh){const a=m.clone();o.getMatrixAt(i,a);m.multiply(a);}const b=o.geometry.boundingBox.clone().applyMatrix4(m);rows.push({name:o.name,index:i,min:b.min.toArray(),max:b.max.toArray(),parameters:o.geometry.parameters});}return rows;};
    const glass=objects.filter(o=>box(o,.08,6.4,4.1)&&near(o.position.x,389.18));const rails=objects.filter(o=>box(o,.2,6.5,.14)&&near(o.position.x,389));
    const refs=[lab.securityConsole.group,lab.securityConsole.screen,lab.turretConsole.group,lab.turretConsole.screen,lab.field,lab.turret.head];
    const decorative=glass.concat(rails).every(o=>!refs.includes(o)&&!lab.normalMats.includes(o.material)&&!lab.emergencyMats.includes(o.material));
    const sources=[];c.scene.traverse(o=>{if(!o.isPointLight||o.userData.budgetMode!=='campaign')return;const pos=o.getWorldPosition(c.camera.position.clone()).toArray();
        const entry=lab.lights.find(e=>e.light===o);let intensity=o.intensity;
        if(pos.join(',')==='360,773.16,2.88'){if(intensity<3||intensity>4.4)throw Error('Specimen pulse out of range');intensity='existing specimen pulse';}
        if(entry){intensity=entry.intensity;}sources.push({position:pos,color:entry?entry.color:o.color.getHex(),intensity,emergencyColor:entry?.emergencyColor,range:o.distance,decay:o.decay,shadow:o.castShadow});});
    const shots=[];for(const z of [.4,.8,1.1,1.35,1.45,1.62,1.7,2.1])shots.push({kind:'fallen',z,blocked:c.probeBlocked(334,656,z,340,656,z)});
    for(const y of [714,722])for(const z of [.5,1.3,1.62,1.7])shots.push({kind:'bench',y,z,blocked:c.probeBlocked(344,y,z,350,y,z)});
    for(const y of [712,722])for(const z of [.5,1.55,1.62,1.7])shots.push({kind:'desk',y,z,blocked:c.probeBlocked(380,y,z,386.1,y,z)});
    for(const y of [706,716,726])for(const z of [.8,1.7,4.2,8.8])shots.push({kind:'security wall',y,z,blocked:c.probeBlocked(388,y,z,392,y,z)});
    const points=[[386.4,640],[386.4,646],[386.4,652],[386,650],[360,625],[360,645],[360,672],[360,696],[360,714],[367,718],[373,718],[360,748],[352,774],[430,752],[446,752]];
    const route=points.map(([x,y])=>({x,y,solid:c.insideSolid(x,y)}));
    const emergency=[];c.scene.getObjectByName('ContainmentEmergency').traverse(o=>{if(o.isMesh&&(box(o,5.5,.7,.7)||o.name.startsWith('CP3CRDebris')))emergency.push(...bounds(o));});
    const protectedRows=objects.filter(o=>!mutable(o)&&o!==lab.field&&o!==lab.turret.head).map(mesh).map(r=>JSON.stringify(r)).sort();
    const allBounds=objects.filter(mutable).flatMap(bounds);
    const namedCount=n=>objects.filter(o=>o.name===n).reduce((sum,o)=>sum+(o.isInstancedMesh?o.count:1),0);
    return {protectedRows,allBounds,emergency,plateText:Object.values(window.__placementPlateText),sources,shots,route,
        solids:c.solidsForTest().map(({x0,y0,x1,y1,topY,bottomY,overhead,portal})=>({x0,y0,x1,y1,topY,bottomY,overhead:!!overhead,portal:portal||null})),
        map:[...ChargefrontFacility.MAP_SEGMENTS,...ChargefrontFacility.LAB_MAP_SEGMENTS],sections:c.facilitySections(),
        doors:c.facilityDoors.map(d=>({id:d.id,base:d.base,axis:d.axis,panels:d.panels.map(p=>({offC:p.offC,offO:p.offO,shape:p.g.children[0].geometry.parameters}))})),
        anchors:{security:lab.securityConsole.pos,turretConsole:lab.turretConsole.pos,turret:lab.turret.pos,head:lab.turret.head.position.toArray(),components:lab.turret.group.children.filter(o=>o!==lab.turret.group.children[0]).map(mesh)},
        field:{position:lab.field.position.toArray(),parameters:lab.field.geometry.parameters},
        protectedFeeder:objects.filter(o=>o.name==='CP3CPowersteel').map(mesh),
        cp3b:objects.filter(o=>o.name.startsWith('CP3B')||['ResearchInstrument','ResearchReadout'].includes(o.name)).map(mesh),
        growth:objects.filter(o=>o.geometry.type==='SphereGeometry'&&o.material.color?.getHex()===0xcc44ff).map(mesh),
        retiredLayers:{research:objects.filter(o=>box(o,.12,4.8,2.8)&&near(o.position.x,331)).length,
            archive:objects.filter(o=>box(o,6,.12,2.8)&&near(o.position.y,793.95)).length,
            rearVents:objects.filter(o=>box(o,.8,.12,1.2)&&near(o.position.y,761.94)).length},
        s01:{glass:glass.length,rails:rails.length,decorative},generators:namedCount('ServiceGenerator'),banks:objects.filter(o=>box(o,1.8,2.2,3.5)&&near(o.position.x,387.7)).length,
        slots:c.performanceInfo().budgetLights.slots,total:c.performanceInfo().budgetLights.total,exposure:c.renderer.toneMappingExposure,fog:[c.scene.fog.near,c.scene.fog.far]};
})));}
async function m4Snapshot(){await page.evaluate(()=>{const c=__cf;c.completeMission();c.setNoSpawn(true);c.setNoAggro(true);c.clearTestEnemies();});await page.waitForTimeout(600);
    return page.evaluate(()=>{const c=__cf;const shots=[];for(const [x,y]of [[395,750],[415,752],[405,760],[415.5,759.4]])for(const z of [.5,1,1.62,1.7])shots.push({x,y,z,blocked:c.probeBlocked(x-2,y,z,x+2,y,z)});
        const lane=[];for(let x=412;x<=448;x+=2)for(const y of [750,752,754])lane.push({x,y,solid:c.insideSolid(x,y)});
        return {mission:c.missionId,shots,lane,growth:c.campaignContent.lab.emergency.children.filter(o=>o.isGroup).map(o=>({position:o.position.toArray(),scale:o.scale.toArray(),children:o.children.length}))};});}
const near=(a,b)=>Math.abs(a-b)<1e-4;
function validate(s,b){
    // The initial immutable receipt predates the connected status/plate seating
    // assertions. Exempt only those explicitly approved companion components.
    const companions=new Set(['SecurityStatus','PowerBusStatus','CP3CContainmentLabels']);
    const protectedBefore=b.protectedRows.filter(text=>!companions.has(JSON.parse(text).name));
    const protectedNow=s.protectedRows.filter(text=>!companions.has(JSON.parse(text).name));
    const actual=new Set(protectedNow),expected=new Set(protectedBefore);
    const compact=text=>{const r=JSON.parse(text);return {name:r.name,position:r.position,parameters:r.parameters,count:r.count};};
    const missing=protectedBefore.filter(r=>!actual.has(r)),extra=protectedNow.filter(r=>!expected.has(r));
    assert(missing.length===0&&extra.length===0,'Protected geometry differences: '+JSON.stringify({missing:missing.slice(0,5).map(compact),extra:extra.slice(0,5).map(compact)}));
    assert.equal(protectedNow.length,protectedBefore.length);
    for(const k of ['solids','map','sections','doors','anchors','field','protectedFeeder','cp3b','growth','sources','shots','route','slots','total','exposure','fog'])assert.deepEqual(s[k],b[k],'Preservation: '+k);
    assert.equal(s.solids.length,329);assert.equal(s.map.length,30);assert.equal(s.doors.length,6);assert.equal(s.slots,8);assert.equal(s.generators,4);assert.equal(s.banks,4);
    // Compare the actual native fillText arguments, not font-raster pixels:
    // Firefox canvas readback/antialiasing hashes varied on unchanged text.
    const labels=['INTAKE / ID CHECK','VISITOR RECORDS','RECEPTION / INTAKE',...['R1','R2','R3'].map(n=>n+' / ISOLATE BEFORE SERVICE'),
        'FILTER / INTAKE','PURGE / EXHAUST','FILTER / INTAKE','PURGE / EXHAUST','ANALYSIS / SEALED SAMPLE','ANALYSIS / SEALED SAMPLE',
        'CALIBRATION / OPTICAL','CALIBRATION / OPTICAL','CCTV / LOCAL RECORD','CCTV / LOCAL RECORD',
        ...Array(4).fill('NETWORK / RECORDER'),...Array(4).fill('ARCHIVE / SEALED'),...Array(4).fill('GEN / SERVICE')];
    assert.deepEqual(s.plateText.slice(0,28),labels,'Unapproved plate text changed');
    assert.deepEqual(s.plateText.slice(28),Array(2).fill(priority0?'DISTRIBUTION / ISOLATION':'BUS / REMOTE STATUS'));
    const casing=s.allBounds.find(r=>r.name==='CP3CRFallenCasing');assert(casing);assert(near(casing.min[2],.25)&&casing.max[2]<=1.40001);
    assert(casing.min[0]>=335.5&&casing.max[0]<=338.5&&casing.min[1]>=654.5&&casing.max[1]<=657.5,'Casing exceeds real solid footprint');
    assert.equal(s.emergency.length,3);assert(s.emergency.every(r=>near(r.min[2],.35)&&r.max[2]<.5),'False-cover debris remains');
    assert(!s.allBounds.some(r=>r.parameters?.width===.9&&r.parameters?.depth===2&&r.parameters?.height===1.1),'Decorative shells remain');
    const hits=[];for(const r of s.allBounds.filter(r=>!r.name.endsWith('Labels')).concat(s.emergency))for(const d of s.doors)for(const p of d.panels){const ax=d.axis==='x',half=(ax?p.shape.width:p.shape.depth)/2;
        const a0=Math.min(p.offC,p.offO)-half,a1=Math.max(p.offC,p.offO)+half;const rect=ax?[d.base[0]+a0,d.base[1]-.16,d.base[0]+a1,d.base[1]+.16]:[d.base[0]-.16,d.base[1]+a0,d.base[0]+.16,d.base[1]+a1];
        if(r.min[2]<8.2&&r.max[2]>0&&r.min[0]<rect[2]&&r.max[0]>rect[0]&&r.min[1]<rect[3]&&r.max[1]>rect[1])hits.push(r.name+':'+d.id);}
    assert.deepEqual(hits,[],'Door sweep intrusion');
    if(priority0){assert.equal(s.s01.glass,3);assert.equal(s.s01.rails,6);}else{
        assert.equal(s.s01.glass,0);assert.equal(s.s01.rails,0);
        assert.deepEqual(s.retiredLayers,{research:0,archive:0,rearVents:0});
        for(const r of s.allBounds){let face=null,axis=0;
            if(['DeconWallPanel','DeconStatus','ResearchWallPanel','ContainmentWallPanel','ContainmentWallRib'].includes(r.name))face=r.min[0]<360?330.7:(r.max[0]>400?409.3:389.3);
            if(['SecurityMonitor','SecurityStatus'].includes(r.name))face=389.3;
            if(r.name==='InteriorIdentityBatch'&&r.parameters?.depth===3.2&&r.parameters?.height===2.7)face=r.min[0]<360?331:389;
            if(['ResearchFarWall','ResearchUpperReturn'].includes(r.name)){face=734.3;axis=1;}
            if(['ArchiveMonitorBay','ContainmentFarWall'].includes(r.name)){face=794.3;axis=1;}
            if(r.name==='PowerBus'){face=769.3;axis=1;}
            if(['PowerWallPanel','PowerWallHousing'].includes(r.name)){face=736.7;axis=1;}
            if(face!==null)assert(near(r.min[axis],face)||near(r.max[axis],face),'Unsupported backing: '+r.name);
        }
        const crossbars=s.allBounds.filter(r=>r.name==='CP3CRDeconCrossbar');assert.equal(crossbars.length,2);assert(crossbars.every(r=>near(r.min[2],7.8)));
        const support=s.allBounds.find(r=>r.name==='CP3CRTurretBase');assert(support&&near(support.min[2],.35)&&near(support.max[2],.94));
        const mounts=s.allBounds.filter(r=>r.name==='CP3CRHallPipeMounts');assert.equal(mounts.length,18);assert(mounts.every(r=>r.max[2]<=7.901));
        const runs=s.allBounds.filter(r=>r.name==='CP3CRHallUtilityRun');assert.equal(runs.length,3);assert(runs.every(r=>near(r.min[0],331)&&near(r.max[0],389)),'Pipe endpoints not wall-seated');
        const gauge=s.allBounds.find(r=>r.name==='CP3CRUtilityGauge'),dial=s.allBounds.find(r=>r.name==='CP3CRUtilityGaugeFace');
        assert(gauge&&dial&&near(gauge.min[1],623.6)&&near(gauge.max[1],dial.min[1]),'Gauge rim/face disconnected');
        const riser=s.allBounds.find(r=>r.name==='CP3CRUtilityRiser');assert(riser&&near(riser.min[2],2)&&near(riser.max[2],9),'Utility riser not connected');
        const visitor=s.allBounds.find(r=>r.name==='CP3CHallLabels'&&r.index===1);assert(visitor&&near(visitor.min[2],1.332)&&visitor.min[0]>=385.57&&visitor.max[0]<=386.43,'Visitor plate outside seated intake top');
        const id=s.allBounds.find(r=>r.name==='CP3CHallLabels'&&r.index===0);
        const divider=s.allBounds.find(r=>r.name==='CP3CHalldark'&&Math.abs((r.min[0]+r.max[0])/2-385.089)<.005&&Math.abs((r.min[1]+r.max[1])/2-650)<.005);
        assert(id&&divider&&divider.min[2]>id.max[2],'ID plate still crossed by divider');
    }
    return {preservation:true,cover:true,doorSweepHits:hits,decorativeSecurityBefore:b.s01,contacts:!priority0};}
const views=[
    ['H1',[382.5,648.5,null],[386.2,648,1.35]],['H3',[382.5,647,4],[386.4,648,1.25]],['H4',[342,651,null],[337,656,1.1]],
    ['H5',[336,634,null],[340,628,7.4]],['H6',[336,626,null],[336,623.6,1.8]],['H8',[340,643,null],[336,644,3]],
    ['H9',[340,625,null],[335,621.1,5.2]],['D1',[360,693,null],[340,699,4]],['D3',[350,697,7],[360,698,8.25]],
    ['R1',[338,715,null],[331,711,3.8]],['R2',[332,718,4],[331,711,3.8]],['S0',[381,719,null],[387.7,722,3.2]],
    ['S1',[388,719,null],[389.15,726,4.2]],['C1',[400,790,4.4],[393,794,3.8]],['C3',[333.5,777,null],[331.05,782,4.1]],
    ['C4',[345,743,null],[342,744,1]],['C0',[351,762,null],[361,777,2.8]],['P1',[438,766.7,null],[439,769,4.4]],
    ['P3',[431,767.5,8],[439,769.1,7.75]],['P4',[430,756,null],[434,764,2.1]]];
async function capture(id,pos,target,mission='M3'){
    await page.evaluate(({pos,target})=>{const c=__cf;c.pause(false);c.setHud(false);c.hideViewmodel(true);c.clearTestEnemies();c.move(pos[0]-c.player.pos.x,pos[1]-c.player.pos.y);c.setCoverPose([pos[0],pos[1],pos[2]??c.terrainHeight(pos[0],pos[1])+c.player.eye,...target]);for(const m of c.squad){m.pos.x=360;m.pos.y=580;m.mesh.visible=false;}document.querySelector('#cf-perf-diagnostics').style.display='none';},{pos,target});
    await page.waitForTimeout(1000);await page.waitForFunction(()=>{const c=__cf,s=c.scene.getObjectByName('LocalLightSlot0');return s.intensity>0&&s.position.distanceTo(c.camera.position)<55;},undefined,{timeout:20000});
    const receipt=await page.evaluate(()=>{const c=__cf;c.pause(true);c.render();window.__placementCapture=true;const tick=()=>{if(!window.__placementCapture)return;c.render();requestAnimationFrame(tick);};requestAnimationFrame(tick);return {camera:c.camera.position.toArray(),fov:c.camera.fov,exposure:c.renderer.toneMappingExposure,fog:[c.scene.fog.near,c.scene.fog.far],slots:c.performanceInfo().budgetLights.slots,render:c.performanceInfo().render,programs:c.renderer.info.programs.length};});
    const file=id+'-'+mission+'.png';let reusedFrom=null;
    if(stage==='before'&&name==='firefox'){
        const oldRoot=resolve('_playtest/m42/cp3cr-20261012');const dir=id.startsWith('E')?'emergency-current':['H6','H8','C4'].includes(id)?'supplement-current':'current';
        const old=resolve(oldRoot,dir,id+(mission==='M4'?'-current-m4.png':'-current-normal.png'));
        const inspected=JSON.parse(readFileSync(resolve(oldRoot,'inspection.json'),'utf8'));
        if(existsSync(old)&&inspected.hashesBefore['src/world/facility.js']===sha){copyFileSync(old,resolve(out,file));reusedFrom=old;}
    }
    if(!reusedFrom)await page.screenshot({path:resolve(out,file)});await page.evaluate(()=>{window.__placementCapture=false;});
    report.views.push({id,file,mission,reusedFrom,...receipt});console.log('CAPTURE',stage,name,id,reusedFrom?'reused':'new');
}
try{
    for(const seed of [0,1,2147483647,4294967295,420042]){await load(seed);const state=await snapshot();const row={seed,state};
        if(baseline)row.validation=validate(state,baseline.seeds.find(r=>r.seed===seed).state);
        const m4=await m4Snapshot();row.m4=m4;if(baseline)assert.deepEqual(m4,baseline.seeds.find(r=>r.seed===seed).m4,'M4 projectiles/navigation/growth changed');
        report.seeds.push(row);console.log('CHECK',stage,name,seed,JSON.stringify(row.validation||{s01:state.s01,solids:state.solids.length}));}
    if(!noCaptures){await load(420042);for(const [id,pos,target]of views)await capture(id,pos,target);await m4Snapshot();
        await capture('E2',[421,751,null],[415,752,.9],'M4');await capture('E3',[418,754,3],[415,752,.5],'M4');}
    assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS placement corrections',stage,name);
}finally{writeFileSync(resolve(out,'manifest.json'),JSON.stringify(report,null,2));await browser.close();}
