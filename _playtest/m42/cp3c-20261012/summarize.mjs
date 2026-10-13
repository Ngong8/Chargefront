// Join authoritative receipts, retaining failed first attempts alongside retries.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('_playtest/m42/cp3c-20261012');
const json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const hash=createHash('sha256').update(readFileSync('src/world/facility.js')).digest('hex');
const stage=process.argv[2]||'final',tag=process.argv[3]||'';
const visual=json('visual-summary-'+stage+'.json'),paired=json('paired-performance'+(tag?'-'+tag:'')+'.json');assert.equal(visual.sourceSha256,hash);assert.equal(paired.sourceSha256,hash);assert(paired.passed);
const earlier=[...json('results-facility-regression-facility-playthrough-transition-diagnose.json'),
    ...json('results-m2-progression-traversal-performance-facility-enclosure-environment-placement.json'),
    ...json('results-facility-playthrough-retry.json'),...json('results-m2-progression-retry.json')];
const attempts=tag?[...json('results-facility-regression-facility-playthrough-transition-diagnose-m2-progression-traversal-performance-facility-enclosure-environment-placement-'+tag+'.json'),
    ...json('results-traversal-performance-facility-enclosure-environment-placement-'+tag+'.json')]:earlier;
assert(attempts.every(r=>r.sourceSha256===hash));
const summary={checkpoint:'CP3-C',baseline:'c0bb414492d5359b2d98367bf31ca7511f65f9ba',sourceSha256:hash,
    verdict:'engineering_pass_manual_review_pending',lightingBoundary:'No CP3-D; only the explicitly approved exterior-Research growth/source exclusion',browsers:{}};
for(const name of ['firefox','edge']) {
    const rows=attempts.filter(r=>r.browser===name),latest=Object.fromEntries(rows.map(r=>[r.suite,r]));assert(Object.values(latest).every(r=>r.status===0));
    const dir='regression-'+name+(tag?'-'+tag:'');
    const log=readFileSync(resolve(root,dir,'facility-regression-'+name+'.log'),'utf8');
    const stress=JSON.parse(log.split(/\r?\n/).find(l=>l.startsWith('A–E traversal ')).slice('A–E traversal '.length));
    const enclosure=json(dir+'/facility-enclosure-'+name+'.json');assert.equal(enclosure.doors.length,6);assert.deepEqual(enclosure.errors,[]);
    const placement=json(dir+'/environment-placement-'+name+'.json');assert.deepEqual(placement.errors,[]);
    const regions=json(dir+'/traversal-'+name+'-after-summary.json').filter(r=>['Facility interior','M4 service/exit'].includes(r.label)).map(r=>({label:r.label,summary:r.summary,renderer:r.renderer}));
    summary.browsers[name]={...visual.browsers[name],attempts:rows,latest,stress,regions,
        enclosure:{doorCount:enclosure.doors.length,walks:enclosure.walks,states:enclosure.states},
        placement:{cases:placement.cases.length,baselineParity:placement.baselineParity,errors:placement.errors},paired:paired.browsers[name],earlierAttempts:tag?earlier.filter(r=>r.browser===name):[]};
}
const out=resolve(root,'validation-summary'+(tag?'-'+tag:'')+'.json');assert(!existsSync(out),'Never overwrite a summary receipt');writeFileSync(out,JSON.stringify(summary,null,2));
const compact=Object.fromEntries(Object.entries(summary.browsers).map(([name,r])=>[name,{latest:Object.keys(r.latest),failures:r.attempts.filter(a=>a.status!==0),stress:r.stress,regions:r.regions}]));
console.log(JSON.stringify(compact,null,2));
