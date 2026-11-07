// Ledger model, not an AI/playthrough simulator. Executes the shipped reward,
// upgrade, banking and crafting functions against CP3-B's exact seeded rosters.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import '../../src/combat.js';
import '../../src/endless-director.js';
export const cut=(s,a,b)=>{const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i,a);return s.slice(i,j);};
export function economyContext(html,progression,seed=430012,loadout={}) {
 const math=Object.create(Math),pending=[];let ledger=null;
 const vec2=(x=0,y=0)=>({x,y,copy(){return vec2(this.x,this.y);},add(v){this.x+=v.x;this.y+=v.y;return this;}});
 const config=ChargefrontCombat.endlessConfig(loadout),combat=ChargefrontCombat.create();combat.reset({loadout:config.player,cartridges:8});
 const player={maxHp:100,hp:100,maxShield:100,shield:100,grenades:3,speed:5.2,staminaDrainMult:1,critChance:0,critMult:2,grenadeDmgMult:1,reloadMult:1,dmgTakenMult:1};
 Object.defineProperty(player,'weapon',{get:()=>combat.active});
 const c={Math:math,ChargefrontCombat,playerCombat:combat,player,squadMembers:[],mode:'endless',craft:{scraps:0,powerCells:0,medkits:3},
  cacheFound:0,totalAmmoCrafted:0,totalMedkitsCrafted:0,endlessTurret:null,endlessUpgradeOffers:[],upgradeMenu:false,
  TAU:Math.PI*2,ENDLESS_RELAY_POS:vec2(400,400),LJS:{vec2,rgb:()=>null},rand:(a=1,b=0)=>b+math.random()*(a-b),randInt:(a,b=0)=>Math.floor(b+math.random()*(a-b)),
  notify(){},playSnd(){},playFileSfx(){},saveEndlessBoundary(){},sfx:{vial:0,pickup:0,command:0},
  buildEndlessTurret(){c.endlessTurret={};},
  spawnPickup(pos,kind,quantity=0){
   if(pending.length>=160){if(ledger)ledger.capRejected++;return;}
   // The model resolves the existing 2..4 generic supply-drop bundle once, so
   // generated/collected totals can be compared. Runtime saves remain untouched.
   const n=kind==='scrap'?(quantity||c.randInt(2,5)):1;
   pending.push({kind,quantity:n,source:c.rewardSource||'enemy',age:0});
   if(ledger){ledger.generated[kind]=(ledger.generated[kind]||0)+n;ledger.bySource[c.rewardSource||'enemy']=(ledger.bySource[c.rewardSource||'enemy']||0)+(kind==='scrap'?n:0);}
  },
 };
 vm.createContext(c);vm.runInContext(progression,c);math.random=c.ChargefrontProgression.seedRandom(seed);
 const scripts=[
  cut(html,'const endlessRun =','let endlessRelay ='),
  cut(html,'const ENEMY_STATS =','/* Kamikaze runner'),
  cut(html,'const SQUAD_DEFS =','const SQUAD_AI_MODE'),
  cut(html,'const ENDLESS_DNA_LADDER =','/* ═══ RELAY — tiered purchasable'),
  cut(html,'const ENDLESS_RELAY_UPGRADES =','function endlessRarityColor'),
  cut(html,'function upgradeCount','/* relay auto-turret'),
  cut(html,'function refreshEndlessUpgradeOffers','function openEndlessUpgradeMenu'),
  cut(html,'function buyEndlessUpgrade','/* ── waves ── */'),
  cut(html,'function bankDna','/* per-frame endless update'),
  cut(html,'function applyPickup','/* ─── crafting'),
  cut(html,'const CRAFT_COSTS','let deployT ='),
 ];
 for(const code of scripts)vm.runInContext(code,c);
 const drops=cut(html,'        const scrapAmount =','    detonate()').replace(/\s*}\s*$/,'');
 vm.runInContext('function economyDeath(type){(function(){'+drops+'}).call({type,pos:LJS.vec2(),encounterSource:rewardSource==="brood"?"carrier_spawn":"endless_wave"});}',c);
 const refresh=cut(html,'    /* relay upgrades that refresh','    saveEndlessBoundary();');vm.runInContext('function economyRefresh(){'+refresh+'}',c);
 const clear=cut(html,'        /* COMBAT MEDICS (relay)','/* ── interact (E)');vm.runInContext('function economyClear(){if(true){'+clear,c);
 vm.runInContext('this.model={run:endlessRun,stats:ENEMY_STATS,baseSquad:SQUAD_DEFS,upgrades:ENDLESS_RELAY_UPGRADES,mutators:ENDLESS_MUTATORS,bank:bankDna,pickup:applyPickup,ammo:craftAmmo,medkit:craftMedkit,useMedkit,share:giveSquadAmmo,grenade:craftGrenade,offers:refreshEndlessUpgradeOffers,buy:buyEndlessUpgrade,refresh:economyRefresh,clear:economyClear,drops:economyDeath,ammoCost,medkitCost,cap:reserveCap,get offersNow(){return endlessUpgradeOffers;}};',c);
 const m=c.model;
 c.squadMembers.push(...m.baseSquad.map((base,i)=>{const def=ChargefrontCombat.squadLoadout(base,config.squad[['rook','vex','kade'][i]]);return {def,maxHp:def.hp,hp:def.hp,maxShield:Math.round(def.hp*.8),shield:Math.round(def.hp*.8),mag:def.magSize,magSize:def.magSize,reserve:def.reserve,dmgMult:1,rateMult:1,critChance:0,critMult:2,reloadMult:1,speedMult:1,dmgTakenMult:1};}));
 return {c,m,pending,config,setLedger(value){ledger=value;}};
}
const add=(a,b)=>{for(const [k,v] of Object.entries(b))a[k]=(a[k]||0)+v;};
export const scenarios=[
 {id:'balanced',collect:.65,revisit:.15,accuracy:.65,broods:1.5,mutator:'mixed',bank:'wave',player:{slot1:'rifle',slot2:'scatter'}},
 {id:'rifle-squad',collect:.65,revisit:.15,accuracy:.60,broods:1.5,mutator:'mixed',bank:'wave',player:{slot1:'rifle',slot2:'plasma'},squad:{rook:{weapon:'rifle'},vex:{weapon:'rifle'},kade:{weapon:'rifle'}}},
 {id:'efficient-scavenger',collect:.90,revisit:.30,accuracy:.85,broods:2.5,mutator:'mixed',bank:'wave',player:{slot1:'arc',slot2:'plasma'},squad:{rook:{weapon:'plasma'},vex:{weapon:'arc'},kade:{weapon:'arc'}}},
 {id:'corrosive-refinery',collect:.85,revisit:.25,accuracy:.75,broods:2,mutator:'corrosive',bank:'split',player:{slot1:'rifle',slot2:'arc'}},
 {id:'low-collection',collect:.40,revisit:.08,accuracy:.60,broods:.5,mutator:'mixed',bank:'wave',player:{slot1:'rifle',slot2:'scatter'}},
];
export function simulate(html,progression,seed,scenario,waves=40) {
 const ctx=economyContext(html,progression,seed,scenario),{c,m,pending}=ctx,P=c.ChargefrontProgression;
 const route=P.seedRandom(seed^0xc011ec7),fight=P.seedRandom(seed^0xa660),broodRandom=P.seedRandom(seed^0xb00d),mutatorRandom=P.seedRandom(seed^0x437);
 const rows=[],sum={generated:{scrap:0,power:0,dna:0,grenade:0},collected:{scrap:0,power:0,dna:0,grenade:0},bankScrap:0,bankCells:0,clearScrap:0,clearCells:0,ammoSpent:0,medSpent:0,upgradeScrap:0,upgradeCells:0,grenadeCells:0,reloads:0,unfundedReloads:0,shortfallScrap:0};
 let healthDebt=0,previousMutator=null;
 function collect(row,pickup){const before={s:c.craft.scraps,p:c.craft.powerCells};m.pickup(pickup.kind,pickup.quantity);row.collected[pickup.kind]=(row.collected[pickup.kind]||0)+pickup.quantity;return before;}
 function loot(row,revisit=false){for(let i=pending.length-1;i>=0;i--){const p=pending[i];if(!revisit&&p.age)continue;const chance=revisit?scenario.revisit:scenario.collect;if(route()<chance){collect(row,p);pending.splice(i,1);}else p.age=1;}}
 function reload(actor,row){
  const squad=actor!==c.player;if((squad?actor.reserve:c.playerCombat.cartridges)<=0){
   if(c.playerCombat.cartridges<=0){const cost=m.ammoCost();if(c.craft.scraps<cost){row.unfundedReloads++;row.shortfallScrap+=cost-c.craft.scraps;c.craft.scraps=cost;}const before=c.craft.scraps;m.ammo();row.ammoSpent+=before-c.craft.scraps;}
   if(squad)m.share(actor);
  }
  if(squad){actor.reserve--;actor.mag=actor.magSize;}
  else{c.playerCombat.reload(c.player.reloadMult);c.playerCombat.tick(c.playerCombat.active.reloadDuration);}
  row.reloads++;
 }
 for(let wave=1;wave<=waves;wave++){
  const row={wave,generated:{scrap:0,power:0,dna:0,grenade:0},collected:{scrap:0,power:0,dna:0,grenade:0},bySource:{},capRejected:0,ammoSpent:0,medSpent:0,upgradeScrap:0,upgradeCells:0,grenadeCells:0,reloads:0,unfundedReloads:0,shortfallScrap:0,bankScrap:0,bankCells:0,clearScrap:0,clearCells:0,broodKills:0};ctx.setLedger(row);m.run.wave=wave;
  m.run.mutator=scenario.mutator==='corrosive'&&wave>=6?m.mutators.find(x=>x.id==='corrosive'):ChargefrontCombat.chooseMutator(wave,previousMutator,m.mutators,mutatorRandom);previousMutator=m.run.mutator?.id||null;row.mutator=previousMutator;
  m.refresh();const roster=[...ChargefrontEndlessDirector.plan(wave,seed).queue].map(type=>({type,source:'enemy'}));
  for(const entry of roster){
   if(entry.type==='carrier'){const children=Math.floor(scenario.broods)+(broodRandom()<scenario.broods%1?1:0);for(let j=0;j<children;j++)roster.push({type:'skitter',source:'brood'});row.broodKills+=children;}
   const n=fight(),actor=n<.4?c.player:c.squadMembers[Math.min(2,Math.floor((n-.4)/.2))];
   if(actor===c.player){const secondary=['brute','carrier','boss'].includes(entry.type)&&['plasma','arc'].includes(scenario.player.slot2);c.playerCombat.activeId=secondary?scenario.player.slot2:scenario.player.slot1;}
   const w=actor===c.player?actor.weapon:actor.def.weaponDefinition,base=m.stats[entry.type];
   const hp=Math.round(base.hp*(entry.type==='boss'?1+wave*.02:1+wave*.05))*(row.mutator==='armored'?1.3:1)+(base.shield||0);
   let damage=w.dmg*(actor===c.player?w.dmgMult:actor.dmgMult*.48)*(1+actor.critChance*(actor.critMult-1));
   if(row.mutator==='blackout'||row.mutator==='storm'&&w.id==='rifle')damage*=1.2;
   if(['brute','boss'].includes(entry.type))damage*=1+(m.run.hunterMult||0);
   const hit=scenario.accuracy,contact=w.kind==='scatter'?8*.55:w.kind==='arc'?1.3:w.kind==='plasma'?1.2:1;
   const shots=Math.ceil(hp/Math.max(1,damage*hit*contact));row.shots=(row.shots||0)+shots;
   for(let j=0;j<shots;j++){if((actor===c.player?actor.weapon.mag:actor.mag)<=0)reload(actor,row);if(actor===c.player)actor.weapon.mag--;else actor.mag--;}
   c.rewardSource=entry.source;m.drops(entry.type);loot(row);
  }
  // Revisit missed drops once in intermission; this is an estimate, not a claim
  // that the AI or player automatically collects loot during gameplay.
  loot(row,true);
  const bankBefore={s:c.craft.scraps,p:c.craft.powerCells};
  if(scenario.bank==='split'){const dna=m.run.dna;m.run.dna=0;let remaining=dna;while(remaining){const n=Math.min(3,remaining);m.run.dna=n;m.bank();remaining-=n;}}
  else if(m.run.dna)m.bank();
  row.bankScrap=c.craft.scraps-bankBefore.s;row.bankCells=c.craft.powerCells-bankBefore.p;
  c.rewardSource='supply';const clearBefore={s:c.craft.scraps,p:c.craft.powerCells};m.clear();row.clearScrap=c.craft.scraps-clearBefore.s;row.clearCells=c.craft.powerCells-clearBefore.p;loot(row);
  healthDebt+=wave<6?.25:wave<16?.5:1;while(healthDebt>=1){healthDebt--;if(c.craft.medkits){c.player.hp=Math.max(1,c.player.maxHp-50);m.useMedkit();}if(c.craft.medkits<3&&c.craft.scraps>=m.medkitCost()){const before=c.craft.scraps;m.medkit();row.medSpent+=before-c.craft.scraps;}}
  if(wave%2===0){c.player.grenades=Math.max(0,c.player.grenades-1);if(c.player.grenades<2&&c.craft.powerCells){const before=c.craft.powerCells;m.grenade();row.grenadeCells+=before-c.craft.powerCells;}}
  m.offers();for(let attempt=0;attempt<3;attempt++){
   const offers=m.offersNow,rank=u=>['r_dmg','r_ammo','r_craft','r_field','r_super','r_cell','r_dnasync'].includes(u.id)?0:1;
   const ammoBuffer=Math.max(12,Math.ceil(row.reloads*m.ammoCost()*1.5));
   const candidate=offers.map((u,i)=>({u,i})).filter(({u})=>!u.cost.s||c.craft.scraps>=u.cost.s+ammoBuffer).filter(({u})=>!u.cost.p||c.craft.powerCells>=u.cost.p+1).sort((a,b)=>rank(a.u)-rank(b.u))[0];if(!candidate)break;
   const before={s:c.craft.scraps,p:c.craft.powerCells};m.buy(candidate.i);row.upgradeScrap+=before.s-c.craft.scraps;row.upgradeCells+=before.p-c.craft.powerCells;
  }
  row.inventory={scrap:c.craft.scraps,cells:c.craft.powerCells,cartridges:c.playerCombat.cartridges,medkits:c.craft.medkits,grenades:c.player.grenades,uncollected:pending.length,milestone:m.run.milestone};
  row.netScrap=(wave===1?row.inventory.scrap:row.inventory.scrap-rows.at(-1).inventory.scrap)-row.shortfallScrap;
  rows.push(row);add(sum.generated,row.generated);add(sum.collected,row.collected);
  for(const k of Object.keys(sum))if(typeof sum[k]==='number')sum[k]+=row[k]||0;
 }
 return {seed,scenario:scenario.id,assumptions:{collection:scenario.collect,revisit:scenario.revisit,accuracy:scenario.accuracy,broodsPerCarrier:scenario.broods,bank:scenario.bank,mutators:scenario.mutator},sum,final:rows.at(-1).inventory,rows};
}
