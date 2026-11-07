import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {economyContext} from './helpers/endless-economy-model.mjs';
import '../src/progression.js';
const root='_playtest/m43/cp3/c',html=readFileSync('chargefront.html','utf8'),source=readFileSync('src/progression.js','utf8'),oldSource=readFileSync(root+'/baseline-progression.js','utf8');
const context={};vm.runInNewContext(oldSource,context);const old=context.ChargefrontProgression,P=ChargefrontProgression;
const serial=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(serial(P.reserves),serial(old.reserves));assert.deepEqual(serial(P.economy.campaign),serial(old.economy.campaign));assert.deepEqual(serial(P.scrap),serial(old.scrap));
let campaignRolls=0,introRolls=0,heavyRolls=0;
for(const type of Object.keys(P.scrap)){
 const a=old.seedRandom(3437),b=P.seedRandom(3437);for(let i=0;i<10000;i++){assert.equal(P.scrapReward(type,b,'campaign',9999,'carrier_spawn'),old.scrapReward(type,a,'campaign'));campaignRolls++;}assert.equal(a(),b());
 for(const wave of [1,5,6,11]){const a=old.seedRandom(3437),b=P.seedRandom(3437);for(let i=0;i<500;i++){assert.equal(P.scrapReward(type,b,'endless',wave,'endless_wave'),old.scrapReward(type,a,'endless'));introRolls++;}assert.equal(a(),b());}
 if(!['skitter','spitter','drone'].includes(type)){const a=old.seedRandom(3437),b=P.seedRandom(3437);for(let i=0;i<1000;i++){assert.equal(P.scrapReward(type,b,'endless',40,'endless_wave'),old.scrapReward(type,a,'endless'));heavyRolls++;}assert.equal(a(),b());}
}
assert.deepEqual(serial(P.economy.endless.lateScrap.skitter),{chance:.26,min:1,max:2});
for(const type of ['spitter','drone'])assert.deepEqual(serial(P.economy.endless.lateScrap[type]),{chance:.38,min:2,max:3});
assert.equal(P.scrapReward('skitter',()=>.1,'endless',12,'carrier_spawn'),1);assert.equal(P.scrapReward('skitter',()=>.2,'endless',12,'carrier_spawn'),0);
assert.equal(P.economy.endless.powerChance,.08);assert.equal(.32*P.economy.endless.powerChance,.0256);assert.equal(P.economy.endless.corrosiveBonus,.10);
const rates={ordinary:.32*.08,refinery:.32*(.08+.08),rainBefore:.32*(.08+.22),rainAfter:.32*(.08+.10),rainRefineryBefore:.32*(.08+.22+.08),rainRefineryAfter:.32*(.08+.10+.08)};
for(const sync of [1,1.5])for(let from=0;from<100;from++)for(const span of [1,2,7,21]){
 const batch=P.endlessDnaReward(from,from+span,sync),sum={scrap:0,cells:0};for(let ms=from;ms<from+span;ms++){const r=P.endlessDnaReward(ms,ms+1,sync);sum.scrap+=r.scrap;sum.cells+=r.cells;}assert.deepEqual(batch,sum,'Bank size cannot multiply or skip rewards');
}
for(let ms=1;ms<=6;ms++)assert.equal(P.endlessDnaReward(ms-1,ms).scrap,6+2*ms);
assert.equal(P.endlessDnaReward(6,7).scrap,18);assert.equal(P.endlessDnaReward(17,18).scrap,18);assert.equal(P.endlessDnaReward(18,19).scrap,12);assert.equal(P.endlessDnaReward(900,901).scrap,12);
for(let ms=1;ms<=30;ms++)assert.equal(P.endlessDnaReward(ms-1,ms).cells,[2,8,14,20,26].includes(ms)?1:0);
assert.deepEqual(P.endlessDnaReward(20,20),{scrap:0,cells:0});
// CP3-C's three HTML substitutions remain exact. CP3-D/R intentionally changed
// later RNG/alarm/reserve lines, so check the CP3-C scope at its actual call
// sites instead of requiring the pre-CP3-C file to remain byte-identical.
const cBank='        const dividend = ChargefrontProgression.endlessDnaReward(oldMilestone,endlessRun.milestone,endlessRun.dnaSyncMult || 1);\n        const scrapBonus = dividend.scrap;\n        const cellBonus = dividend.cells;';
const cScrap="ChargefrontProgression.scrapReward(this.type,rewardRandom,mode,mode === 'endless' ? endlessRun.wave : 0,this.encounterSource)";
assert.equal(html.split(cBank).length-1,1,'CP3-C bank dividend call present once');
assert.equal(html.split(cScrap).length-1,1,'CP3-C wave/source reward context present once');
assert(html.includes('ChargefrontProgression.economy.endless.corrosiveBonus : 0'),'CP3-C corrosive bonus retained');
assert(!html.includes('const scrapBonus = Math.round((6 + endlessRun.milestone * 2)'));
assert(!html.includes("ChargefrontProgression.scrapReward(this.type,Math.random,mode)"));
assert(!html.includes('? 0.22 : 0'));
// Exercise actual bankDna code, not merely the new formula, including old earned
// balances and equal material/passive outcomes for bulk vs split banking.
for(const sync of [1,1.5]){
 const bulk=economyContext(html,source),split=economyContext(html,source);
 for(const ctx of [bulk,split]){ctx.c.craft.scraps=5000;ctx.c.craft.powerCells=75;ctx.m.run.dnaBanked=60;ctx.m.run.milestone=20;ctx.m.run.dnaSyncMult=sync;}
 bulk.m.run.dna=21;bulk.m.bank();for(let i=0;i<7;i++){split.m.run.dna=3;split.m.bank();}
 assert.deepEqual(serial(bulk.c.craft),serial(split.c.craft));assert.equal(bulk.m.run.milestone,split.m.run.milestone);assert.equal(bulk.c.player.maxHp,split.c.player.maxHp);assert(bulk.c.craft.scraps>=5000&&bulk.c.craft.powerCells>=75);
}
for(const file of ['src/progression.js','tests/helpers/endless-economy-model.mjs','tests/endless-economy.mjs']){const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{input:html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],encoding:'utf8'});assert.equal(syntax.status,0,syntax.stderr);
writeFileSync(root+'/state.json',JSON.stringify({passed:true,campaignRolls,introRolls,heavyRolls,rates,bankSplittingCases:800,htmlAllowedEdits:3,savedQuantities:'No clamps, migrations or rerolls; material and passive bulk/split results match'},null,2));
console.log('PASS CP3-C economy: Campaign/intro/heavy drop streams exact, staged fodder/brood rewards, power modifiers, bank batching invariant, prior balances preserved, exact CP3-C HTML call sites and syntax');
