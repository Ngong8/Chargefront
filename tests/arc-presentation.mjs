// ARC-9 hitscan lightning, no logical projectile,
// static magazine glow, reload channel power-down/power-up, bounded effects.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const ff=process.argv.includes('firefox'),name=ff?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m41/arc');mkdirSync(out,{recursive:true});
const browser=await(ff?firefox:chromium).launch(ff?{headless:true}:{headless:!process.argv.includes('--headed'),executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],consoles=[],results={};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoles.push(m.text());});
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
const info=()=>page.evaluate(()=>__cf.arcInfo());
const sampleChannel=async(n=6)=>{let maxC=0,energy=0;for(let i=0;i<n;i++){const a=await info();maxC=Math.max(maxC,...a.channelOpacity);energy=Math.max(energy,a.reloadEnergy);await page.waitForTimeout(60);}return{maxChannel:maxC,energy};};
const capture=async label=>{if(!ff){await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');await page.screenshot({path:resolve(out,label+'.png')});}};
try{
 await page.goto(url.href);await page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
 await page.evaluate(()=>__cf.startEndlessMode({player:{slot1:'arc',slot2:'plasma',startingSlot:1}}));
 await page.waitForFunction(()=>__cf.mode==='endless');await page.mouse.click(640,360);
 await page.evaluate(()=>{__cf.setNoSpawn(true);__cf.setNoAggro(true);__cf.clearTestEnemies();__cf.setInvulnerable(true);});
 await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>__cf.player.weapon.id),'arc');
 // 1) Magazine glow is static (red-box area no longer pulses); channel pulses when ready.
 const mag=[],chanReady=[];
 for(let i=0;i<5;i++){const a=await info();mag.push(a.magazineBoltOpacity);chanReady.push(a.channelOpacity[0]);await page.waitForTimeout(90);}
 assert(new Set(mag).size===1&&mag[0]===1,'Magazine glow must stay static');assert(Math.max(...chanReady)-Math.min(...chanReady)>0.15,'Ready channel must pulse');
 assert.equal((await info()).magazineWindowOpacity,1);assert.equal((await info()).magazineTransparent,false);results.magazine={bolt:mag[0],window:1};results.channelReady={min:Math.min(...chanReady),max:Math.max(...chanReady)};
  // 2) Firing produces muzzle lightning without creating a damaging projectile.
 const fired=await page.evaluate(()=>{
  __cf.combat.weapons.arc.mag=20;const before=__cf.effectInfo().arcs;__cf.fire();
   return {before,after:__cf.effectInfo().arcs,hit:__cf.arcHitInfo(),arcProjectiles:__cf.shots.filter(s=>s.style==='arc').length};
 });
  assert.equal(fired.hit.mechanism,'hitscan');assert.equal(fired.arcProjectiles,0,'No ARC primary projectile exists');
 assert(fired.after-fired.before>=2,'Muzzle lightning arcs emitted');
  results.firing={hit:fired.hit,arcs:fired.after-fired.before};
 await page.evaluate(()=>{__cf.player.yaw=Math.PI/2;__cf.player.pitch=0;window.__arcSpam=setInterval(()=>{__cf.combat.weapons.arc.mag=32;__cf.combat.fireT=0;__cf.player.swapT=0;__cf.fire();},40);});
 await page.waitForTimeout(260);await capture('06-arc-muzzle-lightning');await page.evaluate(()=>clearInterval(window.__arcSpam));
 // 3) Chain arcs connect to a valid secondary target after a real hit.
 const chain=await page.evaluate(()=>{
  __cf.clearTestEnemies();const p=__cf.player;
  const a=__cf.spawnTestEnemy('brute',10,0);a.hp=a.maxHp=100000;a.speed=0;
  const b=__cf.spawnTestEnemy('brute',13,1);b.hp=b.maxHp=100000;b.speed=0;
  const before=__cf.effectInfo().arcs;__cf.spawnTestShot(p.pos.x,p.pos.y,p.zPos+p.eye,1,0,0,'arc');__cf.advanceShots(0.2);
  return {emitted:__cf.effectInfo().arcs-before,damage:[a.hp<100000,b.hp<100000]};
 });
 assert(chain.emitted>=3,'Primary + chain lightning arcs');assert(chain.damage[0]&&chain.damage[1],'Chain damage still authorized');results.chain=chain;
 await page.evaluate(()=>__cf.clearTestEnemies());await page.waitForTimeout(200);
 // 4) Reload channel powers down then back up.
 await page.evaluate(()=>{__cf.combat.weapons.arc.mag=4;});
 await page.keyboard.press('r');await page.waitForFunction(()=>__cf.player.weapon.reloading);
 await page.waitForTimeout(900);const mid=await info();
 assert(mid.reloadEnergy<0.4&&Math.max(...mid.channelOpacity)<0.35,'Channel powers down during reload');results.reloadMid=mid;
 if(!ff)await page.screenshot({path:resolve(out,'07-arc-reload-energy-off.png')});
 await page.waitForFunction(()=>!__cf.player.weapon.reloading);const done=await sampleChannel();
 assert(done.energy>0.9&&done.maxChannel>0.5,'Channel powers back up after reload');results.reloadDone=done;
 if(!ff)await page.screenshot({path:resolve(out,'08-arc-reload-energy-on.png')});
 // 5) Cancelling by weapon switch restores the ready state (no stuck dark, no false completion).
 await page.evaluate(()=>{__cf.combat.weapons.arc.mag=2;});
 await page.keyboard.press('r');await page.waitForFunction(()=>__cf.player.weapon.reloading);await page.waitForTimeout(900);
 const darkBeforeCancel=await info();assert(darkBeforeCancel.reloadEnergy<0.4,'Powers down before cancel');
 await page.evaluate(()=>__cf.selectWeapon(1));assert.equal(await page.evaluate(()=>__cf.player.weapon.id),'plasma');
 await page.evaluate(()=>__cf.selectWeapon(0));const cancel=await sampleChannel();
 assert(cancel.energy>0.9&&cancel.maxChannel>0.5,'Switch cancel restores charged look');results.cancel=cancel;
 // 6) No per-frame material/geometry creation across firing and reloads.
 await page.evaluate(()=>{__cfPerf.reset();for(let i=0;i<12;i++){__cf.combat.weapons.arc.mag=20;__cf.fire();__cf.advanceShots(0.05);}});
 await page.waitForTimeout(700);results.counters=await page.evaluate(()=>__cfPerf.summary().counters);
 for(const key of ['materialsCreated','geometriesCreated','linkProgram','buildEndlessWorld','buildTerrain'])assert.equal(results.counters[key]||0,0,key);
 assert.deepEqual(errors,[]);assert.deepEqual(consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);
 results.passed=true;console.log('PASS ARC-9 lightning presentation',name,JSON.stringify({chain:results.chain,reload:{mid:results.reloadMid.reloadEnergy,done:results.reloadDone.reloadEnergy}}));
}finally{
 for(const key of ['r'])await page.keyboard.up(key).catch(()=>{});
 writeFileSync(resolve(out,'arc-'+name+'.json'),JSON.stringify({results,errors,consoles},null,2));await browser.close();
}
