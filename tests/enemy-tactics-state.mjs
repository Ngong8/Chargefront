import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {resolve} from 'node:path';
import '../src/enemy-tactics.js';
const T=globalThis.ChargefrontEnemyTactics,html=readFileSync('chargefront.html','utf8');
const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{encoding:'utf8',input:html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]});assert.equal(syntax.status,0,syntax.stderr);
const actor=(x,y)=>({pos:{x,y},alive:true}),origin={x:0,y:0},current=actor(20,0),near=actor(3,0),blocked=actor(1,0);
const valid=t=>!!t?.alive,visible=t=>t!==blocked;
assert.equal(T.chooseVisible(current,[near,blocked],origin,visible,valid,true),current,'Visible committed target retained');
assert.equal(T.chooseVisible(current,[near,blocked],origin,visible,valid,false),near,'Much closer visible threat can take focus');
assert.equal(T.chooseVisible(null,[blocked],origin,visible,valid),null,'Never acquire an obstructed candidate');
current.alive=false;assert.equal(T.chooseVisible(current,[near],origin,visible,valid,true),near,'Invalid target releases commitment');
const hidden=T.engagement(T.roles.drone,origin,{x:20,y:0},20,1,false,1);assert.equal(hidden.mode,'investigate');assert.equal(hidden.x,20,'Blocked range band must advance to known position');
assert.equal(T.engagement(T.roles.spitter,origin,{x:5,y:0},25,1,true,1).mode,'withdraw');
assert.equal(T.engagement(T.roles.artillery,origin,{x:39,y:0},40,1,true,1).mode,'hold-range');
assert.equal(T.engagement(T.roles.drone,origin,{x:20,y:0},20,1,true,1).mode,'strafe');
assert.equal(T.engagement(T.roles.screecher,origin,{x:22,y:0},22,1,true,-1).mode,'orbit');
assert.equal(T.engagement(T.roles.skitter,origin,{x:15,y:0},0,2,true,1).mode,'flank');
assert.equal(T.engagement(T.roles.shielded,origin,{x:15,y:0},0,2,true,1).mode,'advance');
assert(T.roles.brute.windup>T.roles.skitter.windup);assert(Object.isFrozen(T.roles.brute));
const box={x0:4,x1:8,y0:-2,y1:2};
const clear=(a,b)=>{for(let i=0;i<=100;i++){const t=i/100,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(x>=3.55&&x<=8.45&&y>=-2.45&&y<=2.45)return false;}return true;};
const corner=T.detour(origin,{x:12,y:0},[box],clear);assert(clear(origin,corner));assert(Math.abs(corner.y)>2.45);
const repeated=T.detour(origin,{x:12,y:0},[box],clear,corner);assert.notDeepEqual(repeated,corner,'Reached corners cannot immediately reverse to themselves');
let calls=0;T.detour(origin,{x:100,y:0},Array(500).fill(box),()=>{calls++;return false;});assert(calls<=53,'Bounded 48 corners plus five escape probes');
const stats=JSON.parse(JSON.stringify(vm.runInNewContext(html.slice(html.indexOf('const ENEMY_STATS ='),html.indexOf('/* Kamikaze runner tuning'))+';ENEMY_STATS')));
assert.deepEqual(Object.values(stats).map(s=>[s.hp,s.speed,s.dmg]),[[40,10,9],[34,16.5,8],[280,5.7,30],[100,6.2,13],[72,9,14],[105,8,12],[95,7,14],[340,4.8,23],[150,12,18],[165,6,0],[190,4.5,24],[4200,3.7,40]],'Tactics do not buff base health, speed or damage');
if(process.env.CF_AI_BASELINE){
 const before=readFileSync(resolve(process.env.CF_AI_BASELINE,'edge','chargefront.html'),'utf8');
 // CP2-R authorizes separate Campaign drop generation; cp2r-state independently
 // protects exact Endless rolls and saved quantities instead of freezing both.
 for(const [start,end] of [['const CAMPAIGN_MISSIONS =','const CAMPAIGN_MISSION_BY_ID'],['function defaultCampaignProfile','/* ─── engine settings'],['function currentResultCounters','function colorStr'],['function startExtractionHoldout','function setFacilityCaptureView']]){
  const slice=text=>text.slice(text.indexOf(start),text.indexOf(end,text.indexOf(start)));assert.equal(slice(html),slice(before),'Preserve accepted '+start);
 }
 console.log('PASS accepted-source preservation: Campaign definitions, persisted gate, result rendering and defence/extraction');
}
console.log('PASS enemy tactical policies: visible targeting/commitment, roles, bounded corner search, wind-ups and unchanged base combat tuning');
