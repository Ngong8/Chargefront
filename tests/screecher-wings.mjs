// Screecher wing attachment/pivot/flap audit with close gameplay captures.
import assert from 'node:assert/strict';
import {campaignClick} from './menu-helpers.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const ff=process.argv.includes('firefox'),name=ff?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m41/screecher');mkdirSync(out,{recursive:true});
const browser=await(ff?firefox:chromium).launch(ff?{headless:true}:{headless:!process.argv.includes('--headed'),executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],consoles=[],results={};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoles.push(m.text());});
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
const capture=async(label,cam)=>{if(ff)return;await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');
 if(cam)await page.evaluate(c=>__cf.setCoverPose(c),cam);await page.screenshot({path:resolve(out,label+'.png')});await page.evaluate(()=>__cf.setCoverPose(null));};
try{
 await page.goto(url.href);await page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
 await campaignClick(page);await page.locator('#btn-sound-start').click();await page.waitForFunction(()=>__cf.intro&&!__cf.intro.prewarmPending,undefined,{timeout:120000});await page.keyboard.press('Space');
 await page.evaluate(()=>{
  const c=__cf;c.setNoSpawn(true);c.setNoAggro(false);c.clearTestEnemies();c.setInvulnerable(true);
  c.player.yaw=0;c.player.pitch=0;
  const e=c.spawnTestEnemy('screecher',0,14);
  e.skySpawnT=0;e.aggroT=0;e.speed=0;e.attackT=99999;e.beginSkySpawn(1);e.skySpawnT=0;
 });
 // let it settle at hover height
 await page.waitForFunction(()=>{const e=__cf.enemies.find(x=>x.type==='screecher');return e&&e.skySpawnT<=0;},undefined,{timeout:8000});
 await page.waitForTimeout(400);
 const audit=await page.evaluate(()=>__cf.wingAudit('screecher')[0]);
 results.audit=audit;
 assert.equal(audit.wings.length,2,'Two wings');
 const [a,b]=audit.wings;
 // Symmetric left/right placement.
 assert.equal(a.y,-b.y,'Wing roots mirrored on the body sides');assert.equal(a.z,b.z,'Wing roots share the same body plane');assert.equal(a.x,b.x);
 // Attached to the body (not floating off it) and tips extend outward.
 assert(Math.abs(a.y)<=0.42&&a.z>0.55&&a.z<0.95,'Wing roots sit on the body');
 assert(Math.abs(a.childY)>0,'Wing blade offset from the root');
 // Opposite flap phase.
 const opposite=await page.evaluate(()=>{const w=__cf.wingAudit('screecher')[0].wings;return Math.sign(w[0].rotX)!==Math.sign(w[1].rotX)||(Math.abs(w[0].rotX-Math.abs(w[1].rotX))>1e-6);});
 results.opposite=opposite;
 // Flap animates over time but roots never translate (no detachment).
 const s1=await page.evaluate(()=>__cf.wingAudit('screecher')[0].wings.map(w=>({p:[w.x,w.y,w.z],r:w.rotX})));
 await page.waitForTimeout(180);
 const s2=await page.evaluate(()=>__cf.wingAudit('screecher')[0].wings.map(w=>({p:[w.x,w.y,w.z],r:w.rotX})));
 assert(s1.some((w,i)=>w.r!==s2[i].r),'Flap animates');
 assert(s1.every((w,i)=>JSON.stringify(w.p)===JSON.stringify(s2[i].p)),'Wing roots do not translate/detach during flap');
 assert(s2.every(w=>Math.abs(w.r)<=0.7),'Flap stays within a modest range');
 // Turning stability: rotate the creature and re-check attachment.
 await page.evaluate(()=>{const e=__cf.enemies.find(x=>x.type==='screecher');e.angle+=1.7;e.mesh.rotation.z=e.angle;});
 await page.waitForTimeout(120);
 const turned=await page.evaluate(()=>__cf.wingAudit('screecher')[0].wings);
 assert(turned.every((w,i)=>JSON.stringify([w.x,w.y,w.z])===JSON.stringify([s2[i].p[0],s2[i].p[1],s2[i].p[2]])),'Attachment stable while turning');
 // Close captures: front, side, three-quarter.
 const cx=(await page.evaluate(()=>{const e=__cf.enemies.find(x=>x.type==='screecher');return {x:e.pos.x,y:e.pos.y,z:e.z};}));
 await capture('01-front',[cx.x,cx.y-9,cx.z+2,cx.x,cx.y,cx.z]);
 await capture('02-side',[cx.x+9,cx.y,cx.z+2,cx.x,cx.y,cx.z]);
 await capture('03-three-quarter',[cx.x+7,cx.y-7,cx.z+4,cx.x,cx.y,cx.z]);
 assert.deepEqual(errors,[]);assert.deepEqual(consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);
 results.passed=true;console.log('PASS screecher wings',name,JSON.stringify({wings:audit.wings,opposite}));
}finally{writeFileSync(resolve(out,'screecher-'+name+'.json'),JSON.stringify({results,errors,consoles},null,2));await browser.close();}
