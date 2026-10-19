// Same seed, arena, initial actors and instrumented update wrapper for accepted
// pre-CP1 HTML and current HTML. Static policy cost + normal-speed combat load.
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import '../src/progression.js';
const {chromium,firefox}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href);
const name=process.argv.includes('firefox')?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m43/cp1-cp2/performance',name);assert(!existsSync(out));mkdirSync(out,{recursive:true});
const baselineDir=resolve(process.env.CF_AI_BASELINE||'_playtest/m43/cp1-cp2/before-fixed',name),baseline=readFileSync(resolve(baselineDir,'chargefront.html'),'utf8'),actual=pathToFileURL(resolve('chargefront.html'));
const baselineFile=resolve(out,'baseline.html');writeFileSync(baselineFile,baseline.replace('<head>','<head><base href="'+actual.href+'">'));
for(const path of ['src/world/facility.js','src/combat.js'])assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),createHash('sha256').update(readFileSync(resolve(baselineDir,path.replaceAll('/','-')))).digest('hex'),path+' must retain accepted geometry and weapon tuning');
// CP2-R legitimately changes Campaign economy; this is an Endless benchmark.
const oldContext={};vm.runInNewContext(readFileSync(resolve(baselineDir,'src-progression.js'),'utf8'),oldContext);
assert.equal(JSON.stringify(globalThis.ChargefrontProgression.economy.endless.scrap),JSON.stringify(oldContext.ChargefrontProgression.scrap));assert.equal(globalThis.ChargefrontProgression.economy.endless.powerChance,.08);
const report={browser:name,rows:[],comparisons:[],errors:[],baselineHash:createHash('sha256').update(baseline).digest('hex'),currentHash:createHash('sha256').update(readFileSync('chargefront.html')).digest('hex')};
const browser=await(name==='firefox'?firefox:chromium).launch(name==='firefox'?{headless:true}:{headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
try{
 for(const protocol of ['stationary-policy','live-combat'])for(const version of ['before','after']){
  const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>report.errors.push(e.message));
  const url=version==='before'?pathToFileURL(baselineFile):new URL(actual.href);url.searchParams.set('perfDiagnostics','1');url.searchParams.set('endlessFixture','1');
  const boot=async()=>{await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});};
  await boot();await page.evaluate(()=>{__cf.startEndlessMode();__cf.pause(true);});const saved=await page.evaluate(()=>{const s=__cf.endlessSaveInfo();s.arena='crater';s.run.worldSeed=430012;return s;});await boot();await page.evaluate(s=>{localStorage.cf_endless_v1=JSON.stringify(s);if(!__cf.continueEndless())throw Error('Paired arena restore');__cf.pause(true);},saved);
  await page.evaluate(protocol=>{const c=__cf;c.setNoSpawn(true);c.setNoAggro(false);c.setInvulnerable(true);c.clearTestEnemies();c.suppressAbilityAutonomy(1e8);c.commandSquad('hold');for(const m of c.squad){m.fireT=m.abilityCd=1e8;}const random=Math.random,types=['skitter','shielded','brute','spitter','drone','screecher'];try{for(let i=0;i<18;i++){Math.random=ChargefrontProgression.seedRandom(430012+i);const a=i*Math.PI/9,e=c.spawnTestEnemy(types[i%types.length],Math.cos(a)*35,Math.sin(a)*35);e.hp=e.maxHp=1e5;e.skySpawnT=0;e.unburrowing=false;if(protocol==='stationary-policy'){e.speed=0;e.attackT=e.spitT=e.specialT=1e8;}}}finally{Math.random=random;}const proto=c.enemies[0].constructor.prototype,update=proto.update;window.aiCost={calls:0,ms:0,maxMs:0};proto.update=function(...args){const t=performance.now();try{return update.apply(this,args);}finally{const ms=performance.now()-t;aiCost.calls++;aiCost.ms+=ms;aiCost.maxMs=Math.max(aiCost.maxMs,ms);}};c.pause(false);},protocol);
  await page.evaluate(()=>__cf.waitCombatPreparation());await page.waitForTimeout(protocol==='stationary-policy'?2500:6500);await page.evaluate(()=>{__cfPerf.reset();aiCost={calls:0,ms:0,maxMs:0};});await page.waitForTimeout(8000);
  const row=await page.evaluate(()=>{const s=__cfPerf.summary();return {frames:s.frames,average:s.averageMs,p95:s.p95Ms,p99:s.p99Ms,worst:s.worstMs,counters:s.counters,aiCost,arena:__cf.endless.arena.id,seed:__cf.endless.worldSeed,actors:__cf.enemies.length,entities:__cf.performanceInfo().entities,tactics:__cf.enemyTacticalInfo?__cf.enemyTacticalInfo().map(e=>({type:e.type,perception:e.perceptionChecks,plans:e.navPlans,attacks:e.attacks})):null};});
  assert.equal(row.arena,'crater');assert.equal(row.seed,430012);assert.equal(row.actors,18);row.actorUpdateMs=row.aiCost.ms/row.aiCost.calls;row.projected18ActorMs=row.actorUpdateMs*18;
  assert(row.actorUpdateMs<.25,'Bounded AI CPU budget per actor update (not FPS certification)');for(const key of ['linkProgram','buildCampaignWorld','buildEndlessWorld','buildFacility','collisionNavRebuild'])assert.equal(row.counters[key]||0,0,key);
  if(protocol==='stationary-policy')for(const key of ['geometriesCreated','materialsCreated'])assert.equal(row.counters[key]||0,0,key);
  report.rows.push({protocol,version,...row});console.log('PAIRED',name,protocol,version,JSON.stringify({p95:row.p95,worst:row.worst,perActor:row.actorUpdateMs,actors:row.actors,counters:row.counters}));await page.close();
 }
 for(const protocol of ['stationary-policy','live-combat']){const a=report.rows.find(r=>r.protocol===protocol&&r.version==='before'),b=report.rows.find(r=>r.protocol===protocol&&r.version==='after');report.comparisons.push({protocol,p95Before:a.p95,p95After:b.p95,worstBefore:a.worst,worstAfter:b.worst,actorUpdateBefore:a.actorUpdateMs,actorUpdateAfter:b.actorUpdateMs,extra18ActorMs:b.projected18ActorMs-a.projected18ActorMs});}
 assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS paired AI performance',name,JSON.stringify(report.comparisons));
}finally{writeFileSync(resolve(out,'performance.json'),JSON.stringify(report,null,2));await browser.close();}
