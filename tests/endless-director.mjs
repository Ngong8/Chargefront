// CP3-B focused Edge runtime: one real-speed early wave, bounded lifecycle
// fixtures, native Director arrivals on three arenas, representative CPU load.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/User/AppData/Local/Temp/opencode/node_modules/playwright/index.mjs')).href);
const out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m43/cp3/b/runtime-01');assert(!existsSync(out),'Use a fresh evidence directory');mkdirSync(out,{recursive:true});
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7),run=s=>!only||only.split(',').includes(s);
const report={browser:'Edge',scope:only||'focused CP3-B',cases:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>report.errors.push(e.message));
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');url.searchParams.set('endlessFixture','1');
async function boot(){await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});}
async function arena(id='valley',seed=430012){
 await boot();await page.evaluate(()=>{__cf.startEndlessMode();__cf.pause(true);});
 const saved=await page.evaluate(({id,seed})=>{const s=__cf.endlessSaveInfo();s.arena=id;s.run.worldSeed=seed;return s;},{id,seed});
 await resume(saved);await page.evaluate(()=>__cf.waitCombatPreparation());
}
async function resume(saved){await boot();await page.evaluate(s=>{localStorage.cf_endless_v1=JSON.stringify(s);if(!__cf.continueEndless())throw Error('Continue failed');__cf.pause(true);__cf.setNoSpawn(true);},saved);}
async function capture(file){await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');await page.screenshot({path:resolve(out,file+'.png')});}
const summary=()=>page.evaluate(()=>{const c=__cf,p=ChargefrontEndlessDirector.plan(c.endless.wave,c.endless.worldSeed),live=ChargefrontEndlessDirector.live(c.enemies);return {wave:c.endless.wave,active:c.endless.waveActive,pending:c.endless.budgetLeft,alive:c.endless.alive,rest:c.endless.intermissionT,hp:c.player.hp,dead:c.player.dead,kills:c.resultInfo().current.kills,...live,cap:p.activeCap,threatCap:p.threatCap};});
async function wave(w){await page.evaluate(w=>{const c=__cf;c.pause(true);c.clearTestEnemies();c.endless.waveActive=false;c.endless.intermissionT=0;c.setWave(w-1);c.startWave();},w);}
try{
 if(run('early')){
  await arena();await page.evaluate(()=>{const c=__cf;c.setNoAggro(false);c.setInvulnerable(false);c.move(406-c.player.pos.x,403-c.player.pos.y);c.player.yaw=Math.PI/2;c.pause(false);});
  await page.keyboard.down('e');await page.waitForFunction(()=>__cf.endless.waveActive,undefined,{timeout:10000});await page.keyboard.up('e');
  const start=Date.now();let maximum=0,shot=false;await page.mouse.move(640,360);await page.mouse.down();
  try{
   for(let i=0;i<150;i++){
    await page.waitForTimeout(400);
    await page.evaluate(()=>{const c=__cf,e=c.enemies.filter(e=>!e.dead&&!e.dying&&!e.unburrowing).sort((a,b)=>a.pos.distance(c.player.pos)-b.pos.distance(c.player.pos))[0];if(e){c.player.yaw=Math.atan2(e.pos.y-c.player.pos.y,e.pos.x-c.player.pos.x);c.player.pitch=Math.atan2(e.z+.8-c.player.zPos-c.player.eye,e.pos.distance(c.player.pos));}});
    const s=await summary();maximum=Math.max(maximum,s.count);assert(!s.dead,'Normal early-wave commander survives');assert(s.count<=s.cap&&s.cost<=s.threatCap);
    if(s.count>=2&&!shot){await capture('early-wave');shot=true;}
    if(!s.active)break;
    if(await page.evaluate(()=>__cf.player.weapon.mag===0&&!__cf.player.weapon.reloading))await page.keyboard.press('r');
   }
  }finally{await page.mouse.up();}
  await page.evaluate(()=>__cf.pause(true));const final=await summary();assert(!final.active&&final.pending===0&&final.alive===0,'Normal-speed wave 1 completes');assert.equal(final.kills,8);
  report.cases.push({label:'native-hold-E-normal-speed-early-wave',seconds:(Date.now()-start)/1000,maximum,final});
  const saved=await page.evaluate(()=>__cf.endlessSaveInfo());assert(!saved.run.waveActive&&saved.run.intermissionT===6);
  const blocked=await page.evaluate(()=>{const n=__cf.endless.wave;__cf.startWave();return __cf.endless.wave===n;});assert(blocked,'Minimum recovery is enforced');
  await resume(saved);assert.equal(await page.evaluate(()=>__cf.endless.intermissionT),6);
  await page.evaluate(()=>{__cf.advanceEncounterSystems(6);__cf.startWave();});assert.equal((await summary()).wave,2);
  const waveStart=await page.evaluate(()=>__cf.endlessSaveInfo());assert.equal(waveStart.run.budgetLeft,10);assert.equal(waveStart.run.directorVersion,1);
  await page.evaluate(()=>{__cf.endless.spawnT=0;__cf.advanceEncounterSystems(.25);});assert.equal((await summary()).pending,9);assert.equal(await page.evaluate(()=>__cf.saveEndless()),false,'No mid-wave snapshot');
  await resume(waveStart);assert.equal((await summary()).pending,10);assert.equal((await summary()).alive,0);
  assert.deepEqual(await page.evaluate(()=>__cf.endlessSaveInfo().craft),waveStart.craft,'Continue cannot repay a refresh/reward');
  delete waveStart.run.directorVersion;waveStart.run.budgetLeft=16;
  await resume(waveStart);await page.evaluate(()=>__cf.advanceEncounterSystems(0));assert.equal((await summary()).pending,10,'Legacy wave-start migration');
  report.cases.push({label:'intermission-wave-start-Continue-and-legacy-migration',passed:true});
  console.log('PASS CP3-B early gameplay, recovery and Continue');
 }
 if(run('lifecycle')){
  if(!run('early'))await arena();
  await wave(8);
  const retry=await page.evaluate(()=>{const c=__cf,b=c.addTestSolid(210,210,590,590),before=c.endless.budgetLeft;c.endless.spawnT=0;c.advanceEncounterSystems(0);b.disabled=true;return {before,after:c.endless.budgetLeft,count:c.enemies.length};});assert.equal(retry.before,retry.after);assert.equal(retry.count,0);
  const emitted=await page.evaluate(()=>{
   const c=__cf,plan=ChargefrontEndlessDirector.plan(8,c.endless.worldSeed),types=[],invalid=[];c.setNoAggro(true);c.move(400-c.player.pos.x,640-c.player.pos.y);
   for(const m of c.squad){m.pos.set(400,640);m.holdPos.set(400,640);m.fireT=m.abilityCd=1e8;}
   for(let i=0;i<80&&c.endless.budgetLeft;i++){
    c.endless.spawnT=0;c.advanceEncounterSystems(1);
    for(const e of c.enemies){types.push(e.type);const h=c.terrainHeight(e.home.x,e.home.y);if(c.insideSolid(e.home.x,e.home.y)||!Number.isFinite(h)||h>32||Math.hypot(e.home.x-400,e.home.y-400)>180)invalid.push(e.type);}
    c.clearTestEnemies();
   }
   c.advanceEncounterSystems(0);return {types,expected:plan.queue,invalid,rest:c.endless.intermissionT,active:c.endless.waveActive,boss:c.endless.bossSpawned};
  });assert.deepEqual(emitted.types,emitted.expected);assert.deepEqual(emitted.invalid,[]);assert(emitted.boss&&!emitted.active&&emitted.rest===12);
  report.cases.push({label:'failed-location-retry-exact-queue-boss-and-clear',...emitted});
  await wave(6);
  const brood=await page.evaluate(()=>{
   const c=__cf;c.endless.budgetLeft=0;
   const carrier=c.spawnTestEnemy('carrier',60,-240);carrier.encounterSource='endless_wave';carrier.die();c.advanceEncounterSystems(0);
   const first=c.enemies.filter(e=>!e.dead&&!e.dying),active=c.endless.waveActive,alive=c.endless.alive;
   const plan=ChargefrontEndlessDirector.plan(6,c.endless.worldSeed);
   while(ChargefrontEndlessDirector.live(c.enemies).count<plan.activeCap-1)c.spawnTestEnemy('skitter',80,0);
   const second=c.spawnTestEnemy('carrier',-60,-240);second.encounterSource='endless_wave';const before=ChargefrontEndlessDirector.live(c.enemies).count;second.die();
   const after=ChargefrontEndlessDirector.live(c.enemies).count;
   return {children:first.length,active,alive,before,after,cap:plan.activeCap,remaining:ChargefrontEndlessDirector.live(c.enemies)};
  });assert(brood.children>0&&brood.children<=3&&brood.active);assert.equal(brood.alive,brood.children);assert(brood.after<=brood.cap&&brood.after<=brood.before);
  report.cases.push({label:'Carrier-live-count-and-pressure-gate',...brood});
  // Artificial immobility is confined to a watchdog fixture, not gameplay proof.
  await wave(6);
  const watchdog=await page.evaluate(()=>{
   const c=__cf;c.endless.budgetLeft=0;const e=c.spawnTestEnemy('shielded',120,-180);e.encounterSource='endless_wave';e.canSeeTarget=false;e.memoryT=0;e.advanceReplans=3;
   const before={kills:c.resultInfo().current.kills,pickups:c.additionalInfo().pickups.length};
   for(let i=0;i<47;i++)c.advanceEncounterSystems(2);
   return {removed:!c.enemies.includes(e),active:c.endless.waveActive,before,after:{kills:c.resultInfo().current.kills,pickups:c.additionalInfo().pickups.length}};
  });assert(watchdog.removed&&!watchdog.active);assert.deepEqual(watchdog.before,watchdog.after);
  report.cases.push({label:'unseen-stalled-outlier-no-kill-or-resource-reward',...watchdog});
  await wave(9);await page.evaluate(()=>{const c=__cf;c.endless.spawnT=0;c.advanceEncounterSystems(2);c.setInvulnerable(false);c.player.shield=0;c.damagePlayer(10000);});
  const result=await page.evaluate(()=>__cf.resultInfo().payload);assert.equal(result.wave,9);assert.equal(result.cleared,8);assert.equal(await page.evaluate(()=>localStorage.getItem('cf_endless_v1')),null);await capture('survival-debrief');
  const geometry=await page.evaluate(()=>__cf.scene.getObjectByName('EndlessGround').geometry.uuid),identity=await page.evaluate(()=>[__cf.endless.arena.id,__cf.endless.worldSeed]);
  await page.locator('#btn-result-retry').click();await page.waitForFunction(()=>__cf.phaseName==='ENDLESS'&&!__cf.player.dead);await page.evaluate(()=>__cf.pause(true));
  assert.equal(await page.evaluate(()=>__cf.scene.getObjectByName('EndlessGround').geometry.uuid),geometry);assert.deepEqual(await page.evaluate(()=>[__cf.endless.arena.id,__cf.endless.worldSeed]),identity);
  assert.deepEqual(await page.evaluate(()=>({wave:__cf.endless.wave,budget:__cf.endless.budgetLeft,rest:__cf.endless.intermissionT,kills:__cf.resultInfo().current.kills,cartridges:__cf.combat.cartridges,medkits:__cf.craft.medkits})),{wave:0,budget:0,rest:0,kills:0,cartridges:8,medkits:3});
  await page.evaluate(()=>__cf.startWave());assert.equal((await summary()).pending,8);
  report.cases.push({label:'survival-debrief-active-wave-and-replay-no-world-rebuild',wave:result.wave,cleared:result.cleared,identity,passed:true});
  console.log('PASS CP3-B spawn retries, boss lifecycle, Carrier tracking, straggler recovery and debrief/replay');
 }
 if(run('arenas')){
  for(const [i,id] of ['valley','crater','ridges'].entries()){
   await arena(id,430012+i);await wave(12);
   await page.evaluate(()=>{const c=__cf;c.setInvulnerable(true);c.setNoAggro(false);c.suppressAbilityAutonomy(1e8);c.move(400-c.player.pos.x,640-c.player.pos.y);c.commandSquad('hold');for(const m of c.squad){m.pos.set(400,640);m.holdPos.set(400,640);m.z=c.terrainHeight(400,640);m.fireT=m.abilityCd=1e8;}c.endless.spawnT=0;c.advanceEncounterSystems(0);window.initialArrivals=c.enemies.map(e=>({id:e.tacticalId,type:e.type,d:Math.hypot(e.pos.x-400,e.pos.y-400)}));c.pause(false);});
   await page.waitForTimeout(8000);await page.evaluate(()=>__cf.pause(true));
   const row=await page.evaluate(()=>{const c=__cf,initial=initialArrivals.map(a=>{const e=c.enemies.find(e=>e.tacticalId===a.id);return {...a,after:Math.hypot(e.pos.x-400,e.pos.y-400),inside:c.insideSolid(e.pos.x,e.pos.y),awareness:e.awareness,attacks:e.attackCount};});return {arena:c.endless.arena.id,initial,validHomes:c.enemies.every(e=>!c.insideSolid(e.home.x,e.home.y)&&c.terrainHeight(e.home.x,e.home.y)<=32),state:ChargefrontEndlessDirector.live(c.enemies)};});
   assert(row.initial.length>=1&&row.initial.every(e=>!e.inside&&e.after<e.d-15&&e.attacks===0));assert(row.validHomes);
   const capped=await page.evaluate(()=>{const c=__cf;for(let n=0;n<40;n++){c.endless.spawnT=0;c.advanceEncounterSystems(0);}const plan=ChargefrontEndlessDirector.plan(12,c.endless.worldSeed);return {state:ChargefrontEndlessDirector.live(c.enemies),cap:plan.activeCap,threat:plan.threatCap,pending:c.endless.budgetLeft};});assert(capped.state.count<=capped.cap&&capped.state.cost<=capped.threat&&capped.pending>0);
   report.cases.push({label:'native-Director-spawn-validity-advance-and-pressure',...row,capped});
  }
  console.log('PASS CP3-B native wave actors advance on Valley, Crater and Ridges; valid spawns and pressure bounded');
 }
 if(run('performance')){
  if(!run('arenas')){await arena('ridges',430014);await wave(20);}
  await page.evaluate(()=>{const c=__cf;c.setInvulnerable(true);c.setNoAggro(false);c.endless.budgetLeft=0;c.move(400-c.player.pos.x,640-c.player.pos.y);for(const m of c.squad){m.pos.set(400,640);m.holdPos.set(400,640);m.fireT=m.abilityCd=1e8;}
   const types=['skitter','shielded','brute','spitter','drone','tunneler','support','artillery'];
   while(ChargefrontEndlessDirector.live(c.enemies).count<24){const i=c.enemies.length,a=i*Math.PI/12;c.spawnTestEnemy(types[i%types.length],Math.cos(a)*65,Math.sin(a)*65-240);}
   const proto=c.enemies[0].constructor.prototype,update=proto.update;window.actorCost={calls:0,ms:0,maxMs:0};proto.update=function(...args){const t=performance.now();try{return update.apply(this,args);}finally{const ms=performance.now()-t;actorCost.calls++;actorCost.ms+=ms;actorCost.maxMs=Math.max(actorCost.maxMs,ms);}};c.pause(false);
  });await page.waitForTimeout(1500);await page.evaluate(()=>{__cfPerf.reset();actorCost={calls:0,ms:0,maxMs:0};});await page.waitForTimeout(4000);
  const perf=await page.evaluate(()=>{__cf.pause(true);const s=__cfPerf.summary();return {actors:ChargefrontEndlessDirector.live(__cf.enemies).count,frames:s.frames,averageMs:s.averageMs,p95Ms:s.p95Ms,worstMs:s.worstMs,counters:s.counters,actorCost,entities:__cf.performanceInfo().entities};});assert.equal(perf.actors,24);assert(perf.actorCost.calls>100);perf.perActorMs=perf.actorCost.ms/perf.actorCost.calls;assert(perf.perActorMs<.5);
  for(const key of ['buildEndlessWorld','buildTerrain','buildFacility','collisionNavRebuild','linkProgram'])assert.equal(perf.counters[key]||0,0,key+' not repeated');
  report.cases.push({label:'24-actor-normal-speed-CPU-smoke-not-FPS-certification',...perf});console.log('PASS CP3-B CPU smoke',JSON.stringify({actors:24,perActorMs:perf.perActorMs,p95Ms:perf.p95Ms}));
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{await page.keyboard.up('e').catch(()=>{});await page.mouse.up().catch(()=>{});writeFileSync(resolve(out,'runtime.json'),JSON.stringify(report,null,2));await browser.close();}
