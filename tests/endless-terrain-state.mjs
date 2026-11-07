import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import '../src/world/endless-terrain.js';
import '../src/world/campaign-terrain.js';
const T=globalThis.ChargefrontEndlessTerrain;
assert.deepEqual(Object.keys(T.profiles),['valley','crater','ridges']);
const means=[];
for(const [id,p] of Object.entries(T.profiles)){
 assert(Object.isFrozen(p)&&Object.isFrozen(p.soil));
 const sum=[0,0,0];let n=0,min=1,max=0;
 for(let y=160;y<=640;y+=5)for(let x=160;x<=640;x+=5){
  const color=T.color(id,x,y,Math.abs(Math.sin(x*.035)*12));
  assert(color.every(v=>Number.isFinite(v)&&v>=.08&&v<=.9));
  assert.deepEqual(T.color(id,x,y,Math.abs(Math.sin(x*.035)*12)),color);
  color.forEach((v,i)=>{sum[i]+=v;min=Math.min(min,v);max=Math.max(max,v);});n++;
 }
 assert(max-min>.1);means.push(sum.map(v=>v/n));
}
for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert(Math.hypot(...means[i].map((v,k)=>v-means[j][k]))>.07,'Distinct arena palette');
assert.deepEqual(T.color('unknown',400,400,0),T.color('valley',400,400,0));
const geometry=[],samples=[];
for(const id of Object.keys(T.profiles)){
 let min=Infinity,max=-Infinity,sum=0,squares=0,slope=0,zero=0;const heights=[];
 for(let y=220;y<=580;y+=2.5)for(let x=220;x<=580;x+=2.5){
  const d=Math.hypot(x-400,y-400);if(d>180)continue;const h=T.height(id,x,y);
  assert(Number.isFinite(h)&&h>=0&&h<25);assert.equal(h,T.height(id,x,y));
  if(d>28)assert(h>0,'No clipping-created flat terrain outside the relay pad');
  min=Math.min(min,h);max=Math.max(max,h);sum+=h;squares+=h*h;heights.push(h);if(h===0)zero++;
  slope=Math.max(slope,Math.hypot(T.height(id,x+.05,y)-h,T.height(id,x,y+.05)-h)/.05);
 }
 const mean=sum/heights.length,stdDev=Math.sqrt(squares/heights.length-mean*mean);
 assert(max-min>6&&stdDev>1.5);assert(slope<.75,'Smooth traversable interior grade');assert(zero/heights.length<.025);
 for(const [x,y] of [[400,400],[413,400],[400,420]])assert.equal(T.height(id,x,y),0,'Accessible relay/vial clearing');
 geometry.push({id,range:max-min,stdDev,maxSlope:slope,flatFraction:zero/heights.length});samples.push(heights);
}
for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){
 const rms=Math.sqrt(samples[i].reduce((sum,h,k)=>sum+(h-samples[j][k])**2,0)/samples[i].length);
 assert(rms>2,'Distinct height distributions, not just different materials');
}
const current=readFileSync('chargefront.html','utf8').replaceAll('\r\n','\n');
const baseline=execFileSync('git',['show','0f1b230:chargefront.html'],{encoding:'utf8',maxBuffer:2*1024*1024}).replaceAll('\r\n','\n');
const cut=(text,a,b)=>{const start=text.indexOf(a),end=text.indexOf(b,start);assert(start>=0&&end>start);return text.slice(start,end);};
for(const [a,b] of [
 ['const ENDLESS_ARENAS =','const endlessRun ='],
 ['function buildEndlessRelay','function makeDnaPickup'],
 ['function movePlayer','function fireWeapon'],
])assert.equal(cut(current,a,b),cut(baseline,a,b),'Preserve accepted '+a);
// CP3-B/D/R own the run-setup and restart internals. Keep CP3-A's geometry,
// selection, world-build and no-rebuild-restart invariants explicit instead of
// requiring a pre-CP3-B byte match for code those checkpoints intentionally changed.
const setup=cut(current,'function resetEndlessRun','const ENDLESS_SAVE_KEY');
for(const required of [
 'endlessRun.arena = ENDLESS_ARENAS[randInt(ENDLESS_ARENAS.length)];',
 'endlessRun.worldSeed = randInt(4294967295);',
 'buildMapGrid();','buildTerrain();','buildEndlessRelay();','buildEndlessVial();','buildEndlessDecor();',
 'function placeEndlessSquad()',
])assert(setup.includes(required),'CP3-A setup invariant '+required);
const restart=cut(current,'function restartEndlessRun','function restartCurrentRun');
for(const required of [
 'const currentArena = endlessRun.arena;','const currentSeed = endlessRun.worldSeed;','resetEndlessRun();',
 'endlessRun.arena = currentArena;','endlessRun.worldSeed = currentSeed;','placeEndlessSquad();',
])assert(restart.includes(required),'CP3-A restart invariant '+required);
assert(!restart.includes('buildEndlessWorld('),'Restart reuses the accepted world geometry');
// src/progression.js is deliberately owned by CP3-C; its economy/save contract
// is covered by the CP3-C/CP2-R suites. The remaining protected modules stay exact.
for(const path of ['src/enemy-tactics.js','src/combat.js','src/results.js','src/world/campaign-terrain.js','src/world/facility.js'])
 assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),execFileSync('git',['show','0f1b230:'+path],{encoding:'utf8',maxBuffer:2*1024*1024}).replaceAll('\r\n','\n'),'Protected module '+path);
const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{input:current.match(/<script type="module">([\s\S]*?)<\/script>/)[1],encoding:'utf8'});
assert.equal(syntax.status,0,syntax.stderr);
console.log('PASS CP3-A geometry: distinct non-flat smooth profiles, positive troughs, protected relay pad; accepted selection/scenery/movement/waves/saves/restart and protected modules',JSON.stringify({geometry,means}));
if(process.argv.includes('--receipts')){
 const root=resolve(process.argv[process.argv.indexOf('--receipts')+1]);
 for(const browser of ['edge','firefox']){
  const report=JSON.parse(readFileSync(resolve(root,'geometry-final',browser,'terrain.json'),'utf8'));
  assert(report.passed);assert.deepEqual(report.errors,[]);assert.deepEqual(report.cases.map(c=>c.arena),Object.keys(T.profiles));
  for(const row of report.cases){assert(row.numerical.range>6&&row.numerical.stdDev>1.5);assert(row.alignment.maxError<1e-5);assert(row.resumed.wave===1);}
  console.log('BROWSER_GEOMETRY',JSON.stringify({browser,cases:report.cases.map(row=>({arena:row.arena,range:row.numerical.range,stdDev:row.numerical.stdDev,maxSlope:row.numerical.maxSlope,flatFraction:row.numerical.zeroFraction,alignment:row.alignment.maxError,maxSquadPenetration:Math.max(...row.legs.flatMap(leg=>leg.squad.map(m=>m.penetration)))}))}));
 }
 console.log('PASS CP3-A geometry receipts: six focused geometry/selection/navigation/save cases in Edge and Firefox');
}
