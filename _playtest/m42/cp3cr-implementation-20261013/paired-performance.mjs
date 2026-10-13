// Compare inspected CP3-C and current CP3-C-R in isolated fresh sites, no
// workspace source swapping. One browser/session at a time, identical warm tour.
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const {firefox,chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href);
const root=resolve('_playtest/m42/cp3cr-implementation-20261013'),out=resolve(root,'paired-performance'+(process.env.CF_PERF_TAG?'-'+process.env.CF_PERF_TAG:'')+'.json');assert(!existsSync(out));
const site=mkdtempSync('C:/Users/User/AppData/Local/Temp/opencode/cp3cr-pair-');
const digest=data=>createHash('sha256').update(data).digest('hex');
const baseline=readFileSync(resolve(root,'before-facility.js'));
assert.equal(digest(baseline),'62f23aed1589ae2508c4f96a6274f6407a599d8980ab850c5a720075999aeb86');
const report={baseline:'inspected CP3-C working source',baselineSha256:digest(baseline),sourceSha256:digest(readFileSync('src/world/facility.js')),seed:420042,browsers:{}};
const poses=[['Hall',[382.5,648.5,1.62,386.2,648,1.35]],['Vault',[360,677,1.62,360,682.5,6.8]],
    ['Decon',[360,693,1.62,340,699,4]],['Research',[338,715,1.62,331,711,3.8]],
    ['Security',[381,719,1.62,387.7,722,3.2]],['Containment',[351,762,1.62,361,777,2.8]],['Power',[430,756,1.62,434,764,2.1]]];
try{
    execFileSync('git',['archive','--format=tar','-o',resolve(site,'site.tar'),'c0bb414','chargefront.html','src','Images','SFX','Music','Glitch Slap.otf']);
    execFileSync('tar',['-xf',resolve(site,'site.tar'),'-C',site]);
    // The inspected CP3-C work was uncommitted. Its immutable actual source is
    // restored only in this private site; other game files match the same HEAD.
    writeFileSync(resolve(site,'src/world/facility.js'),baseline);
    for(const name of process.env.CF_BROWSER?[process.env.CF_BROWSER]:['firefox','edge']){
        const browser=await(name==='firefox'?firefox.launch({headless:true}):chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files','--enable-unsafe-swiftshader']}));
        const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],runs=[];page.on('pageerror',e=>errors.push(e.message));
        try{for(const stage of process.env.CF_PAIR_ORDER?process.env.CF_PAIR_ORDER.split(','):['before','after']){
            const url=pathToFileURL(resolve(stage==='before'?site:'.','chargefront.html'));url.searchParams.set('perfDiagnostics','1');
            await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});
            await page.evaluate(()=>{const c=__cf,r=Math.random;Math.random=ChargefrontProgression.seedRandom(420042);try{c.resetCampaignProgress();c.startMission('dead_signal','new_campaign');}finally{Math.random=r;}
                c.skipIntro();c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);c.completeMission();c.completeMission();c.clearTestEnemies();c.setHud(false);c.hideViewmodel(true);document.querySelector('#cf-perf-diagnostics').style.display='none';});
            await page.evaluate(()=>__cf.waitCombatPreparation());await page.waitForTimeout(1500);
            for(const [,pose]of poses){await page.evaluate(p=>{const c=__cf;c.move(p[0]-c.player.pos.x,p[1]-c.player.pos.y);c.setCoverPose(p);for(const m of c.squad){m.pos.x=360;m.pos.y=580;m.mesh.visible=false;}},pose);await page.waitForTimeout(700);}
            const regions=[];
            for(const [label,pose]of poses){await page.evaluate(p=>{const c=__cf;c.move(p[0]-c.player.pos.x,p[1]-c.player.pos.y);c.setCoverPose(p);},pose);await page.waitForTimeout(1000);
                const row=await page.evaluate(async()=>{__cfPerf.reset();for(let i=0;i<64;i++)await new Promise(r=>requestAnimationFrame(r));const summary=__cfPerf.summary(),times=__cfPerf.report().frames.map(f=>f.renderMs).sort((a,b)=>a-b);
                    return {summary,renderP50:times[Math.floor(times.length*.5)],renderP95:times[Math.floor(times.length*.95)],calls:__cf.performanceInfo().render.calls,programs:__cf.renderer.info.programs.length};});
                for(const key of ['linkProgram','geometriesCreated','materialsCreated','geometryDisposes','materialDisposes','buildCampaignWorld','collisionNavRebuild'])assert.equal(row.summary.counters[key]||0,0,label+': '+key);
                regions.push({label,...row});
            }
            runs.push({stage,regions});
        }}finally{await browser.close();}
        assert.deepEqual(errors,[]);const before=runs.find(r=>r.stage==='before'),after=runs.find(r=>r.stage==='after');
        assert(after.regions.every((r,i)=>r.programs<=before.regions[i].programs),'New warmed program growth');
        report.browsers[name]={runs,errors};writeFileSync(out,JSON.stringify(report,null,2));
        console.log(name,JSON.stringify(runs.map(r=>({stage:r.stage,regions:r.regions.map(v=>({label:v.label,p95:v.summary.p95Ms,renderP50:v.renderP50,renderP95:v.renderP95,calls:v.calls,programs:v.programs}))}))));
    }
    report.passed=true;writeFileSync(out,JSON.stringify(report,null,2));
}finally{rmSync(site,{recursive:true,force:true});}
