import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const ff=process.argv.includes('firefox'),name=ff?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m41/regressions/additional');mkdirSync(out,{recursive:true});
const browser=await(ff?firefox:chromium).launch(ff?{headless:!process.argv.includes('--headed')}:{headless:!process.argv.includes('--headed'),executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1780,height:832}}),errors=[],consoles=[],results={};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoles.push(m.text());});
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
const ready=()=>page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
const quiet=()=>page.evaluate(()=>{__cf.setNoSpawn(true);__cf.setNoAggro(true);__cf.clearTestEnemies();__cf.pause(true);});
const capture=async label=>{await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');await page.screenshot({path:resolve(out,`${label}-${name}.png`)});};
async function launch(){await page.locator('#btn-sound-start').click();await page.waitForFunction(()=>__cf.mode==='endless'||!!__cf.intro||document.querySelector('#start-screen').classList.contains('hidden'),undefined,{timeout:120000});}
async function returnMenu(){await page.evaluate(()=>__cf.pause(false));if(!await page.evaluate(()=>!!document.pointerLockElement)){await page.mouse.click(890,416);await page.waitForFunction(()=>!!document.pointerLockElement);}await page.evaluate(()=>document.exitPointerLock());await page.waitForFunction(()=>!document.querySelector('#pause-screen').classList.contains('hidden'));await page.locator('#btn-quit-to-menu').click();await ready();}
async function continueCampaign(){await page.locator('#btn-campaign').click();await page.locator('#btn-continue-campaign').click();await launch();await page.waitForFunction(()=>__cf.mode==='campaign'&&!__cf.intro&&__cf.phase!==1);await quiet();}
async function continueEndless(){await page.locator('#btn-endless').click();assert(await page.locator('#endless-resume-panel').isVisible());await page.locator('#btn-endless-continue').click();await launch();await page.waitForFunction(()=>__cf.mode==='endless');await quiet();}
try{
 await page.addInitScript(()=>{window.__preparing=[];new MutationObserver(()=>{const el=document.querySelector('#cf-intro-loading span');if(el&&!__preparing.length){const s=getComputedStyle(el);__preparing.push({font:s.fontFamily,animation:s.animationName,color:s.color});}}).observe(document,{childList:true,subtree:true});});
 await page.goto(url.href);await ready();assert.equal(await page.locator('#btn-campaign').textContent(),'CAMPAIGN');
 await page.locator('#btn-campaign').click();assert(await page.locator('#btn-continue-campaign').isDisabled());await capture('01-campaign-submenu');
 await page.locator('#btn-start').click();await launch();await page.waitForFunction(()=>__cf.intro&&!__cf.intro.prewarmPending,undefined,{timeout:120000});await page.keyboard.press('Space');await page.waitForFunction(()=>__cf.phaseName==='M1_MOVE_FAC');await quiet();
 results.loading=await page.evaluate(()=>__preparing);assert.equal(results.loading[0].font,'"Glitch Slap"');assert.equal(results.loading[0].animation,'cf-preparing-glow');
 // Actual optional choice, then a deliberately damaged/earned outgoing squad.
 await page.evaluate(()=>{const c=__cf;c.setPhase(17);c.campaignRun.worldState.localPower=true;c.campaignContent.cellCarried=true;
  c.player.pos.set(344,630);c.player.zPos=c.terrainHeight(344,630);c.interact(2);
  c.player.maxHp=120;c.player.hp=51;c.player.maxShield=130;c.player.shield=17;c.player.shieldDelayT=c.player.hpDelayT=1000;c.player.abilityCd=13;
  c.combat.cartridges=11;c.combat.weapons.rifle.mag=14;c.combat.weapons.scatter.mag=8;c.player.grenades=1;
  c.craft.scraps=27;c.craft.powerCells=2;c.craft.medkits=1;
  for(let i=0;i<3;i++){const m=c.squad[i];m.maxHp+=10;m.maxShield+=7;m.hp=45+i;m.shield=12+i;m.mag=7+i;m.reserve=i;m.abilityCd=7+i;m.hpDelayT=m.shieldDelayT=1000;}c.squad[2].downed=true;
  c.completeMission();c.checkpoint();});
 const transitioned=await page.evaluate(()=>JSON.parse(localStorage.cf_campaign_v1).operation.continuedState);
 assert.equal(transitioned.missionId,'power_through');assert.equal(transitioned.phase,2);assert(transitioned.rewards.alphaIntel);assert.equal(transitioned.player.hp,51);assert.equal(transitioned.player.maxHp,120);
 results.transition=transitioned;await page.reload();await ready();await continueCampaign();
 const resumed=await page.evaluate(()=>{__cf.checkpoint();return JSON.parse(localStorage.cf_campaign_v1).operation.continuedState;});
 assert.equal(resumed.missionId,'power_through');assert.equal(resumed.player.hp,51);assert.equal(resumed.player.maxHp,120);assert.equal(resumed.player.maxShield,130);
 assert.deepEqual(resumed.player.combat,transitioned.player.combat);assert.deepEqual(resumed.craft,transitioned.craft);
 assert.deepEqual(resumed.squad.map(m=>[m.hp,m.maxHp,m.shield,m.maxShield,m.mag,m.reserve,m.downed]),transitioned.squad.map(m=>[m.hp,m.maxHp,m.shield,m.maxShield,m.mag,m.reserve,m.downed]));
 assert(resumed.player.abilityCd>12);assert.equal(await page.evaluate(()=>__cf.additionalInfo().intel),'alpha');
 // Walk the accepted safe corridor with real W input; adaptive guidance has no index.
 const alpha=await page.evaluate(()=>__cf.additionalInfo().routes.alpha);
 await page.evaluate(start=>{__cf.move(start[0]-__cf.player.pos.x,start[1]-__cf.player.pos.y);__cf.pause(false);},alpha[0]);
 if(await page.locator('#pause-screen').isVisible())await page.locator('#btn-resume').click();
 const alphaWalk=[];
 const alphaApproaches=alpha.slice(1);alphaApproaches[alphaApproaches.length-1]=[211,575];
 for(const point of alphaApproaches) {
  await page.evaluate(([x,y])=>{__cf.player.yaw=Math.atan2(y-__cf.player.pos.y,x-__cf.player.pos.x);__cf.player.pitch=0;},point);
  await page.keyboard.down('w');
  try{await page.waitForFunction(([x,y])=>Math.hypot(__cf.player.pos.x-x,__cf.player.pos.y-y)<(x===211?.5:1.2),point,{timeout:40000});}
  finally{await page.keyboard.up('w');}
  alphaWalk.push(await page.evaluate(()=>({position:[__cf.player.pos.x,__cf.player.pos.y],route:__cf.relayRouteInfo()})));
  if(point[0]===360&&point[1]===580){await page.evaluate(()=>{__cf.player.yaw=Math.atan2(575-__cf.player.pos.y,300-__cf.player.pos.x);});await page.waitForTimeout(120);await capture('02-alpha-intel');}
 }
 await page.evaluate(()=>{__cf.pause(true);__cf.checkpoint();});results.alphaWalk=alphaWalk;
 assert(alphaWalk.at(-1).route.arrived.alpha);assert.equal(alphaWalk.at(-1).route.path.length,0);assert(await page.evaluate(()=>JSON.parse(localStorage.cf_campaign_v1).operation.continuedState.rewards.alphaRouteArrived));
 // Every Select Mission uses authored maxima and reduced reserves; no old actor state.
 results.fresh=[];
 for(const id of ['power_through','sample_zero','break_contact','dead_signal']){
  await page.evaluate(id=>{for(const m of Object.values(__cf.campaignProfile.missions))m.unlocked=true;__cf.startMission(id);},id);
  if(id==='dead_signal'){await page.evaluate(()=>__cf.pause(false));await page.waitForFunction(()=>__cf.intro&&!__cf.intro.prewarmPending,undefined,{timeout:120000});await page.evaluate(()=>{__cf.skipIntro();__cf.pause(true);});}
  const row=await page.evaluate(()=>({mission:__cf.missionId,hp:__cf.player.hp,maxHp:__cf.player.maxHp,shield:__cf.player.shield,maxShield:__cf.player.maxShield,
    cartridges:__cf.combat.cartridges,squad:__cf.squad.map(m=>({hp:m.hp,maxHp:m.maxHp,shield:m.shield,maxShield:m.maxShield,reserve:m.reserve,mag:m.mag,magSize:m.magSize}))}));
  assert.equal(row.hp,row.maxHp);assert.equal(row.shield,row.maxShield);assert(row.squad.every(m=>m.hp===m.maxHp&&m.shield===m.maxShield&&m.mag===m.magSize));
  const baseline=await page.evaluate(id=>__cf.additionalInfo().reserves[id],id);assert.equal(row.cartridges,baseline.player);assert(row.squad.every(m=>m.reserve===baseline.squad));results.fresh.push(row);
 }
 // Locker choice spawns two stationary ground objects, not immediate inventory.
 await page.evaluate(()=>__cfPerf.reset());
 await page.evaluate(()=>{const c=__cf;c.setPhase(17);c.campaignRun.worldState.localPower=true;c.campaignContent.cellCarried=true;
  c.player.pos.set(376,626);c.player.zPos=c.terrainHeight(376,626);c.interact(2);});
 const locker=await page.evaluate(()=>__cf.additionalInfo().locker);assert(locker.every(p=>p.visible));assert.equal(await page.evaluate(()=>__cf.combat.cartridges),6);
 assert(!await page.evaluate(()=>__cf.campaignRun.rewards.alphaIntel));
 for(const p of locker)assert(!await page.evaluate(([x,y])=>__cf.insideSolid(x,y),p.pos));
 await page.evaluate(()=>{const c=__cf;c.combat.cartridges=12;c.player.grenades=5;c.player.pos.set(373,624);c.player.zPos=c.terrainHeight(373,624);c.interact(1);});
 assert.equal((await page.evaluate(()=>__cf.additionalInfo().locker))[0].remaining,3);
 await page.evaluate(()=>{__cf.combat.cartridges=10;__cf.player.grenades=4;});
 // With no E input proximity must not collect. Then real E collects only capacity room.
 await page.evaluate(()=>__cf.pause(false));await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>__cf.combat.cartridges),10);
 results.lockerPerformance=await page.evaluate(()=>__cfPerf.summary().counters);
 for(const key of ['materialsCreated','geometriesCreated','linkProgram','buildTerrain','buildFacility'])assert.equal(results.lockerPerformance[key]||0,0,'Locker activation must reuse prepared resources: '+key);
 await page.keyboard.down('e');await page.waitForFunction(()=>__cf.combat.cartridges===12);await page.keyboard.up('e');await page.evaluate(()=>__cf.pause(true));
 assert.equal((await page.evaluate(()=>__cf.additionalInfo().locker))[0].remaining,1);
 await page.evaluate(()=>{const c=__cf;c.player.pos.set(379,624);c.player.zPos=c.terrainHeight(379,624);c.interact(1);});
 assert.equal(await page.evaluate(()=>__cf.player.grenades),5);assert.equal((await page.evaluate(()=>__cf.additionalInfo().locker))[1].remaining,1);
 const ground=await page.evaluate(async()=>{const T=await import('three');return __cf.additionalInfo().locker.map(p=>{const g=__cf.scene.getObjectByName('AuxLocker'+p.kind),box=new T.Box3().setFromObject(g);return {kind:p.kind,clearance:box.min.z-__cf.terrainHeight(p.pos[0],p.pos[1])};});});
 assert(ground.every(p=>Math.abs(p.clearance-.03)<.001));results.pickupGround=ground;
 await page.evaluate(()=>{const h=__cf.terrainHeight(376,620);__cf.setCoverPose([376,620,h+2,376,624,h+.15]);__cf.setHud(false);});await capture('03-locker-pickups');await page.evaluate(()=>{__cf.setCoverPose(null);__cf.setHud(true);});
 // Exercise the same serialized restore path without changing Mission Select isolation.
 const lockerSave=await page.evaluate(()=>{__cf.campaignRunOrigin;return __cf.createCheckpointForTest();});
 await page.evaluate(saved=>__cf.restoreCheckpointForTest(saved),lockerSave);
 assert.deepEqual((await page.evaluate(()=>__cf.additionalInfo().locker)).map(p=>p.remaining),[1,1]);
 await page.evaluate(()=>{__cf.combat.cartridges=11;__cf.player.grenades=4;__cf.player.pos.set(373,624);__cf.interact(1);__cf.player.pos.set(379,624);__cf.interact(1);});
 assert((await page.evaluate(()=>__cf.additionalInfo().locker)).every(p=>!p.visible));
 // Sense actual Canvas2D minimap paint, including a main objective that differs
 // from the generic facility dot. This also guards marker-render scope ownership.
 results.mainMinimap=await page.evaluate(()=>{const c=__cf,phase=c.phase,paint=[],original=CanvasRenderingContext2D.prototype.fillRect;
  CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){const t=this.getTransform(),cx=t.a*(x+w/2)+t.c*(y+h/2)+t.e,cy=t.b*(x+w/2)+t.d*(y+h/2)+t.f;
   if(Math.abs(t.a*w)===7&&Math.abs(t.d*h)===7&&cx>innerWidth-166&&cy>=18&&cy<=168)paint.push({x:cx,y:cy});return original.call(this,x,y,w,h);};
  try{c.setPhase(15);c.inspectHUD();const p=c.campaignContent.maintenanceBattery.pos;return {paint,expected:{x:innerWidth-91+(p.x-c.player.pos.x)*.625,y:93-(p.y-c.player.pos.y)*.625}};}
  finally{CanvasRenderingContext2D.prototype.fillRect=original;c.setPhase(phase);}});
 assert(results.mainMinimap.paint.some(p=>Math.abs(p.x-results.mainMinimap.expected.x)<=1&&Math.abs(p.y-results.mainMinimap.expected.y)<=1),'Actual current objective must be painted on the minimap (native pixel rounding allowed)');
 const collectedSave=await page.evaluate(()=>__cf.createCheckpointForTest());await page.evaluate(saved=>__cf.restoreCheckpointForTest(saved),collectedSave);
 assert((await page.evaluate(()=>__cf.additionalInfo().locker)).every(p=>!p.visible));
 // Gamma route is absent before actual escort scan completion; reward intel is bounded/LOS-aware.
 await page.evaluate(()=>{__cf.startMission('power_through');__cf.pause(true);__cf.clearTestEnemies();__cf.player.pos.set(205,575);__cf.player.zPos=__cf.terrainHeight(205,575);__cf.player.yaw=0;});
 assert.equal(await page.evaluate(()=>__cf.additionalInfo().intel),null);
 await page.evaluate(()=>{__cf.setPhase(6);const e=__cf.campaignContent.escort;e.state='scanning';e.scanT=.001;__cf.pause(false);});
 await page.waitForFunction(()=>__cf.campaignRun.optional.escort_drone);await page.evaluate(()=>__cf.pause(true));
 assert.equal(await page.evaluate(()=>__cf.additionalInfo().intel),'gamma');assert(await page.evaluate(()=>__cf.campaignRun.worldState.betaSurvey));
 results.routes=await page.evaluate(()=>{
  const c=__cf,rows=[];for(const [id,path] of Object.entries(c.additionalInfo().routes)){
   let blocked=0,closedFrontDoor=0,steps=0,maxStep=0;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length);let previous=c.terrainHeight(...a);
    for(let j=0;j<=n;j++){const t=j/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,h=c.terrainHeight(x,y);if(c.insideSolid(x,y)){
      // The known 8m-wide automatic front door closes when the player is far away.
      // Its real opening/traversal was verified by the W-key sequence above;
      // do not misclassify that operable door as a permanent wall.
      if(id==='alpha'&&Math.abs(x-360)<.001&&Math.abs(y-618)<.001)closedFrontDoor++;else blocked++;
    }maxStep=Math.max(maxStep,Math.abs(h-previous));previous=h;steps++;}}
   rows.push({id,path,blocked,closedFrontDoor,steps,maxStep});}return rows;});
 assert(results.routes.every(r=>r.blocked===0&&r.maxStep<=2.6));
 await page.evaluate(()=>{__cf.player.pos.set(212,575);__cf.player.zPos=__cf.terrainHeight(212,575);__cf.player.yaw=0;const e=__cf.spawnTestEnemy('brute',20,0);e.hp=100000;for(const m of __cf.squad)m.fireT=1e9;__cf.pause(false);});await page.waitForTimeout(150);await page.evaluate(()=>{__cf.pause(true);__cf.inspectHUD();});
 assert((await page.evaluate(()=>__cf.additionalInfo().contacts))>0);await capture('04-gamma-survey');
 results.deathDrops=await page.evaluate(()=>{const c=__cf,before=c.additionalInfo().pickups.length,random=Math.random;try{Math.random=()=>.2;const e=c.spawnTestEnemy('tunneler',24,0);e.takeDamage(99999);e.takeDamage(99999);e.die();
  const drops=c.additionalInfo().pickups.slice(before);const checkpoint=c.createCheckpointForTest();c.restoreCheckpointForTest(checkpoint);return {drops,aliveTunnelers:c.enemies.filter(e=>e.type==='tunneler'&&!e.dead).length,restored:c.additionalInfo().pickups.length,expected:checkpoint.pickups.length};}finally{Math.random=random;}});
 assert.equal(results.deathDrops.drops.length,1);assert.equal(results.deathDrops.drops[0].kind,'scrap');assert.equal(results.deathDrops.drops[0].quantity,4);assert.equal(results.deathDrops.aliveTunnelers,0);assert.equal(results.deathDrops.restored,results.deathDrops.expected);
 // Real hovering samples after emergence; z and rendered hitbox origin stay aligned.
 await page.evaluate(()=>{__cf.clearTestEnemies();const e=__cf.spawnTestEnemy('screecher',40,0);e.skySpawnT=0;e.z=__cf.terrainHeight(e.pos.x,e.pos.y)+6;window.__hover=e;__cf.pause(false);window.__hoverSamples=[];
  const sample=()=>{const e=__hover;__hoverSamples.push({offset:e.z-__cf.terrainHeight(e.pos.x,e.pos.y),align:Math.abs(e.mesh.position.z-e.z)});if(__hoverSamples.length<180)requestAnimationFrame(sample);};requestAnimationFrame(sample);});
 await page.waitForFunction(()=>__hoverSamples.length===180,undefined,{timeout:15000});results.hover=await page.evaluate(()=>{__cf.pause(true);return {min:Math.min(...__hoverSamples.map(s=>s.offset)),max:Math.max(...__hoverSamples.map(s=>s.offset)),alignment:Math.max(...__hoverSamples.map(s=>s.align))};});
 assert(results.hover.min>=5.77&&results.hover.max<=6.23&&results.hover.max>results.hover.min);assert(results.hover.alignment<.001);
 await page.mouse.click(890,416);await returnMenu();
 const campaignBytes=await page.evaluate(()=>localStorage.cf_campaign_v1);
 await page.locator('#btn-endless').click();assert(await page.locator('#endless-setup-panel').isVisible());assert.equal(await page.locator('#endless-starting-slot').count(),0);
 assert.equal(await page.locator('#endless-player-ability').inputValue(),'surge');assert(!await page.locator('#endless-setup-panel').textContent().then(s=>s.includes('Tab / arrows / Enter navigate')));
 results.deploymentLayouts=[];for(const viewport of [{width:1780,height:832},{width:1280,height:720},{width:1920,height:1080},{width:1280,height:540}]){await page.setViewportSize(viewport);const panel=await page.locator('#endless-setup-panel').boundingBox();assert(panel.y>=0&&panel.y+panel.height<=viewport.height);assert.equal(await page.locator('.cf-loadout-group').count(),4);results.deploymentLayouts.push({viewport,panel});}await page.setViewportSize({width:1780,height:832});
 await page.locator('#endless-slot1').selectOption('arc');await page.locator('#endless-slot2').selectOption('plasma');await capture('05-deployment-ability');
 await page.locator('#btn-endless-ready').click();await launch();await page.waitForFunction(()=>__cf.mode==='endless');await page.mouse.click(890,416);await quiet();
 await page.evaluate(()=>{__cf.player.abilityCd=0;__cf.player.shield=0;__cf.player.shieldDelayT=1000;__cf.pause(false);});await page.keyboard.press('f');await page.waitForFunction(()=>__cf.player.abilityCd>20);await page.evaluate(()=>__cf.pause(true));assert.equal(await page.evaluate(()=>__cf.player.shield),35);
 const waveStart=await page.evaluate(()=>{const c=__cf;c.grantUpgrade('r_vit');c.player.hp=73;c.player.shield=19;c.player.abilityCd=5;c.combat.weapons.arc.mag=24;c.combat.weapons.plasma.mag=7;c.selectWeapon(1);c.combat.cartridges=11;c.craft.scraps=22;
  for(const m of c.squad){m.hp=50;m.shield=21;m.mag=6;m.reserve=2;m.abilityCd=9;}c.startWave();return c.endlessSaveInfo();});
 assert.equal(waveStart.run.wave,1);assert(waveStart.run.waveActive);assert.equal(waveStart.configuration.player.ability,'surge');
 const decor=await page.evaluate(()=>__cf.endlessDecorInfo());
 await page.evaluate(()=>{__cf.player.hp=8;__cf.combat.cartridges=1;__cf.craft.scraps=1;__cf.squad[0].hp=9;__cf.pause(false);});await page.waitForTimeout(120);
 const boundaryGuard=await page.evaluate(()=>{const before=localStorage.cf_endless_v1,saved=__cf.saveEndless();return {saved,unchanged:before===localStorage.cf_endless_v1};});assert(!boundaryGuard.saved&&boundaryGuard.unchanged);results.boundaryGuard=boundaryGuard;await returnMenu();
 assert.equal(await page.evaluate(()=>localStorage.cf_campaign_v1),campaignBytes);await capture('06-endless-main-return');await continueEndless();
 const waveResume=await page.evaluate(()=>({saved:__cf.endlessSaveInfo(),hp:__cf.player.hp,maxHp:__cf.player.maxHp,cartridges:__cf.combat.cartridges,scrap:__cf.scrap,slot:__cf.combat.activeId,squad:__cf.squad.map(m=>[m.hp,m.maxHp,m.mag,m.reserve])}));
 assert.equal(waveResume.hp,73);assert.equal(waveResume.maxHp,120);assert.equal(waveResume.cartridges,11);assert.equal(waveResume.scrap,22);assert.equal(waveResume.slot,'plasma');assert.equal(waveResume.saved.run.wave,1);results.endless=waveResume;
 assert.deepEqual(await page.evaluate(()=>__cf.endlessDecorInfo()),decor,'Saved arena decoration/collision layout is reproducible');
 await page.evaluate(()=>{const c=__cf;c.clearTestEnemies();c.endless.waveActive=false;c.setWave(5);const random=Math.random;Math.random=()=>.25;c.startWave();Math.random=random;c.endless.budgetLeft=0;c.advanceEncounterSystems(0);});
 const paid=await page.evaluate(()=>__cf.scrap);await returnMenu();await continueEndless();assert.equal(await page.evaluate(()=>__cf.scrap),paid);
 await page.evaluate(()=>__cf.advanceEncounterSystems(0));assert.equal(await page.evaluate(()=>__cf.scrap),paid,'Wave reward is not paid again on restore');
 await page.evaluate(()=>{__cf.setInvulnerable(false);__cf.player.hp=1;__cf.player.shield=0;__cf.damagePlayer(1000);});assert.equal(await page.evaluate(()=>localStorage.getItem('cf_endless_v1')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('cf_endless_v1.backup')),null);
 await page.evaluate(()=>__cf.restartEndless());assert.equal(await page.evaluate(()=>__cf.endless.wave),0);assert.equal(await page.evaluate(()=>__cf.combat.cartridges),8);assert.equal(await page.evaluate(()=>__cf.player.maxHp),100);
 await page.evaluate(()=>{__cf.setInvulnerable(false);__cf.player.hp=1;__cf.player.shield=0;__cf.damagePlayer(1000);});await page.reload();await ready();await page.locator('#btn-endless').click();assert(await page.locator('#endless-setup-panel').isVisible());
 // New campaign overwrite confirmation is accessible and cancel preserves bytes.
 await page.locator('#btn-endless-back').click();await page.locator('#btn-campaign').click();await page.locator('#btn-start').click();assert(await page.locator('#confirm-panel').isVisible());await page.locator('#btn-confirm-back').click();
 assert.equal(await page.evaluate(()=>localStorage.cf_campaign_v1),campaignBytes);
 results.layouts=[];for(const viewport of [{width:1780,height:832},{width:1280,height:720},{width:1920,height:1080},{width:1280,height:540}]){
  await page.setViewportSize(viewport);await page.locator('#btn-campaign-back').click();await page.locator('#btn-guide').click();
  const guide=await page.locator('#guide-panel').boundingBox();assert(guide.y>=15&&guide.y+guide.height<=viewport.height-15);assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),viewport.height);
  const items=await page.locator('.cf-guide').textContent();assert(items.includes('Directly equip weapon slots')&&items.includes('Cycle between equipped weapons'));
  const sections=await page.locator('.cf-guide > div').allTextContents();assert(sections[0].includes('Use MEDKIT')&&!sections[1].includes('Use MEDKIT'));
  const weaponRows=await page.locator('.cf-guide b').evaluateAll(nodes=>nodes.filter(el=>['BUL-117','CRW-8','ARC-9','PX-4'].includes(el.textContent)).map(el=>el.parentElement.textContent));assert.equal(weaponRows.length,4);assert(weaponRows.every(row=>['BUL-117','CRW-8','ARC-9','PX-4'].filter(w=>row.includes(w)).length===1));
  assert(await page.locator('.cf-guide').evaluate(el=>getComputedStyle(el).fontFamily.startsWith('"Glitch Slap"')));results.layouts.push({viewport,guide});await page.locator('#btn-guide-back').click();await page.locator('#btn-campaign').click();}
 await page.setViewportSize({width:1780,height:832});await capture('07-menu-confirm-guide');
 // Real storage corruption/fallback and overwrite reset, including reduced motion.
 await page.evaluate(()=>{localStorage.setItem('cf_campaign_v1.backup',localStorage.cf_campaign_v1);localStorage.cf_campaign_v1='{broken';localStorage.cf_endless_v1='{broken';});
 await page.reload();await ready();await page.locator('#btn-campaign').click();assert(!await page.locator('#btn-continue-campaign').isDisabled());assert.match(await page.locator('#save-status').textContent(),/backup/);
 await page.locator('#btn-campaign-back').click();await page.locator('#btn-endless').click();assert(await page.locator('#endless-setup-panel').isVisible());assert.match(await page.locator('#endless-save-status').textContent(),/could not be read/);
 // A valid Endless checkpoint must survive an explicitly confirmed fresh Campaign.
 await page.evaluate(saved=>localStorage.cf_endless_v1=JSON.stringify(saved),waveStart);
 await page.locator('#btn-endless-back').click();await page.locator('#btn-campaign').click();await page.locator('#btn-start').click();assert(await page.locator('#confirm-panel').isVisible());await page.locator('#btn-confirm-new').click();
 await page.emulateMedia({reducedMotion:'reduce'});await launch();await page.waitForFunction(()=>__cf.intro&&!__cf.intro.prewarmPending,undefined,{timeout:120000});await page.keyboard.press('Space');await page.waitForFunction(()=>__cf.phaseName==='M1_MOVE_FAC');await quiet();
 assert.equal(await page.evaluate(()=>__cf.combat.cartridges),6);assert((await page.evaluate(()=>__cf.squad.map(m=>m.reserve))).every(n=>n===3));
 assert.equal(await page.evaluate(()=>__preparing[0].animation),'none');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.cf_endless_v1).run.wave),1);
 const storageFailure=await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('fixture quota');};const before=localStorage.cf_campaign_v1;const saved=__cf.checkpoint();Storage.prototype.setItem=original;return {saved,unchanged:before===localStorage.cf_campaign_v1};});
 assert(!storageFailure.saved&&storageFailure.unchanged);results.storageFailure=storageFailure;
 assert.deepEqual(errors,[]);assert.deepEqual(consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);
 results.passed=true;console.log('PASS additional refinement',name,JSON.stringify({fresh:results.fresh.map(r=>({mission:r.mission,reserve:r.cartridges})),routes:results.routes,hover:results.hover,endless:{wave:waveResume.saved.run.wave,hp:waveResume.hp,slot:waveResume.slot}}));
}finally{writeFileSync(resolve(out,`additional-${name}.json`),JSON.stringify({results,errors,consoles},null,2));await browser.close();}
