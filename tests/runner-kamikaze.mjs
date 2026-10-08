// Runner kamikaze: arming, ~2 s fuse, single bounded detonation, no stale state.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const ff=process.argv.includes('firefox'),name=ff?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m41/runner');mkdirSync(out,{recursive:true});
const browser=await(ff?firefox:chromium).launch(ff?{headless:true}:{headless:!process.argv.includes('--headed'),executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],consoles=[],results={};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoles.push(m.text());});
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
const runners=()=>page.evaluate(()=>__cf.runnerInfo());
const capture=async label=>{if(!ff){await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');await page.screenshot({path:resolve(out,label+'.png')});}};
// Freeze HP/shield regen so blast damage is measured cleanly.
const setHp=(hp,sh)=>page.evaluate(({hp,sh})=>{const c=__cf;c.setPlayerHealth(hp,sh);c.player.shieldDelayT=1e9;c.player.hpDelayT=1e9;},{hp,sh});
try{
 await page.goto(url.href);await page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
 await page.evaluate(()=>__cf.startEndlessMode({}));await page.waitForFunction(()=>__cf.mode==='endless');await page.mouse.click(640,360);
 await page.evaluate(()=>{const c=__cf;c.setNoSpawn(true);c.setNoAggro(false);c.clearTestEnemies();c.setInvulnerable(false);c.setPlayerHealth(100,40);c.player.shieldDelayT=1e9;c.player.hpDelayT=1e9;c.player.grenadeCd=0;});
 // Park the squad far out of range so only the runner's blast affects the player.
 const parkSquad=()=>page.evaluate(()=>{const c=__cf;for(const m of c.squad){m.pos.x=c.player.pos.x+260;m.pos.y=c.player.pos.y+120;m.z=c.terrainHeight(m.pos.x,m.pos.y);m.fireT=1e9;m.target=null;m.aggroT=0;}c.commandSquad('hold');});
 await parkSquad();
 const armedOnce=async()=>{await parkSquad();await page.evaluate(()=>{const c=__cf;__cf.setPlayerHealth(100,40);__cf.player.shieldDelayT=1e9;__cf.player.hpDelayT=1e9;c.spawnTestEnemy('runner',3.2,0);});
  await page.waitForFunction(()=>{const r=__cf.runnerInfo()[0];return r&&r.armed;},undefined,{timeout:4000});
  return page.evaluate(()=>__cf.player.hp+__cf.player.shield);};
 // 1) Single runner: arms once, one bounded blast, removed after.
 const hp0=await armedOnce();
 const armed=await runners();results.armed=armed[0];assert(armed.length===1&&armed[0].armed);
 if(!ff)await capture('01-runner-armed-telegraph');
 await page.waitForFunction(()=>{const r=__cf.runnerInfo()[0];return !r||r.detonated||r.dead;},undefined,{timeout:6000});
 await page.waitForTimeout(250);const hp1=await page.evaluate(()=>__cf.player.hp+__cf.player.shield);
 const firstDrop=hp0-hp1;assert(firstDrop>0&&firstDrop<=40,`Bounded radial damage (got ${firstDrop})`);
 results.firstDrop=firstDrop;
 await page.waitForTimeout(900);const hp2=await page.evaluate(()=>__cf.player.hp+__cf.player.shield);assert.equal(hp2,hp1,'No repeated explosion damage');
 assert((await runners()).length===0,'Runner removed after detonation');
 // 1b) Precise fuse timing on a fresh runner (no capture latency in the window).
 await armedOnce();const t0=Date.now();
 await page.waitForFunction(()=>{const r=__cf.runnerInfo()[0];return !r||r.detonated||r.dead;},undefined,{timeout:6000});
 const elapsed=(Date.now()-t0)/1000;results.fuse=elapsed;assert(elapsed>=1.5&&elapsed<=2.6,`Fuse ~2s (got ${elapsed.toFixed(2)})`);
 await page.waitForTimeout(300);
 // 2) Killed during the fuse never explodes and keeps no armed state.
 await parkSquad();
 await page.evaluate(()=>{const c=__cf;c.clearTestEnemies();c.setPlayerHealth(100,40);c.player.shieldDelayT=1e9;c.player.hpDelayT=1e9;c.setNoAggro(false);c.spawnTestEnemy('runner',3.2,0);});
 await page.waitForFunction(()=>{const r=__cf.runnerInfo()[0];return r&&r.armed;},undefined,{timeout:4000});
 const beforeKill=await page.evaluate(()=>__cf.player.hp+__cf.player.shield);
 await page.evaluate(()=>{__cf.runnerInfo();const e=__cf.enemies.find(x=>x.type==='runner');e.takeDamage(999999);});
 await page.waitForTimeout(1200);
 assert.equal(await page.evaluate(()=>__cf.player.hp+__cf.player.shield),beforeKill,'Killed mid-fuse does not detonate');
 const dead=await page.evaluate(()=>__cf.runnerInfo());assert(dead.every(r=>!r.armed&&!r.detonated),'No stale armed state after death');
 // 3) Moving target out during the fuse still detonates once (committed).
 await parkSquad();
 await page.evaluate(()=>{const c=__cf;c.clearTestEnemies();__cf.setPlayerHealth(100,40);__cf.player.shieldDelayT=1e9;__cf.player.hpDelayT=1e9;c.spawnTestEnemy('runner',3.2,0);});
 await page.waitForFunction(()=>{const r=__cf.runnerInfo()[0];return r&&r.armed;},undefined,{timeout:4000});
 await page.evaluate(()=>{__cf.player.pos.x+=60;__cf.player.zPos=__cf.terrainHeight(__cf.player.pos.x,__cf.player.pos.y);});
 await page.waitForFunction(()=>{const r=__cf.runnerInfo()[0];return !r||r.detonated||r.dead;},undefined,{timeout:5000});
 await page.waitForTimeout(300);const outHp=await page.evaluate(()=>__cf.player.hp+__cf.player.shield);
 assert.equal(outHp,140,'Fuse detonates out of range with no damage (LOS/distance authorization)');
 // 4) Several runners at once: bounded, all resolve, no runaway damage.
 await parkSquad();
 const many=await page.evaluate(()=>{const c=__cf;c.clearTestEnemies();c.setPlayerHealth(100,100);c.player.shieldDelayT=1e9;c.player.hpDelayT=1e9;for(let i=0;i<4;i++)c.spawnTestEnemy('runner',3.0+i*0.6,i-2);return __cf.runnerInfo().length;});
 await page.waitForFunction(()=>__cf.runnerInfo().length===0,undefined,{timeout:10000});
 const after=await page.evaluate(()=>({hp:__cf.player.hp+__cf.player.shield,runners:__cf.runnerInfo().length}));
 assert.equal(after.runners,0);assert(after.hp>=0);assert(after.hp>=200-4*40,'Bounded combined blast');results.multi={spawned:many,...after};
 assert.deepEqual(errors,[]);assert.deepEqual(consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);
 results.passed=true;console.log('PASS runner kamikaze',name,JSON.stringify({fuse:+results.fuse.toFixed(2),drop:results.firstDrop,multi:results.multi}));
}finally{writeFileSync(resolve(out,'runner-'+name+'.json'),JSON.stringify({results,errors,consoles},null,2));await browser.close();}
