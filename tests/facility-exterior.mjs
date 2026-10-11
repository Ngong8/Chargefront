// Matched CP1 -> CP2 exterior views on the actual file:// game. Before receipts
// are immutable; normal lighting/exposure/fog are retained, including eye views.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const {firefox,chromium}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const ff=process.argv.includes('firefox'),browserName=ff?'firefox':'edge';
const stage=process.argv.find(a=>a.startsWith('--stage='))?.slice(8)||'after';
const root=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m42/cp2-20261011');
const out=resolve(root,stage,browserName);assert(!existsSync(out),'Use a fresh stage; preserve earlier captures');mkdirSync(out,{recursive:true});
const source=readFileSync('src/world/facility.js','utf8');
if(stage==='before'&&!existsSync(resolve(root,'cp1-facility-baseline.js')))writeFileSync(resolve(root,'cp1-facility-baseline.js'),source);
const browser=await(ff?firefox:chromium).launch(ff?{headless:true}:{headless:true,
    executablePath:process.env.CHROME_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const report={stage,browser:browserName,seed:420042,sourceSha256:createHash('sha256').update(source).digest('hex'),views:[],errors};
async function fingerprint(){return page.evaluate(()=>{
    const c=__cf,snap=o=>({type:o.type,geometry:o.geometry?.type,parameters:o.geometry?.parameters,
        position:o.position.toArray(),rotation:o.rotation.toArray(),scale:o.scale.toArray(),count:o.count,
        instances:o.isInstancedMesh?Array.from(o.instanceMatrix.array):null,castShadow:o.castShadow,receiveShadow:o.receiveShadow});
    const exterior=c.scene.getObjectByName('FacilityExterior');
    const loading=o=>o.geometry?.type==='PlaneGeometry'&&(o.geometry.parameters.width===9&&o.position.y===668||o.name==='FacilityLoadingSign');
    const lab=[];c.campaignContent.lab.root.traverse(o=>{
        if(!o.geometry||o===c.campaignContent.lab.field||o===c.campaignContent.lab.turret.head)return;
        // The shared outer-exit sign is the only permitted boundary-sign correction.
        if(o.geometry.type==='PlaneGeometry'&&(o.position.x===449&&o.position.y===752||o.name==='FacilityEmergencyExitSign'))return;
        lab.push(snap(o));
    });
    const core=['FacilityHallRoof','FacilityVaultRoof','ResearchCeiling','ContainmentCeiling','EmergencyPassageCeiling','HallEastPerimeterWall','ContainmentNorthReturnWall']
        .map(name=>({name,...snap(c.scene.getObjectByName(name))}));
    return {solids:c.environmentPlacementSolidsForTest(),core,lab,
        exteriorOriginal:exterior.children.filter(o=>o.isMesh&&!o.name.startsWith('ExteriorIdentity')&&!loading(o)).map(snap),
        sections:c.facilitySections(),terrain:[[360,610],[360,640],[360,696],[360,718],[430,752],[457,752],[296,690]].map(([x,y])=>c.terrainHeight(x,y))};
});}
async function view(label,position,target,eye=false){
    await page.evaluate(({position,target,eye})=>{
        const c=__cf;c.pause(false);c.setCoverPose(null);c.setHud(eye);c.hideViewmodel(!eye);
        c.move(position[0]-c.player.pos.x,position[1]-c.player.pos.y);
        const z=position[2]===null?c.terrainHeight(position[0],position[1])+c.player.eye:position[2];
        const tz=target[2]===null?c.terrainHeight(target[0],target[1])+c.player.eye:target[2];
        c.player.yaw=Math.atan2(target[1]-position[1],target[0]-position[0]);c.player.pitch=Math.atan2(tz-z,Math.hypot(target[0]-position[0],target[1]-position[1]));
        if(!eye)c.setCoverPose([position[0],position[1],z,target[0],target[1],tz]);
        for(const m of c.squad){const p=m.formationSpot();m.pos.x=p.x;m.pos.y=p.y;}
        document.querySelector('#cf-perf-diagnostics').style.display='none';
    },{position,target,eye});
    await page.waitForTimeout(650);await page.evaluate(()=>__cf.pause(true));
    const receipt=await page.evaluate(()=>{
        const c=__cf;c.render();const gl=c.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
        return {camera:c.camera.position.toArray(),forward:c.getCamFwd(),fov:c.camera.fov,exposure:c.renderer.toneMappingExposure,
            fog:[c.scene.fog.near,c.scene.fog.far],mission:c.missionId,phase:c.phaseName,world:c.performanceInfo(),programs:c.renderer.info.programs.length,
            renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null};
    });
    await page.evaluate(()=>{window.__exteriorCapture=true;const render=()=>{if(!window.__exteriorCapture)return;__cf.render();requestAnimationFrame(render);};requestAnimationFrame(render);});
    await page.screenshot({path:resolve(out,label+'.png')});await page.evaluate(()=>window.__exteriorCapture=false);
    report.views.push({label,eye,...receipt});console.log('CAPTURED',label,JSON.stringify({calls:receipt.world.render.calls,triangles:receipt.world.render.triangles,camera:receipt.camera}));
}
try{
    const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
    await page.goto(url.href);await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});
    await page.evaluate(()=>{const c=__cf,old=Math.random;Math.random=ChargefrontProgression.seedRandom(420042);
        try{c.resetCampaignProgress();if(!c.startMission('dead_signal','new_campaign'))throw Error('Campaign setup failed');}finally{Math.random=old;}
        c.skipIntro();c.completeMission();c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);c.clearTestEnemies();});
    await page.evaluate(()=>__cf.waitCombatPreparation());await page.waitForTimeout(2000);
    report.structure=await fingerprint();
    await view('lz-facing',[450,150,null],[360,650,5],true);
    await view('road-facing',[360,548,null],[360,618,5],true);
    await view('main-entrance',[360,597,null],[360,618,5],true);
    await view('west-side',[309,640,null],[330,639,5],true);
    await view('east-side',[414,640,null],[390,640,5],true);
    await view('service-yard',[448,680,null],[413,660,5],true);
    await view('rear-perimeter',[465,820,42],[375,710,5]);
    await view('overview',[450,625,82],[376,705,2]);
    await page.evaluate(()=>{__cf.setCoverPose(null);__cf.pause(false);__cf.completeMission();__cf.completeMission();__cf.clearTestEnemies();if(__cf.missionId!=='break_contact')throw Error('M4 setup failed');});
    await view('service-wing',[472,766,null],[450,752,6],true);
    await view('emergency-exit',[464,752,null],[449,752,6.3],true);
    // Real eye-level W traversal: unlocked front door opens by proximity.
    await page.evaluate(()=>{const c=__cf;c.setCoverPose(null);c.pause(false);c.setHud(true);c.hideViewmodel(false);c.move(360-c.player.pos.x,601-c.player.pos.y);c.player.yaw=Math.PI/2;c.player.pitch=.08;});
    await page.keyboard.down('w');await page.waitForTimeout(3500);await page.keyboard.up('w');
    const walk=await page.evaluate(()=>({pos:[__cf.player.pos.x,__cf.player.pos.y],inside:__cf.insideSolid(__cf.player.pos.x,__cf.player.pos.y)}));
    assert(walk.pos[1]>619&&!walk.inside,'Native entrance traversal failed');report.walk=walk;
    await view('entrance-traversal',[360,walk.pos[1],null],[360,630,3],true);
    report.resources=await page.evaluate(()=>{
        const c=__cf,geometry=new Set(),materials=new Set(),textures=new Set();
        c.scene.traverse(o=>{if(o.geometry)geometry.add(o.geometry.uuid);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m.uuid);if(m.map)textures.add(m.map.uuid);}});
        return {geometries:geometry.size,materials:materials.size,textures:textures.size,world:c.performanceInfo()};
    });
    if(stage!=='before'){
        const before=JSON.parse(readFileSync(resolve(root,'before',browserName,'manifest.json'),'utf8'));
        assert.equal(report.resources.world.counts.lights,before.resources.world.counts.lights,'Exterior pass added lights');
        assert.equal(report.resources.world.budgetLights.slots,8,'Fixed light slots changed');
        assert.equal(report.resources.world.budgetLights.total,before.resources.world.budgetLights.total,'Exterior pass added light sources');
        report.mountedClearance=await page.evaluate(()=>{
            const c=__cf,parts=[],violations=[];c.scene.updateMatrixWorld(true);
            const inspect=node=>{
                if(!node)return; // S2/S5 removed by the approved CP2-R2 pass
                if(node.isLight)violations.push('new light '+node.name);
                if(!node.isMesh)return;
                if(node.castShadow)violations.push('new shadow caster '+node.name);
                node.geometry.computeBoundingBox();
                const count=node.isInstancedMesh?node.count:1;
                for(let i=0;i<count;i++){
                    const matrix=node.matrixWorld.clone();
                    if(node.isInstancedMesh){const instance=new node.matrix.constructor();node.getMatrixAt(i,instance);matrix.multiply(instance);}
                    const b=node.geometry.boundingBox.clone().applyMatrix4(matrix);parts.push({name:node.name,min:b.min.toArray(),max:b.max.toArray()});
                    if(b.min.z<3.25){
                        // R2 allows shallow service cabinets and their feeds at
                        // usable height. They must remain within actor stand-off.
                        const service=/MaintenanceCabinet|CabinetStatus|WallRaceway/.test(node.name);
                        const projection=b.min.x>410?735.3-b.min.y:b.max.x<330?329-b.min.x:b.max.x-391;
                        // Cabinet body <= .30 m, status trim adds .03 m; the
                        // complete assembly stays inside the .40 m actor radius.
                        if(!service||b.min.z<.3||projection>.35)violations.push('ground/low obstacle '+node.name);
                    }
                }
            };
            c.scene.getObjectByName('ExteriorIdentity').traverse(inspect);
            for(const name of ['ExteriorIdentityAirSign','ExteriorIdentityArchiveSign','FacilityEmergencyExitSign'])inspect(c.scene.getObjectByName(name));
            // Accepted R1 8.2 m panels/.32 m depth, swept along the exact long
            // extent supplied by doorPlacementZones (remove its .5 m shoulder).
            const sweeps=c.environmentPlacementZones().filter(z=>z.id.startsWith('door:')).map(z=>{
                const x=(z.x0+z.x1)/2,y=(z.y0+z.y1)/2,axisX=z.x1-z.x0>z.y1-z.y0;
                return {id:z.id,x0:axisX?z.x0+.5:x-.16,x1:axisX?z.x1-.5:x+.16,
                    y0:axisX?y-.16:z.y0+.5,y1:axisX?y+.16:z.y1-.5};
            });
            for(const p of parts)for(const s of sweeps){
                if(p.min[2]<8.2-1e-4&&p.max[2]>0&&p.min[0]<s.x1-1e-4&&p.max[0]>s.x0+1e-4&&p.min[1]<s.y1-1e-4&&p.max[1]>s.y0+1e-4)
                    violations.push(p.name+' intersects '+s.id);
            }
            return {pieces:parts.length,minimumZ:Math.min(...parts.map(p=>p.min[2])),doorSweeps:sweeps.length,violations};
        });
        assert.deepEqual(report.mountedClearance.violations,[],'Mounted detail interferes with accepted doors/ground/light budget');
        // CP2-R1 (approved AC-1..AC-4) deliberately changes facility structure:
        // shell/lab walls, roof slabs, door heights, legacy frames and roof trims.
        // Facility structure is now guarded by tests/facility-enclosure.mjs; this
        // CP2 harness keeps exact seeded scenery, terrain and section parity.
        const envelope=s=>s.x0>=328.9&&s.x1<=451.1&&s.y0>=616.5&&s.y1<=796;
        report.structure.solids=report.structure.solids.filter(s=>!envelope(s));
        before.structure.solids=before.structure.solids.filter(s=>!envelope(s));
        before.structure.sections=before.structure.sections.map(s=>s.name==='hall'?{...s,objects:s.objects-2}:s); // retired y690 trims
        for(const key of ['solids','terrain','sections']) {
            // The existing rear utility sign also faces its actual exterior
            // observer now, rather than exposing mirrored back-face lettering.
            const preserved=data=>key==='exteriorOriginal'?data.filter(p=>!(p.geometry==='PlaneGeometry'&&p.position[0]===430&&p.position[1]===770.85))
                .map(p=>p.geometry==='CylinderGeometry'&&p.parameters.height===8&&p.position[0]===437&&p.position[1]===674?
                    {...p,position:[437,674,0]}:p):data;
            assert.deepEqual(JSON.parse(JSON.stringify(preserved(report.structure[key]))),preserved(before.structure[key]),'Preserved '+key+' changed');
        }
        report.craneSupport=await page.evaluate(()=>{
            const c=__cf,m=c.scene.getObjectByName('FacilityCraneMast'),samples=[];
            for(const dx of [-.35,0,.35])for(const dy of [-.35,0,.35])samples.push(c.terrainHeight(437+dx,674+dy));
            return {bottom:m.position.z-4,highest:Math.max(...samples),lowest:Math.min(...samples),geometry:m.geometry.parameters};
        });
        assert(Math.abs(report.craneSupport.bottom-report.craneSupport.highest)<1e-6,'Existing crane mast is not grounded');
        report.comparison=report.views.map(v=>{const b=before.views.find(b=>b.label===v.label);return {label:v.label,callsBefore:b.world.render.calls,callsAfter:v.world.render.calls,
            trianglesBefore:b.world.render.triangles,trianglesAfter:v.world.render.triangles,programsBefore:b.programs,programsAfter:v.programs};});
    }
    assert.deepEqual(errors,[]);console.log('PASS exterior capture/structural preservation',stage,browserName);
}finally{
    await page.keyboard.up('w');writeFileSync(resolve(out,'manifest.json'),JSON.stringify(report,null,2));await browser.close();
}
