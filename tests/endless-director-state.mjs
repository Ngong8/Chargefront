// CP3-B: seeded composition comparison, pressure bounds and lifecycle simulation.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import '../src/endless-director.js';
import '../src/progression.js';
const D=ChargefrontEndlessDirector,seedRandom=ChargefrontProgression.seedRandom;
const root='_playtest/m43/cp3/b',before=readFileSync(root+'/baseline.html','utf8').replaceAll('\r\n','\n'),current=readFileSync('chargefront.html','utf8').replaceAll('\r\n','\n');
const cut=(text,a,b)=>{const i=text.indexOf(a),j=text.indexOf(b,i);assert(i>=0&&j>i);return text.slice(i,j);};
// CP3-D authorized the supply-drop stream to use the saved event RNG. Retain
// the historical reward/refresh/price comparison around that substitution.
const normalizeSupplyDrop=text=>text.replace('                const a = endlessRand(TAU), r = endlessRand(4, 12);','                const a = rand(TAU), r = rand(4, 12);');
for(const [a,b] of [['        /* COMBAT MEDICS (relay)','/* ── interact (E)'],['    /* relay upgrades that refresh','    saveEndlessBoundary(); // post-refresh'],['const ENDLESS_RELAY_UPGRADES','function endlessRarityColor']])assert.equal(normalizeSupplyDrop(cut(current,a,b)),normalizeSupplyDrop(cut(before,a,b)),'Exact pre-CP3-B rewards/refresh/prices: '+a);
const oldType=before.slice(before.indexOf('function endlessWaveType('),before.indexOf('function spawnEndlessGroup('));
const count=list=>list.reduce((r,t)=>(r[t]=(r[t]||0)+1,r),{}),rows=[];
const expectedScrap=counts=>Object.entries(counts).reduce((sum,[type,n])=>{const r=ChargefrontProgression.scrap[type];return sum+n*r.chance*(r.min+r.max)/2;},0);
for(const seed of [430012,430013,430014,7,42,913])for(const wave of [1,2,3,4,5,6,8,10,12,16,20,32]){
 const math=Object.create(Math);math.random=seedRandom(seed^wave);const ctx={Math:math,endlessRun:{wave}};vm.runInNewContext(oldType+';this.pick=endlessWaveType;',ctx);
 const old=Array.from({length:6+wave*5},()=>ctx.pick(0));if(wave%8===0)old.push('boss');
 const p=D.plan(wave,seed);assert.deepEqual(p,D.plan(wave,seed));
 assert(p.queue.length<=55&&p.activeCap<=24&&p.threatCap<=58);
 assert.equal(p.queue.filter(t=>t==='boss').length,wave%8===0?1:0);
 for(const t of p.queue)assert(t==='boss'||D.unlock[t]<=wave);
 if(wave>2){assert(new Set(p.queue).size>=3);assert(p.queue.includes('skitter')&&p.queue.includes('spitter'));}
 const counts=count(p.queue);assert((counts.carrier||0)<=2&&(counts.support||0)<=2&&(counts.artillery||0)<=2);
 if(wave===1)assert.equal(counts.skitter,8);
 if(wave===2)assert(!counts.brute&&counts.runner===2&&counts.spitter===2);
 if(p.pattern==='airborne')assert(counts.drone>1&&counts.drone<p.queue.length*.6);
 assert(p.delays.some(t=>t>4)&&p.rest>=6);
 rows.push({seed,wave,before:count(old),after:counts,pattern:p.pattern,beforeTotal:old.length,total:p.queue.length,activeCap:p.activeCap,threatCap:p.threatCap,baseExpectedScrap:{before:expectedScrap(count(old)),after:expectedScrap(counts)}});
}
for(const seed of [7,42,430012]){
 const patterns=Array.from({length:100},(_,i)=>D.plan(i+1,seed).pattern);
 for(let i=1;i<patterns.length;i++)assert.notEqual(patterns[i],patterns[i-1],'No consecutive pattern repeats');
 for(const wave of [6,12,20])assert(new Set([7,42,913,430012,430013,430014].map(s=>JSON.stringify(Object.entries(count(D.plan(wave,s).queue)).sort()))).size>=4,'Seeded role-count variation');
}
// Pressure caps count living actors, not lingering death animations. Carrier
// children obey the same shared pressure calculation as planned reinforcements.
const p=D.plan(20,42),full=Array.from({length:p.activeCap},()=>({type:'skitter'}));
assert(!D.permits(p,D.live(full),['skitter']));assert(D.permits(p,D.live(full.map(e=>({...e,dead:true}))),['skitter']));
assert(!D.permits(p,{count:0,cost:p.threatCap,counts:{}},['skitter']));
assert(!D.permits(p,{count:4,cost:4,counts:{runner:4}},['tunneler']));
assert(!D.permits(p,{count:2,cost:10,counts:{carrier:2}},['carrier']));
assert(!D.permits(p,{count:0,cost:0,counts:{}},['brute'],'carrier_spawn'));
// Extract existing integration functions into a bounded actor-free lifecycle
// harness: failed spawns cannot erase budget, pending boss prevents early clear,
// cooldowns are enforced, and rewards/save run once per real transition.
const start=current.indexOf('const endlessDirectorState ='),end=current.indexOf('/* ── interact (E)',start);
const c={ChargefrontEndlessDirector:D,endlessRun:{wave:7,waveActive:false,worldSeed:42,encounterSeed:42,replayCount:0,decisionRng:1,eventRng:2,directorVersion:0,intermissionT:0,previousMutatorId:null,medkitCap:0,grenadeCap:0,supplyDrop:0},
 endlessConfiguration:{player:{slot1:'rifle',slot2:'scatter'},squad:{}},
 enemies:[],player:{pos:{x:400,y:640},hp:100,maxHp:100},squadMembers:[],ENDLESS_MUTATORS:[],ENDLESS_RELAY_POS:{x:400,y:400},
 ChargefrontCombat:{chooseMutator:()=>null},music:{play(){}},notify(){},playFileSfx(){},refreshEndlessUpgradeOffers(){},saveEndlessBoundary(){c.saves++;},saves:0,
 requestEncounter:()=>true,findEndlessSpawnPoint:()=>null,recordEncounterSpawn(){},resolveCircle(){},randInt:()=>0,isObviousSpawnPopIn:()=>false,WORLD:800,Math};
