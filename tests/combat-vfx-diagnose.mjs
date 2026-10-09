// Same reproducible visual/flight probes before and after refinement. No assertions
// of subjective quality; the receipt exposes material, culling and timing facts.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const ff=process.argv.includes('firefox'),name=ff?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m41/regressions/combat-vfx-diagnose');mkdirSync(out,{recursive:true});
const browser=await(ff?firefox:chromium).launch(ff?{headless:true}:{headless:true,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],results={};page.on('pageerror',e=>errors.push(e.message));
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
async function capture(label){await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');await page.screenshot({path:resolve(out,`${label}-${name}.png`)});}
try{
 await page.goto(url.href);await page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
 await page.evaluate(()=>__cf.startEndlessMode({player:{slot1:'arc',slot2:'plasma'}}));await page.mouse.click(640,360);
 await page.evaluate(()=>{__cf.setNoSpawn(true);__cf.setNoAggro(true);__cf.clearTestEnemies();__cf.setInvulnerable(true);});await page.waitForTimeout(500);
 results.magazine=await page.evaluate(()=>{
  const c=__cf;c.pause(true);c.setHud(false);c.advanceShots(5);c.sampleReloadPose(1,75);c.player.weaponKick=c.player.weaponPitch=c.player.weaponRoll=0;
  const model=c.scene.getObjectByName('arcViewWeapon'),window=model.userData.magazineWindow,lights=[];
  c.camera.traverse(o=>{if(o.isPointLight){lights.push([o,o.intensity]);o.intensity=0;}});
  const pixels=()=>{c.render();const gl=c.renderer.getContext(),v=window.position.clone(),data=[];
   for(const y of [-.035,-.015,.015,.035])for(const z of [-.085,-.055,.055,.085]){v.set(-.007,y,z);window.localToWorld(v);v.project(c.camera);const x=Math.round((v.x*.5+.5)*gl.drawingBufferWidth),py=Math.round((v.y*.5+.5)*gl.drawingBufferHeight),p=new Uint8Array(4);gl.readPixels(x,py,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);data.push(Array.from(p));}return data;};
  const dark=pixels();for(const [light] of lights)light.intensity=80;const lit=pixels();for(const [light,intensity] of lights)light.intensity=intensity;
  return {info:c.arcInfo(),transparent:window.material.transparent,depthWrite:window.material.depthWrite,color:window.material.color.getHex(),dark,lit,maxLightingDelta:Math.max(...dark.map((p,i)=>Math.max(...p.slice(0,3).map((v,j)=>Math.abs(v-lit[i][j])))))};
 });await capture('arc-magazine-idle');
 results.culling=[];
 for(const [i,yaw] of [0,Math.PI/2,Math.PI,0].entries()){
  const row=await page.evaluate(({yaw,i})=>{const c=__cf;c.player.yaw=yaw;c.player.pitch=-.16;c.sampleReloadPose(1,75);c.player.weapon.mag=32;c.combat.fireT=0;c.combat.switchT=0;c.fire();c.render();
   const lines=c.scene.children.filter(o=>o.name==='PooledElectricalRibbon'||o.isLine&&o.geometry.attributes.position.count===6);
   return {i,yaw,arcs:lines.map(o=>{const p=o.geometry.attributes.position,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let j=0;j<p.count;j++){const xyz=[p.getX(j),p.getY(j),p.getZ(j)];for(let k=0;k<3;k++){min[k]=Math.min(min[k],xyz[k]);max[k]=Math.max(max[k],xyz[k]);}}const expected=min.map((v,j)=>(v+max[j])/2),center=o.geometry.boundingSphere?.center.toArray();return {culled:o.frustumCulled,expected,center,boundsDrift:center?Math.hypot(...center.map((v,j)=>v-expected[j])):null};}),info:c.arcInfo()};},{yaw,i});results.culling.push(row);await capture('arc-angle-'+i);
  await page.evaluate(()=>__cf.pause(false));await page.waitForTimeout(280);await page.evaluate(()=>__cf.pause(true));
 }
 results.flight=await page.evaluate(()=>{const c=__cf,rows=[];c.pause(true);c.clearTestEnemies();c.advanceShots(10);
  for(const [label,distance] of [['near',5],['distant',60],['shallow',35]]){
   const [x,y]=[[420,450],[450,430],[375,455],[425,475]].find(([x,y])=>!c.insideSolid(x,y)&&!c.probeBlocked(x,y,c.terrainHeight(x,y)+1.6,x+1.5,y,c.terrainHeight(x,y)+1.3,.1));
   const h=c.terrainHeight(x,y),z=h+1.6,targetZ=c.terrainHeight(x+distance,y)+.1,dx=distance,dz=targetZ-z,length=Math.hypot(dx,dz),before=c.effectInfo().impacts.length;
   const fire=performance.now();c.spawnTestShot(x,y,z,dx/length,0,dz/length,'arc');const shot=c.shots.at(-1),created=performance.now();let tick=0;
   while(c.shots.includes(shot)&&tick<120){c.advanceShots(1/60);tick++;}
   const collision=performance.now(),activated=c.effectInfo().impacts.length>before,activation=performance.now();c.render();
   rows.push({label,distance,ticks:tick,flightSeconds:tick/60,expectedSeconds:length/85,fire,created,collision,activation,activated,firstEligibleRender:c.renderer.info.render.frame,impact:c.effectInfo().impacts.at(-1)});
  }return rows;});
 results.passed=errors.length===0;console.log('ARC diagnostic',name,JSON.stringify({lightingDelta:results.magazine.maxLightingDelta,culling:results.culling.map(r=>r.arcs.map(a=>({enabled:a.culled,unusedBoundsDrift:a.boundsDrift}))),flight:results.flight.map(r=>({label:r.label,flight:r.flightSeconds,activated:r.activated}))}));
}finally{writeFileSync(resolve(out,`diagnose-${name}.json`),JSON.stringify({results,errors},null,2));await browser.close();}
