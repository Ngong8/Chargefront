// Native W/Shift/E traversal. Existing guidance solver supplies physical paths;
// no controller or scene semantics are modified to help the probe.
import assert from 'node:assert/strict';import {existsSync,mkdirSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const {firefox,chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href),name=process.argv.includes('firefox')?'firefox':'edge',endless=process.argv.includes('--endless');
const evacuation=process.argv.includes('--evacuation');
const out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m42/cp4/native',(endless?'endless-':evacuation?'evacuation-':'campaign-')+name);assert(!existsSync(out));mkdirSync(out,{recursive:true});
const report={name,mode:endless?'endless':evacuation?'evacuation':'campaign',legs:[],captures:[],waves:[],errors:[]};
const browser=await(name==='firefox'?firefox.launch({headless:true}):chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files','--enable-unsafe-swiftshader']})),page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>report.errors.push(e.message));
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
url.searchParams.set('endlessFixture','1'); // Explicit isolated Endless fixture.
async function boot(){await page.goto(url.href);await page.waitForFunction(()=>window.__cf?.renderer&&window.__cfPerf,undefined,{timeout:120000});}
async function walk(x,y,label){
    const start=Date.now(),route=await page.evaluate(({x,y})=>{const c=__cf;c.pause(false);const solver=ChargefrontRelayRouting.create({world:800,clear:(a,b)=>c.relaySegmentClear([a.x,a.y],[b.x,b.y])});return solver.solve({x:c.player.pos.x,y:c.player.pos.y},{x,y},[{x:c.player.pos.x,y:c.player.pos.y},{x,y}]);},{x,y});
    assert(route.length>=2,'No physical path: '+label);
    for(const target of route.slice(1)){
        let previous=Infinity,stuck=0;const deadline=Date.now()+90000;
        await page.keyboard.down('w');await page.keyboard.down('Shift');
        try{while(Date.now()<deadline){const s=await page.evaluate(target=>{const c=__cf;c.player.yaw=Math.atan2(target.y-c.player.pos.y,target.x-c.player.pos.x);c.player.pitch=0;return {d:Math.hypot(target.x-c.player.pos.x,target.y-c.player.pos.y),inside:c.insideSolid(c.player.pos.x,c.player.pos.y),pos:[c.player.pos.x,c.player.pos.y]};},target);
            assert(!s.inside,'Embedded '+label+JSON.stringify(s));if(s.d<.9)break;
            stuck=s.d>=previous-.03?stuck+1:0;assert(stuck<50,'Native walk stuck '+label+JSON.stringify(s));previous=s.d;await page.waitForTimeout(100);
        }assert(Date.now()<deadline,'Native walk timeout '+label);}finally{await page.keyboard.up('w');await page.keyboard.up('Shift');}
    }
    const state=await page.evaluate(()=>({position:[__cf.player.pos.x,__cf.player.pos.y],squad:__cf.squadInfo(),mission:__cf.missionId,phase:__cf.phaseName}));
    report.legs.push({label,route,seconds:(Date.now()-start)/1000,...state});console.log('NATIVE',name,label,JSON.stringify({seconds:report.legs.at(-1).seconds,position:state.position}));
}
async function capture(id,target){
    await page.evaluate(target=>{const c=__cf;c.setCoverPose(null);if(target){const dx=target[0]-c.player.pos.x,dy=target[1]-c.player.pos.y;c.player.yaw=Math.atan2(dy,dx);c.player.pitch=Math.atan2(target[2]-c.terrainHeight(c.player.pos.x,c.player.pos.y)-c.player.eye,Math.hypot(dx,dy));}document.querySelector('#cf-perf-diagnostics').style.display='none';},target);
    await page.waitForTimeout(350);const state=await page.evaluate(()=>{const c=__cf;c.pause(true);window.cp4nativeRender=true;const f=()=>{if(window.cp4nativeRender){c.render();requestAnimationFrame(f);}};requestAnimationFrame(f);return {mission:c.missionId,phase:c.phaseName,mode:c.mode,position:[c.player.pos.x,c.player.pos.y],camera:c.camera.position.toArray(),exposure:c.renderer.toneMappingExposure,fog:[c.scene.fog.near,c.scene.fog.far]};});
    await page.screenshot({path:resolve(out,id+'.png')});await page.evaluate(()=>{window.cp4nativeRender=false;__cf.pause(false);});report.captures.push({id,...state});assert.equal(state.exposure,.78);
}
async function interact(predicate){await page.keyboard.down('e');try{await page.waitForFunction(predicate,undefined,{timeout:15000});}finally{await page.keyboard.up('e');}}
try{
    await boot();
    if(evacuation){
        // Explicit regional setup; Sample lifecycle/timers are independently
        // tested unaccelerated by facility-e2. No relocation after this setup.
        await page.evaluate(()=>{const c=__cf;c.resetCampaignProgress();c.startMission('dead_signal','new_campaign');c.skipIntro();c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);c.completeMission();c.completeMission();c.clearTestEnemies();c.pause(true);c.setPhase(21);c.move(373-c.player.pos.x,718-c.player.pos.y);c.interact(2);c.move(364-c.player.pos.x,774-c.player.pos.y);for(let i=0;i<c.squad.length;i++){c.squad[i].pos.x=350+i*10;c.squad[i].pos.y=762;}c.interact(2);if(!c.completeStabilization())throw Error('M4 fixture failed');c.clearTestEnemies();c.pause(false);});await page.evaluate(()=>__cf.waitCombatPreparation());
        assert.equal(await page.evaluate(()=>__cf.missionId),'break_contact');
        for(const [x,y]of [[395,752],[407,752],[425,752],[444,752],[456,752]])await walk(x,y,'M4 east exit '+x+','+y);
        await capture('m4-emergency-side-native',[450,752,4]);
        for(const [x,y]of [[462,742],[442,720],[442,690],[420,646],[390,530],[420,405],[445,235],[450,120],[466,99]]){
            await walk(x,y,'M4 evacuation '+x+','+y);if(y===690||y===405||y===120)await capture('m4-evacuation-'+y,[450,80,4]);
        }
        await page.waitForFunction(()=>__cf.phaseName==='M4_CALL_EXTRACTION',undefined,{timeout:10000});await interact(()=>__cf.phaseName==='M4_HOLD_LZ');
        await page.evaluate(()=>{__cf.clearTestEnemies();__cf.completeExtractionHoldout();});await page.waitForFunction(()=>__cf.phaseName==='M4_BOARD',undefined,{timeout:20000});
        await walk(450,84,'M4 boarding approach');await capture('m4-boarding-native',[450,74,4]);await interact(()=>__cf.phaseName==='M4_DEPART');
        await page.waitForFunction(()=>__cf.phaseName==='DONE',undefined,{timeout:20000});assert(await page.evaluate(()=>__cf.campaignProfile.campaignComplete));
    }else if(!endless){
        await page.evaluate(()=>{const c=__cf;c.resetCampaignProgress();c.startMission('dead_signal','new_campaign');c.skipIntro();c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);c.clearTestEnemies();});await page.evaluate(()=>__cf.waitCombatPreparation());await page.waitForFunction(()=>__cf.phaseName==='M1_MOVE_FAC',undefined,{timeout:20000});
        await capture('m1-deployed',[445,235,3]);
        for(const [x,y]of [[445,150],[445,235],[420,405],[390,530],[360,580],[360,614]])await walk(x,y,'M1 '+x+','+y);
        assert.equal(await page.evaluate(()=>__cf.phaseName),'M1_INVESTIGATE');await capture('m1-approach-native',[360,618,4]);
        await walk(324,603,'M1 battery approach');await interact(()=>__cf.phaseName==='M1_RESTORE_POWER');await page.evaluate(()=>__cf.clearTestEnemies());
        await walk(360,615.5,'M1 automatic front door');await page.waitForFunction(()=>__cf.facilityDoors[0].solid.disabled,undefined,{timeout:10000});
        await walk(360,628,'M1 Hall entrance');await walk(346.5,630,'M1 grid console');await interact(()=>__cf.phaseName==='M1_COMMAND');
        await walk(379.2,648,'M1 command records');await interact(()=>__cf.missionId==='power_through');await page.evaluate(()=>__cf.clearTestEnemies());
        await walk(360,628,'M2 Hall departure');await walk(360,621,'M2 front-door approach');
        await page.waitForFunction(()=>__cf.facilityDoors[0].solid.disabled,undefined,{timeout:10000});await walk(360,610,'M2 front-door exit');
        for(const [index,points]of [[0,[[300,575],[211,575]]],[1,[[205,630],[205,665],[224,710],[245,742]]],[2,[[285,690],[285,585],[450,570],[535,580],[569,585]]]]){
            for(const [x,y]of points)await walk(x,y,'M2 '+['Alpha','Beta','Gamma'][index]+' '+x+','+y);
            await capture('m2-'+['alpha','beta','gamma'][index]+'-native',[[205,245,575][index],[575,748,585][index],[4,24,4][index]]);
            await interact(()=>/^DEFEND_R/.test(__cf.phaseName));await page.evaluate(i=>{__cf.completeRelay(i);__cf.clearTestEnemies();},index);
        }
        await page.waitForFunction(()=>__cf.squad.every(m=>!m.downed&&!__cf.insideSolid(m.pos.x,m.pos.y)&&Math.hypot(m.pos.x-__cf.player.pos.x,m.pos.y-__cf.player.pos.y)<24),undefined,{timeout:30000});
        report.follow=await page.evaluate(()=>__cf.squadInfo());
        // Existing E2/playthrough cover every interior room and live Sample Zero.
        // This leg continues through the actual canonical Gamma return gateway.
        for(const [x,y]of [[505,605],[455,600],[400,600],[360,610],[360,615.5]])await walk(x,y,'M2 return '+x+','+y);
        await page.waitForFunction(()=>__cf.facilityDoors[0].solid.disabled,undefined,{timeout:10000});
        for(const [x,y]of [[360,628],[379.2,648]])await walk(x,y,'M2 return '+x+','+y);
        await interact(()=>__cf.missionId==='sample_zero');await capture('m3-front-interior',[360,660,4]);
    }else{
        const template=await page.evaluate(()=>{__cf.startEndlessMode();__cf.saveEndless();return __cf.endlessSaveInfo();});
        for(const [arena,seed]of [['valley',0],['crater',4294967295],['ridges',420042]]){
            await boot();await page.evaluate(({template,arena,seed})=>{const s=structuredClone(template);s.arena=arena;s.run.worldSeed=seed;localStorage.setItem('cf_endless_v1',JSON.stringify(s));const c=__cf;if(!c.continueEndless())throw Error('Continue failed');c.setInvulnerable(true);c.setNoAggro(true);c.pause(false);},{template,arena,seed});await page.evaluate(()=>__cf.waitCombatPreparation());
            const before=await page.evaluate(()=>JSON.stringify(__cf.environmentPlacementSolidsForTest()));
            await capture('endless-'+arena+'-center',[400,400,4]);await walk(470,442,arena+' central exit');await walk(480,405,arena+' outer terrain');await capture('endless-'+arena+'-flank',[400,400,6]);
            await page.evaluate(()=>{__cf.setNoSpawn(false);__cf.startWave();});await page.waitForFunction(()=>__cf.enemies.length>0,undefined,{timeout:20000});
            const spawns=await page.evaluate(()=>__cf.enemies.map(e=>({type:e.type,x:e.pos.x,y:e.pos.y,inside:__cf.insideSolid(e.pos.x,e.pos.y,.35)})));assert(spawns.every(s=>!s.inside));
            await page.waitForFunction(()=>__cf.endless.budgetLeft<=0,undefined,{timeout:60000});await page.evaluate(()=>__cf.clearTestEnemies());await page.waitForFunction(()=>!__cf.endless.waveActive,undefined,{timeout:10000});
            await page.evaluate(()=>__cf.startWave());await page.waitForFunction(()=>__cf.endless.wave===2&&__cf.enemies.length>0,undefined,{timeout:20000});
            report.waves.push({arena,seed,spawns,wave:await page.evaluate(()=>__cf.endless.wave),method:'Real spawn budget/intermission; test-only enemy clearing after wave1 budget exhausted'});
            await page.evaluate(()=>__cf.restartEndless());assert.equal(await page.evaluate(()=>__cf.endless.wave),0);assert.equal(await page.evaluate(()=>JSON.stringify(__cf.environmentPlacementSolidsForTest())),before,'Restart changed scenery');
        }
    }
    assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS CP4 native traversal',name,report.mode);
}finally{await page.keyboard.up('w').catch(()=>{});await page.keyboard.up('Shift').catch(()=>{});await page.keyboard.up('e').catch(()=>{});writeFileSync(resolve(out,'manifest.json'),JSON.stringify(report,null,2));await browser.close();}
