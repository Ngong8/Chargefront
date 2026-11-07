// Focused CP3-A surface/selection/persistence and real-input traversal. No full
// Campaign/late-wave regression matrix; no product helpers added for this probe.
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const name=process.argv.includes('firefox')?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m43/cp3/geometry-final',name);
assert(!existsSync(out),'Use a fresh output directory');mkdirSync(out,{recursive:true});
const captureOnly=process.argv.includes('--capture-only');
const auditOnly=process.argv.includes('--height-audit');
const report={browser:name,scope:auditOnly?'CP3-A numerical height audit only':captureOnly?'CP3-A material/capture follow-up':'CP3-A only',cases:[],errors:[]};
const browser=await(name==='firefox'?firefox:chromium).launch(name==='firefox'?{headless:true}:{headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>report.errors.push(e.message));
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');url.searchParams.set('endlessFixture','1');
async function boot(){await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});}
async function ready(){await page.evaluate(()=>__cf.waitCombatPreparation());await page.waitForFunction(()=>__cf.scene.getObjectByName('EndlessGround')?.material.map?.image?.width===2048,undefined,{timeout:15000});}
async function fingerprint(){return page.evaluate(()=>{
 const c=__cf,g=c.scene.getObjectByName('EndlessGround'),rim=c.scene.getObjectByName('TerrainBoundaryRim');
 const hash=values=>{let h=2166136261;for(const v of values){h^=v;h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
 const digest=attribute=>hash(new Uint32Array(attribute.array.buffer,attribute.array.byteOffset,attribute.array.byteLength/4));
 const solids=c.environmentPlacementSolidsForTest(),text=JSON.stringify(solids),trees=JSON.stringify(c.endlessDecorInfo());
 return {arena:c.endless.arena.id,seed:c.endless.worldSeed,positions:digest(g.geometry.attributes.position),colors:digest(g.geometry.attributes.color),
  solids:hash([...text].map(ch=>ch.charCodeAt(0))),solidCount:solids.length,trees:hash([...trees].map(ch=>ch.charCodeAt(0))),
  vertices:g.geometry.attributes.position.count,colorVertices:g.geometry.attributes.color.count,vertexColors:g.material.vertexColors,
  rimColors:rim.geometry.attributes.color.count,sharedMaterial:g.material===rim.material,textureSize:g.material.map.image.width,
  groundFill:g.material.emissive.toArray(),fillIntensity:g.material.emissiveIntensity,sharedTexture:g.material.map===g.material.emissiveMap,
  heights:[[400,400],[413,400],[400,442],[480,405],[520,460]].map(([x,y])=>c.terrainHeight(x,y))};
});}
async function heightStats(){return page.evaluate(()=>{
 const c=__cf,values=[],crossSections=[],stats={min:Infinity,max:-Infinity,zero:0,maxSlope:0,coreZero:0,coreSamples:0};let sum=0,squares=0;
 for(let y=230;y<=570;y+=5)for(let x=230;x<=570;x+=5){const d=Math.hypot(x-400,y-400);if(d>170)continue;const h=c.terrainHeight(x,y);values.push(h);sum+=h;squares+=h*h;stats.min=Math.min(stats.min,h);stats.max=Math.max(stats.max,h);if(h===0)stats.zero++;if(d<=90){stats.coreSamples++;if(h===0)stats.coreZero++;}if(d>28)stats.maxSlope=Math.max(stats.maxSlope,Math.hypot(c.terrainHeight(x+.25,y)-h,c.terrainHeight(x,y+.25)-h)/.25);}
 for(let i=0;i<8;i++){const a=i*Math.PI/4;crossSections.push(Array.from({length:18},(_,n)=>+c.terrainHeight(400+Math.cos(a)*n*10,400+Math.sin(a)*n*10).toFixed(4)));}
 const mean=sum/values.length;return {...stats,samples:values.length,range:stats.max-stats.min,mean,stdDev:Math.sqrt(squares/values.length-mean*mean),zeroFraction:stats.zero/values.length,coreZeroFraction:stats.coreZero/stats.coreSamples,crossSections};
});}
async function alignment(){return page.evaluate(()=>{
 const c=__cf,g=c.scene.getObjectByName('EndlessGround'),p=g.geometry.attributes.position,index=g.geometry.index;
 let maxError=0;
 for(let i=0;i<64;i++){
  const angle=i*.618,radius=30+i%11*13,x=400+Math.cos(angle)*radius,y=400+Math.sin(angle)*radius;
  const col=Math.floor(x/2.5),row=Math.floor((800-y)/2.5),first=(row*320+col)*6;let z=null;
  // Independent barycentric check of the actual indexed rendered triangles.
  for(let triangle=0;triangle<2;triangle++){
   const ids=[0,1,2].map(k=>index.getX(first+triangle*3+k)),v=ids.map(i=>[p.getX(i)+400,p.getY(i)+400,p.getZ(i)]),[a,b,d]=v;
   const den=(b[1]-d[1])*(a[0]-d[0])+(d[0]-b[0])*(a[1]-d[1]);
   const u=((b[1]-d[1])*(x-d[0])+(d[0]-b[0])*(y-d[1]))/den,w=((d[1]-a[1])*(x-d[0])+(a[0]-d[0])*(y-d[1]))/den;
   if(u>=-1e-8&&w>=-1e-8&&u+w<=1+1e-8){z=u*a[2]+w*b[2]+(1-u-w)*d[2];break;}
  }
  if(z===null)throw Error('No ground triangle');maxError=Math.max(maxError,Math.abs(z-c.terrainHeight(x,y)));
 }
 const trees=c.endlessDecorInfo(),solids=c.environmentPlacementSolidsForTest();let treeError=0,solidError=0;
 for(const tree of trees){const [x,y,z]=tree.position;treeError=Math.max(treeError,Math.abs(z-c.terrainHeight(x,y)));const slab=solids.find(s=>Math.abs((s.x0+s.x1)/2-x)<1e-6&&Math.abs((s.y0+s.y1)/2-y)<1e-6);if(!slab)throw Error('Missing tree collider');solidError=Math.max(solidError,Math.abs(slab.bottomY-z));}
 return {samples:64,maxError,trees:trees.length,treeError,solidError};
});}
async function walk(x,y){
 const start=await page.evaluate(()=>[__cf.player.pos.x,__cf.player.pos.y]);
 await page.evaluate(({x,y})=>{__cf.player.yaw=Math.atan2(y-__cf.player.pos.y,x-__cf.player.pos.x);__cf.player.pitch=0;__cf.pause(false);},{x,y});
 await page.keyboard.down('w');await page.keyboard.down('Shift');
 try{await page.waitForFunction(({x,y})=>{const c=__cf;c.player.yaw=Math.atan2(y-c.player.pos.y,x-c.player.pos.x);if(c.insideSolid(c.player.pos.x,c.player.pos.y))throw Error('Player embedded');return Math.hypot(x-c.player.pos.x,y-c.player.pos.y)<1;},{x,y},{timeout:18000});}
 finally{await page.keyboard.up('w');await page.keyboard.up('Shift');}
 const state=await page.evaluate(()=>{
  const c=__cf,solids=c.environmentPlacementSolidsForTest();
  return {position:[c.player.pos.x,c.player.pos.y],groundError:Math.abs(c.player.zPos-c.terrainHeight(c.player.pos.x,c.player.pos.y)),squad:c.squad.map(m=>({
   position:[m.pos.x,m.pos.y],inside:c.insideSolid(m.pos.x,m.pos.y),distance:Math.hypot(m.pos.x-c.player.pos.x,m.pos.y-c.player.pos.y),
   penetration:Math.max(0,...solids.filter(s=>!s.disabled&&!s.overhead).map(s=>.4-Math.hypot(m.pos.x-Math.max(s.x0,Math.min(s.x1,m.pos.x)),m.pos.y-Math.max(s.y0,Math.min(s.y1,m.pos.y)))))
  }))};
 });
 assert(state.groundError<.01);assert(state.squad.every(m=>m.penetration<1e-5),JSON.stringify(state));return {start,target:[x,y],...state};
}
async function capture(id){
 await page.evaluate(()=>{const c=__cf;c.pause(true);c.setHud(false);c.hideViewmodel(true);c.setCoverPose([520,510,25,400,400,3]);document.querySelector('#cf-perf-diagnostics').style.display='none';window.cp3Render=true;const draw=()=>{if(window.cp3Render){c.render();requestAnimationFrame(draw);}};draw();});
 await page.screenshot({path:resolve(out,id+'.png')});
 await page.evaluate(()=>{window.cp3Render=false;__cf.setCoverPose(null);__cf.setHud(true);__cf.hideViewmodel(false);});
}
try{
 if(auditOnly){
  for(const [index,id] of ['valley','crater','ridges'].entries()){
   await boot();await page.evaluate(index=>{const random=Math.random;try{Math.random=()=>(index+.2)/3;__cf.startEndlessMode();}finally{Math.random=random;}__cf.pause(true);},index);
   await ready();assert.equal(await page.evaluate(()=>__cf.endless.arena.id),id);report.cases.push({arena:id,numerical:await heightStats()});
  }
  report.passed=report.errors.length===0;
 }else{
 for(const [index,id] of ['valley','crater','ridges'].entries()){
  await boot();await page.evaluate(index=>{const c=__cf,random=Math.random;try{Math.random=()=>(index+.2)/3;c.startEndlessMode();}finally{Math.random=random;}c.pause(true);c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);c.clearTestEnemies();},index);
  await ready();const initial=await fingerprint();assert.equal(initial.arena,id,'Real random arena selection');assert(initial.vertexColors&&initial.sharedMaterial);assert.equal(initial.vertices,103041);assert.equal(initial.colorVertices,initial.vertices);
  const row={arena:id,initial,legs:[]};report.cases.push(row);
  row.numerical=await heightStats();assert(row.numerical.range>6&&row.numerical.stdDev>1.5);assert(row.numerical.zeroFraction<.025);assert(row.numerical.maxSlope<.75);
  row.alignment=await alignment();assert(row.alignment.maxError<1e-5&&row.alignment.treeError<1e-5&&row.alignment.solidError<1e-5);assert(row.alignment.trees>0);
   if(captureOnly){if(name==='edge'){await capture(id);row.screenshot=id+'.png';}assert(initial.sharedTexture);assert.equal(initial.fillIntensity,.25);console.log('PASS CP3-A final material',name,id);continue;}
  // Central exit and outer shoulder use native input/controller/collision.
  row.legs.push(await walk(400,410));row.legs.push(await walk(413,405));row.legs.push(await walk(430,442));row.legs.push(await walk(455,435));
  await page.waitForFunction(()=>__cf.squad.every(m=>Math.hypot(m.pos.x-__cf.player.pos.x,m.pos.y-__cf.player.pos.y)<24),undefined,{timeout:10000});
  const collision=await page.evaluate(()=>{const c=__cf,z=c.terrainHeight(400,400);return {low:c.probeBlocked(390,400,z+1,410,400,z+1),high:c.probeBlocked(390,400,z+12,410,400,z+12)};});assert(collision.low&&!collision.high);row.collision=collision;
  if(name==='edge'){await capture(id);row.screenshot=id+'.png';}
  await page.evaluate(()=>{const c=__cf;c.pause(true);c.combat.cartridges=7;if(!c.saveEndless())throw Error('Boundary save');c.move(400-c.player.pos.x,640-c.player.pos.y);c.commandSquad('hold');for(const m of c.squad){m.pos.set(400,640);m.holdPos.set(400,640);m.z=c.terrainHeight(400,640);m.fireT=m.abilityCd=1e8;}c.setNoAggro(false);let point=null;for(let i=0;i<16;i++){const angle=i*Math.PI/8,x=400+Math.cos(angle)*90,y=400+Math.sin(angle)*90;if(!c.insideSolid(x,y)){point={x,y};break;}}if(!point)throw Error('No clear enemy fixture');window.cp3Enemy=c.spawnTestEnemy('shielded',point.x-c.player.pos.x,point.y-c.player.pos.y);c.startWave();c.endless.budgetLeft=0;c.pause(false);});
  const enemyStart=await page.evaluate(()=>Math.hypot(cp3Enemy.pos.x-400,cp3Enemy.pos.y-400));await page.waitForTimeout(4000);
  row.navigation=await page.evaluate(()=>{const e=cp3Enemy;__cf.pause(true);return {distance:Math.hypot(e.pos.x-400,e.pos.y-400),inside:__cf.insideSolid(e.pos.x,e.pos.y),awareness:e.awareness,attacks:e.attackCount};});assert(row.navigation.distance<enemyStart-5);assert(!row.navigation.inside);assert.equal(row.navigation.attacks,0);
  assert.deepEqual(await fingerprint(),initial,'Traversal/combat rebuilt or altered terrain/scenery');
  const saved=await page.evaluate(()=>__cf.endlessSaveInfo());assert(saved.run.waveActive);assert.equal(saved.player.combat.cartridges,7);
  // Actual persisted v1 boundary is read after a reload, not fabricated anew.
  await boot();await page.evaluate(()=>{const c=__cf;if(!c.continueEndless())throw Error('Continue');c.pause(true);c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);});await ready();
  assert.deepEqual(await fingerprint(),initial,'Continue changed selected surface, terrain or collision');
  assert.equal(await page.evaluate(()=>__cf.combat.cartridges),7);assert.equal(await page.evaluate(()=>__cf.endless.wave),1);row.resumed={wave:1,cartridges:7};
  const geometry=await page.evaluate(()=>__cf.scene.getObjectByName('EndlessGround').geometry.uuid);
  await page.evaluate(()=>{__cf.restartEndless();__cf.pause(true);});assert.equal(await page.evaluate(()=>__cf.endless.wave),0);assert.equal(await page.evaluate(()=>__cf.combat.cartridges),8);
  assert.equal(await page.evaluate(()=>__cf.scene.getObjectByName('EndlessGround').geometry.uuid),geometry,'Restart rebuilt terrain');assert.deepEqual(await fingerprint(),initial);
  console.log('PASS CP3-A',name,id,'selection, native movement/FOLLOW, collision, pursuit, Continue and no-rebuild restart');
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
 }
}finally{await page.keyboard.up('w').catch(()=>{});await page.keyboard.up('Shift').catch(()=>{});writeFileSync(resolve(out,'terrain.json'),JSON.stringify(report,null,2));await browser.close();}
