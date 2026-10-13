// Fresh full accepted-HEAD site, then current site, in one browser per pair.
// This isolates the room render delta from historical / randomized sweep timing.
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const {firefox,chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href);
const root=resolve('_playtest/m42/cp3c-20261012'),out=resolve(root,'paired-performance'+(process.env.CF_PERF_TAG?'-'+process.env.CF_PERF_TAG:'')+'.json');assert(!existsSync(out));
const site=mkdtempSync('C:/Users/User/AppData/Local/Temp/opencode/cp3c-');
const report={baseline:'c0bb414',seed:420042,sourceSha256:createHash('sha256').update(readFileSync('src/world/facility.js')).digest('hex'),browsers:{}};
const poses=[['Hall',[380,645,1.7,386,650,1.5]],['Vault',[360,677,1.7,360,682.5,6.8]],['Decon',[342,697,1.7,334,695,1.8]],
    ['Research',[351,714,1.7,346.8,714,1.22]],['Security',[381,719,1.7,387.7,722,3.2]],['Containment',[351,762,1.7,361,777,2.8]],['Power',[428,752,1.7,434,764,2.1]]];
try {
    execFileSync('git',['archive','--format=tar','-o',resolve(site,'accepted.tar'),'c0bb414','chargefront.html','src','Images','SFX','Music','Glitch Slap.otf']);
    execFileSync('tar',['-xf',resolve(site,'accepted.tar'),'-C',site]);
    for(const name of ['firefox','edge']) {
        const browser=await (name==='firefox'?firefox.launch({headless:true}):chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files','--enable-unsafe-swiftshader']}));
        const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
        const runs=[];
        try {for(const stage of ['before','after']) {
            const url=pathToFileURL(resolve(stage==='before'?site:'.','chargefront.html'));url.searchParams.set('perfDiagnostics','1');
            await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});
            await page.evaluate(()=>{const c=__cf,r=Math.random;Math.random=ChargefrontProgression.seedRandom(420042);
                try{c.resetCampaignProgress();c.startMission('dead_signal','new_campaign');}finally{Math.random=r;}
                c.skipIntro();c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);c.completeMission();c.completeMission();c.clearTestEnemies();
                c.setHud(false);c.hideViewmodel(true);document.querySelector('#cf-perf-diagnostics').style.display='none';});
            await page.evaluate(()=>__cf.waitCombatPreparation());await page.waitForTimeout(1500);
            // Prime identical normal viewpoints on both sites before the steady
            // comparison. Accepted CP3-B itself first links two shadow variants
            // when the camera leaves the LZ; do not count that cold view as churn.
            for(const [,pose] of poses) {
                await page.evaluate(p=>{const c=__cf;c.move(p[0]-c.player.pos.x,p[1]-c.player.pos.y);c.setCoverPose(p);for(const m of c.squad){m.pos.x=360;m.pos.y=580;m.mesh.visible=false;}},pose);
                await page.waitForTimeout(700);
            }
            const regions=[];
            for(const [label,pose] of poses) {
                await page.evaluate(pose=>{const c=__cf;c.move(pose[0]-c.player.pos.x,pose[1]-c.player.pos.y);c.setCoverPose(pose);for(const m of c.squad){m.pos.x=360;m.pos.y=580;m.mesh.visible=false;}},pose);
                await page.waitForTimeout(1000);
                const region=await page.evaluate(async()=>{__cfPerf.reset();for(let i=0;i<64;i++)await new Promise(r=>requestAnimationFrame(r));
                    const report=__cfPerf.report(),summary=__cfPerf.summary();const render=report.frames.map(f=>f.renderMs).sort((a,b)=>a-b);
                    return {summary,renderP50:render[Math.floor(render.length*.5)],renderP95:render[Math.floor(render.length*.95)],calls:__cf.performanceInfo().render.calls,programs:__cf.renderer.info.programs.length};});
                for(const key of ['linkProgram','geometriesCreated','materialsCreated','geometryDisposes','materialDisposes','buildCampaignWorld','collisionNavRebuild'])assert.equal(region.summary.counters[key]||0,0,label+': '+key);
                regions.push({label,...region});
            }
            runs.push({stage,regions});
        }} finally {await browser.close();}
        assert.deepEqual(errors,[]);report.browsers[name]={runs,errors};writeFileSync(out,JSON.stringify(report,null,2));
        console.log(name,JSON.stringify(runs.map(r=>({stage:r.stage,regions:r.regions.map(p=>({label:p.label,p95:p.summary.p95Ms,renderP50:p.renderP50,renderP95:p.renderP95,calls:p.calls,programs:p.programs}))}))));
    }
    report.passed=true;writeFileSync(out,JSON.stringify(report,null,2));
} finally {rmSync(site,{recursive:true,force:true});}
