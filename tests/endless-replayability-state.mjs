// CP3-D only: versioned schedules, saved RNG streams, compatibility and budgets.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {cut,economyContext} from './helpers/endless-economy-model.mjs';
import '../src/progression.js';
const D=ChargefrontEndlessDirector,P=ChargefrontProgression,C=ChargefrontCombat,root='_playtest/m43/cp3/d';
const html=readFileSync('chargefront.html','utf8'),progression=readFileSync('src/progression.js','utf8'),before=readFileSync(root+'/baseline.html','utf8');
const oldCtx={};vm.runInNewContext(readFileSync(root+'/baseline-director.js','utf8'),oldCtx);const old=oldCtx.ChargefrontEndlessDirector;
const serial=x=>JSON.parse(JSON.stringify(x)),digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.deepEqual(serial(D.costs),serial(old.costs));assert.deepEqual(serial(D.unlock),serial(old.unlock));assert.equal(D.live.toString(),old.live.toString());assert.equal(D.permits.toString(),old.permits.toString());
const count=queue=>queue.reduce((r,t)=>(r[t]=(r[t]||0)+1,r),{}),seeds=Array.from({length:64},(_,i)=>430012+i),representatives=[];
let plans=0;const oldOrders=new Set(),newOrders=new Set(),raw={before:0,after:0};
function expected(queue,w){return queue.reduce((sum,t)=>{const row=w>=12?P.economy.endless.lateScrap[t]:P.scrap[t];return sum+row.chance*(row.min+row.max)/2+(t==='carrier'?1.5*.2:0);},0);}
for(const seed of seeds){
 const previous=[],legacy=[],rows=[];
 for(let wave=1;wave<=128;wave++){
  const a=old.plan(wave,seed),v1=D.plan(wave,seed,1),b=D.plan(wave,seed);assert.deepEqual(serial(v1),serial(a),'Exact legacy queue/delay/caps');assert.deepEqual(b,D.plan(wave,seed));
  for(const key of ['activeCap','threatCap','batchSize','initialDelay','rest','minRadius','maxRadius','delays'])assert.deepEqual(b[key],serial(a[key]),key+' CP3-B budget/pacing unchanged');
  assert.equal(b.queue.length,a.queue.length);assert.equal(b.queue.filter(t=>t==='boss').length,wave%8===0?1:0);
  const roles=count(b.queue);for(const t of ['carrier','support','artillery'])assert((roles[t]||0)<=2);assert((roles.runner||0)+(roles.tunneler||0)<=Math.min(8,Math.ceil(a.queue.length*.24)));
  for(const t of b.queue)assert(t==='boss'||D.unlock[t]<=wave);
  previous.push(b.pattern);legacy.push(a.pattern);if(wave>=5){assert.notEqual(previous[wave-1],previous[wave-2]);assert.notEqual(previous[wave-1],previous[wave-3],'No A/B/A at family seams');}
  if(wave>=5&&(wave-4)%5===0)assert.equal(new Set(previous.slice(wave-5,wave)).size,5,'One of each established family per block');
  if(wave>=13&&wave<=42){raw.before+=expected(a.queue,wave);raw.after+=expected(b.queue,wave);}
  if(wave<=24)rows.push({wave,before:a.pattern,after:b.pattern,mutator:null,roles:count(b.queue),budget:b.queue.length,live:b.activeCap,threat:b.threatCap});plans++;
 }
 oldOrders.add(legacy.slice(2,22).join('/'));newOrders.add(previous.slice(2,22).join('/'));
 if(seed<430015)representatives.push({seed,arena:['valley','crater','ridges'][seed-430012],waves:rows});
 for(let replay=1;replay<=3;replay++){const s=D.replaySeed(seed,replay);assert.notEqual(s,seed);assert.notEqual(D.replaySeed(seed,replay-1),s);assert.notEqual(digest(Array.from({length:12},(_,i)=>D.plan(i+3,seed))),digest(Array.from({length:12},(_,i)=>D.plan(i+3,s))));}
}
assert(newOrders.size>oldOrders.size&&newOrders.size>=50);assert(Math.abs(raw.after/raw.before-1)<.10,'No economy rebalance via roster inflation');
const setups=[{}, {player:{slot1:'scatter',slot2:'plasma',ability:'bulwark'},squad:{rook:{weapon:'scatter'},vex:{weapon:'plasma'},kade:{weapon:'arc'}},posture:'screen'},
 {player:{slot1:'arc',slot2:'plasma',ability:'medic_pulse'},squad:{rook:{weapon:'plasma'},vex:{weapon:'arc'},kade:{weapon:'arc'}},posture:'escort'},
 {player:{slot1:'plasma',slot2:'rifle',ability:'target_designator'},squad:{rook:{weapon:'rifle'},vex:{weapon:'rifle'},kade:{weapon:'rifle'}}}];
