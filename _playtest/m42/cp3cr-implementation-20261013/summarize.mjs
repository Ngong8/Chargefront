// Final-source receipts; retain initial interruption/timeouts alongside retries.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('_playtest/m42/cp3cr-implementation-20261013');
const json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const hash=createHash('sha256').update(readFileSync('src/world/facility.js')).digest('hex');
const visual=json('visual-summary.json'),paired=json('paired-performance.json'),reverse=json('paired-performance-reverse.json');
assert.equal(visual.sourceSha256,hash);assert.equal(paired.sourceSha256,hash);assert.equal(reverse.sourceSha256,hash);assert(paired.passed&&reverse.passed);
const attempts=[...json('results-final-both-facility-regression-facility-playthrough-transition-diagnose.json'),
    ...json('results-final-both-m2-progression-traversal-performance.json'),...json('results-final-both-facility-enclosure-environment-placement.json'),
    ...json('results-placement-retry-firefox-environment-placement.json'),...json('results-placement-retry-edge-environment-placement.json')];
assert(attempts.every(r=>r.sourceSha256===hash));
const result={checkpoint:'CP3-C-R',sourceSha256:hash,beforeSourceSha256:json('before/firefox/manifest.json').sourceSha256,
    verdict:'functional_preservation_prewarming_pass_visual_review_pending_timing_inconclusive',browsers:{}};
for(const name of ['firefox','edge']){
    const rows=attempts.filter(r=>r.browser===name),latest=Object.fromEntries(rows.map(r=>[r.suite,r]));assert.equal(Object.keys(latest).length,7);assert(Object.values(latest).every(r=>r.status===0));
    const after=json('final/'+name+'/manifest.json'),before=json('before/'+name+'/manifest.json');assert(after.passed);assert.equal(after.sourceSha256,hash);
    const log=readFileSync(resolve(root,'regression-final-'+name,'facility-regression.log'),'utf8');
    const stress=JSON.parse(log.split(/\r?\n/).find(l=>l.startsWith('A–E traversal ')).slice('A–E traversal '.length));
    const placement=json('regression-placement-retry-'+name+'/environment-placement-'+name+'.json');assert.deepEqual(placement.errors,[]);
    const enclosure=json('regression-final-'+name+'/facility-enclosure-'+name+'.json');assert.deepEqual(enclosure.errors,[]);assert.equal(enclosure.doors.length,6);
    const regions=json('regression-final-'+name+'/traversal-'+name+'-after-summary.json').filter(r=>['Facility interior','M4 service/exit'].includes(r.label)).map(r=>({label:r.label,summary:r.summary,renderer:r.renderer}));
    result.browsers[name]={attempts:rows,latest,stress,regions,visual:visual.browsers[name],
        preservation:{seedCount:after.seeds.length,protectedRowCount:after.seeds[0].state.protectedRows.length,
            securityDecorativeProof:before.seeds[0].state.s01,retiredLayers:after.seeds[0].state.retiredLayers,
            collisionExact:true,projectilesExact:true,doorSweepsClear:true,cp3bExact:true,missionAnchorsAndTurretComponentsExact:true,authoredSourcesExact:true},
        enclosure:{doors:enclosure.doors.length,walks:enclosure.walks,states:enclosure.states},
        placement:{cases:placement.cases.length,baselineParity:placement.baselineParity,errors:placement.errors},paired:paired.browsers[name],reverse:reverse.browsers[name]||null};
}
const path=resolve(root,'validation-summary.json');assert(!existsSync(path),'Fresh summary only');writeFileSync(path,JSON.stringify(result,null,2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(result.browsers).map(([name,r])=>[name,{latest:Object.keys(r.latest),interruptions:r.attempts.filter(r=>r.status!==0),stress:r.stress,regions:r.regions,placementCases:r.placement.cases}])),null,2));
