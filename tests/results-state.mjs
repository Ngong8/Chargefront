import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
await import('../src/results.js');
const R=globalThis.ChargefrontResults,html=readFileSync('chargefront.html','utf8');
const missions=JSON.parse(JSON.stringify(vm.runInNewContext(html.slice(html.indexOf('const CAMPAIGN_MISSIONS ='),html.indexOf('const CAMPAIGN_MISSION_BY_ID'))+'; CAMPAIGN_MISSIONS')));
const rows=missions.slice(0,3).map((m,i)=>R.chapter(m,{kills:[7,9,11][i],activeSeconds:[111,222,333][i],cartridgesCrafted:i+2,medkitsCrafted:i+1},Object.fromEntries(m.optionalObjectives.map(o=>[o.id,true]))));
const input={missions,missionId:'break_contact',origin:'continue_campaign',success:true,profileComplete:true,rows,
    current:{kills:21,activeSeconds:444,cartridgesCrafted:5,medkitsCrafted:4},optional:{},mainIndex:5};
const result=R.campaign(input);
assert(!('enterEndless' in result),'Campaign payload has no direct Endless navigation');
assert.equal(result.title,'CAMPAIGN COMPLETE');assert.deepEqual(result.totals,{activeSeconds:1110,kills:48,cartridgesCrafted:14,medkitsCrafted:10});
assert.deepEqual(result.chapters.map(r=>r.optionalCount),[2,1,1,0]);assert.equal(result.stats[0].value,'18:30');
assert(Object.isFrozen(result)&&Object.isFrozen(result.stats[0]));input.current.kills=999;rows[0].kills=999;assert.equal(result.totals.kills,48);
assert.equal(R.campaign({...input,origin:'mission_select',rows:[]}).title,'MISSION 4 COMPLETE');
assert.equal(R.campaign({...input,profileComplete:false}).title,'MISSION 4 COMPLETE');
const failed=R.campaign({...input,success:false,mainIndex:2});assert.equal(failed.title,'MISSION FAILED');assert(!failed.enterEndless&&failed.replay);assert.equal(failed.chapters.at(-1).mainCompleted,2);
const legacy=R.campaign({...input,rows:[{missionId:'sample_zero',kills:11,activeSeconds:333,cartridgesCrafted:4,medkitsCrafted:3}]});
assert.equal(legacy.chapters[0].optionalCount,null);assert(legacy.scope.startsWith('Recorded'));assert(legacy.notes.some(n=>n.includes('not recorded')));
const history=R.history(missions,'break_contact',[rows[0],rows[1],{...rows[1],kills:5},{missionId:'break_contact',kills:1e6},{missionId:'unknown'},rows[2]]);
assert.deepEqual(history.map(r=>r.missionId),['dead_signal','power_through','sample_zero']);assert.equal(history[1].kills,5);
assert.equal(R.chapter(missions[0],{}, {scan_growth:true,unsupported:true}).optionalCount,1);
assert.equal(R.integer(4e9),'4,000,000,000');
for(const bad of [undefined,NaN,Infinity,-4]) {
    const e=R.endless({success:false,run:{wave:bad,waveActive:true,dnaBanked:bad,arena:{name:'TEST'}},current:{kills:bad,activeSeconds:bad,cartridgesCrafted:bad,medkitsCrafted:bad}});
    assert.equal(e.wave,0);assert.equal(e.cleared,0);assert(e.stats.every(s=>s.value==='0'||s.value==='0:00'));
}
for(const [wave,active,expected] of [[0,false,0],[1,true,0],[6,false,6],[7,true,6]]) {
    const e=R.endless({success:!active,run:{wave,waveActive:active,arena:{name:'TEST'},dnaBanked:14},current:{kills:1234,activeSeconds:3661}});
    assert.equal(e.cleared,expected);assert.equal(e.stats.find(s=>s.id==='kills').value,'1,234');assert.equal(e.stats.find(s=>s.id==='time').value,'1:01:01');
}
console.log('PASS results-state: aggregation, history, partial saves, identity, immutability, wave semantics and finite formatting');
