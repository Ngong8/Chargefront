// Commit-1 UI checks: compass-adjacent status, right-aligned objectives,
// optional-marker proximity hysteresis, Commander ability line.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const ff=process.argv.includes('firefox'),name=ff?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m41/navigation');mkdirSync(out,{recursive:true});
const browser=await(ff?firefox:chromium).launch(ff?{headless:true}:{headless:!process.argv.includes('--headed'),executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],consoles=[],results={};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoles.push(m.text());});
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
const hud=()=>page.evaluate(()=>__cf.inspectHUD());
const capture=async label=>{if(!ff){await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');await page.screenshot({path:resolve(out,label+'.png')});}};
const W=1280;
try{
 await page.goto(url.href);await page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
 await page.locator('#btn-start').click();await page.locator('#btn-sound-start').click();await page.waitForFunction(()=>__cf.intro&&!__cf.intro.prewarmPending,undefined,{timeout:120000});await page.keyboard.press('Space');
 await page.evaluate(()=>{__cf.setNoSpawn(true);__cf.setNoAggro(true);__cf.clearTestEnemies();__cf.setInvulnerable(true);});
 await page.waitForFunction(()=>__cf.phaseName==='M1_MOVE_FAC');await page.waitForTimeout(4300);
 // 1) Compass-adjacent status strip.
 let h=await hud();
 const distance=h.text.find(t=>t.x===W/2&&/^◈ \d+ m$/.test(t.value));
 assert(distance&&distance.y>=18&&distance.y<=60,`Waypoint distance must sit just under the compass (got ${JSON.stringify(distance)})`);
 assert(!h.text.some(t=>t.x===W/2&&t.y>120&&t.y<200),'No stray mid-screen top-center status text');
 await page.mouse.down();await page.waitForTimeout(120);await page.mouse.up();await page.waitForTimeout(60);
 h=await hud();const toast=h.text.find(t=>t.x===W/2&&t.value==='EQUIPPED BUL-117');assert(!toast||toast.y<=60,'Equipped notification must stay under the compass');
 results.statusY=distance.y;await capture('01-compass-status-stack');
 // 2) Right-aligned objectives.
 const main=h.text.find(t=>t.value==='MAIN OBJECTIVE');
 assert.equal(main.x,W-16);assert.equal(main.align,'right');
 // Optionals are discovery-gated; reveal the scan optional to check its right alignment.
 await page.evaluate(()=>{__cf.setOptionalDiscovered('scan_growth',true);__cf.advanceObjectiveHUD(0);});h=await hud();
 const optional=h.text.find(t=>t.value==='OPTIONAL');assert(optional&&optional.x===W-16&&optional.align==='right');
 const rightRows=h.text.filter(t=>/Reach the abandoned|Scan Infested/.test(t.value));assert(rightRows.length>=1);assert(rightRows.every(t=>t.x===W-16&&t.align==='right'));
 results.objectiveRight=rightRows.map(t=>({value:t.value,x:t.x,align:t.align}));await capture('02-objectives-right-aligned');
 // 3) Commander ability line, READY then cooldown, behind the same visual language.
 const surgeReady=h.text.find(t=>t.value==='[F] SURGE READY');assert(surgeReady);assert.equal(surgeReady.size,h.text.find(t=>/^\[[ZXY]\]/.test(t.value)).size);
 await page.keyboard.press('f');await page.waitForTimeout(120);h=await hud();
 const surgeCd=h.text.find(t=>/^\[F\] SURGE [\d.]+s$/.test(t.value));assert(surgeCd&&parseFloat(surgeCd.value.match(/[\d.]+/)[0])>15);
 results.surge={ready:surgeReady.value,cooldown:surgeCd.value};await capture('03-commander-ability');
 // 4) Optional-marker proximity + hysteresis (near 100, far 110).
 const place=dist=>page.evaluate(d=>{
  const s=__cf.campaignContent.scan.pos;const dir=s.x>400?-1:1;
  __cf.player.pos.x=Math.max(3,Math.min(797,s.x+dir*d));__cf.player.pos.y=s.y;
  __cf.player.zPos=__cf.terrainHeight(__cf.player.pos.x,__cf.player.pos.y);__cf.advanceObjectiveHUD(0);
 },dist);
 const face=()=>page.evaluate(()=>{const s=__cf.campaignContent.scan.pos,p=__cf.player;const a=Math.atan2(s.y-p.pos.y,s.x-p.pos.x);p.yaw=a;p.lastMoveYaw=a;p.pitch=0;});
 const visible=async()=>{await page.evaluate(()=>__cf.inspectHUD());return (await page.evaluate(()=>__cf.optionalMarkerInfo())).state['BIO-SCAN']===true;};
 await place(150);await face();assert.equal(await visible(),false,'Far optional marker hidden');
 assert(!(await hud()).text.some(t=>/BIO-SCAN/.test(t.value)),'Far optional on-screen label absent');await capture('04-optional-far-hidden');
 await place(60);await face();assert.equal(await visible(),true,'Near optional marker visible');assert((await hud()).text.some(t=>/BIO-SCAN/.test(t.value)));
 await capture('05-optional-near-visible');
 await place(105);for(let i=0;i<5;i++)assert.equal(await visible(),true,'No flicker inside band while visible');
 await place(115);assert.equal(await visible(),false,'Hides past far threshold');
 await place(105);for(let i=0;i<5;i++)assert.equal(await visible(),false,'Stays hidden inside band after hiding');
 await place(96);assert.equal(await visible(),true,'Reappears at near threshold');
 results.hysteresis=await page.evaluate(()=>__cf.optionalMarkerInfo());
 // Mission transition retires marker state (no stale distant optional markers).
 await page.evaluate(()=>{__cf.setNoSpawn(true);__cf.clearTestEnemies();__cf.completeMission();});
 const after=await page.evaluate(()=>__cf.optionalMarkerInfo().state);
 assert(!('BIO-SCAN' in after),'Mission transition clears stale optional marker state');
 assert.deepEqual(errors,[]);assert.deepEqual(consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);
 results.passed=true;console.log('PASS navigation/objective HUD',name,JSON.stringify({statusY:results.statusY,hysteresis:results.hysteresis.near+'/'+results.hysteresis.far}));
}finally{
 for(const key of ['w'])await page.keyboard.up(key).catch(()=>{});
 writeFileSync(resolve(out,'navigation-'+name+'.json'),JSON.stringify({results,errors,consoles},null,2));await browser.close();
}