vm.createContext(c);vm.runInContext(current.slice(start,end)+';this.start=startEndlessWave;this.tick=updateEndlessWaves;this.plan=endlessPlan;this.audit=auditEndlessStragglers;',c);
c.start();assert.equal(c.endlessRun.wave,8);const initial=c.endlessRun.budgetLeft;c.tick(2);assert.equal(c.endlessRun.budgetLeft,initial,'Failed locations retain budget');assert(c.endlessRun.waveActive);
c.endlessRun.budgetLeft=1;c.endlessRun.spawnT=0;c.tick(2);assert(c.endlessRun.waveActive,'Last pending actor prevents false completion');
c.endlessRun.budgetLeft=0;c.tick(0);assert(!c.endlessRun.waveActive);assert.equal(c.endlessRun.intermissionT,12);const saves=c.saves;c.tick(1);assert.equal(c.saves,saves,'No repeat clear/rewards');c.start();assert.equal(c.endlessRun.wave,8);c.tick(11);c.start();assert.equal(c.endlessRun.wave,9);
for(const scenario of ['visible','relay-arrival','moving','unseen-stalled','outside-world']){
 const e={type:'shielded',encounterSource:'endless_wave',pos:{x:520,y:500},memoryT:0,canSeeTarget:scenario==='visible',advanceReplans:3,endlessProgress:{x:520,y:500,idle:90},destroy(){c.enemies.splice(c.enemies.indexOf(this),1);}};
 if(scenario==='relay-arrival')e.pos={x:408,y:400};if(scenario==='moving')e.pos.x+=2;if(scenario==='outside-world')e.pos.x=801;
 c.enemies.push(e);c.audit(2);assert.equal(!c.enemies.includes(e),['unseen-stalled','outside-world'].includes(scenario),scenario+' retirement policy');c.enemies.length=0;
}
const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{input:current.match(/<script type="module">([\s\S]*?)<\/script>/)[1],encoding:'utf8'});assert.equal(syntax.status,0,syntax.stderr);
writeFileSync(root+'/composition.json',JSON.stringify({passed:true,seedCount:6,waves:[1,2,3,4,5,6,8,10,12,16,20,32],rows},null,2));
console.log('PASS CP3-B: 72 old/new seeded compositions, anti-repeat/unlocks/role limits, live/cost/brood bounds, spawn retry/boss pending/cooldown/reward-once lifecycle, module syntax');
