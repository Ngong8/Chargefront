// Bounded debrief lifecycle regression. Accelerated chapter/counter fixtures use
// real checkpoint restore, native M3 transfer, purge/boarding/ship and death paths.
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const name=process.argv.includes('firefox')?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m43/results',name);
assert(!existsSync(out),'Use a fresh evidence destination');mkdirSync(out,{recursive:true});
const browser=await(name==='firefox'?firefox:chromium).launch(name==='firefox'?{headless:true}:{headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),report={browser:name,states:[],layouts:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
const ready=()=>page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});
async function boot(){await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});await ready();}
async function quiet(){await page.evaluate(()=>{__cf.setNoSpawn(true);__cf.setNoAggro(true);__cf.clearTestEnemies();__cf.pause(true);});}
async function capture(label){await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');await page.screenshot({path:resolve(out,label+'.png')});}
async function observe(label){const row=await page.evaluate(()=>({mission:__cf.missionId,phase:__cf.phaseName,...__cf.resultInfo(),chapters:structuredClone(__cf.campaignRun.chapterStats||[]),save:localStorage.cf_campaign_v1||null,endless:localStorage.cf_endless_v1||null,dom:document.querySelector('#campaign-result-screen').innerText}));report.states.push({label,...row});console.log('RESULTS',name,label,row.phase);return row;}
async function validateResult(){
 const r=await page.evaluate(()=>__cf.resultInfo().payload);assert(r);
 assert(await page.locator('#campaign-result-screen').isVisible());assert.equal(await page.locator('#campaign-result-title').innerText(),r.title);
 for(const s of r.stats)assert.equal(await page.locator(`[data-stat="${s.id}"] dd`).innerText(),s.value);
 const text=await page.locator('#result-card').innerText();assert(!/NaN|undefined|Infinity|\b-\d/.test(text));
 assert.equal(await page.locator('#btn-result-retry').isVisible(),r.replay);assert.equal(await page.locator('#btn-result-endless').count(),0);assert.equal(await page.locator('#btn-result-missions').isVisible(),r.selectMission);
 return r;
}
async function layouts(label){
 for(const size of [{width:1280,height:720},{width:768,height:600},{width:390,height:740},{width:320,height:568},{width:960,height:420}]){
  await page.setViewportSize(size);await page.locator('#result-card').evaluate(el=>el.scrollTop=0);
  const bounds=await page.locator('#result-card').boundingBox();assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=size.width+1&&bounds.y+bounds.height<=size.height+1);
  assert(await page.locator('#result-card').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  for(const button of await page.locator('.cf-result-actions button:visible').all()){await button.scrollIntoViewIfNeeded();const b=await button.boundingBox();assert(b.x>=0&&b.x+b.width<=size.width+1&&b.y>=0&&b.y+b.height<=size.height+1);}
  if(size.width===390)await capture(label+'-390-controls');
  await page.locator('#result-card').evaluate(el=>el.scrollTop=0);report.layouts.push({label,size,bounds});if(size.width===390||size.width===1280)await capture(label+'-'+size.width);
 }
 await page.setViewportSize({width:1280,height:720});
}
async function seedChapter(kills,time,ammo,medkits,optional){await page.evaluate(v=>{const c=__cf,s=c.createCheckpointForTest();s.kills=v.kills;s.missionTime=v.time;s.totalAmmoCrafted=v.ammo;s.totalMedkitsCrafted=v.medkits;s.optional=v.optional;c.restoreCheckpointForTest(s);},{kills,time,ammo,medkits,optional});}
async function extract(){
 await page.evaluate(()=>{const c=__cf,s=c.createMission4Snapshot();s.extraction.phase=26;s.extraction.mainIndex=2;c.applyMission4Snapshot(s);c.startExtraction();if(c.completeExtractionHoldout()!=='M4_BOARD')throw Error('purge failed');c.boardExtraction();if(c.completeExtractionDeparture()!=='DONE')throw Error('ship departure failed');});
 return validateResult();
}
async function launchSound(){await page.locator('#btn-sound-start').click();await page.waitForFunction(()=>__cf.mode==='endless'||document.querySelector('#start-screen').classList.contains('hidden'),undefined,{timeout:120000});}
try{
 await boot();await page.evaluate(()=>{const c=__cf;c.resetCampaignProgress();if(!c.startMission('dead_signal','new_campaign'))throw Error('fresh campaign failed');c.skipIntro();});await quiet();
 await seedChapter(7,111,2,1,{scan_growth:true,portable_cell:true});await page.evaluate(()=>__cf.completeMission());assert.equal(await page.evaluate(()=>__cf.missionId),'power_through');assert(!await page.locator('#campaign-result-screen').isVisible());
 await seedChapter(9,222,3,2,{escort_drone:true});await page.evaluate(()=>{__cf.completeMission();__cf.clearTestEnemies();});assert.equal(await page.evaluate(()=>__cf.missionId),'sample_zero');
 await page.evaluate(()=>{const c=__cf;c.setPhase(21);c.move(373-c.player.pos.x,718-c.player.pos.y);c.interact(2);c.restoreLabTurret();c.move(364-c.player.pos.x,774-c.player.pos.y);for(let i=0;i<3;i++){c.squad[i].pos.x=350+i*10;c.squad[i].pos.y=762;}});
 await seedChapter(11,333,4,3,{security_turret:true});
 await page.evaluate(()=>{__cf.interact(2);if(!__cf.completeStabilization())throw Error('native transfer failed');__cf.clearTestEnemies();});
 assert.equal(await page.evaluate(()=>__cf.missionId),'break_contact');assert(!await page.locator('#campaign-result-screen').isVisible());assert.equal(await page.evaluate(()=>__cf.resultInfo().payload),null);
 const beforeFailure=await observe('M3-to-M4 seamless');assert.deepEqual(beforeFailure.chapters.map(c=>c.optionalCount),[2,1,1]);
 // Failed run never completes/unlocks M4. Continue remains the living checkpoint.
 await page.evaluate(()=>{__cf.checkpoint();__cf.setInvulnerable(false);__cf.player.shield=0;__cf.damagePlayer(10000);});
 const failure=await validateResult();assert.equal(failure.title,'MISSION FAILED');assert.equal(failure.identity,'MISSION 4 / BREAK CONTACT');assert.equal(await page.evaluate(()=>__cf.squad.filter(m=>!m.downed).length),3);
 await page.evaluate(()=>__cf.completeMission());assert.equal(await page.evaluate(()=>__cf.campaignProfile.campaignComplete),false);assert.equal(await page.evaluate(()=>__cf.campaignProfile.missions.break_contact.completed),false);await observe('Campaign failure');await layouts('campaign-failure');
 // Non-Space keys and background clicks cannot silently retry or hijack navigation.
 await page.keyboard.press('a');await page.locator('#campaign-result-title').click();assert.equal(await page.evaluate(()=>__cf.phaseName),'DEAD');
 await page.locator('#btn-result-retry').click();await ready();await page.waitForFunction(()=>__cf.missionId==='break_contact'&&!__cf.player.dead,undefined,{timeout:120000});await quiet();
 const retry=await observe('Fresh retry retains completed chapters');assert.deepEqual(retry.chapters,beforeFailure.chapters);assert.equal(retry.current.kills,0);assert.equal(retry.payload,null);assert.equal(await page.evaluate(()=>__cf.player.hp),100);assert(!await page.locator('#campaign-result-screen').isVisible());
 // Successful fresh Campaign final attempt; current M4 seeded, real purge adds deaths.
 await page.evaluate(()=>{const c=__cf,s=c.createMission4Snapshot();s.kills=13;s.missionTime=444;s.totalAmmoCrafted=5;s.totalMedkitsCrafted=4;c.applyMission4Snapshot(s);});
 const full=await extract(),end=await observe('Fresh Campaign complete');
 assert.equal(full.title,'CAMPAIGN COMPLETE');assert.equal(full.totals.kills,27+end.current.kills);assert.equal(full.totals.activeSeconds,1110);assert.equal(full.totals.cartridgesCrafted,14);assert.equal(full.totals.medkitsCrafted,10);assert.deepEqual(full.chapters.map(r=>r.optionalCount),[2,1,1,0]);
 assert.equal(JSON.parse(end.save).operation.continuedState,null);assert(JSON.parse(end.save).campaignComplete);await layouts('campaign-complete');
 // A late hostile death cannot rewrite the frozen terminal snapshot/DOM.
 const immutable=await page.evaluate(()=>{const c=__cf,before=c.resultInfo().payload,e=c.spawnTestEnemy('skitter',20,0);e.takeDamage(10000);e.die();c.completeMission();c.completeExtractionDeparture();return {before,after:c.resultInfo().payload,current:c.resultInfo().current};});assert.deepEqual(immutable.after,immutable.before);await validateResult();report.immutable=immutable;
 // Native SELECT MISSION: M4 is mission completion and preserves save bytes.
 const completedBytes=end.save;await page.locator('#btn-result-missions').click();await ready();assert(await page.locator('#mission-panel').isVisible());
 await page.locator('[data-mission-id="break_contact"]').click();await launchSound();await page.waitForFunction(()=>__cf.missionId==='break_contact'&&__cf.phaseName==='M4_BREAK_CONTACT',undefined,{timeout:120000});await quiet();
 const standalone=await extract();assert.equal(standalone.title,'MISSION 4 COMPLETE');assert.equal(standalone.chapters.length,1);assert.equal(await page.evaluate(()=>localStorage.cf_campaign_v1),completedBytes);await observe('Standalone M4 complete');await capture('standalone-m4');
 // Mission Select M3 still continues seamlessly into M4 with Mission Select origin.
 await page.locator('#btn-result-missions').click();await ready();await page.locator('[data-mission-id="sample_zero"]').click();await launchSound();await page.waitForFunction(()=>__cf.missionId==='sample_zero',undefined,{timeout:120000});await quiet();
 await page.evaluate(()=>{const c=__cf;c.setPhase(21);c.move(373-c.player.pos.x,718-c.player.pos.y);c.interact(2);c.move(364-c.player.pos.x,774-c.player.pos.y);for(let i=0;i<3;i++){c.squad[i].pos.x=350+i*10;c.squad[i].pos.y=762;}c.interact(2);if(!c.completeStabilization())throw Error('standalone M3 transfer failed');c.clearTestEnemies();});
 assert.equal(await page.evaluate(()=>__cf.missionId),'break_contact');assert(!await page.locator('#campaign-result-screen').isVisible());const selectedChain=await extract();assert.equal(selectedChain.title,'MISSION 4 COMPLETE');assert.deepEqual(selectedChain.chapters.map(c=>c.missionId),['sample_zero','break_contact']);assert.equal(await page.evaluate(()=>localStorage.cf_campaign_v1),completedBytes);await observe('Mission Select M3-to-M4 complete');
 // Campaign results return to Main Menu; earned completion opens Endless there.
 await page.locator('#btn-result-menu').click();await ready();assert(await page.locator('#btn-endless').isEnabled());await page.locator('#btn-endless').click();assert(await page.locator('#endless-setup-panel').isVisible());await page.locator('#btn-endless-ready').click();await launchSound();await page.waitForFunction(()=>__cf.mode==='endless',undefined,{timeout:120000});await quiet();
 assert.equal(await page.evaluate(()=>__cf.resultInfo().current.kills),0);assert.equal(await page.evaluate(()=>localStorage.cf_campaign_v1),completedBytes);
 const waveSave=await page.evaluate(()=>{const c=__cf;c.player.hp=50;c.player.shield=0;c.craft.medkits=1;c.giveScrap(10);c.craftAmmo();c.craftMedkit();const e=c.spawnTestEnemy('skitter',20,0);e.takeDamage(10000);e.die();c.startWave();const saved=c.endlessSaveInfo();saved.missionTime=3675;localStorage.cf_endless_v1=JSON.stringify(saved);return saved;});
 const eventStats=await page.evaluate(()=>__cf.resultInfo().current);assert.equal(eventStats.kills,1);assert.equal(eventStats.cartridgesCrafted,1);assert.equal(eventStats.medkitsCrafted,1);
 // Browser reload + native Endless Continue restores its exact wave-start counters.
 await page.reload();await ready();await page.locator('#btn-endless').click();await page.locator('#btn-endless-continue').click();await launchSound();await page.waitForFunction(()=>__cf.mode==='endless',undefined,{timeout:120000});await quiet();
 const resumedEvents=await page.evaluate(()=>__cf.resultInfo().current);assert.deepEqual({...resumedEvents,activeSeconds:0},{...eventStats,activeSeconds:0});assert(resumedEvents.activeSeconds>=waveSave.missionTime&&resumedEvents.activeSeconds<waveSave.missionTime+1,'Continue permits real gameplay frames before the quiet fixture pauses');
 await page.evaluate(()=>{__cf.setInvulnerable(false);__cf.player.shield=0;__cf.damagePlayer(10000);});const gameOver=await validateResult();assert.equal(gameOver.wave,1);assert.equal(gameOver.cleared,0);assert.equal(gameOver.totals.kills,1);assert.equal(gameOver.stats.find(s=>s.id==='time').value,'1:01:15');assert.equal(await page.evaluate(()=>localStorage.getItem('cf_endless_v1')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('cf_endless_v1.backup')),null);
 assert.equal(await page.evaluate(()=>localStorage.cf_campaign_v1),completedBytes);await observe('Endless resumed Game Over');await layouts('endless-game-over');
 await page.locator('#btn-result-retry').click();await page.waitForFunction(()=>__cf.phaseName==='ENDLESS');await quiet();const restarted=await page.evaluate(()=>__cf.resultInfo().current);assert.deepEqual({...restarted,activeSeconds:0},{activeSeconds:0,kills:0,cartridgesCrafted:0,medkitsCrafted:0});assert(restarted.activeSeconds<1);assert.equal(await page.evaluate(()=>__cf.endless.wave),0);assert.equal(await page.evaluate(()=>__cf.endless.arena.id),waveSave.arena);assert.equal(await page.evaluate(()=>__cf.resultInfo().payload),null);
 // Successful Endless extraction at six-wave milestone through real K input.
 await page.evaluate(()=>{const c=__cf;for(let wave=0;wave<6;wave++){c.startWave();c.endless.budgetLeft=0;c.advanceEncounterSystems(0);}c.move(406-c.player.pos.x,400-c.player.pos.y);c.pause(false);});
 await page.keyboard.press('k');await page.waitForFunction(()=>__cf.phaseName==='DONE');const extracted=await validateResult();assert.equal(extracted.wave,6);assert.equal(extracted.cleared,6);assert.equal(extracted.success,true);await observe('Endless successful extraction');await capture('endless-extracted');
 await page.waitForTimeout(2100);await page.keyboard.press('Space');await page.waitForFunction(()=>__cf.phaseName==='ENDLESS');await quiet();assert.equal(await page.evaluate(()=>__cf.resultInfo().current.kills),0);await page.evaluate(()=>{__cf.player.shield=0;__cf.damagePlayer(10000);});await validateResult();await page.locator('#btn-result-menu').click();await ready();assert(await page.locator('#menu-buttons').isVisible());assert.equal(await page.evaluate(()=>localStorage.cf_campaign_v1),completedBytes);
 // Restore an existing living Campaign checkpoint, then native Continue and finish.
 await page.evaluate(raw=>{localStorage.cf_campaign_v1=raw;localStorage.removeItem('cf_campaign_v1.backup');},beforeFailure.save);await page.reload();await ready();await page.locator('#btn-campaign').click();await page.locator('#btn-continue-campaign').click();await launchSound();await page.waitForFunction(()=>__cf.missionId==='break_contact'&&__cf.phaseName==='M4_BREAK_CONTACT',undefined,{timeout:120000});await quiet();
 assert.deepEqual((await observe('Valid Campaign Continue')).chapters,beforeFailure.chapters);const resumed=await extract();assert.equal(resumed.chapters.length,4);assert.deepEqual(resumed.chapters.map(c=>c.optionalCount),[2,1,1,0]);await observe('Resumed Campaign complete');
 // Legacy checkpoint lacks some archive data: report known scope, never invent zero optional history.
 await page.locator('#btn-result-menu').click();await ready();await page.evaluate(raw=>{const p=JSON.parse(raw);p.operation.continuedState.chapterStats=p.operation.continuedState.chapterStats.slice(2).map(({optionalCount,...r})=>r);localStorage.cf_campaign_v1=JSON.stringify(p);localStorage.removeItem('cf_campaign_v1.backup');},beforeFailure.save);await page.reload();await ready();await page.evaluate(()=>__cf.startMission('break_contact','continue_campaign'));await quiet();const legacy=await extract();assert(legacy.scope.startsWith('Recorded'));assert.equal(legacy.chapters[0].optionalCount,null);assert.match(await page.locator('#result-objective-rows').innerText(),/Not recorded/);await observe('Legacy partial history');await capture('legacy-recorded-totals');
 assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS results-flow',name,JSON.stringify({states:report.states.length,layouts:report.layouts.length,fullTotals:full.totals}));
}finally{writeFileSync(resolve(out,'results.json'),JSON.stringify(report,null,2));await browser.close();}
