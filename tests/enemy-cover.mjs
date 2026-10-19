// Actual launched mortar + late cover: area damage must not cross a solid wall.
// CF_BASELINE_HTML may point to the preserved pre-CP1 source. Only its asset base
// URL changes in the isolated evidence copy; gameplay code is not rewritten.
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href);
const name=process.argv.includes('firefox')?'firefox':'edge',baseline=!!process.env.CF_BASELINE_HTML,out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m43/cp1-cp2/cover',name);assert(!existsSync(out));mkdirSync(out,{recursive:true});
const actual=pathToFileURL(resolve('chargefront.html'));let url=new URL(actual.href);
if(baseline){const file=resolve(out,'baseline.html');writeFileSync(file,readFileSync(resolve(process.env.CF_BASELINE_HTML),'utf8').replace('<head>','<head><base href="'+actual.href+'">'));url=pathToFileURL(file);}
url.searchParams.set('perfDiagnostics','1');url.searchParams.set('endlessFixture','1');
const browser=await(name==='firefox'?firefox:chromium).launch(name==='firefox'?{headless:true}:{headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),report={browser:name,baseline,errors:[]};page.on('pageerror',e=>report.errors.push(e.message));
async function boot(){await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});}
try{
 await boot();await page.evaluate(()=>{__cf.startEndlessMode();__cf.pause(true);});const saved=await page.evaluate(()=>{const s=__cf.endlessSaveInfo();s.arena='crater';s.run.worldSeed=430012;return s;});await boot();await page.evaluate(s=>{localStorage.cf_endless_v1=JSON.stringify(s);__cf.continueEndless();__cf.pause(true);},saved);
 await page.evaluate(()=>{const c=__cf;c.setNoSpawn(true);c.setNoAggro(false);c.setInvulnerable(false);c.clearTestEnemies();c.suppressAbilityAutonomy(1e8);c.move(400-c.player.pos.x,430-c.player.pos.y);c.player.hp=100;c.player.shield=0;c.player.hpDelayT=c.player.shieldDelayT=1e8;c.commandSquad('hold');for(const m of c.squad){m.pos.set(450,150);m.holdPos.set(450,150);m.fireT=m.abilityCd=1e8;}const e=c.spawnTestEnemy('artillery',0,38);e.speed=0;window.shooter=e;c.pause(false);});
 await page.waitForFunction(()=>__cf.scene.children.some(o=>o.style?.kind==='mortar'),undefined,{timeout:7000});
 report.before=await page.evaluate(()=>{const c=__cf,shot=c.scene.children.find(o=>o.style?.kind==='mortar');window.mortar=shot;window.cover=c.addTestSolid(398,434,402,435);c.move(0,2);return {hp:c.player.hp,shot:shot.position.toArray(),damage:shot.dmg,coverBlocks:c.probeBlocked(400,436,1.35,400,432,1.35),player:[c.player.pos.x,c.player.pos.y]};});assert(report.before.coverBlocks);
 await page.waitForFunction(()=>!__cf.scene.children.includes(window.mortar),undefined,{timeout:6000});await page.waitForTimeout(100);report.after=await page.evaluate(()=>({hp:__cf.player.hp,shield:__cf.player.shield}));
 if(baseline)assert(report.after.hp<100,'Accepted baseline reproduces splash through cover');else assert.equal(report.after.hp,100,'Mortar blast respects intervening wall');
 await page.evaluate(()=>{cover.disabled=true;__cf.move(0,-4);__cf.player.hp=100;shooter.attackT=0;shooter.losT=0;});await page.waitForFunction(()=>__cf.scene.children.some(o=>o.style?.kind==='mortar'),undefined,{timeout:7000});await page.waitForFunction(()=>__cf.player.hp<100,undefined,{timeout:6000});report.openAfter=await page.evaluate(()=>({hp:__cf.player.hp,shield:__cf.player.shield}));assert(report.openAfter.hp<100,'Open blast still damages its actual target');
 assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS mortar cover',name,JSON.stringify(report));
}finally{writeFileSync(resolve(out,'cover.json'),JSON.stringify(report,null,2));await browser.close();}
