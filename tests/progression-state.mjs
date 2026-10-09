import assert from 'node:assert/strict';
import '../src/progression.js';
const p=globalThis.ChargefrontProgression;
const rng1=p.seedRandom(1234),rng2=p.seedRandom(1234);for(let i=0;i<64;i++){const a=rng1();assert.equal(a,rng2());assert(a>=0&&a<1);}
assert.deepEqual(Object.values(p.reserves).map(v=>[v.player,v.squad]),[[6,3],[5,2],[4,2],[3,2]]);
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
console.log('PASS progression state: reserves, bounded difficulty drops, atomic replacement/backup, legacy validation, quota failure, durable actor ownership');
