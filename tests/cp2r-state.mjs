import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import '../src/progression.js';
import '../src/enemy-tactics.js';
import '../src/combat.js';
const P=globalThis.ChargefrontProgression,T=globalThis.ChargefrontEnemyTactics,C=globalThis.ChargefrontCombat;
const baseline=resolve(process.env.CF_CP2R_BASELINE||'tests/fixtures/m43'),context={};vm.runInNewContext(readFileSync(resolve(baseline,'src-progression.js'),'utf8'),context);const old=context.ChargefrontProgression;
assert.deepEqual(Object.values(P.reserves).map(r=>r.player),[4,4,4,3]);assert.deepEqual(Object.values(P.reserves).map(r=>r.squad),[3,2,2,2]);
assert.deepEqual(JSON.parse(JSON.stringify(P.scrap)),JSON.parse(JSON.stringify(old.scrap)),'Default/Endless drop table remains exact');
assert.equal(P.economy.endless.scrap,P.scrap);assert.equal(P.economy.endless.powerChance,.08);assert.equal(P.economy.campaign.powerChance,.05);assert.equal(P.economy.campaign.worldScrap,2);
const summary=[];
for(const [type,row] of Object.entries(P.economy.campaign.scrap)){
 const a=old.seedRandom(9087),b=P.seedRandom(9087),c=P.seedRandom(9087);let sumOld=0,sumCampaign=0;
 for(let i=0;i<10000;i++){const before=old.scrapReward(type,a),endless=P.scrapReward(type,b,'endless');assert.equal(endless,before);sumOld+=before;const value=P.scrapReward(type,c,'campaign');assert(value===0||value>=row.min&&value<=row.max);sumCampaign+=value;}
 assert.equal(a(),b(),'Endless reward consumes the same random sequence');assert(sumCampaign<=sumOld);summary.push({type,before:sumOld/10000,campaign:sumCampaign/10000});
}
assert(Object.isFrozen(P.economy.campaign.scrap.runner));
const combat=C.create();combat.reset({cartridges:P.reserves.dead_signal.player});assert.equal(combat.weapons.rifle.mag,50);assert.equal(combat.weapons.scatter.mag,20);
combat.weapons.rifle.mag=0;assert(combat.reload());combat.tick(1.7);assert.equal(combat.cartridges,3);assert.equal(combat.weapons.rifle.mag,50);combat.select(1);combat.tick(1);combat.weapons.scatter.mag=0;assert(combat.reload());combat.tick(2.05);assert.equal(combat.cartridges,2);assert.equal(combat.weapons.scatter.mag,20);
combat.restore({combat:{version:3,activeId:'scatter',cartridges:11,weapons:{rifle:{mag:7},scatter:{mag:3}}}},12);assert.equal(combat.cartridges,11);assert.equal(combat.weapons.rifle.mag,7);assert.equal(combat.weapons.scatter.mag,3);
const center={x:400,y:400},ring=T.relayObjective({x:550,y:400},center,p=>!(p.x>410&&p.y<403));assert(ring);assert(Math.hypot(ring.x-400,ring.y-400)>=7.99);assert.notDeepEqual(ring,center);assert.equal(T.relayObjective(center,center,()=>false),null);
const html=readFileSync('chargefront.html','utf8').replaceAll('\r\n','\n');
const fixture=JSON.parse(readFileSync('tests/fixtures/m43/protected-sections.json','utf8'));
const cut=(text,start,end)=>{const from=text.indexOf(start),to=text.indexOf(end,from);assert(from>=0&&to>from,'Protected source markers exist');return text.slice(from,to);};
for(const section of fixture.sections){
 const end=section.id==='campaign_search'?'    endlessGoal(dt) {':section.end;
 const body=cut(html,section.start,end).replace("        if(mode==='endless')return this.endlessGoal(dt);\n",'');
 assert.equal(createHash('sha256').update(body).digest('hex'),section.sha256,'Preserve accepted '+section.id);
}
if(process.env.CF_CP2R_BASELINE){
const before=readFileSync(resolve(baseline,'chargefront.html'),'utf8').replaceAll('\r\n','\n');
assert.equal(cut(html,'    perceive(dt) {','    knownGoal(dt) {'),cut(before,'    perceive(dt) {','    knownGoal(dt) {'),'Accepted perception unchanged');
assert.equal(cut(html,'    knownGoal(dt) {','    endlessGoal(dt) {').replace("        if(mode==='endless')return this.endlessGoal(dt);\n",''),cut(before,'    knownGoal(dt) {','    updateAttack(dt,victim,reach) {'),'Campaign lost-contact code remains exact');
assert.equal(cut(html,'    updateAttack(dt,victim,reach) {','    setSpawnScale(scale)'),cut(before,'    updateAttack(dt,victim,reach) {','    setSpawnScale(scale)'),'Attack wind-ups/damage untouched');
for(const [start,end] of [['function applyPickup','/* ─── crafting'],['const CRAFT_COSTS','function craftMedkit'],['function currentResultCounters','function colorStr'],['function defaultCampaignProfile','/* ─── engine settings']])assert.equal(cut(html,start,end),cut(before,start,end),'Preserve '+start);
for(const [start,end] of [['function resetEndlessRun','function placeEndlessSquad'],['function spawnEndlessGroup','function updateEndlessWaves'],['function updateEndlessWaves','function updateEndlessInteract'],['function bankDna','function updateEndless(dt)']])assert.equal(cut(html,start,end),cut(before,start,end),'Keep Endless initialization, waves and payouts: '+start);
}
const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{encoding:'utf8',input:html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]});assert.equal(syntax.status,0,syntax.stderr);
console.log('PASS CP2-R state: separate Campaign economy, exact Endless rolls/RNG, owned-magazine cost, saved reserves, relay perimeter and unchanged Campaign/attack/gate/results code',JSON.stringify(summary));