function context(seed,configuration={}){
 const ctx=economyContext(html,progression,seed,configuration),{c,m}=ctx;c.ChargefrontEndlessDirector=D;c.endlessConfiguration=ctx.config;
 vm.runInContext(cut(html,'const endlessDirectorState =','function endlessPlan()'),c);m.run.worldSeed=seed;c.initializeEndlessVariation();
 const body=cut(html,'        const rewardRandom =','    detonate()').replace(/\s*}\s*$/,'');
 vm.runInContext('this.drops=function(type,source="endless_wave"){(function(){'+body+'}).call({type,encounterSource:source,pos:LJS.vec2(400,400)});};',c);
 return ctx;
}
const compatibility=[];
for(const [index,setup] of setups.entries()){
 const a=context(430012,setup),b=context(430012,setup),sequence=[];let previous=null;
 for(let wave=1;wave<=24;wave++){
  a.m.run.wave=b.m.run.wave=wave;
  // Cosmetic global draws and event rolls cannot alter the decision stream.
  for(let n=0;n<wave*3;n++){b.c.Math.random();b.c.endlessRandom();}
  const choose=ctx=>C.chooseMutator(wave,previous,D.eligibleMutators(ctx.m.mutators,ctx.config),()=>ctx.c.endlessRandom('decisionRng'));
  const x=choose(a),y=choose(b);assert.equal(x?.id,y?.id);if(x){assert(wave>=6);assert.notEqual(x.id,previous);}previous=x?.id||null;sequence.push(previous);
  if(!a.config.player.slot1.includes('rifle')&&!a.config.player.slot2.includes('rifle'))assert.notEqual(previous,'storm');
  a.m.offers();b.m.offers();assert.deepEqual(Array.from(a.m.offersNow,u=>u.id),Array.from(b.m.offersNow,u=>u.id));
  for(const u of a.m.offersNow)assert(!u.requiresWeapon||[a.config.player.slot1,a.config.player.slot2].includes(u.requiresWeapon));
 }
 const saved=structuredClone(a.m.run),clone=context(430012,setup);Object.assign(clone.m.run,saved);clone.c.initializeEndlessVariation({run:saved});
 const nextA=Array.from({length:16},()=>a.c.endlessRandom()),nextB=Array.from({length:16},()=>clone.c.endlessRandom());assert.deepEqual(nextA,nextB);
 for(const field of ['decisionRng','eventRng'])for(const value of [0,0x80000001,0xffffffff]){const s={...saved,[field]:value};Object.assign(clone.m.run,s);clone.c.initializeEndlessVariation({run:s});assert.equal(clone.m.run[field],value);}
 compatibility.push({setup:index,configuration:a.config,mutators:sequence});
}
for(const run of representatives){const ctx=context(run.seed);let previous=null;for(const row of run.waves){ctx.m.run.wave=row.wave;const mutator=C.chooseMutator(row.wave,previous,D.eligibleMutators(ctx.m.mutators,ctx.config),()=>ctx.c.endlessRandom('decisionRng'));previous=mutator?.id||null;row.mutator=previous;ctx.m.offers();}}
// Campaign material RNG/quantities/positions must remain exactly as before D.
for(const type of Object.keys(P.scrap)){
 const a=economyContext(before,progression,789),b=context(789);a.c.mode=b.c.mode='campaign';a.c.rewardSource='enemy';
 for(let n=0;n<100;n++){a.m.drops(type);b.c.drops(type);}assert.deepEqual(serial(a.pending),serial(b.pending));assert.equal(a.c.Math.random(),b.c.Math.random());
}
const state=context(123);state.m.run.wave=20;state.m.run.milestone=20;state.m.run.dnaBanked=60;state.m.run.dna=3;state.c.craft.scraps=5000;state.c.craft.powerCells=75;state.m.bank();assert.equal(state.c.craft.scraps,5012);assert.equal(state.c.craft.powerCells,75);
const legacy=context(430012);Object.assign(legacy.m.run,{wave:8,waveActive:true,directorVersion:0,budgetLeft:46});legacy.c.initializeEndlessVariation({run:{wave:8,worldSeed:430012}});vm.runInContext(cut(html,'function endlessPlan()','function startEndlessWave()'),legacy.c);assert.deepEqual(serial(legacy.c.endlessPlan()),serial(old.plan(8,430012)));assert.equal(legacy.m.run.directorVersion,1);assert.equal(legacy.m.run.budgetLeft,29);
assert(html.includes("music.play(plan.pattern === 'airborne' || endlessRun.wave % 8 === 0"));assert(html.includes("music.play(endlessPlan().pattern==='airborne'||endlessRun.wave%8===0"));
// Material streams replay independently of unrelated global cosmetic draws.
const a=context(430012),b=context(430012);a.m.run.wave=b.m.run.wave=20;
for(const type of D.plan(20,430012).queue){for(let i=0;i<17;i++)b.c.Math.random();a.c.drops(type);b.c.drops(type);}assert.deepEqual(serial(a.pending),serial(b.pending));assert.equal(a.m.run.eventRng,b.m.run.eventRng);
const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{input:html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],encoding:'utf8'});assert.equal(syntax.status,0,syntax.stderr);
writeFileSync(root+'/seeded.json',JSON.stringify({passed:true,plans,seedCount:64,legacyOrders:oldOrders.size,newOrders:newOrders.size,rawScrapRatio:raw.after/raw.before,compatibility,representatives},null,2));
console.log('PASS CP3-D seeded:',JSON.stringify({plans,legacyOrders:oldOrders.size,newOrders:newOrders.size,rawScrapRatio:raw.after/raw.before,loadouts:compatibility.length,legacyExact:true}));
