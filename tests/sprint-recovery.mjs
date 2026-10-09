// Hold real sprint input through repeated exhaustion/recovery; observe resolved state.
import assert from 'node:assert/strict';
import {campaignClick} from './menu-helpers.mjs';
import { mkdirSync,writeFileSync } from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const ff=process.argv.includes('firefox'),name=ff?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m41/hud-flow');mkdirSync(out,{recursive:true});
const browser=await(ff?firefox:chromium).launch(ff?{headless:true}:{headless:!process.argv.includes('--headed'),executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const results={};
try{
 await page.goto(pathToFileURL(resolve('chargefront.html')).href);await page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
 await campaignClick(page);await page.locator('#btn-sound-start').click();await page.waitForFunction(()=>__cf.intro&&!__cf.intro.prewarmPending,undefined,{timeout:120000});await page.keyboard.press('Space');
 await page.evaluate(()=>{
  __cf.setNoSpawn(true);__cf.setNoAggro(true);__cf.clearTestEnemies();__cf.setInvulnerable(true);
  window.__sprintEvents=[];window.__sprintFrames=[];const p=__cf.player;let value=p.sprinting;
  Object.defineProperty(p,'sprinting',{configurable:true,get:()=>value,set(next){if(next!==value)__sprintEvents.push({next,stamina:p.stamina,at:performance.now()});value=next;}});
  const sample=()=>{__sprintFrames.push({sprint:p.sprinting,exhausted:p.sprintExhausted,stamina:p.stamina,speed:p.lastSpeed,blend:p.sprintBlend,pose:p.viewmodelState});if(__sprintFrames.length<2000)requestAnimationFrame(sample);};requestAnimationFrame(sample);
 });
 await page.keyboard.down('w');await page.keyboard.down('ShiftLeft');
 await page.waitForFunction(()=>__cf.player.sprintExhausted&&__cf.player.stamina>6&&__cf.player.stamina<15,undefined,{timeout:12000});
 results.recovery=await page.evaluate(()=>({stamina:__cf.player.stamina,sprinting:__cf.player.sprinting,exhausted:__cf.player.sprintExhausted,speed:__cf.player.lastSpeed,blend:__cf.player.sprintBlend,pose:__cf.player.viewmodelState}));
 assert(!results.recovery.sprinting&&results.recovery.exhausted);assert.equal(results.recovery.speed,5.2);assert(results.recovery.blend<.05);assert.notEqual(results.recovery.pose,'SPRINT');
 if(!ff)await page.screenshot({path:resolve(out,'01-sprint-recovering.png')});
 await page.waitForFunction(()=>__sprintEvents.filter(e=>!e.next).length>=3&&__sprintEvents.filter(e=>e.next).length>=4,undefined,{timeout:20000});
 await page.keyboard.up('ShiftLeft');await page.keyboard.up('w');
 results.events=await page.evaluate(()=>__sprintEvents);results.frames=await page.evaluate(()=>({recovering:__sprintFrames.filter(f=>f.exhausted).length,chatter:__sprintFrames.filter(f=>f.exhausted&&f.sprint).length,wrongSpeed:__sprintFrames.filter(f=>f.exhausted&&f.speed!==5.2).length}));
 const resumptions=results.events.filter(e=>e.next).slice(1);assert(resumptions.length>=3);assert(resumptions.every(e=>e.stamina>=25-22/60-1e-6));
 for(let i=1;i<results.events.length;i++)if(results.events[i].next)assert(results.events[i].at-results.events[i-1].at>=1600,'No tiny-regeneration sprint re-entry');
 assert.equal(results.frames.chatter,0);assert.equal(results.frames.wrongSpeed,0);assert.deepEqual(errors,[]);results.passed=true;
 console.log('PASS sprint recovery',name,JSON.stringify(results));
}finally{await page.keyboard.up('ShiftLeft').catch(()=>{});await page.keyboard.up('w').catch(()=>{});writeFileSync(resolve(out,'sprint-'+name+'.json'),JSON.stringify({results,errors},null,2));await browser.close();}
