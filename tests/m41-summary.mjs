// Produce a concise auditable receipt from successful real test artifacts.
// Does not rerun tests or label missing/failing artifacts as a pass.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve('_playtest/m41');
const read = path => JSON.parse(readFileSync(resolve(root,path),'utf8'));
const regressions = read('regressions/results-edge-firefox.json');
assert.equal(regressions.length,14); assert(regressions.every(r=>r.status===0));
const summarize = browser => {
    const focused = read(`endless-hud-${browser}.json`), combat = read(`compatibility/combat-squad-${browser}.json`), play = read(`compatibility/playtest-${browser}.json`);
    for(const receipt of [focused,combat,play]) {
        assert.equal(receipt.results.passed,true);
        assert.deepEqual(receipt.errors,[]);
        assert.deepEqual((receipt.consoles||receipt.consoleErrors||[]).filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);
    }
    assert.equal(focused.results.runs.length,4); assert.equal(combat.results.checkpoints.length,8); assert.equal(play.results.chapters.length,3);
    const zeroKeys=['materialsCreated','geometriesCreated','linkProgram','buildEndlessWorld','buildTerrain','buildFacility','collisionNavRebuild'];
    const runs=focused.results.runs.map(r=>{
        const counters=Object.fromEntries(zeroKeys.map(key=>[key,r.performance.summary.counters[key]||0]));
        assert(Object.values(counters).every(n=>n===0));
        assert.deepEqual(r.restarted.config,r.deployed.config); assert.deepEqual(r.restarted.combat,r.deployed.combat);
        return {deployment:r.deployed.config, weaponDamage:r.weapons.map(w=>({id:w.after.id,shots:w.before.mag-w.after.mag,damage:w.before.hp-w.after.hp})),
            reloadProgress:r.reload.map(b=>+b.progress.toFixed(3)),
            abilityOwners:r.abilities.map(a=>({operator:a.name,ability:a.ability,cooldown:a.cooldown,actualUser:a.lastUser})),
            mutatorCounts:r.mutators.reduce((s,m)=>{s[m.id||'none']=(s[m.id||'none']||0)+1;return s;},{}),
            restart:{activeId:r.restarted.combat.activeId,cartridges:r.restarted.combat.cartridges,arena:r.restarted.arena,mutator:r.restarted.mutator},
            performance:{p95:r.performance.summary.p95Ms,worst:r.performance.summary.worstMs,counters,pool:r.performance.pools}};
    });
    const traversal=read(`regressions/traversal-${browser}-after-summary.json`).map(r=>({label:r.label,...r.summary}));
    return {guidedBrowserMode:browser==='edge'?'headed':'headless',runs,terrains:focused.results.terrains,crwModerate:focused.results.crwModerate,
        projectiles:focused.results.projectiles,campaignOrigins:focused.results.campaign.map(r=>({origin:r.origin,combat:r.combat,squad:r.squad})),
        checkpointCombinations:combat.results.checkpoints.length,campaignTransitions:play.results.chapters.map(r=>r.mission),
        m4EmergencyFloor:combat.results.emergencyFloor,sharedSquadSupply:combat.results.sharedSupply,
        cache:play.results.emergencyCache,continue:play.results.continue,
        isolatedCampaignCombat:play.results.isolatedCombat,traversal,pageErrors:0,unexpectedConsoleErrors:0};
};
const evidence=['01-deployment','02-player-arc-px-pair','03-squad-customization','04-horizontal-footer','05-consolidated-hud','06-reload-progress','07-px-gameplay','08-automatic-mutator','09-flat-terrain','10-elevated-terrain'].map(n=>`evidence/${n}.png`);
assert(evidence.every(path=>existsSync(resolve(root,path))));
const result={milestone:'4.1',baseline:'cd60d51',scope:'Endless loadouts, shared ammo, mutators, HUD',
    method:'Guided real-browser input; bounded contact/wave fixtures. Subjective human feel and multi-hour soak not certified.',
    authoritativeRegressions:regressions,browsers:{edge:summarize('edge'),firefox:summarize('firefox')},evidence};
writeFileSync(resolve(root,'validation-summary.json'),JSON.stringify(result,null,2));
console.log('PASS compact Milestone 4.1 receipt: 14 regressions, 6 focused/guided browser passes, 10 selected images');
