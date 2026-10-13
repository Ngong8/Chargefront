// Bounded inspection handoff verification; no product writes or image loading.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve('_playtest/m42/cp3cr-20261012');
const read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const initial=read('inspection.json'),supplement=read('supplement.json'),emergency=read('emergency.json');
const hashes=Object.fromEntries(Object.keys(initial.hashesBefore).map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')]));
assert.deepEqual(hashes,initial.hashesBefore,'Pre-existing product/test/documentation content changed');
for(const receipt of [initial,supplement,emergency]){
    assert(receipt.productUnchanged);assert.deepEqual(receipt.errors,[]);
    for(const view of receipt.views){assert.equal(view.slots,8);assert.equal(view.exposure,.78);assert.deepEqual(view.fog,[40,280]);}
}
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();assert.equal(head,initial.head);
const branch=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();assert.equal(branch,'milestone-4.2');
const staged=execFileSync('git',['diff','--cached','--name-only'],{encoding:'utf8'}).trim();assert.equal(staged,'');
let links=0;for(const name of ['REPORT.md','SCREENSHOT-INDEX.md']){
    const path=resolve(root,name),text=readFileSync(path,'utf8');
    for(const match of text.matchAll(/\]\(([^)]+)\)/g)){const url=match[1];if(url.startsWith('http')||url.startsWith('#'))continue;
        assert(existsSync(resolve(dirname(path),url.split('#')[0])),'Missing evidence link: '+url);links++;}
}
const output=resolve(root,'review-verification.json');assert(!existsSync(output),'Fresh verification receipt only');
const receipt={inspectionOnly:true,head,branch,stagedFiles:[],productSourceSha256:hashes['src/world/facility.js'],
    protectedFilesVerified:Object.keys(hashes).length,productContentUnchanged:true,linksChecked:links,
    captureCount:initial.views.length+supplement.views.length+emergency.views.length,normalLightSlots:8,
    findingsReport:'REPORT.md',screenshotIndex:'SCREENSHOT-INDEX.md',implementationApproved:false};
writeFileSync(output,JSON.stringify(receipt,null,2));console.log('PASS inspection handoff',JSON.stringify(receipt));
