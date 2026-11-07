// One normal-speed CP3-B wave + actual collection/crafting, then small explicit
// Carrier and old-wallet Continue/Replay fixtures. No Campaign/browser matrix.
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/User/AppData/Local/Temp/opencode/node_modules/playwright/index.mjs')).href);
const out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m43/cp3/c/runtime');assert(!existsSync(out));mkdirSync(out,{recursive:true});
const report={browser:'Edge',cases:[],errors:[]},browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>report.errors.push(e.message));
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');url.searchParams.set('endlessFixture','1');
async function boot(){await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});}
const inventory=()=>page.evaluate(()=>({craft:{...__cf.craft},cartridges:__cf.combat.cartridges,shots:__cf.combat.shotsFired,kills:__cf.resultInfo().current.kills,dna:__cf.endless.dna,banked:__cf.endless.dnaBanked,squad:__cf.squad.map(m=>({mag:m.mag,reserve:m.reserve})),remaining:__cf.additionalInfo().pickups}));
try{
 await boot();await page.evaluate(()=>{__cf.startEndlessMode();__cf.pause(true);});
 const saved=await page.evaluate(()=>{const s=__cf.endlessSaveInfo();s.arena='valley';s.run.worldSeed=430012;return s;});
 await boot();await page.evaluate(s=>{localStorage.cf_endless_v1=JSON.stringify(s);if(!__cf.continueEndless())throw Error('Continue');const c=__cf;c.pause(true);c.setNoSpawn(true);c.setNoAggro(false);c.setInvulnerable(false);c.move(406-c.player.pos.x,403-c.player.pos.y);c.player.yaw=Math.PI/2;Math.random=ChargefrontProgression.seedRandom(430012);},saved);
  await page.evaluate(()=>__cf.waitCombatPreparation());const initial=await inventory();assert.equal(initial.craft.scraps,0);assert.equal(initial.craft.powerCells,0);assert.equal(initial.cartridges,6);
 await page.evaluate(()=>__cf.pause(false));await page.keyboard.down('e');await page.waitForFunction(()=>__cf.endless.waveActive,undefined,{timeout:10000});await page.keyboard.up('e');
 await page.waitForFunction(()=>__cf.enemies.length>0,undefined,{timeout:10000});
 await page.evaluate(()=>{window.economyGenerated=[];const c=__cf,proto=c.enemies[0].constructor.prototype,die=proto.die;proto.die=function(...args){const dead=this.dead,before=c.additionalInfo().pickups.length,result=die.apply(this,args);if(!dead)for(const p of c.additionalInfo().pickups.slice(before))economyGenerated.push({...p,source:this.encounterSource||'unknown',enemy:this.type});return result;};});
 const start=Date.now();await page.mouse.move(640,360);await page.mouse.down();
 try{for(let i=0;i<160;i++){
  await page.waitForTimeout(350);const state=await page.evaluate(()=>{const c=__cf,e=c.enemies.filter(e=>!e.dead&&!e.dying&&!e.unburrowing).sort((a,b)=>a.pos.distance(c.player.pos)-b.pos.distance(c.player.pos))[0];if(e){c.player.yaw=Math.atan2(e.pos.y-c.player.pos.y,e.pos.x-c.player.pos.x);c.player.pitch=Math.atan2(e.z+.8-c.player.zPos-c.player.eye,e.pos.distance(c.player.pos));}return {active:c.endless.waveActive,dead:c.player.dead,reload:c.player.weapon.mag===0&&!c.player.weapon.reloading};});assert(!state.dead);if(!state.active)break;if(state.reload)await page.keyboard.press('r');
 }}finally{await page.mouse.up();}
 assert.equal(await page.evaluate(()=>__cf.endless.waveActive),false);const combatSeconds=(Date.now()-start)/1000;
 const postCombat=await inventory();assert.equal(postCombat.kills,8);
 // Walk and sprint via real input to reachable drops, with a short sidestep when
 // needed. No direct inventory edits or pickup-position moves in this check.
 await page.keyboard.down('w');await page.keyboard.down('Shift');let last=null,stalled=0;
 try{for(let i=0;i<180;i++){
  const step=await page.evaluate(()=>{const c=__cf,all=c.additionalInfo().pickups,clear=all.filter(p=>c.enemyWalkClearForTest(c.player.pos,p)),p=(clear.length?clear:all).sort((a,b)=>Math.hypot(a.x-c.player.pos.x,a.y-c.player.pos.y)-Math.hypot(b.x-c.player.pos.x,b.y-c.player.pos.y))[0];if(!p)return null;c.player.yaw=Math.atan2(p.y-c.player.pos.y,p.x-c.player.pos.x);c.player.pitch=-.12;return {pos:[c.player.pos.x,c.player.pos.y],remaining:all.length};});
  if(!step)break;
  if(last&&Math.hypot(step.pos[0]-last[0],step.pos[1]-last[1])<.25)stalled++;else stalled=0;
  if(stalled>=3){await page.evaluate(()=>__cf.player.yaw+=.9);stalled=0;}
  last=step.pos;await page.waitForTimeout(250);
 }}finally{await page.keyboard.up('w');await page.keyboard.up('Shift');}
 await page.evaluate(()=>__cf.pause(true));const collected=await inventory(),generated=await page.evaluate(()=>economyGenerated);
 const totals=generated.reduce((r,p)=>(r[p.kind]=(r[p.kind]||0)+(p.kind==='scrap'?p.quantity:1),r),{scrap:0,power:0,dna:0,grenade:0});
 assert.equal(collected.craft.scraps+collected.remaining.filter(p=>p.kind==='scrap').reduce((s,p)=>s+p.quantity,0),totals.scrap,'Actual generated = collected + still on ground');
 assert.equal(collected.craft.powerCells+collected.remaining.filter(p=>p.kind==='power').length,totals.power);
 assert.equal(collected.dna+collected.remaining.filter(p=>p.kind==='dna').length,totals.dna);
 assert(collected.craft.scraps>0,'Native movement actually collected scrap');
 const craft=await page.evaluate(()=>{const c=__cf,before={s:c.craft.scraps,reserve:c.combat.cartridges,n:c.resultInfo().current.cartridgesCrafted};c.craftAmmo();return {before,after:{s:c.craft.scraps,reserve:c.combat.cartridges,n:c.resultInfo().current.cartridgesCrafted}};});
 if(craft.before.s>=4&&craft.before.reserve<12){assert.equal(craft.after.s,craft.before.s-4);assert.equal(craft.after.reserve,craft.before.reserve+1);assert.equal(craft.after.n,craft.before.n+1);}else assert.deepEqual(craft.after,craft.before);
 report.cases.push({label:'normal-speed-native-wave-and-real-input-collection',combatSeconds,initial,postCombat,generated:totals,collected:{scrap:collected.craft.scraps,cells:collected.craft.powerCells,dna:collected.dna},uncollected:collected.remaining,playerCartridgesConsumed:8-postCombat.cartridges,playerShots:postCombat.shots,craft});
 await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');await page.screenshot({path:resolve(out,'economy-hud.png')});
 // Carrier payout fixture uses real death/brood/drop paths, with deterministic
 // reward rolls only. It is not labelled as ordinary combat or collection.
 const brood=await page.evaluate(()=>{const c=__cf;c.clearTestEnemies();c.endless.waveActive=false;c.endless.intermissionT=0;c.setWave(11);c.startWave();const random=Math.random,before=economyGenerated.length;try{Math.random=()=>.1;const e=c.spawnTestEnemy('carrier',460-c.player.pos.x,400-c.player.pos.y);e.encounterSource='endless_wave';e.die();const children=c.enemies.filter(e=>!e.dead&&!e.dying&&e.encounterSource==='carrier_spawn');for(const child of children)child.die();return {children:children.length,drops:economyGenerated.slice(before)};}finally{Math.random=random;}});
 assert(brood.children>0&&brood.children<=3);assert.equal(brood.drops.find(p=>p.enemy==='carrier'&&p.kind==='scrap').quantity,5);assert(brood.drops.filter(p=>p.source==='carrier_spawn'&&p.kind==='scrap').every(p=>p.quantity===1));report.cases.push({label:'native-Carrier-and-brood-reward-fixture',...brood});
 const oldWallet=structuredClone(saved);Object.assign(oldWallet.run,{wave:12,waveActive:false,budgetLeft:0,intermissionT:0,directorVersion:1,dnaBanked:60,milestone:20,dna:3});oldWallet.craft={scraps:5000,powerCells:75,medkits:3};oldWallet.player.combat.cartridges=11;oldWallet.pickups=[{kind:'scrap',quantity:11,x:420,y:420},{kind:'scrap',quantity:0,x:425,y:420},{kind:'power',quantity:1,x:430,y:420}];
 await boot();await page.evaluate(s=>{localStorage.cf_endless_v1=JSON.stringify(s);if(!__cf.continueEndless())throw Error('Old wallet Continue');__cf.pause(true);},oldWallet);
 const restored=await inventory();assert.deepEqual(restored.craft,oldWallet.craft);assert.equal(restored.cartridges,11);assert.deepEqual(restored.remaining,oldWallet.pickups);
 const bank=await page.evaluate(()=>{const c=__cf;c.bankDna();if(!c.saveEndless())throw Error('Bank boundary save');return {craft:{...c.craft},milestone:c.endless.milestone,saved:c.endlessSaveInfo()};});assert.equal(bank.craft.scraps,5012);assert.equal(bank.craft.powerCells,75);assert.equal(bank.milestone,21);
 await boot();await page.evaluate(()=>{if(!__cf.continueEndless())throw Error('Saved wallet Continue');__cf.pause(true);});assert.deepEqual((await inventory()).craft,bank.craft);assert.deepEqual((await inventory()).remaining,oldWallet.pickups);
 const geom=await page.evaluate(()=>__cf.scene.getObjectByName('EndlessGround').geometry.uuid),identity=await page.evaluate(()=>[__cf.endless.arena.id,__cf.endless.worldSeed]);
 await page.evaluate(()=>{__cf.setInvulnerable(false);__cf.player.shield=0;__cf.damagePlayer(10000);});await page.locator('#btn-result-retry').click();await page.waitForFunction(()=>__cf.phaseName==='ENDLESS'&&!__cf.player.dead);await page.evaluate(()=>__cf.pause(true));
 const replay=await inventory();assert.deepEqual(replay.craft,{scraps:0,powerCells:0,medkits:3});assert.equal(replay.cartridges,8);assert.equal(replay.kills,0);assert.equal(replay.dna,0);assert.deepEqual(await page.evaluate(()=>[__cf.endless.arena.id,__cf.endless.worldSeed]),identity);assert.equal(await page.evaluate(()=>__cf.scene.getObjectByName('EndlessGround').geometry.uuid),geom);
 report.cases.push({label:'old-quantities-and-pickup-bundles-Continue-future-dividend-and-native-Replay',restored:{craft:restored.craft,cartridges:restored.cartridges,pickups:restored.remaining},bank:{craft:bank.craft,milestone:bank.milestone},replay:{craft:replay.craft,cartridges:replay.cartridges},identity});
 assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS CP3-C normal-speed economy, actual collection/crafting, Carrier rewards, preserved saved quantities and Replay',JSON.stringify({seconds:combatSeconds,generated:totals,collected:report.cases[0].collected}));
}finally{await page.keyboard.up('e').catch(()=>{});await page.keyboard.up('w').catch(()=>{});await page.keyboard.up('Shift').catch(()=>{});await page.mouse.up().catch(()=>{});writeFileSync(resolve(out,'economy.json'),JSON.stringify(report,null,2));await browser.close();}
