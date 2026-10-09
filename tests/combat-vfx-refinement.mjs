import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const ff=process.argv.includes('firefox'),name=ff?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m41/regressions/combat-vfx');mkdirSync(out,{recursive:true});
const browser=await(ff?firefox:chromium).launch(ff?{headless:!process.argv.includes('--headed')}:{headless:!process.argv.includes('--headed'),executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const context=await browser.newContext({viewport:{width:1280,height:720},...(process.argv.includes('--video')?{recordVideo:{dir:out,size:{width:1280,height:720}}}:{})});
const page=await context.newPage(),errors=[],consoles=[],results={angles:[],timings:[],balance:[]};page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoles.push(m.text());});
const videoStarted=Date.now();
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
const ready=()=>page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
const quiet=()=>page.evaluate(()=>{__cf.setNoSpawn(true);__cf.setNoAggro(true);__cf.setInvulnerable(true);__cf.setHud(false);__cf.clearTestEnemies();__cf.suppressAbilityAutonomy(1000);__cf.pause(true);for(const m of __cf.squad){m.fireT=m.abilityCd=1000;}__cf.advanceShots(10);__cf.advanceElectricalFx(10);});
async function continueSaved(saved=null){await page.reload();await ready();if(saved)await page.evaluate(s=>localStorage.cf_endless_v1=JSON.stringify(s),saved);await page.locator('#btn-endless').click();await page.locator('#btn-endless-continue').click();await page.locator('#btn-sound-start').click();await page.waitForFunction(()=>__cf.mode==='endless');await quiet();await page.evaluate(()=>__cf.waitCombatPreparation());}
async function arena(id){
 const saved=await page.evaluate(id=>{__cf.saveEndless();const s=__cf.endlessSaveInfo();s.arena=id;s.run.worldSeed=4181;return s;},id);
 // Product menu return reloads the document. Do the same before Continue so
 // older terrain/decor cannot remain layered over the newly restored arena.
 await continueSaved(saved);
}
async function capture(label){await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');const old=await page.locator('#pause-screen').evaluate(el=>{const old=el.style.visibility;el.style.visibility='hidden';return old;});try{await page.screenshot({path:resolve(out,`${label}-${name}.png`)});}finally{await page.locator('#pause-screen').evaluate((el,old)=>el.style.visibility=old,old);}}
async function nativeImpact(label,distance,{pitch=null,strafe=false}={}){
 await page.evaluate(({distance,pitch})=>{const c=__cf;c.pause(true);c.advanceShots(10);c.advanceElectricalFx(10);c.selectWeapon(0);c.advanceWeapon(1);c.move(420-c.player.pos.x,450-c.player.pos.y);c.player.yaw=0;
  c.player.pitch=pitch??Math.atan2(c.terrainHeight(420+distance,450)+.1-(c.player.zPos+c.player.eye-.1),distance);c.player.weaponKick=c.player.weaponPitch=c.player.weaponRoll=c.player.kick=0;c.sampleReloadPose(1,75);c.combat.fireT=0;c.combat.switchT=0;c.player.weapon.mag=32;c.player.weapon.spread=0;c.arcTimingInfo(true);c.pause(false);c.fire();window.__timedArc=c.shots.at(-1)?.arcTraceId;
 },{distance,pitch});
 const id=await page.evaluate(()=>__timedArc);assert(id);
 if(strafe){await page.keyboard.down('d');await page.mouse.move(700,380,{steps:5});}
 await page.waitForFunction(id=>__cf.arcTimingInfo().some(e=>e.id===id&&e.stage==='impact-active'),id,{timeout:3000});
 await page.waitForFunction(id=>__cf.arcTimingInfo().some(e=>e.id===id&&e.stage==='first-render'),id,{timeout:1000});
 if(strafe)await page.keyboard.up('d');await page.evaluate(()=>__cf.pause(true));
 const events=await page.evaluate(id=>__cf.arcTimingInfo().filter(e=>e.id===id),id),fire=events.find(e=>e.stage==='fire'),collision=events.find(e=>e.stage==='collision'),active=events.find(e=>e.stage==='impact-active'),render=events.find(e=>e.stage==='first-render');
 assert.equal(collision.time,active.time);assert.equal(collision.frame,active.frame);assert(render.frame-active.frame<=1);assert(active.now>=collision.now);assert(active.now-collision.now<15);
 assert(events.find(e=>e.stage==='created').now>=fire.now);assert(collision.flightSeconds>0);await capture('impact-'+label);
 const row={label,events,flightSeconds:collision.flightSeconds,postCollisionMs:active.now-collision.now,renderFrames:render.frame-active.frame,position:active.position};results.timings.push(row);
 await page.evaluate(()=>{__cf.advanceShots(10);__cf.advanceElectricalFx(10);});const terminal=await page.evaluate(id=>__cf.arcTimingInfo().filter(e=>e.id===id&&e.stage==='collision').length,id);assert.equal(terminal,1,'An expired shot cannot activate a leftover impact');return row;
}
try{
 await page.goto(url.href);await ready();await page.evaluate(()=>__cf.startEndlessMode({player:{slot1:'arc',slot2:'plasma'}}));await page.mouse.click(640,360);await quiet();await arena('crater');await page.evaluate(()=>__cf.waitCombatPreparation());
 if(process.argv.includes('--record-only')){
  await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');
  await page.evaluate(()=>{__cf.setHud(true);__cf.pause(false);__cf.player.pitch=-.35;__cf.player.yaw=0;});await page.mouse.click(640,360);await page.waitForTimeout(1000);
  const before=await page.evaluate(()=>__cf.combat.shotsFired);
  for(const [yaw,pitch] of [[0,-.4],[.22,-.025],[-.2,.3],[.1,-.65]]){
   await page.evaluate(([yaw,pitch])=>{__cf.player.yaw=yaw;__cf.player.pitch=pitch;},[yaw,pitch]);
   await page.mouse.down();await page.waitForTimeout(850);await page.mouse.up();await page.waitForTimeout(850);
  }
  await page.waitForTimeout(700);results.nativeRecording={shots:await page.evaluate(()=>__cf.combat.shotsFired)-before,fov:75};assert(results.nativeRecording.shots>=8);assert.deepEqual(errors,[]);results.passed=true;console.log('PASS native ARC video',name,JSON.stringify(results.nativeRecording));
 }else{
 results.nativeRibbonBefore=await page.evaluate(()=>{const c=__cf;c.pause(true);c.player.pitch=0;c.player.yaw=0;c.sampleReloadPose(1,75);c.player.weapon.mag=32;c.combat.fireT=c.combat.switchT=0;c.fire();const a=c.arcVfxInfo().find(a=>a.kind==='primary');c.player.yaw+=.04;c.pause(false);return a;});
 await page.waitForFunction(before=>__cf.arcVfxInfo().some(a=>a.geometry===before.geometry&&a.vertexVersion>before.vertexVersion),results.nativeRibbonBefore,{timeout:2000});
 results.nativeRibbonAfter=await page.evaluate(before=>{__cf.pause(true);return __cf.arcVfxInfo().find(a=>a.geometry===before.geometry);},results.nativeRibbonBefore);assert(results.nativeRibbonAfter.vertexVersion>results.nativeRibbonBefore.vertexVersion,'Normal render loop, not a diagnostic render call, must refresh camera-facing geometry');
 const viewports=[{width:1280,height:720},{width:1780,height:832},{width:1920,height:1080}],pitches=[-.6,-.02,.6,1.25,-1.25];
 for(const [vi,viewport] of viewports.entries()){
  await page.setViewportSize(viewport);await page.evaluate(()=>__cf.pause(true));
  for(const fov of [60,75,100])for(const [pi,pitch] of pitches.entries()){
   const row=await page.evaluate(({fov,pitch,vi,pi})=>{const c=__cf;c.advanceShots(10);c.advanceElectricalFx(10);c.move(420+vi*6-c.player.pos.x,450-c.player.pos.y);c.player.yaw=pi*Math.PI/2;c.player.pitch=pitch;c.player.weaponKick=c.player.weaponPitch=c.player.weaponRoll=c.player.kick=0;c.sampleReloadPose(1,fov);c.player.weapon.mag=32;c.combat.fireT=c.combat.switchT=0;c.player.weapon.spread=0;c.render();
    const gl=c.renderer.getContext(),before=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,before);
    const muzzle=c.arcMuzzleForTest(),yaw=c.player.yaw,p=c.player.pitch,origin=c.camera.position.toArray();origin[2]-=.1;const direction=[Math.cos(yaw)*Math.cos(p),Math.sin(yaw)*Math.cos(p),Math.sin(p)],end=c.arcEndpointForTest(origin,direction);c.fire();c.render();
    const after=new Uint8Array(before.length);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,after);let changed=0;for(let i=0;i<after.length;i+=4)if(Math.max(after[i]-before[i],after[i+1]-before[i+1],after[i+2]-before[i+2])>12)changed++;
    return {fov,pitch,yaw,muzzle,end,arcs:c.arcVfxInfo().filter(a=>a.kind==='primary'),changed,magazine:c.arcInfo(),render:c.renderer.info.render,beforeSum:before.reduce((n,v)=>n+v,0),afterSum:after.reduce((n,v)=>n+v,0),geometry:c.scene.children.filter(o=>o.name==='PooledElectricalRibbon').map(o=>({vertices:Array.from(o.geometry.attributes.position.array.slice(0,18)),visible:o.visible,mask:o.layers.mask,matrix:o.matrixWorld.toArray(),opacity:o.material.opacity})),camera:c.camera.matrixWorld.toArray(),environment:{autoClear:c.renderer.autoClear,target:c.renderer.getRenderTarget()?.samples||0,depth:gl.getParameter(gl.DEPTH_TEST),readMatchesDraw:gl.getParameter(gl.READ_FRAMEBUFFER_BINDING)===gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING),sceneVisible:c.scene.visible,override:!!c.scene.overrideMaterial}};
   },{fov,pitch,vi,pi});
   results.lastAngle=row;if(row.changed<8)await capture('failed-lightning');
   assert.equal(row.arcs.length,2);assert(row.arcs.every(a=>!a.frustumCulled&&a.depthTest&&a.vertices>0&&a.points.every(Number.isFinite)));
   assert(Math.hypot(...row.muzzle.map((v,i)=>v-row.arcs[0].points[i]))<.002);const endpoint=row.arcs[0].points.slice(-3);assert(Math.hypot(endpoint[0]-row.end.x,endpoint[1]-row.end.y,endpoint[2]-row.end.z)<.003);assert(row.changed>=8,'Actual visible lightning pixels '+JSON.stringify({fov,pitch,vi,changed:row.changed}));
   assert.equal(row.magazine.magazineWindowOpacity,1);assert(!row.magazine.magazineTransparent);assert(row.magazine.magazineScale.every(v=>Math.abs(v-1)<1e-8));results.angles.push({...row,viewport});
   if(vi===0&&fov===75)await capture('lightning-'+pi);
  }
 }
 await page.setViewportSize({width:1280,height:720});
 // A truly head-on segment uses the nondegenerate diamond fallback; near-plane
 // clipping must also remain finite without relying on a lucky jitter direction.
 results.degenerate=await page.evaluate(()=>{const c=__cf;c.advanceElectricalFx(10);const T=c.camera.position.constructor,from=c.camera.localToWorld(new T(0,0,-2)).toArray(),to=c.camera.localToWorld(new T(0,0,-20)).toArray(),random=Math.random;try{Math.random=()=>.5;c.emitArcForTest(from,to);c.render();return c.arcVfxInfo();}finally{Math.random=random;}});assert(results.degenerate.every(a=>a.vertices>0&&a.points.every(Number.isFinite)));
 await page.evaluate(()=>__cf.advanceElectricalFx(10));
 for(const p of [0,.2,.375,.46,.64,.75,.82,.94,1]){const info=await page.evaluate(p=>{__cf.sampleReloadPose(p,75);return __cf.arcInfo();},p);assert.equal(info.magazineWindowOpacity,1);assert.equal(info.magazineBoltOpacity,1);assert(info.magazineScale.every(v=>Math.abs(v-1)<1e-8));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await capture('arc-reload-'+String(p).replace('.','_'));}
 await page.evaluate(()=>{__cf.sampleReloadPose(1);__cf.setHud(true);});
 results.nativeVideoStart=(Date.now()-videoStarted)/1000;
 await nativeImpact('near-flat',5);await nativeImpact('distant-flat',60);await nativeImpact('shallow',35);await nativeImpact('strafing',20,{strafe:true});
 // Rendered collision fixtures exercise real solid faces/roofs, not just endpoint arrays.
 await page.evaluate(async()=>{window.__T=await import('three');});
 for(const kind of ['wall','roof']){
  await page.evaluate(kind=>{const c=__cf,T=__T;const roof=kind==='roof',x=roof?420:432,y=450,w=roof?8:2,d=10,h=roof?1:6,z=roof?4.5:3;
   window.__testSolid=c.addTestSolid(x-w/2,y-d/2,x+w/2,y+d/2);__testSolid.bottomY=roof?4:0;__testSolid.topY=roof?5:6;
   window.__testWall=new T.Mesh(new T.BoxGeometry(w,d,h),new T.MeshStandardMaterial({color:0x4a5361,roughness:.8}));__testWall.position.set(x,y,z);c.scene.add(__testWall);
  },kind);
  const row=await nativeImpact(kind,12,{pitch:kind==='roof'?1.25:0});assert.equal(row.events.find(e=>e.stage==='collision').kind,'solid');
  if(kind==='wall')assert(Math.abs(row.position[0]-430.9)<.01);else assert(Math.abs(row.position[2]-3.9)<.01);
  await page.evaluate(()=>{__testSolid.disabled=true;__cf.scene.remove(__testWall);__testWall.geometry.dispose();__testWall.material.dispose();});
 }
 await page.evaluate(()=>{__cf.move(420-__cf.player.pos.x,450-__cf.player.pos.y);const e=__cf.spawnTestEnemy('brute',15,0);e.hp=e.maxHp=10000;e.speed=0;window.__hitEnemy=e;});
 const enemyHit=await nativeImpact('enemy',15,{pitch:Math.atan2(-.8,15)});assert.equal(enemyHit.events.find(e=>e.stage==='collision').kind,'enemy');assert.equal(await page.evaluate(()=>10000-__hitEnemy.hp),42);
 await arena('ridges');await nativeImpact('uneven-slope',20);await arena('crater');
 // Authoritative PX capacity, refill, HUD and older saved 10-round records.
 await page.evaluate(()=>{__cf.selectWeapon(1);__cf.advanceWeapon(1);__cf.sampleReloadPose(1);__cf.player.weapon.mag=15;__cf.combat.cartridges=0;});
 results.px=await page.evaluate(()=>{const c=__cf,w=c.player.weapon,before=c.combat.shotsFired;for(let i=0;i<15;i++){c.fire();c.advanceWeapon(.81);c.advanceShots(1);}c.fire();return {capacity:w.magSize,remaining:w.mag,shots:c.combat.shotsFired-before,reloading:w.reloading,tuning:{damage:w.dmg,cadence:w.cd,speed:c.shots.at(-1)?.speed||85,range:w.range,spread:w.spread,splash:w.splash,reload:w.reloadTime},hud:c.inspectHUD().text};});
 assert.equal(results.px.capacity,15);assert.equal(results.px.shots,15);assert.equal(results.px.remaining,0);assert(!results.px.reloading);assert(results.px.hud.some(t=>t.value==='0 / 15'));assert.deepEqual(results.px.tuning,{damage:74,cadence:.8,speed:85,range:110,spread:.018,splash:6.5,reload:2.2});
 await page.evaluate(()=>{__cf.combat.cartridges=2;__cf.reload();__cf.advanceWeapon(2.2);});assert.equal(await page.evaluate(()=>__cf.player.weapon.mag),15);assert.equal(await page.evaluate(()=>__cf.combat.cartridges),1);
 const oldPXSave=await page.evaluate(()=>{const c=__cf;c.saveEndless();const s=c.endlessSaveInfo();s.player.combat.weapons.plasma.mag=10;s.player.weaponStats.plasma.magSize=10;s.squad[1].mag=10;s.squad[1].magSize=10;s.squad[1].weapon='plasma';s.configuration.squad.vex.weapon='plasma';return s;});await continueSaved(oldPXSave);
 results.oldPX=await page.evaluate(()=>{const c=__cf;return {player:{size:c.combat.weapons.plasma.magSize,mag:c.combat.weapons.plasma.mag},squad:{size:c.squad[1].magSize,mag:c.squad[1].mag},reserve:c.combat.cartridges};});assert.deepEqual(results.oldPX.player,{size:15,mag:10});assert.deepEqual(results.oldPX.squad,{size:15,mag:10});assert.equal(results.oldPX.reserve,1);
 const clampSave=await page.evaluate(()=>{const c=__cf,s=c.endlessSaveInfo();s.player.combat.weapons.plasma.mag=99;s.player.weaponStats.plasma.magSize=99;return s;});await continueSaved(clampSave);results.clamp=await page.evaluate(()=>[__cf.combat.weapons.plasma.mag,__cf.combat.weapons.plasma.magSize]);assert.deepEqual(results.clamp,[15,15]);
 await page.evaluate(()=>{__cf.selectWeapon(1);__cf.advanceWeapon(1);});
 for(const type of ['skitter','shielded','brute','carrier']){
  const runs=[];
  for(const capacity of [10,15])runs.push(await page.evaluate(({type,capacity})=>{const c=__cf;c.pause(true);c.clearTestEnemies();c.advanceShots(10);c.advanceElectricalFx(10);c.move(420-c.player.pos.x,450-c.player.pos.y);const e=c.spawnTestEnemy(type,20,0);e.speed=0;const hp=e.hp,shield=e.shield||0,w=c.player.weapon,spread=w.spread;w.spread=0;w.mag=capacity;c.combat.cartridges=0;c.combat.fireT=c.combat.switchT=0;let shots=0;
   while(!e.dead&&!e.dying&&shots<capacity){c.player.yaw=0;c.player.pitch=Math.atan2(e.z+.8-c.player.zPos-c.player.eye+.1,20);c.sampleReloadPose(1);c.fire();for(let tick=0;tick<18;tick++)c.advanceShots(1/60);c.advanceWeapon(.81);shots++;}w.spread=spread;return {capacity,type,hp,shield,shots,killed:e.dead||e.dying,lastShotSeconds:(shots-1)*.8};
  },{type,capacity}));
  assert.equal(runs[0].shots,runs[1].shots);assert(runs.every(r=>r.killed),'Representative tier kill must fit either magazine');results.balance.push(runs);
 }
 // Preparation is settled before measuring repeated, pooled fire/contact/rotation.
 await quiet();await page.evaluate(()=>{__cf.selectWeapon(0);__cf.advanceWeapon(1);__cf.sampleReloadPose(1);__cf.pause(false);});await page.waitForTimeout(400);await page.evaluate(()=>{__cf.pause(true);__cfPerf.reset();});
 await page.evaluate(()=>{const c=__cf;for(let i=0;i<20;i++){c.player.weapon.mag=32;c.combat.fireT=0;c.player.pitch=-.3;c.player.yaw=i*.1;c.sampleReloadPose(1);c.fire();c.advanceShots(.8);c.render();c.advanceElectricalFx(1);} });
 await page.waitForTimeout(200);results.shaderEvents=await page.evaluate(()=>__cfPerf.report().frames.flatMap(f=>f.events||[]).filter(e=>e.name==='shaderPrograms'));
 results.performance=await page.evaluate(()=>__cfPerf.summary().counters);for(const key of ['materialsCreated','geometriesCreated','linkProgram'])assert.equal(results.performance[key]||0,0,key);
 assert.deepEqual(errors,[]);assert.deepEqual(consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);results.passed=true;console.log('PASS combat VFX/PX refinement',name,JSON.stringify({angles:results.angles.length,timings:results.timings.map(t=>({label:t.label,flight:t.flightSeconds,delay:t.postCollisionMs,frames:t.renderFrames})),px:results.px.capacity,balance:results.balance}));
 }
}finally{await page.keyboard.up('d').catch(()=>{});await page.close();if(page.video()){const recorded=await page.video().path(),named=resolve(out,`combat-vfx-${name}.webm`);renameSync(recorded,named);results.video=named;}writeFileSync(resolve(out,`combat-vfx-${name}.json`),JSON.stringify({results,errors,consoles},null,2));await browser.close();}
