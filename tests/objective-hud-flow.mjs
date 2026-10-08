// Guided UI/browser flow: fixed slots, objective retirement, optional discovery, real E interactions.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium,firefox}=await import(process.env.PLAYWRIGHT_PACKAGE?pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href:'playwright');
const ff=process.argv.includes('firefox'),name=ff?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m41/hud-flow');mkdirSync(out,{recursive:true});
const browser=await(ff?firefox:chromium).launch(ff?{headless:true}:{headless:!process.argv.includes('--headed'),executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],consoles=[],results={};
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoles.push(m.text());});
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
const hud=()=>page.evaluate(()=>__cf.inspectHUD());
const snapshot=()=>page.evaluate(()=>__cf.objectiveHUDInfo());
const capture=async label=>{if(!ff)await page.screenshot({path:resolve(out,label+'.png')});};
const discovered=()=>page.evaluate(()=>__cf.discoveredInfo());
const near=async(pos)=>page.evaluate(({x,y})=>{const c=__cf;c.player.pos.x=x;c.player.pos.y=y;c.player.zPos=c.terrainHeight(x,y);for(const m of c.squad){m.pos.x=x+1;m.pos.y=y;m.z=c.terrainHeight(x+1,y);}c.advanceObjectiveHUD(0);},pos);
try{
 await page.goto(url.href);await page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
 await page.locator('#btn-start').click();await page.locator('#btn-sound-start').click();await page.waitForFunction(()=>__cf.intro&&!__cf.intro.prewarmPending,undefined,{timeout:120000});await page.keyboard.press('Space');
 await page.evaluate(()=>{__cf.setNoSpawn(true);__cf.setNoAggro(true);__cf.clearTestEnemies();__cf.setInvulnerable(true);document.getElementById('cf-perf-diagnostics').style.display='none';});
 await page.waitForFunction(()=>__cf.phaseName==='M1_MOVE_FAC');await page.waitForTimeout(4200);
 await page.evaluate(()=>{__cf.combat.weapons.rifle.mag=42;__cf.combat.weapons.scatter.mag=20;});
 // 1) Fixed weapon rows by slot; emphasis swaps only.
 const positions=[];
 for(const [key,index] of [['1',0],['2',1],['q',0],['q',1]]){
  await page.keyboard.press(key);await page.waitForFunction(i=>__cf.player.weaponIndex===i&&!__cf.player.swapT,index);
  const h=await hud(),rows=h.text.filter(t=>/^\[[12]\] (BUL-117|CRW-8)$/.test(t.value));
  assert.deepEqual(rows.map(t=>t.value),['[1] BUL-117','[2] CRW-8']);assert(rows[index].size>rows[1-index].size);assert(rows[index].color[0]>rows[1-index].color[0]);
  assert(h.text.some(t=>t.value==='42 / 50'&&t.y===rows[0].y));assert(h.text.some(t=>t.value==='20 / 20'&&t.y===rows[1].y));positions.push(rows.map(t=>t.y));
 }
 assert(positions.every(p=>JSON.stringify(p)===JSON.stringify(positions[0])));results.fixedRows=positions;
 // 2) Vitals spacing + right alignment; optionals start hidden.
 await page.evaluate(()=>{__cf.pause(true);for(const m of __cf.squad){m.hp=m.maxHp*.5;m.shield=m.maxShield*.3;m.abilityCd=7;}__cf.squad[2].downed=true;});
 const initial=await hud(),operators=initial.text.filter(t=>['ROOK','VEX','KADE'].includes(t.value)),abilities=initial.text.filter(t=>/^\[[ZXY]\]/.test(t.value));
 for(let i=0;i<2;i++)assert(operators[i+1].y-abilities[i].y>=16);
 assert.equal(initial.icons.length,9);assert(initial.text.some(t=>t.value==='DOWN'));results.spacing=operators.map((t,i)=>({name:t.value,y:t.y,abilityY:abilities[i].y}));
 const main=initial.text.find(t=>t.value==='MAIN OBJECTIVE');assert(main.x===1264&&main.align==='right'&&main.y>=170);
 assert(!initial.text.some(t=>t.value==='OPTIONAL'),'Optional objectives start hidden');
 results.initial=await snapshot();await capture('02-fixed-slots-vitals-objectives');
 // 3) Main phase replacement: strike-through, hold, fade, removal.
 await page.evaluate(()=>{__cf.setPhase(15);__cf.advanceObjectiveHUD(0);__cf.advanceObjectiveHUD(.4);});
 const held=await hud();assert(held.strikes.length>0&&held.strikes.every(s=>s.alpha===1));
 const nextY=h=>h.text.find(t=>t.x===1264&&t.value.startsWith('Search the')).y;
 const beforeY=nextY(held);results.held=await snapshot();await capture('03-objective-strike');
 await page.evaluate(()=>__cf.advanceObjectiveHUD(.35));const faded=await hud();assert(faded.strikes.some(s=>s.alpha>0&&s.alpha<1));assert(nextY(faded)<beforeY);
 assert(faded.text.some(t=>t.x===1264&&t.alpha>0&&t.alpha<1&&t.outlineAlpha<=t.alpha),'Completed text outlines fade with the glyphs');
 results.fading=await snapshot();await capture('04-objective-fade');
 await page.evaluate(()=>__cf.advanceObjectiveHUD(.5));const settled=await hud();assert.equal(settled.strikes.length,0);assert(nextY(settled)<nextY(faded));assert.equal((await snapshot()).filter(r=>r.group==='main').length,1);
 // 4) Main interaction via real E.
 await page.evaluate(()=>{__cf.squad[2].downed=false;__cf.debugTeleport();__cf.pause(false);});
 await page.keyboard.down('e');await page.waitForFunction(()=>__cf.phaseName==='M1_RESTORE_POWER',undefined,{timeout:10000});await page.keyboard.up('e');
 assert((await snapshot()).some(r=>r.group==='main'&&r.completed&&r.text.startsWith('Search')));
 // 5) Discovery: hidden while far, revealed by proximity; skips are allowed.
 const scan=await page.evaluate(()=>{const p=__cf.campaignContent.scan.pos;return{x:p.x,y:p.y};});
 const cell=await page.evaluate(()=>{const p=__cf.campaignContent.cell.pos;return{x:p.x,y:p.y};});
 const far=await page.evaluate(()=>({x:400,y:200}));
 // Reset discovery and move everyone far in one step so no frame re-discovers in between.
 await page.evaluate(({x,y})=>{const c=__cf;c.setOptionalDiscovered('scan_growth',false);c.setOptionalDiscovered('portable_cell',false);
  c.player.pos.x=x;c.player.pos.y=y;c.player.zPos=c.terrainHeight(x,y);
  for(const m of c.squad){m.pos.x=x+1;m.pos.y=y;m.z=c.terrainHeight(x+1,y);}c.advanceObjectiveHUD(0);},far);
 await page.evaluate(()=>__cf.advanceObjectiveHUD(.1));
 assert(!(await discovered()).scan_growth&&!(await discovered()).portable_cell,'Far optionals stay hidden');
 await near({x:cell.x+30,y:cell.y});await page.evaluate(()=>__cf.advanceObjectiveHUD(.1));
 const d1=await discovered();assert(d1.portable_cell&&!d1.scan_growth,'Later optional discovered independently of the skipped earlier one');
 const h1=await hud();assert(h1.text.some(t=>t.value==='OPTIONAL')&&h1.text.some(t=>t.value==='Recover the Auxiliary Field Cell'));
 results.skipDiscover=d1;await capture('05a-optional-discovery-skip');
 await near({x:scan.x+30,y:scan.y});await page.evaluate(()=>__cf.advanceObjectiveHUD(.1));
 const d2=await discovered();assert(d2.scan_growth&&d2.portable_cell,'Both optionals discovered independently');
 const h2=await hud();assert(h2.text.some(t=>t.value==='Scan Infested Growth'));
 await capture('05b-optional-both-discovered');
 await near(far);await page.evaluate(()=>__cf.advanceObjectiveHUD(.1));assert((await discovered()).scan_growth,'Discovery persists when leaving');
 // 6) Complete the discovered scan via real E -> strike/fade.
 await page.evaluate(()=>{const c=__cf,p=c.campaignContent.scan.pos;c.campaignContent.scanThreatTriggered=true;c.move(p.x-c.player.pos.x,p.y+2-c.player.pos.y);});
 await page.keyboard.down('e');await page.waitForFunction(()=>__cf.campaignRun.optional.scan_growth,undefined,{timeout:10000});await page.keyboard.up('e');await page.evaluate(()=>__cf.pause(true));
 assert((await snapshot()).some(r=>r.group==='optional'&&r.id==='scan_growth'&&r.completed));assert((await hud()).strikes.length>0);
 await page.evaluate(()=>__cf.advanceObjectiveHUD(1.2));assert(!(await snapshot()).some(r=>r.id==='scan_growth'));
 assert((await snapshot()).some(r=>r.id==='portable_cell'&&!r.completed));
 await page.evaluate(()=>{__cf.campaignRun.optional.portable_cell=true;__cf.advanceObjectiveHUD(0);});
 assert((await snapshot()).some(r=>r.id==='portable_cell'&&r.completed));await page.evaluate(()=>__cf.advanceObjectiveHUD(1.2));
 // 7) Checkpoint persists discovery.
 await page.evaluate(()=>{__cf.setOptionalDiscovered('portable_cell',false);__cf.setOptionalDiscovered('scan_growth',true);__cf.checkpoint();});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.cf_campaign_v1||'{}'));
 results.checkpointDiscovery=(saved.operation&&saved.operation.continuedState&&saved.operation.continuedState.discovered)||null;
 assert(results.checkpointDiscovery&&results.checkpointDiscovery.scan_growth===true&&results.checkpointDiscovery.portable_cell!==true,'Checkpoint serializes discovery');
 await page.evaluate(()=>{__cf.setOptionalDiscovered('scan_growth',false);__cf.startMission('dead_signal','continue_campaign');__cf.advanceObjectiveHUD(0);});
 const restored=await discovered();assert(restored.scan_growth===true&&restored.portable_cell!==true,'Continue preserves discovery');
 results.restoredDiscovery=restored;
 // 8) Mission transition clears irrelevant discovery; new mission starts with none.
 await page.evaluate(()=>{__cf.completeMission();__cf.advanceObjectiveHUD(0);});
 assert(Object.keys(await discovered()).length===0,'Mission transition clears discovery');
 await page.evaluate(()=>__cf.advanceObjectiveHUD(1.2));assert((await snapshot()).every(r=>!r.completed));
 // 9) M2 survey: hidden until discovered + active; progress updates in place; completion fades.
 await page.evaluate(()=>{__cf.campaignContent.escort.state='escorting';__cf.advanceObjectiveHUD(0);});
 assert(!(await snapshot()).some(r=>r.id==='survey'),'Survey hidden before discovery');
 await page.evaluate(()=>{__cf.setOptionalDiscovered('survey',true);__cf.advanceObjectiveHUD(0);});
 assert((await snapshot()).some(r=>r.id==='survey'&&!r.completed));
 results.progress=await page.evaluate(()=>{
  const c=__cf,current=()=>c.objectiveHUDInfo().filter(r=>r.id==='survey'&&!r.completed)[0];
  const hpOff=current().text;
  c.campaignContent.escort.hp=c.campaignContent.escort.maxHp*.5;c.advanceObjectiveHUD(0);
  const hpOn=current().text,completedAfterHp=c.objectiveHUDInfo().filter(r=>r.id==='survey'&&r.completed).length;
  c.campaignContent.escort.state='disabled';c.campaignContent.escort.emergencyRepairT=4;c.advanceObjectiveHUD(0);
  c.campaignContent.escort.emergencyRepairT=3;c.advanceObjectiveHUD(0);
  return {hpOff,hpOn,completedAfterHp,repair:current().text};
 });
 assert.notEqual(results.progress.hpOff,results.progress.hpOn);assert(results.progress.hpOn.includes('50%'),'Escort HP updates progress in place');
 assert.equal(results.progress.completedAfterHp,0,'Escort HP change is not completion');assert(results.progress.repair.includes('repair'),'Repair countdown is progress in place');
 await page.evaluate(()=>{__cf.campaignContent.escort.state='complete';__cf.advanceObjectiveHUD(0);__cf.advanceObjectiveHUD(1.2);});assert(!(await snapshot()).some(r=>r.id==='survey'));
 // 10) M3 turret gated by discovery.
 await page.evaluate(()=>{__cf.completeMission();__cf.advanceObjectiveHUD(0);});assert(!(await snapshot()).some(r=>r.id==='turret'),'Turret hidden until discovered');
 await page.evaluate(()=>{__cf.setOptionalDiscovered('turret',true);__cf.advanceObjectiveHUD(0);});assert((await snapshot()).some(r=>r.id==='turret'&&!r.completed));
 await page.evaluate(()=>{__cf.restoreLabTurret();__cf.advanceObjectiveHUD(0);});assert((await snapshot()).some(r=>r.id==='turret'&&r.completed));
 await page.evaluate(()=>__cf.advanceObjectiveHUD(1.2));assert(!(await snapshot()).some(r=>r.id==='turret'));
 // 11) M4 has no campaign optionals.
 await page.evaluate(()=>{__cf.completeMission();__cf.advanceObjectiveHUD(0);});results.mission4=await snapshot();
 assert(results.mission4.some(r=>r.group==='main'&&r.completed));assert(results.mission4.some(r=>r.key.startsWith('break_contact:')&&!r.completed));
 assert(!results.mission4.some(r=>r.group==='optional'),'M4 has no optional objectives');
 await page.evaluate(()=>__cf.advanceObjectiveHUD(1.2));assert((await snapshot()).every(r=>!r.completed));
 // 12) Layout at desktop resolutions.
 await page.evaluate(()=>{__cf.startMission('power_through','mission_select');__cf.pause(true);__cf.setPhase(18);__cf.campaignContent.escort.state='escorting';__cf.setOptionalDiscovered('survey',true);__cf.advanceObjectiveHUD(0);__cf.advanceObjectiveHUD(1.2);});
 results.layouts=[];
 for(const viewport of [{width:1280,height:720},{width:1366,height:768},{width:1920,height:1080}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);const h=await hud(),x=viewport.width-16;
  assert(h.text.find(t=>t.value==='MAIN OBJECTIVE').x===x);const right=h.text.filter(t=>t.x===x);assert(right.length>=4);
  assert(right.every(t=>t.y>=170&&t.y<viewport.height-80));assert(right.every(t=>t.align==='right'));
  const bounds=await page.evaluate(rows=>{const c=document.createElement('canvas').getContext('2d');return rows.map(t=>{c.font=t.size+'px "Glitch Slap"';const w=c.measureText(t.value).width;return {right:t.x,left:t.x-w};});},right);
  assert(bounds.every(b=>b.right<=viewport.width-14&&b.left>=viewport.width-316));results.layouts.push({viewport,lines:right.length});
 }
 await page.evaluate(()=>{__cf.setPhase(3);__cf.relays[0].powering=true;__cf.relays[0].progress=.2;__cf.advanceObjectiveHUD(0);__cf.advanceObjectiveHUD(1.2);});
 const progress1=(await hud()).bars.find(b=>b.width===300);assert.equal(progress1.progress,.2);
 await page.evaluate(()=>{__cf.relays[0].progress=.6;__cf.advanceObjectiveHUD(0);});const progress2=(await hud()).bars.find(b=>b.width===300);assert.equal(progress2.progress,.6);assert((await snapshot()).every(r=>!r.completed));
 results.relayProgress=[progress1.progress,progress2.progress];await page.evaluate(()=>{__cf.relays[0].powering=false;});
 await page.evaluate(()=>{__cf.pause(false);__cf.clearTestEnemies();__cfPerf.reset();});await page.waitForTimeout(1200);
 results.counters=await page.evaluate(()=>__cfPerf.summary().counters);for(const key of ['materialsCreated','geometriesCreated','linkProgram','buildFacility','buildTerrain'])assert.equal(results.counters[key]||0,0);
 assert.deepEqual(errors,[]);assert.deepEqual(consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);results.passed=true;
 console.log('PASS objective HUD flow',name,JSON.stringify({spacing:results.spacing,discovery:results.skipDiscover,layouts:results.layouts}));
}finally{await page.keyboard.up('e').catch(()=>{});writeFileSync(resolve(out,'objectives-'+name+'.json'),JSON.stringify({results,errors,consoles},null,2));await browser.close();}
