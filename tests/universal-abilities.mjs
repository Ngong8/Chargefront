import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {endlessDeployment} from './menu-helpers.mjs';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const ff=process.argv.includes('firefox'),name=ff?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m41/regressions/universal-abilities');mkdirSync(out,{recursive:true});
const browser=await(ff?firefox:chromium).launch(ff?{headless:!process.argv.includes('--headed')}:{headless:!process.argv.includes('--headed'),executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],consoles=[],results={matrix:[],layouts:[],saves:[]};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoles.push(m.text());});
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
const abilities=['surge','bulwark','medic_pulse','target_designator'],operators=['player','rook','vex','kade'],keys=['f','z','x','y'];
const ready=()=>page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
const quiet=()=>page.evaluate(()=>{__cf.setNoSpawn(true);__cf.setNoAggro(true);__cf.setInvulnerable(true);__cf.clearTestEnemies();__cf.suppressAbilityAutonomy();__cf.pause(true);});
async function capture(label){await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');const old=await page.locator('#pause-screen').evaluate(el=>{const old=el.style.visibility;el.style.visibility='hidden';return old;});try{await page.screenshot({path:resolve(out,`${label}-${name}.png`)});}finally{await page.locator('#pause-screen').evaluate((el,old)=>el.style.visibility=old,old);}}
async function launch(ability){
 await page.goto(url.href);await ready();await endlessDeployment(page);
 await page.locator('#endless-slot1').selectOption('arc');await page.locator('#endless-slot2').selectOption('plasma');
 for(const id of operators){const options=await page.locator(`#endless-${id}-ability option`).evaluateAll(nodes=>nodes.map(n=>n.value));assert.deepEqual(options,abilities);await page.locator(`#endless-${id}-ability`).selectOption(ability);}
 if(ability==='target_designator'){
  for(const viewport of [{width:1280,height:720},{width:1780,height:832},{width:1920,height:1080}]){await page.setViewportSize(viewport);const panel=await page.locator('#endless-setup-panel').boundingBox();assert(panel.y>=0&&panel.y+panel.height<=viewport.height);assert.equal(await page.locator('.cf-loadout-group').count(),4);assert(await page.locator('#endless-setup-panel').evaluate(el=>getComputedStyle(el).fontFamily.includes('Glitch Slap')));results.layouts.push({viewport,panel});}
  await page.setViewportSize({width:1280,height:720});await capture('four-universal-dropdowns');
 }
 await page.locator('#btn-endless-ready').click();await page.locator('#btn-sound-start').click();await page.waitForFunction(()=>__cf.mode==='endless');await page.mouse.click(640,360);await quiet();
 assert((await page.evaluate(()=>__cf.operatorAbilityInfo())).every(a=>a.ability===ability));
 // Restore a deterministic flat arena through the actual version-1 save reader.
 const fixedArena=await page.evaluate(()=>{const s=__cf.endlessSaveInfo();s.arena='crater';s.run.worldSeed=4181;return s;});
 await page.reload();await ready();await page.evaluate(s=>localStorage.cf_endless_v1=JSON.stringify(s),fixedArena);await page.locator('#btn-endless').click();await page.locator('#btn-endless-continue').click();await page.locator('#btn-sound-start').click();await page.waitForFunction(()=>__cf.mode==='endless');await quiet();
}
async function fixture(owner){return page.evaluate(owner=>{
 const c=__cf;c.pause(true);c.clearTestEnemies();c.advanceShots(10);c.advanceElectricalFx(10);c.commandSquad('hold');c.suppressAbilityAutonomy(30);
 const actors=[c.player,...c.squad],positions=[[420,450],[460,450],[420,490],[460,490]];
 actors.forEach((a,i)=>{const [x,y]=positions[i];a.pos.set(x,y);if(i)a.z=c.terrainHeight(x,y);else a.zPos=c.terrainHeight(x,y);a.hp=40;a.shield=0;a.downed=false;a.dead=false;a.abilityCd=i===owner?0:1000;a.bulwarkT=0;a.hpDelayT=a.shieldDelayT=1000;if(i){a.holdPos.set(x,y);a.fireT=1000;}});
 const source=actors[owner],ally=actors[(owner+1)%4];ally.pos.set(source.pos.x+2,source.pos.y);if(ally===c.player)ally.zPos=c.terrainHeight(ally.pos.x,ally.pos.y);else{ally.z=c.terrainHeight(ally.pos.x,ally.pos.y);ally.holdPos.copy(ally.pos);}
 const enemy=c.spawnTestEnemy('brute',source.pos.x+8-c.player.pos.x,source.pos.y-c.player.pos.y);enemy.hp=enemy.maxHp=10000;enemy.speed=0;enemy.markedT=0;enemy.attackT=1000;
 c.player.yaw=Math.atan2(enemy.pos.y-c.player.pos.y,enemy.pos.x-c.player.pos.x);c.player.pitch=Math.atan2(enemy.z+.8-c.player.zPos-c.player.eye,Math.hypot(enemy.pos.x-c.player.pos.x,enemy.pos.y-c.player.pos.y));c.sampleReloadPose(1,75);
 window.__abilityEnemy=enemy;window.__abilityOwner=owner;
 return {owner,source:[source.pos.x,source.pos.y],hp:source.hp,shield:source.shield,enemyHp:enemy.hp,nearIndex:(owner+1)%4,farIndex:(owner+2)%4};
},owner);}
try{
 for(const ability of abilities){
  await launch(ability);
  for(let owner=0;owner<4;owner++){
   const before=await fixture(owner);await page.evaluate(()=>__cf.pause(false));await page.keyboard.press(keys[owner]);await page.waitForFunction(owner=>__cf.operatorAbilityInfo()[owner].cooldown>0,owner,{timeout:5000});await page.evaluate(()=>__cf.pause(true));
   const row=await page.evaluate(()=>{const c=__cf,actors=[c.player,...c.squad],owner=__abilityOwner;return {ability:c.operatorAbilityInfo()[owner],actors:actors.map(a=>({hp:a.hp,shield:a.shield,maxHp:a.maxHp,maxShield:a.maxShield})),enemyHp:__abilityEnemy.hp,marked:__abilityEnemy.markedT,stun:__abilityEnemy.stunT,impacts:c.effectInfo().impacts,hud:c.inspectHUD().text};});
   assert.equal(row.ability.ability,ability);assert.equal(row.ability.lastSource,'manual');assert(row.ability.cooldown>15);assert(row.impacts.some(p=>Math.hypot(p[0]-before.source[0],p[1]-before.source[1])<.5));
   const own=row.actors[owner],near=row.actors[before.nearIndex],far=row.actors[before.farIndex];
   if(ability==='surge'){assert.equal(own.shield,35);assert.equal(near.shield,35);assert.equal(far.shield,0);assert.equal(before.enemyHp-row.enemyHp,32);assert(row.stun>1);}
   if(ability==='medic_pulse'){assert.equal(own.hp,72);assert.equal(near.hp,72);assert.equal(own.shield,18);assert.equal(near.shield,18);assert.equal(far.hp,40);}
   if(ability==='bulwark'){
    assert(row.ability.bulwark>8.5&&row.ability.bulwark<=9);
    const protection=await page.evaluate(owner=>{const c=__cf,a=[c.player,...c.squad][owner];c.setInvulnerable(false);a.hp=100;a.shield=0;a.bulwarkT=0;const before=a.hp;if(owner)c.squad[owner-1].takeDamage(20);else c.damagePlayer(20);const unprotected=before-a.hp;a.hp=100;a.shield=0;a.bulwarkT=9;if(owner)c.squad[owner-1].takeDamage(20);else c.damagePlayer(20);const protectedDamage=100-a.hp;c.setInvulnerable(true);return {unprotected,protectedDamage};},owner);assert(Math.abs(protection.protectedDamage/protection.unprotected-.45)<1e-6);row.protection=protection;
   }
   if(ability==='target_designator'){assert(row.marked>9.5&&row.marked<=10);assert.equal(row.enemyHp,before.enemyHp);}
   const key=keys[owner].toUpperCase(),hud=row.hud.find(t=>t.value.startsWith('['+key+'] '));assert(hud&&!hud.value.includes('READY'));
   assert((await page.evaluate(text=>{const ctx=document.createElement('canvas').getContext('2d');ctx.font='10px "Glitch Slap"';return ctx.measureText(text).width;},hud.value))<=232);
   row.operator=operators[owner];row.key=key;results.matrix.push({...before,...row});
   const guarded=await page.evaluate(owner=>{const c=__cf,a=[c.player,...c.squad][owner],before=c.effectInfo().impacts.length;const ok=owner?c.useSquadAbility(owner-1):c.useCommanderAbility();return {ok,before,after:c.effectInfo().impacts.length};},owner);assert(!guarded.ok);assert.equal(guarded.before,guarded.after);
   // Incapacitated owners must not spend a cooldown or apply effects, even via the native key.
   await page.evaluate(owner=>{const a=[__cf.player,...__cf.squad][owner];a.abilityCd=0;if(owner)a.downed=true;else a.dead=true;__cf.suppressAbilityAutonomy(30);__cf.pause(false);},owner);
   await page.keyboard.press(keys[owner]);await page.waitForTimeout(100);await page.evaluate(()=>__cf.pause(true));assert.equal((await page.evaluate(()=>__cf.operatorAbilityInfo()))[owner].cooldown,0);
   await page.evaluate(owner=>{const a=[__cf.player,...__cf.squad][owner];a.downed=false;a.dead=false;},owner);
  }
  const config=await page.evaluate(()=>__cf.endlessConfiguration);
  await page.evaluate(ability=>{__cf.player.hp=73;__cf.player.abilityCd=7;__cf.player.bulwarkT=ability==='bulwark'?2:0;__cf.saveEndless();},ability);
  const saved=await page.evaluate(()=>__cf.endlessSaveInfo());assert.equal(saved.player.ability,ability);assert.deepEqual(saved.configuration,config);
  await page.reload();await ready();await page.locator('#btn-endless').click();await page.locator('#btn-endless-continue').click();await page.locator('#btn-sound-start').click();await page.waitForFunction(()=>__cf.mode==='endless');await quiet();
  assert((await page.evaluate(()=>__cf.operatorAbilityInfo())).every(a=>a.ability===ability));assert(await page.evaluate(()=>__cf.player.abilityCd>6));if(ability==='bulwark')assert(await page.evaluate(()=>__cf.player.bulwarkT>1));else assert.equal(await page.evaluate(()=>__cf.player.bulwarkT),0);
  await page.evaluate(()=>__cf.restartEndless());await quiet();assert.deepEqual(await page.evaluate(()=>__cf.endlessConfiguration),config);assert((await page.evaluate(()=>__cf.operatorAbilityInfo())).every(a=>a.cooldown===0&&a.bulwark===0));results.saves.push({ability,configuration:config,continued:true,restarted:true});
  if(ability==='surge'){
   await page.evaluate(()=>{const c=__cf;c.clearTestEnemies();c.advanceElectricalFx(10);c.commandSquad('hold');c.suppressAbilityAutonomy(30);[c.player,...c.squad].forEach((a,i)=>{a.pos.set(420+(i%2)*2,450+Math.floor(i/2)*2);if(i){a.z=c.terrainHeight(a.pos.x,a.pos.y);a.holdPos.copy(a.pos);a.fireT=1000;}else a.zPos=c.terrainHeight(a.pos.x,a.pos.y);a.hp=a.maxHp;a.shield=0;a.abilityCd=0;a.downed=false;a.dead=false;});window.__duplicateEnemy=c.spawnTestEnemy('brute',7,0);__duplicateEnemy.hp=__duplicateEnemy.maxHp=10000;__duplicateEnemy.speed=0;c.pause(false);});
   await Promise.all(keys.map(k=>page.keyboard.down(k)));await page.waitForTimeout(180);await Promise.all(keys.map(k=>page.keyboard.up(k)));await page.evaluate(()=>__cf.pause(true));
   results.duplicateSurge=await page.evaluate(()=>({abilities:__cf.operatorAbilityInfo(),damage:10000-__duplicateEnemy.hp,shields:[__cf.player,...__cf.squad].map(a=>a.shield),maxShields:[__cf.player,...__cf.squad].map(a=>a.maxShield)}));assert(results.duplicateSurge.abilities.every(a=>a.cooldown>20&&a.lastSource==='manual'));assert.equal(results.duplicateSurge.damage,128);assert.deepEqual(results.duplicateSurge.shields,results.duplicateSurge.maxShields);
  }
  if(ability!=='surge'){
   await page.evaluate(ability=>{const c=__cf;c.clearTestEnemies();c.advanceElectricalFx(10);c.suppressAbilityAutonomy(30);const actors=[c.player,...c.squad];actors.forEach((a,i)=>{a.pos.set(420+(i%2)*2,450+Math.floor(i/2)*2);if(i){a.z=c.terrainHeight(a.pos.x,a.pos.y);a.holdPos.set(a.pos.x,a.pos.y);a.fireT=1000;}else a.zPos=c.terrainHeight(a.pos.x,a.pos.y);a.hp=20;a.shield=0;a.abilityCd=0;a.bulwarkT=0;a.hpDelayT=a.shieldDelayT=1000;a.downed=false;a.dead=false;});
    window.__designated=[];if(ability==='target_designator')for(const [x,y] of [[8,0],[8,8],[-8,8],[-8,-8]]){const e=c.spawnTestEnemy('brute',x,y);e.hp=e.maxHp=10000;e.speed=0;__designated.push(e);}
    if(__designated.length){const e=__designated[0];c.player.yaw=Math.atan2(e.pos.y-c.player.pos.y,e.pos.x-c.player.pos.x);c.player.pitch=Math.atan2(e.z+.8-c.player.zPos-c.player.eye,Math.hypot(e.pos.x-c.player.pos.x,e.pos.y-c.player.pos.y));}c.pause(false);
   },ability);
   await Promise.all(keys.map(k=>page.keyboard.down(k)));await page.waitForTimeout(180);await Promise.all(keys.map(k=>page.keyboard.up(k)));await page.evaluate(()=>__cf.pause(true));
   const duplicate=await page.evaluate(()=>({abilities:__cf.operatorAbilityInfo(),actors:[__cf.player,...__cf.squad].map(a=>({hp:a.hp,shield:a.shield,maxHp:a.maxHp})),marked:__designated.map(e=>e.markedT)}));assert(duplicate.abilities.every(a=>a.cooldown>15&&a.lastSource==='manual'));
   if(ability==='bulwark')assert(duplicate.abilities.every(a=>a.bulwark>8.5&&a.bulwark<=9));
   if(ability==='medic_pulse'){assert(duplicate.actors.every(a=>a.hp===a.maxHp&&a.shield===72));await page.evaluate(()=>{__cf.squad[2].downed=true;__cf.squad[2].hp=0;__cf.squad[2].shield=0;__cf.player.abilityCd=0;__cf.player.hp=20;__cf.useCommanderAbility();});assert.deepEqual(await page.evaluate(()=>[__cf.squad[2].hp,__cf.squad[2].shield]),[0,0]);}
   if(ability==='target_designator'){assert(duplicate.marked.every(t=>t>9&&t<=10));const damage=await page.evaluate(()=>{const e=__designated[0],hp=e.hp;e.takeDamage(20);return hp-e.hp;});assert.equal(damage,27,'Designation bonus must not stack multiplicatively');}
   results['duplicate-'+ability]=duplicate;
  }
 }
 // Legacy missing selections recover the historical defaults; config remains the identity owner.
 results.legacy=await page.evaluate(()=>{const c=__cf,s=c.endlessSaveInfo();delete s.configuration.player.ability;for(const id of ['rook','vex','kade'])delete s.configuration.squad[id].ability;localStorage.cf_endless_v1=JSON.stringify(s);c.continueEndless();return c.operatorAbilityInfo();});assert.deepEqual(results.legacy.map(a=>a.ability),['surge','bulwark','medic_pulse','target_designator']);await quiet();
 // Invalid/occluded Commander aim does not fall back to the squad AI target selector.
 await page.evaluate(()=>{__cf.startEndlessMode({player:{slot1:'arc',slot2:'plasma',ability:'target_designator'}});});await quiet();await fixture(0);await page.evaluate(()=>{__cf.player.yaw+=Math.PI;__cf.pause(false);});await page.keyboard.press('f');await page.waitForTimeout(150);await page.evaluate(()=>__cf.pause(true));assert.equal(await page.evaluate(()=>__cf.player.abilityCd),0);
 await page.evaluate(()=>{__cf.setInvulnerable(false);__cf.player.hp=1;__cf.player.shield=0;__cf.damagePlayer(1000);});assert.equal(await page.evaluate(()=>localStorage.getItem('cf_endless_v1')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('cf_endless_v1.backup')),null);
 await page.reload();await ready();await page.locator('#btn-endless').click();assert(await page.locator('#endless-setup-panel').isVisible());await page.locator('#btn-endless-back').click();
 const campaignBytes=await page.evaluate(()=>localStorage.getItem('cf_campaign_v1'));
 await page.evaluate(()=>{for(const m of Object.values(__cf.campaignProfile.missions))m.unlocked=true;__cf.startMission('power_through');});await quiet();assert.deepEqual((await page.evaluate(()=>__cf.operatorAbilityInfo())).map(a=>a.ability),['surge','bulwark','medic_pulse','target_designator']);assert.equal(await page.evaluate(()=>localStorage.getItem('cf_campaign_v1')),campaignBytes);
 assert.equal(results.matrix.length,16);assert.deepEqual(errors,[]);assert.deepEqual(consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);results.passed=true;console.log('PASS universal abilities',name,JSON.stringify({combinations:results.matrix.length,duplicateDamage:results.duplicateSurge.damage,saves:results.saves.length}));
}finally{for(const key of keys)await page.keyboard.up(key).catch(()=>{});writeFileSync(resolve(out,`abilities-${name}.json`),JSON.stringify({results,errors,consoles},null,2));await browser.close();}
