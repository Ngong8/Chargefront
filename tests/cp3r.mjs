// CP3-R targeted browser fixtures. Isolated browser storage; no user saves or
// historical evidence writes. Test-only observation hooks are served in memory.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {cut,economyContext} from './helpers/endless-economy-model.mjs';
const html=readFileSync('chargefront.html','utf8'),progression=readFileSync('src/progression.js','utf8');
const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{input:html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],encoding:'utf8'});
assert.equal(syntax.status,0,syntax.stderr);
for(const file of ['src/progression.js','src/endless-director.js','tests/cp3r.mjs','tests/endless-economy.mjs','tests/endless-replayability.mjs'])assert.equal(spawnSync(process.execPath,['--check',file]).status,0);
// The only alarm call site is the explicit secured-sample M4 transition.
assert.equal((html.match(/playFileSfx\('droneAlert'/g)||[]).length,1);
const alarm=cut(html,"        if (mode === 'campaign' && activeMissionId === 'break_contact'",'    if (toId === \'power_through\')').replace(/\n    }\s*$/,'');
for(const mode of ['campaign','endless'])for(const mission of ['sample_zero','break_contact'])for(const dna of [false,true])for(const emergency of [false,true])for(const phase of [1,2]){
 const c={mode,activeMissionId:mission,phase,P:{M4_BREAK_CONTACT:2},campaignRun:{worldState:{dnaSecured:dna,emergency}},calls:0,playFileSfx(){this.calls++;}};
 // Use a closure rather than a receiver-dependent stub.
 c.playFileSfx=()=>c.calls++;vm.runInNewContext(alarm+'\n'+alarm,c);
 assert.equal(c.calls,Number(mode==='campaign'&&mission==='break_contact'&&dna&&emergency&&phase===2));
}
// Protected CP3-C economy and CP3-D planning remain exercised without rewriting
// their historical artifacts. Use actual banking/offers and seeded plans.
const model=economyContext(html,progression,430012);model.m.run.wave=20;model.m.run.milestone=20;model.m.run.dnaBanked=60;model.m.run.dna=3;model.c.craft.scraps=5000;model.m.bank();assert.equal(model.c.craft.scraps,5012);
const D=globalThis.ChargefrontEndlessDirector;
for(const seed of [7,42,430012])for(let wave=1;wave<=40;wave++){const p=D.plan(wave,seed);assert.deepEqual(p,D.plan(wave,seed));assert(p.activeCap<=24&&p.threatCap<=58);assert.equal(p.queue.filter(t=>t==='boss').length,Number(wave%8===0));for(const t of p.queue)assert(t==='boss'||D.unlock[t]<=wave);}
const {chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/User/AppData/Local/Temp/opencode/node_modules/playwright/index.mjs')).href);
const root=resolve('.'),errors=[],cases=[];
const served=html.replace("function playFileSfx(key, vol = 0.5, pitch = 1, px, py) {","function playFileSfx(key, vol = 0.5, pitch = 1, px, py) { (window.cp3rAudio ||= []).push(key);");
// Append hooks to the module itself, retaining lexical access without product changes.
const instrumented=served.replace(/(<script type="module">[\s\S]*?)(<\/script>)/,(_,body,end)=>body+`\nwindow.cp3r={phases:P,unlock:()=>{campaignProfile.missions.sample_zero.unlocked=true;},refresh:refreshEndlessUpgradeOffers,beginSample:startMission3Stabilization,run:()=>campaignRun,draw:()=>{const old=hudText,labels=[];try{hudText=(text)=>labels.push(text);drawEndlessUpgradeMenu(1280,720);}finally{hudText=old;}return labels;}};\n`+end);
const server=createServer((req,res)=>{try{const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+sep))throw Error('path');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.wav':'audio/wav','.png':'image/png','.jpg':'image/jpeg','.otf':'font/otf'})[extname(file)]||'application/octet-stream');res.end(file===resolve('chargefront.html')?instrumented:readFileSync(file));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/chargefront.html?perfDiagnostics=1&endlessFixture=1`);await page.waitForFunction(()=>window.__cf?.renderer&&window.cp3r,undefined,{timeout:120000});
 const inventory=()=>page.evaluate(()=>({reserve:__cf.combat.cartridges,mags:Object.values(__cf.combat.weapons).map(w=>[w.mag,w.magSize]),squad:__cf.squad.map(m=>({reserve:m.reserve,mag:m.mag,size:m.magSize}))}));
 const fresh=async config=>{await page.evaluate(config=>{__cf.startEndlessMode(config);__cf.pause(true);__cf.setNoSpawn(true);},config);await page.evaluate(()=>__cf.waitCombatPreparation());const s=await inventory();assert.equal(s.reserve,6);assert(s.mags.every(([a,b])=>a===b));assert(s.squad.every(m=>m.reserve===3&&m.mag===m.size));return s;};
 cases.push({freshDefault:await fresh({})});
 const custom={player:{slot1:'arc',slot2:'plasma'},squad:{rook:{weapon:'scatter'},vex:{weapon:'plasma'},kade:{weapon:'arc'}}};cases.push({freshCustom:await fresh(custom)});
 const legacy=await page.evaluate(()=>{const c=__cf;c.combat.cartridges=8;Object.values(c.combat.weapons).forEach((w,i)=>w.mag=i+2);c.squad.forEach((m,i)=>{m.reserve=4+i;m.mag=i+5;});c.saveEndless();return c.endlessSaveInfo();});const old=await inventory();
 await page.evaluate(()=>{if(!__cf.continueEndless())throw Error('Continue');__cf.pause(true);});assert.deepEqual(await inventory(),old);cases.push({continueStoredAmmo:true});
 // Exercise native debrief Replay button rather than only the reset helper.
 await page.evaluate(()=>{__cf.setInvulnerable(false);__cf.player.shield=0;__cf.damagePlayer(10000);});await page.locator('#btn-result-retry').click();await page.evaluate(()=>__cf.pause(true));assert.equal((await inventory()).reserve,6);assert((await inventory()).squad.every(m=>m.reserve===3));cases.push({replayFreshAmmo:true});
 const turret=await page.evaluate(()=>{const c=__cf;c.setWave(9);const before=[];for(let i=0;i<80;i++){cp3r.refresh();before.push(...c.offers);}c.setWave(10);let rolls=0;while(!c.offers.some(x=>x.startsWith('r_turret:'))&&rolls++<1000)cp3r.refresh();const index=c.offers.findIndex(x=>x.startsWith('r_turret:'));c.openUpgrades();const labels=cp3r.draw(),offers=[...c.offers];c.craft.scraps=23;c.buyUpgrade(index);const denied=!c.turretReady&&c.craft.scraps===23;c.craft.scraps=24;c.buyUpgrade(index);const bought=c.turretReady&&c.craft.scraps===0&&c.endless.turretOwned;let repeated=false;for(let i=0;i<80;i++){cp3r.refresh();repeated ||= c.offers.some(x=>x.startsWith('r_turret:'));}c.saveEndless();c.continueEndless();c.pause(true);return {before:before.some(x=>x.startsWith('r_turret:')),rolls,index,labels,offers,denied,bought,repeated,restored:c.turretReady};});
 assert(!turret.before&&turret.index>=0&&turret.denied&&turret.bought&&!turret.repeated&&turret.restored);assert(turret.labels.includes(`[${turret.index+1}] RELAY TURRET`));assert(turret.labels.includes('24 SCRAP'));cases.push({turret});
 const drones=await page.evaluate(()=>{window.cp3rAudio=[];__cf.spawnDrone();__cf.spawnDrone();for(const e of __cf.enemies.filter(e=>e.type==='drone')){e.beginSkySpawn(1);e.update();}return {audio:cp3rAudio,descending:__cf.enemies.some(e=>e.type==='drone'&&e.skySpawnT>0)};});assert(drones.descending&&!drones.audio.includes('droneAlert'));cases.push({endlessDrones:drones});
 await page.evaluate(()=>{cp3r.unlock();if(!__cf.startMission('sample_zero'))throw Error('M3 start');__cf.pause(true);__cf.setNoSpawn(true);__cf.setInvulnerable(true);});
 const campaign=await inventory();assert.equal(campaign.reserve,4);assert(campaign.squad.every(m=>m.reserve===2));
 const m4=await page.evaluate(()=>{const c=__cf;window.cp3rAudio=[];c.setPhase(cp3r.phases.M3_REACH_SAMPLE);c.move(364-c.player.pos.x,774-c.player.pos.y);c.squad.forEach((m,i)=>m.pos.set(350+i*10,762));cp3r.beginSample();const retrieval=[...cp3rAudio];const transitioned=c.completeStabilization();const after=[...cp3rAudio];c.spawnDrone();c.spawnDrone();c.advanceEncounterSystems(1);const run=cp3r.run();return {transitioned,retrieval,after,final:[...cp3rAudio],phase:c.phaseName,state:{...run.worldState}};});
 assert(m4.transitioned);assert(!m4.retrieval.includes('droneAlert'));assert.equal(m4.after.filter(x=>x==='droneAlert').length,1);assert.equal(m4.final.filter(x=>x==='droneAlert').length,1);assert(m4.state.dnaSecured&&m4.state.m4AlarmPlayed);cases.push({campaignM4:m4});
 await fresh({});await page.evaluate(()=>{window.cp3rAudio=[];__cf.spawnDrone();__cf.startWave();__cf.endless.spawnT=0;__cf.advanceEncounterSystems(1);});assert(!await page.evaluate(()=>cp3rAudio.includes('droneAlert')));cases.push({campaignToEndlessNoLeak:true});
 assert.deepEqual(errors,[]);console.log('PASS CP3-R',JSON.stringify({syntax:true,alarmGuardCases:64,directorPlans:120,cases,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
