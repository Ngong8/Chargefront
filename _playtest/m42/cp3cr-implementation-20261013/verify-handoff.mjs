// Final handoff consistency only; does not rerun tests or load image content.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve('_playtest/m42/cp3cr-implementation-20261013');
const json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const digest=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const hash=digest('src/world/facility.js'),summary=json('validation-summary.json');assert.equal(summary.sourceSha256,hash);
for(const name of ['firefox','edge']){
    const final=json('final/'+name+'/manifest.json');assert(final.passed);assert.equal(final.sourceSha256,hash);assert.equal(final.seeds.length,5);assert.deepEqual(final.errors,[]);
    const latest=summary.browsers[name].latest;assert.equal(Object.keys(latest).length,7);assert(Object.values(latest).every(r=>r.status===0&&r.sourceSha256===hash));
    assert.equal(summary.browsers[name].placement.cases,14);assert.equal(summary.browsers[name].enclosure.doors,6);
}
const inspected=JSON.parse(readFileSync('_playtest/m42/cp3cr-20261012/inspection.json','utf8'));
let protectedFiles=0;
for(const [p,before]of Object.entries(inspected.hashesBefore)){
    if(['src/world/facility.js','MILESTONE-4.2-ENVIRONMENT.md'].includes(p))continue;
    assert.equal(digest(p),before,'Unrelated existing content changed: '+p);protectedFiles++;
}
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();assert.equal(head,inspected.head);
const branch=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();assert.equal(branch,'milestone-4.2');
assert.equal(execFileSync('git',['diff','--cached','--name-only'],{encoding:'utf8'}).trim(),'');
let links=0;
const documents=[resolve(root,'README.md'),resolve(root,'SCREENSHOT-INDEX.md'),resolve('MILESTONE-4.2-ENVIRONMENT.md')];
for(const path of documents){let text=readFileSync(path,'utf8');
    if(path.endsWith('MILESTONE-4.2-ENVIRONMENT.md'))text=text.slice(text.indexOf('## CP3-C-R — Approved interior prop placement corrections'));
    for(const match of text.matchAll(/\]\(([^)]+)\)/g)){const url=match[1];if(url.startsWith('http')||url.startsWith('#'))continue;
        assert(existsSync(resolve(dirname(path),url.split('#')[0])),'Missing link: '+url);links++;}
}
const out=resolve(root,'handoff-verification.json');assert(!existsSync(out),'Fresh handoff receipt only');
const result={checkpoint:'CP3-C-R',sourceSha256:hash,head,branch,stagedFiles:[],protectedExistingFiles:protectedFiles,
    creditsUnchanged:true,linksChecked:links,latestSuitesPassBothBrowsers:true,comparativeTiming:'inconclusive',manualVisualAcceptance:'pending'};
writeFileSync(out,JSON.stringify(result,null,2));console.log('PASS handoff consistency',JSON.stringify(result));
