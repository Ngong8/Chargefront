import assert from 'node:assert/strict';
import '../src/progression.js';
const p=globalThis.ChargefrontProgression;
const rng1=p.seedRandom(1234),rng2=p.seedRandom(1234);for(let i=0;i<64;i++){const a=rng1();assert.equal(a,rng2());assert(a>=0&&a<1);}
assert.deepEqual(Object.values(p.reserves).map(v=>[v.player,v.squad]),[[4,3],[4,2],[4,2],[3,2]]);
for(const [type,row] of Object.entries(p.scrap)) {
    assert(row.chance>0&&row.chance<=1&&row.min<=row.max);
    let calls=0;assert.equal(p.scrapReward(type,()=>calls++?0:0),row.min);
    calls=0;assert.equal(p.scrapReward(type,()=>calls++?.999999:0),row.max);
    if(row.chance<1)assert.equal(p.scrapReward(type,()=>row.chance),0);
}
assert(p.scrap.tunneler.chance*p.scrap.tunneler.min>p.scrap.runner.chance*p.scrap.runner.max);
const checkpoint={version:4,missionId:'power_through',player:{hp:51},squad:[]};
const profile={version:4,missions:{dead_signal:{completed:true}},operation:{continuedState:checkpoint}};
const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
assert(p.write(storage,'campaign',profile,p.campaignValid));
assert(p.write(storage,'campaign',{...profile,operation:{continuedState:{...checkpoint,player:{hp:32}}}},p.campaignValid));
values.set('campaign','{broken');const recovered=p.read(storage,'campaign',p.campaignValid);
assert.equal(recovered.data.operation.continuedState.player.hp,51);assert.match(recovered.message,/backup/);
assert(p.campaignValid({...profile,version:3,operation:{continuedState:{...checkpoint,version:undefined}}})===false,'Undefined is not valid JSON; validators do not accept live objects');
const legacy=JSON.parse(JSON.stringify({...profile,version:3,operation:{continuedState:{...checkpoint,version:undefined}}}));assert(p.campaignValid(legacy));
assert(!p.campaignValid({...profile,version:99}));assert(!p.checkpointValid({...checkpoint,player:{hp:NaN}}));
assert(!p.write({getItem:()=>null,setItem:()=>{throw Error('quota');}},'x',profile,p.campaignValid));
assert(p.remove(storage,'campaign'));assert.equal(values.size,0);
const actor={maxHp:130,hp:45,maxShield:104,shield:12,reserve:3,abilityCd:7.5,downed:true,moveBlend:1,mesh:{}};
const saved=p.actorSnapshot(actor);assert(!('mesh' in saved)&&!('moveBlend' in saved));
const restored={maxHp:100,hp:100,maxShield:100,shield:100};p.restoreActor(restored,saved);
assert.equal(restored.maxHp,130);assert.equal(restored.hp,45);assert.equal(restored.abilityCd,7.5);assert(restored.downed);
const completed={version:4,campaignComplete:true,missions:{dead_signal:{completed:true},power_through:{completed:true},sample_zero:{completed:true},break_contact:{completed:true}}};
for(const empty of [null,{},undefined]){assert.equal(p.campaignCompleted(empty),false);assert.equal(p.campaignCleared(empty),false);}
assert(p.campaignCompleted(completed));
for(const campaignComplete of [false,undefined]) {
    const derived=JSON.parse(JSON.stringify({...completed,campaignComplete}));assert(p.campaignCompleted(derived),'All four persisted completed records derive the legacy flag');
}
assert(!p.campaignCompleted({version:4,missions:Object.fromEntries(Object.keys(completed.missions).map(id=>[id,{unlocked:true,completed:false}]))}));
assert(!p.campaignCompleted({...completed,missions:{dead_signal:{completed:true},break_contact:{unlocked:true}}}));
assert(!p.campaignCompleted({...completed,version:99}));
assert(!p.campaignCompleted({version:2,campaignComplete:true,missions:{dead_signal:{completed:true},power_through:{completed:true}}}),'Old two-mission completion alone does not certify the four-mission Campaign');
assert(p.campaignCompleted({version:3,campaignComplete:true,missions:{break_contact:{completed:true}}}),'Preserve the canonical historical full-completion record even if earlier detail is absent');
assert(!p.campaignCompleted({...completed,operation:{continuedState:{missionId:'unknown',player:{hp:5}}}}));
const freshReplay={version:4,campaignComplete:false,completionRecord:{...p.completionRecord},missions:{dead_signal:{unlocked:true,completed:false}}};
assert(p.campaignCleared(freshReplay));assert(!p.campaignCompleted(freshReplay),'Earned unlock does not mark the new Campaign complete');
assert(!p.campaignCleared({...freshReplay,completionRecord:{version:1,finalMission:'sample_zero',completed:true}}));
assert(!p.campaignCleared({...freshReplay,completionRecord:{...p.completionRecord,completed:false}}));
console.log('PASS Campaign completion authority: canonical flag/final record, all-four legacy derivation, locked replay entries and invalid/ambiguous saves');
console.log('PASS progression state: reserves, bounded difficulty drops, atomic replacement/backup, legacy validation, quota failure, durable actor ownership');
