import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const ff=process.argv.includes('firefox'),name=ff?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m41/regressions/route-reload');mkdirSync(out,{recursive:true});
const browser=await(ff?firefox:chromium).launch(ff?{headless:!process.argv.includes('--headed')}:{headless:!process.argv.includes('--headed'),executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],consoles=[],results={};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoles.push(m.text());});
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const quiet=()=>page.evaluate(()=>{__cf.setNoSpawn(true);__cf.setNoAggro(true);__cf.clearTestEnemies();__cf.setInvulnerable(true);__cf.pause(true);});
const place=async(x,y)=>page.evaluate(([x,y])=>{__cf.move(x-__cf.player.pos.x,y-__cf.player.pos.y);__cf.advanceRelayGuide(0);return __cf.relayRouteInfo();},[x,y]);
const validate=async row=>{
 assert(row.path.length>1,'A traversable route is required');
 assert(await page.evaluate(path=>path.slice(1).every((b,i)=>__cf.relaySegmentClear(path[i],b)),row.path),'Every displayed path segment must authorize physical clearance');
 return row;
};
async function capture(label){
 await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');
 // A staged paused-pose capture excludes the DOM pause overlay; engine pause and
 // native resume/input behavior remain intact and the original style is restored.
 const visibility=await page.locator('#pause-screen').evaluate(el=>{const old=el.style.visibility;el.style.visibility='hidden';return old;});
 try{return await page.screenshot({path:resolve(out,`${label}-${name}.png`)});}
 finally{await page.locator('#pause-screen').evaluate((el,old)=>el.style.visibility=old,visibility);}
}
async function walkToArrival(id,timeout=90000){
 const started=Date.now(),samples=[];await page.evaluate(()=>__cf.pause(false));await page.keyboard.down('w');
 try{while(Date.now()-started<timeout){
  const row=await page.evaluate(()=>{const c=__cf,r=c.relayRouteInfo();if(r.path.length>1){const p=r.path[1];c.player.yaw=Math.atan2(p[1]-c.player.pos.y,p[0]-c.player.pos.x);c.player.pitch=0;}return {...r,position:[c.player.pos.x,c.player.pos.y],solid:c.insideSolid(c.player.pos.x,c.player.pos.y)};});
  if(samples.length===0||Date.now()-started>samples.length*1000){samples.push(row);if(samples.length===2){
   if(id==='alpha')results.ribbonWidths=await page.evaluate(()=>{const c=__cf,g=c.scene.getObjectByName('AdaptiveRelayGuide'),p=g.geometry.attributes.position,T=c.camera.position.constructor,rows=[],gl=c.renderer.getContext();g.visible=false;c.render();const before=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,before);g.visible=true;c.render();const after=new Uint8Array(before.length);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,after);
    for(let i=0;i+5<g.geometry.drawRange.count;i+=6){if(g.geometry.attributes.routeSide.getX(i)<.5)continue;const a=new T().fromBufferAttribute(p,i),b=new T().fromBufferAttribute(p,i+2),center=a.clone().lerp(b,.5),d=Math.hypot(center.x-c.player.pos.x,center.y-c.player.pos.y);if(d<8||d>15)continue;a.project(c.camera);b.project(c.camera);center.project(c.camera);if(center.z>1||center.z<0)continue;const dx=(b.x-a.x)*innerWidth,dy=(b.y-a.y)*innerHeight,len=Math.hypot(dx,dy),cx=(center.x*.5+.5)*gl.drawingBufferWidth,cy=(center.y*.5+.5)*gl.drawingBufferHeight,values=[];for(let j=-8;j<=8;j++){const x=Math.round(cx-dy/len*j),y=Math.round(cy+dx/len*j),k=(y*gl.drawingBufferWidth+x)*4;values.push(Math.max(0,after[k]-before[k],after[k+1]-before[k+1],after[k+2]-before[k+2]));}const peak=Math.max(...values);if(peak>15)rows.push(values.reduce((n,v)=>n+v/peak,0));}return rows;});
   await capture(id+'-adaptive-guide');
  }}
  if(row.arrived[id]){samples.push(row);return samples;}await page.waitForTimeout(100);
 }throw Error('Native route walk did not reach '+id);
 }finally{await page.keyboard.up('w');await page.evaluate(()=>__cf.pause(true));}
}
try{
 await page.goto(url.href);await page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
 if(!process.argv.includes('--reload-only')){
 await page.evaluate(()=>{for(const m of Object.values(__cf.campaignProfile.missions))m.unlocked=true;__cf.startMission('power_through');});await quiet();await page.evaluate(()=>__cf.setPhase(2));
 assert.equal((await place(382,646)).path.length,0,'No reward, no route');
 // Native M1 sensor choice, carried through the existing completion/checkpoint boundary.
 await page.evaluate(()=>{const c=__cf;c.startMission('dead_signal');c.skipIntro();c.pause(true);c.setPhase(17);c.campaignRun.worldState.localPower=true;c.campaignContent.cellCarried=true;c.player.pos.set(344,630);c.player.zPos=c.terrainHeight(344,630);c.interact(2);c.completeMission();c.setPhase(2);});
 assert(await page.evaluate(()=>__cf.campaignRun.rewards.alphaIntel));
 results.alphaInitial=await validate(await place(382,646));
 // Invalidate a live route with a real collision footprint, then remove it while stationary.
 const invalidation=await page.evaluate(()=>{const c=__cf,p=c.player.pos,barrier=c.addTestSolid(p.x-1,p.y-1,p.x+1,p.y+1);c.advanceRelayGuide(0);const blocked=c.relayRouteInfo();barrier.disabled=true;c.advanceRelayGuide(0);return {blocked,reopened:c.relayRouteInfo()};});
 assert.equal(invalidation.blocked.path.length,0);assert(!invalidation.blocked.visible);await validate(invalidation.reopened);results.invalidation=invalidation;
 const invalidOrigin=await page.evaluate(()=>{const c=__cf,p=c.player.pos,barrier=c.addTestSolid(p.x+1,p.y-1,p.x+1.3,p.y+1);c.advanceRelayGuide(0);const before=c.relayRouteInfo().stats.solves;p.x+=1.15;c.advanceRelayGuide(.11);const invalid=c.relayRouteInfo();barrier.disabled=true;p.x-=1.15;c.advanceRelayGuide(0);return {before,invalid};});
 assert.equal(invalidOrigin.invalid.stats.solves,invalidOrigin.before+1);assert.equal(invalidOrigin.invalid.path.length,0,'Invalid origin must discard the old path immediately');results.invalidOrigin=invalidOrigin;
 const stationary=await page.evaluate(()=>{const before=__cf.relayRouteInfo().stats.solves;for(let i=0;i<180;i++)__cf.advanceRelayGuide(1/60);return [before,__cf.relayRouteInfo().stats.solves];});assert.equal(...stationary);
 results.destinationInvalidation=await page.evaluate(()=>{const c=__cf,r=c.relays[0],x=r.pos.x,before=c.relayRouteInfo().stats.solves;r.pos.x+=2;c.advanceRelayGuide(0);const changed=c.relayRouteInfo();r.pos.x=x;c.advanceRelayGuide(0);return {before,changed};});assert.equal(results.destinationInvalidation.changed.stats.solves,results.destinationInvalidation.before+1);
 results.layoutInvalidation=await page.evaluate(()=>{const c=__cf,s=c.addTestSolid(430,600,432,602);c.advanceRelayGuide(0);const before=c.relayRouteInfo().stats.solves;s.x0+=32;s.x1+=32;c.advanceRelayGuide(0);const changed=c.relayRouteInfo();s.disabled=true;c.advanceRelayGuide(0);return {before,changed};});assert.equal(results.layoutInvalidation.changed.stats.solves,results.layoutInvalidation.before+1);
 results.skips=[];
 for(const p of [[360,610],[300,575],[280,595],[270,575],[290,575]])results.skips.push(await validate(await place(...p)));
 assert(results.skips[1].path.every(p=>p[0]<=301),'Skipping Hall and staging points never guides backward');
 // One-second solves and independent authoritative connector refreshes.
 results.cadence=await page.evaluate(()=>{const before=__cf.relayRouteInfo(),changes=[];for(let i=0;i<240;i++){__cf.player.pos.x-=.02;const old=__cf.relayRouteInfo().stats.solves;__cf.advanceRelayGuide(1/60);if(__cf.relayRouteInfo().stats.solves!==old)changes.push(i);}const after=__cf.relayRouteInfo();return {count:after.stats.solves-before.stats.solves,changes,connectors:after.connectorUpdates-before.connectorUpdates};});
 assert.equal(results.cadence.count,4);assert.equal(results.cadence.connectors,4);assert(results.cadence.changes.slice(1).every((v,i)=>v-results.cadence.changes[i]>=59&&v-results.cadence.changes[i]<=61));
 const checkpoint=await page.evaluate(()=>__cf.createCheckpointForTest());
 await place(350,575);await page.evaluate(saved=>{__cf.restoreCheckpointForTest(saved);__cf.advanceRelayGuide(0);},checkpoint);
 const restored=await validate(await page.evaluate(()=>__cf.relayRouteInfo()));assert(dist(restored.path[0],[checkpoint.player.position.x,checkpoint.player.position.y])<.01);results.restore=restored;
 // Walk from the Hall with real W, automatic door and adaptive steering; earlier skipped indices have no authority.
 await place(382,646);await page.evaluate(()=>__cfPerf.reset());results.alphaWalk=await walkToArrival('alpha');
 assert(results.ribbonWidths.length>0);assert(results.ribbonWidths.every(w=>w>=2.8&&w<=4.8),'Actual rendered ground ribbon must be genuinely 3–4 pixels wide');
 results.routePerformance=await page.evaluate(()=>__cfPerf.summary());
 for(const key of ['materialsCreated','geometriesCreated','linkProgram'])assert.equal(results.routePerformance.counters[key]||0,0,'Route traversal '+key);
 assert(results.alphaWalk.at(-1).arrived.alpha);assert.equal((await place(300,575)).path.length,0,'Arrival is latched when moving away');
 const arrivalSave=await page.evaluate(()=>__cf.createCheckpointForTest());await page.evaluate(saved=>{__cf.restoreCheckpointForTest(saved);__cf.advanceRelayGuide(0);},arrivalSave);assert.equal((await page.evaluate(()=>__cf.relayRouteInfo())).path.length,0);
 await page.evaluate(()=>{__cf.startMission('power_through');__cf.setPhase(6);__cf.pause(true);});assert.equal((await place(285,690)).path.length,0);
 await page.evaluate(()=>{const e=__cf.campaignContent.escort;e.state='scanning';e.scanT=.001;__cf.pause(false);});await page.waitForFunction(()=>__cf.campaignRun.optional.escort_drone);await quiet();
 results.gamma=await validate(await place(285,690));assert.equal(results.gamma.id,'gamma');
 assert(!await page.evaluate(()=>__cf.relaySegmentClear([285,690],[569,585])),'Direct line crosses the blocked facility');
 await place(450,570);const rejoin=await validate(await page.evaluate(()=>__cf.relayRouteInfo()));assert(rejoin.path.every(p=>p[0]>=449),'Gamma rejoin does not revisit western corridor');results.gammaRejoin=rejoin;
 assert(!(await page.evaluate(()=>__cf.inspectHUD().text)).some(row=>row.value.startsWith('GAMMA SURVEY ')),'Final guide approach must not overlay the authoritative relay label');
 results.gammaWalk=await walkToArrival('gamma');
 await page.evaluate(()=>__cf.setPhase(7));await page.evaluate(()=>__cf.advanceRelayGuide(0));assert(!(await page.evaluate(()=>__cf.relayRouteInfo())).visible);
 await page.evaluate(()=>{__cf.startMission('power_through');__cf.setPhase(2);__cf.campaignRun.rewards.alphaIntel=true;});await place(300,575);
 await page.evaluate(()=>{__cf.setInvulnerable(false);__cf.player.hp=1;__cf.player.shield=0;__cf.damagePlayer(1000);});assert(!(await page.evaluate(()=>__cf.relayRouteInfo())).visible,'Death retires ground geometry before the result pause');
 await page.evaluate(()=>__cf.startMission('sample_zero'));await quiet();assert.equal((await page.evaluate(()=>__cf.relayRouteInfo())).path.length,0);
 }
 // Every playable gun is the existing universal-cell mechanism, with distinct dimensions/sockets.
 results.reloads=[];
 if(!process.argv.includes('--route-only')){
 for(const pair of [['rifle','scatter'],['arc','plasma']]){
  await page.evaluate(([slot1,slot2])=>__cf.startEndlessMode({player:{slot1,slot2}}),pair);await page.mouse.click(640,360);await quiet();
  for(let slot=0;slot<2;slot++){
   await page.evaluate(slot=>{__cf.selectWeapon(slot);__cf.advanceWeapon(1);__cf.advanceShots(5);__cf.player.pitch=0;},slot);
   const id=pair[slot];
   for(const viewport of [{width:1280,height:720},{width:1780,height:832},{width:1920,height:1080}]){
    await page.setViewportSize(viewport);
    for(const fov of [60,75,100]){
     const samples=await page.evaluate(fov=>{const rows=[];for(let i=0;i<=240;i++)rows.push(__cf.sampleReloadPose(i/240,fov));return rows;},fov);
     let maxHand=0,maxPart=0,maxGrip=0;
     for(let i=0;i<samples.length;i++){
      const s=samples[i];assert(s.minDepth>.03,'No near-plane cartridge clipping '+id);
      if(!s.partVisible)assert(!s.visibleInFrustum&&s.projected.every(p=>p[0]<-1||p[1]<-1),'Hidden proxy must be completely outside the camera');
      if(['WITHDRAW','CARRY_OUT','RETRIEVE','BRING_IN','INSERT','LOCK'].includes(s.stage))maxGrip=Math.max(maxGrip,dist(s.handPosition,s.gripPosition));
      if(i){maxHand=Math.max(maxHand,dist(s.handPosition,samples[i-1].handPosition));maxPart=Math.max(maxPart,dist(s.partPosition,samples[i-1].partPosition));}
     }
     results.lastContinuity={id,viewport,fov,maxHand,maxPart,maxGrip,jumps:samples.flatMap((s,i)=>i&&dist(s.partPosition,samples[i-1].partPosition)>.13?[{i,previous:samples[i-1],current:s}]:[])};
     assert(maxGrip<.00001,'Hand stays on its cartridge grip '+id);assert(maxHand<.13&&maxPart<.13,'Adjacent-frame continuity '+id+JSON.stringify({maxHand,maxPart}));
     const seated=samples[197];assert(dist(seated.partPosition,seated.socketPosition)<.001,'Insertion seats at the actual socket');
     results.reloads.push({id,viewport,fov,maxHand,maxPart,maxGrip,hidden:samples.filter(s=>!s.partVisible).length});
    }
   }
   // Ordered captured poses plus closely spaced transition frames, actual renderer.
   await page.setViewportSize({width:1280,height:720});await page.evaluate(()=>__cf.setHud(false));
   const moments=[0,.195,.20,.205,.26,.315,.32,.325,.375,.38,.385,.40,.455,.46,.465,.535,.54,.545,.60,.635,.64,.645,.65,.675,.68,.685,.75,.815,.82,.825,.855,.86,.865,.94,1],images=[];
   for(const p of moments){await page.evaluate(p=>{__cf.sampleReloadPose(p,75);return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));},p);images.push((await capture(`${id}-${String(p).replace('.','_')}`)).toString('base64'));}
   const sheet=await page.evaluate(async({images,moments,id})=>{const canvas=document.createElement('canvas');canvas.width=640*4;canvas.height=380*Math.ceil(images.length/4);const ctx=canvas.getContext('2d');ctx.fillStyle='#10141c';ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let i=0;i<images.length;i++){const image=new Image();image.src='data:image/png;base64,'+images[i];await image.decode();const x=i%4*640,y=Math.floor(i/4)*380;ctx.drawImage(image,x,y,640,360);ctx.fillStyle='white';ctx.font='16px monospace';ctx.fillText(id+'  '+moments[i],x+10,y+376);}return canvas.toDataURL('image/png').split(',')[1];},{images,moments,id});
   writeFileSync(resolve(out,`${id}-sequence-${name}.png`),Buffer.from(sheet,'base64'));
   await page.evaluate(()=>{__cf.setHud(true);__cf.sampleReloadPose(1);__cf.combat.switchT=0;__cf.combat.cartridges=2;__cf.player.weapon.mag=3;__cf.reload();});
   assert(await page.evaluate(()=>__cf.player.weapon.reloading));const shotCount=await page.evaluate(()=>__cf.combat.shotsFired);await page.evaluate(()=>__cf.fire());assert.equal(await page.evaluate(()=>__cf.combat.shotsFired),shotCount);
   await page.evaluate(()=>{__cf.advanceWeapon(__cf.player.weapon.reloadDuration);__cf.sampleReloadPose(1);});assert.equal(await page.evaluate(()=>__cf.combat.cartridges),1);assert(await page.evaluate(()=>__cf.player.weapon.mag===__cf.player.weapon.magSize));
   await page.evaluate(()=>{__cf.fire();});assert.equal(await page.evaluate(()=>__cf.combat.shotsFired),shotCount+1);
   await page.evaluate(()=>{__cf.combat.fireT=0;__cf.combat.cartridges=0;__cf.player.weapon.mag=0;__cf.reload();});assert(!await page.evaluate(()=>__cf.player.weapon.reloading));
   await page.evaluate(()=>{__cf.combat.cartridges=2;__cf.reload();__cf.sampleReloadPose(.4);__cf.selectWeapon(1-__cf.combat.index);});
   const loose=await page.evaluate(()=>__cf.scene.getObjectByName('ViewModelRoot').children.filter(p=>p.name.includes('Cartridge')).length);assert.equal(loose,0);assert.equal(await page.evaluate(()=>__cf.combat.cartridges),2);
   await page.evaluate(slot=>{__cf.selectWeapon(slot);__cf.advanceWeapon(1);__cf.sampleReloadPose(1);},slot);
   await page.evaluate(()=>__cf.advanceShots(5));await page.waitForTimeout(300);
   await page.evaluate(()=>__cfPerf.reset());await page.evaluate(()=>{for(let i=0;i<=120;i++)__cf.sampleReloadPose(i/120);});await page.waitForTimeout(200);
   const counters=await page.evaluate(()=>__cfPerf.summary().counters);results[id+'Performance']=counters;for(const key of ['materialsCreated','geometriesCreated','linkProgram'])assert.equal(counters[key]||0,0,id+' '+key);
   // Real fixed-tick/input reload, pause/resume and moving/turning presentation.
   await page.evaluate(()=>{__cf.sampleReloadPose(1,100);__cf.combat.cartridges=2;__cf.player.weapon.mag=4;__cf.player.sprinting=false;__cf.combat.fireT=0;__cf.pause(false);});
   await page.keyboard.press('r');await page.waitForFunction(()=>__cf.player.weapon.reloading);
   await page.evaluate(()=>{window.__liveReload=[];const sample=()=>{__liveReload.push({...__cf.reloadPresentationInfo(),progress:1-__cf.player.weapon.reloadT/__cf.player.weapon.reloadDuration,active:__cf.player.weapon.reloading});if(__cf.player.weapon.reloading)requestAnimationFrame(sample);};requestAnimationFrame(sample);});
   await page.keyboard.down('d');await page.mouse.move(720,390,{steps:8});await page.waitForTimeout(150);await page.keyboard.up('d');
   await page.keyboard.down('w');await page.keyboard.down('Shift');await page.waitForTimeout(100);await page.keyboard.up('Shift');await page.keyboard.up('w');
   await page.evaluate(()=>__cf.pause(true));const remaining=await page.evaluate(()=>__cf.player.weapon.reloadT);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>__cf.player.weapon.reloadT),remaining);await page.evaluate(()=>__cf.pause(false));
   await page.waitForFunction(()=>!__cf.player.weapon.reloading);await page.evaluate(()=>__cf.pause(true));
   const live=await page.evaluate(()=>__liveReload);assert(live.length>20);assert(live.some(s=>s.stage==='WITHDRAW')&&live.some(s=>s.stage==='INSERT'));
   assert(live.filter(s=>!s.partVisible).every(s=>!s.visibleInFrustum));assert.equal(await page.evaluate(()=>__cf.combat.cartridges),1);assert(await page.evaluate(()=>__cf.player.weapon.mag===__cf.player.weapon.magSize));
   results[id+'Live']={frames:live.length,phases:[...new Set(live.map(s=>s.stage))]};
  }
 }
 await page.evaluate(()=>{__cf.player.weapon.mag=3;__cf.combat.cartridges=2;__cf.reload();__cf.sampleReloadPose(.4);__cf.restartEndless();});
 assert(!await page.evaluate(()=>__cf.player.weapon.reloading));assert.equal(await page.evaluate(()=>__cf.scene.getObjectByName('ViewModelRoot').children.filter(p=>p.name.includes('Cartridge')).length),0);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);results.passed=true;
 console.log('PASS adaptive routes and continuous reloads',name,JSON.stringify({cadence:results.cadence,reloads:results.reloads.length}));
}finally{await page.keyboard.up('w').catch(()=>{});writeFileSync(resolve(out,`route-reload-${name}.json`),JSON.stringify({results,errors,consoles},null,2));await browser.close();}
