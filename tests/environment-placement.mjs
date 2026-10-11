// CP1: observe the real world, exercise the opt-in gate, and draw temporary SVG
// evidence overlays. No proposed prop is attached to the gameplay scene.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const { firefox, chromium } = await import(process.env.PLAYWRIGHT_PACKAGE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const ff = process.argv.includes('firefox'), name = ff ? 'firefox' : 'edge';
const out = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m42/cp1/placement'); mkdirSync(out, { recursive: true });
const browser = await (ff ? firefox : chromium).launch(ff ? { headless: true } : {
    headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    args: ['--allow-file-access-from-files', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage(), errors = [], results = { browser: name, cases: [], baselineParity: [], captures: [] };
page.on('pageerror', e => errors.push(e.message));
const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics', '1');
// Accepted-HEAD baseline: the complete HEAD game (HTML *and* src/ modules) is
// extracted with `git archive` to a temporary site. (CP2-R1: the former
// page.route substitution was ignored for file:// in Firefox and, where honoured,
// still loaded the working-tree src/world/facility.js, so facility construction
// changes could shift seeded scenery undetected.)
const headSite = mkdtempSync(resolve(tmpdir(), 'cf-head-'));
const archive = resolve(headSite, 'head.tar');
execFileSync('git', ['archive', '--format=tar', '-o', archive, '5c8704f', 'chargefront.html', 'src', 'Images', 'SFX', 'Music', 'Glitch Slap.otf']);
execFileSync('tar', ['-xf', archive, '-C', headSite]);
const headHtml = resolve(headSite, 'chargefront.html');
writeFileSync(headHtml, readFileSync(headHtml, 'utf8')
    .replace('window.__cf = {', 'window.__cf = { environmentPlacementSolidsForTest() { return SOLIDS.map(({x0,y0,x1,y1,topY,bottomY})=>({x0,y0,x1,y1,topY,bottomY})); },'));
const headUrl = pathToFileURL(headHtml); headUrl.searchParams.set('perfDiagnostics', '1');
let baseline = false, template;
const digest = data => createHash('sha256').update(JSON.stringify(data)).digest('hex');
async function load(mode, seed, arena = 'valley') {
    await page.goto((baseline ? headUrl : url).href); await page.waitForFunction(() => window.__cf?.renderer && window.__cfPerf, undefined, { timeout: 120000 });
    if (baseline) assert(await page.evaluate(() => !window.ChargefrontFacility.PORTALS), 'Baseline must run the HEAD facility module');
    await page.evaluate(({ mode, seed, arena, template }) => {
        const c = __cf;
        if (mode === 'campaign') {
            const previous = Math.random; Math.random = ChargefrontProgression.seedRandom(seed);
            try { c.resetCampaignProgress(); if (!c.startMission('dead_signal', 'new_campaign')) throw Error('Campaign fixture failed'); }
            finally { Math.random = previous; }
            c.skipIntro();
        } else {
            const saved = structuredClone(template); saved.arena = arena; saved.run.worldSeed = seed;
            if (!ChargefrontProgression.endlessValid(saved)) throw Error('Invalid seeded fixture');
            localStorage.setItem('cf_endless_v1', JSON.stringify(saved)); if (!c.continueEndless()) throw Error('Endless fixture failed');
        }
        c.setNoSpawn(true); c.setNoAggro(true); c.setInvulnerable(true); c.clearTestEnemies();
    }, { mode, seed, arena, template });
    await page.evaluate(() => __cf.waitCombatPreparation()); await page.waitForTimeout(350);
    await page.evaluate(() => __cf.pause(true));
}
async function worldFingerprint() {
    return page.evaluate(() => ({ solids: __cf.environmentPlacementSolidsForTest(), trees: __cf.endlessDecorInfo(),
        sections: __cf.facilitySections(), arena: __cf.mode === 'endless' ? __cf.endless.arena.id : null,
        heights: [[2,2],[450,80],[205,575],[245,748],[575,585],[360,710],[450,752],[400,400],[644,400],[798,798]].map(([x,y]) => __cf.terrainHeight(x,y)) }));
}
async function capture(label, pose, entries) {
    await page.evaluate(({ pose, entries }) => {
        const c = __cf; c.setHud(false); c.hideViewmodel(true); c.setCoverPose(pose); c.pause(false);
        document.querySelector('#cf-perf-diagnostics').style.display = 'none';
        window.__placementOverlay = entries;
    }, { pose, entries });
    await page.waitForTimeout(400); await page.evaluate(() => __cf.pause(true));
    await page.evaluate(() => {
        const c = __cf, ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg'); svg.id = 'placement-evidence'; svg.setAttribute('viewBox','0 0 1280 720');
        svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:90';
        const title = document.createElementNS(ns,'text'); title.setAttribute('x','24'); title.setAttribute('y','30'); title.setAttribute('fill','white');
        title.textContent = 'CP1 TEST OVERLAY — RED: PROTECTED / REJECTED   GREEN: VALIDATED FOOTPRINT (NO WORLD POPULATION)'; svg.append(title);
        for (const e of window.__placementOverlay) {
            const points = e.points.map(([x,y]) => c.project(x,y,c.terrainHeight(x,y)+.4));
            if (points.some(p=>p.z>1)) continue;
            const polygon = document.createElementNS(ns,'polygon'); polygon.setAttribute('points',points.map(p=>`${p.x},${p.y}`).join(' '));
            polygon.setAttribute('fill',e.ok?'#44ff8860':'#ff44443a'); polygon.setAttribute('stroke',e.ok?'#44ff88':'#ff6666'); polygon.setAttribute('stroke-width','2');svg.append(polygon);
            const text = document.createElementNS(ns,'text');text.setAttribute('x',points[0].x+4);text.setAttribute('y',points[0].y-5);text.setAttribute('fill',e.ok?'#88ffbb':'#ffbbbb');text.textContent=e.label;svg.append(text);
        }
        document.body.append(svg);
        // Firefox's paused WebGL buffer may clear: render-only RAF keeps the same
        // state present for screenshot capture without advancing gameplay.
        window.__placementRender = true;
        const render = () => { if (!window.__placementRender) return; c.render(); requestAnimationFrame(render); }; requestAnimationFrame(render);
    });
    await page.screenshot({ path: resolve(out, `${label}-${name}.png`) });
    results.captures.push({ label, pose, entries });
    await page.evaluate(() => { window.__placementRender=false;document.querySelector('#placement-evidence').remove();__cf.setCoverPose(null);__cf.setHud(true);__cf.hideViewmodel(false); });
}
const polygon = b => [[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]];
try {
    // One disposable normal Endless run supplies a valid save template; arena and
    // worldSeed are subsequently set only in isolated browser fixture records.
    await page.goto(url.href);await page.waitForFunction(()=>window.__cf?.renderer,undefined,{timeout:120000});
    template = await page.evaluate(()=>{__cf.startEndlessMode();__cf.saveEndless();return __cf.endlessSaveInfo();});assert(template);
    for (const [mode, seed, arena] of [
        ...[0,1,420042,0x7fffffff,0xffffffff].map(seed=>['campaign',seed,'valley']),
        ...['valley','crater','ridges'].flatMap(arena=>[0,420042,0xffffffff].map(seed=>['endless',seed,arena])),
    ]) {
        baseline = false; await load(mode, seed, arena);
        assert.equal(await page.evaluate(()=>__cf.environmentPlacementStats().validations),0,'Legacy generation must not run new placement rules or consume proposal randomness');
        const before = await worldFingerprint();
        const row = await page.evaluate(({mode,seed,arena})=>{
            const c=__cf,P=ChargefrontEnvironmentPlacement,zones=c.environmentPlacementZones();
            const candidate={purpose:'decoration',width:.6,depth:.5,height:1};
            const badPoints=mode==='campaign'?[[360,640],[430,752],[321,603],[205,575],[450,80],[360,580],[450,752],[388.15,699.75],[398,674],[205,535]]:[[400,400],[413,400],[400,442]];
            const rejected=badPoints.map(([x,y])=>c.validateEnvironmentPlacement({...candidate,x,y}));
            if(rejected.some(r=>r.ok||r.reason!=='exclusion'))throw Error('Protected area admitted a prop');
            if(mode==='campaign') {
                for(const prefix of ['facility:', 'door:', 'deployment:', 'objective:', 'interactable:', 'corridor:', 'spawn:']) {
                    if(!zones.some(z=>z.id.startsWith(prefix)))throw Error('Missing exclusion category '+prefix);
                }
                const travel=c.validateEnvironmentPlacement({...candidate,x:455.4,y:765});
                if(travel.ok||travel.zone!=='door:lab_emergency_exit')throw Error('Open panel travel zone failed');
                const front=c.validateEnvironmentPlacement({...candidate,x:376.6,y:613.1});
                if(front.ok||front.zone!=='door:0')throw Error('Front doorway shoulder failed');
            }
            const boundaries=(mode==='campaign'?[[2,300],[798,300],[300,2],[300,798]]:[[644,400],[156,400],[400,644],[400,156]])
                .map(([x,y])=>c.validateEnvironmentPlacement({...candidate,x,y}));
            if(boundaries.some(r=>r.reason!=='boundary'))throw Error('Full-footprint boundary failed');
            const run=()=>{const rng=ChargefrontProgression.seedRandom(seed),accepted=[],reasons={};
                for(let i=0;i<100;i++){
                    const x=mode==='campaign'?400+rng()*130:440+rng()*100,y=mode==='campaign'?260+rng()*220:430+rng()*100;
                    const r=c.validateEnvironmentPlacement({...candidate,x,y,yaw:(rng()-.5)*Math.PI*2,scale:.8+rng()*.4});
                    if(r.ok)accepted.push(r);else reasons[r.reason]=(reasons[r.reason]||0)+1;
                }return {accepted,reasons};};
            const randomBefore=Math.random,first=run(),second=run();
            if(JSON.stringify(first)!==JSON.stringify(second)||randomBefore!==Math.random)throw Error('Seed reproducibility/random isolation failed');
            if(!first.accepted.length)throw Error('No valid terrain candidate');
            const valid=first.accepted[0];
            const fallback=c.findEnvironmentPlacement({candidate,propose:()=>({x:badPoints[0][0],y:badPoints[0][1]}),maxAttempts:3,fallback:{x:valid.x,y:valid.y}});
            if(!fallback.ok||!fallback.fallback)throw Error('Checked safe fallback failed');
            const sealed=c.findEnvironmentPlacement({candidate,propose:()=>({x:badPoints[0][0],y:badPoints[0][1]}),maxAttempts:100000,fallback:{x:badPoints[0][0],y:badPoints[0][1]}});
            if(sealed.ok||sealed.attempts!==32)throw Error('Rejection budget failed');
            const start=performance.now();for(let i=0;i<1000;i++)c.validateEnvironmentPlacement({...candidate,x:valid.x,y:valid.y});const ms=performance.now()-start;
            return {mode,seed,arena:mode==='endless'?arena:null,zones,accepted:first.accepted,reasons:first.reasons,rejected,boundaries,
                fallback,sealed,thousandValidationsMs:ms,stats:c.environmentPlacementStats()};
        },{mode,seed,arena});
        assert.deepEqual(await worldFingerprint(),before,'Read-only validation altered geometry/collision/scenery');
        assert(row.zones.length<=256);results.cases.push(row);
        console.log('PLACEMENT',JSON.stringify({mode,seed,arena:row.arena,zones:row.zones.length,accepted:row.accepted.length,ms1000:row.thousandValidationsMs,reasons:row.reasons}));
        if(mode==='campaign'&&seed===420042){
            const rects=row.zones.filter(z=>z.type==='rect'&&(z.id==='facility:0'||z.id==='door:0'));
            const shoulder=await page.evaluate(()=>__cf.findEnvironmentPlacement({candidate:{purpose:'decoration',width:1,depth:1,height:1},
                maxAttempts:8,propose:(_random,i)=>({x:398+i*3,y:545})}));
            assert(shoulder.ok,'Front shoulder evidence requires an actually accepted visible candidate');
            await capture('front-exclusions',[430,530,90,360,602,0],rects.map(z=>({label:z.id,points:polygon(z),ok:false})).concat(
                [{label:'accepted shoulder footprint',points:polygon(shoulder.bounds),ok:true}]));
            const exit=row.zones.filter(z=>z.id==='facility:2'||z.id==='door:lab_emergency_exit');
            await capture('annex-exit-exclusions',[490,715,70,430,752,0],exit.map(z=>({label:z.id,points:polygon(z),ok:false})));
            const battery=row.zones.find(z=>z.id==='interactable:maintenanceBattery');
            const circle=Array.from({length:32},(_,i)=>[battery.x+Math.cos(i*Math.PI/16)*battery.radius,battery.y+Math.sin(i*Math.PI/16)*battery.radius]);
            await capture('battery-interaction-exclusion',[345,565,35,321,603,0],[{label:'protected battery approach (6 m)',points:circle,ok:false}]);
        }
        if(mode==='endless'&&seed===420042){
            const center=row.zones[0],circle=Array.from({length:32},(_,i)=>[center.x+Math.cos(i*Math.PI/16)*center.radius,center.y+Math.sin(i*Math.PI/16)*center.radius]);
            await capture('endless-'+arena+'-placements',[540,520,100,430,430,0],[{label:'protected center',points:circle,ok:false},
                ...[...row.accepted].sort((a,b)=>Math.hypot(a.x-440,a.y-440)-Math.hypot(b.x-440,b.y-440)).slice(0,5)
                    .map((r,i)=>({label:'valid footprint '+i,points:polygon(r.bounds),ok:true}))]);
        }
        // HEAD comparison: one campaign + each arena, same seed and unmodified
        // world builder. Baseline instrumentation only exposes plain solid data.
        if(seed===420042){
            baseline=true;await load(mode,seed,arena);const previous=await worldFingerprint();
            // Seeded scenery, terrain and section construction must match HEAD
            // exactly. Solids inside the facility envelope are the approved
            // CP2-R1 structure, guarded separately by tests/facility-enclosure.mjs.
            const envelope=s=>s.x0>=328.9&&s.x1<=451.1&&s.y0>=616.5&&s.y1<=796;
            const scenery=fp=>({...fp,solids:fp.solids.filter(s=>!envelope(s))});
            // The only approved section difference: CP2-R1 retired the two y690
            // roof-ridge trims from the hall section (still constructed, unattached,
            // for stream parity). New structure attaches after section recording.
            const approvedHead=fp=>({...scenery(fp),sections:fp.sections.map(s=>s.name==='hall'?{...s,objects:s.objects-2}:s)});
            assert.deepEqual(mode==='campaign'?approvedHead(previous):scenery(previous),scenery(before),'Accepted seeded scenery/solid coordinates changed from HEAD');
            results.baselineParity.push({mode,arena:row.arena,seed,sha256:digest(scenery(before)),solids:before.solids.length,
                headSolids:previous.solids.length,facilityEnvelopeSolids:[previous.solids.filter(envelope).length,before.solids.filter(envelope).length]});
        }
    }
    // Exercise the actual envBox gateway in a detached parent: no world population.
    baseline=false;await load('endless',420042,'crater');
    results.gateway=await page.evaluate(()=>{
        const c=__cf,rng=ChargefrontProgression.seedRandom(77),occupied=[];
        const find=purpose=>c.findEnvironmentPlacement({candidate:{purpose,width:.8,depth:.6,height:1.1},random:rng,
            propose:r=>({x:440+r()*90,y:435+r()*90})});
        const candidate=find('decoration');if(!candidate.ok)throw Error('Gateway setup failed');
        const parent=new c.scene.constructor(),before=c.solidCount;
        const mesh=c.environmentBoxForTest(parent,{...candidate,width:.8,depth:.6,height:1.1,yaw:.7,scale:.9},occupied);
        if(!mesh)throw Error('Valid decoration refused');
        parent.updateMatrixWorld(true);mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
        if(Math.abs(b.min.z-candidate.baseZ)>.00001||Math.abs(b.max.z-(candidate.baseZ+.99))>.00001)throw Error('World yaw tilted/scaled prop incorrectly');
        if(c.solidCount!==before)throw Error('Decoration created collision');
        const resourcesBefore=parent.children.length;
        if(c.environmentBoxForTest(parent,{purpose:'decoration',x:400,y:400,width:1,depth:1,height:1},occupied)!==null)throw Error('Center placement bypassed gate');
        if(c.environmentBoxForTest(parent,{...candidate,width:.8,depth:.6,height:1.1},occupied)!==null)throw Error('Stacking was admitted');
        if(parent.children.length!==resourcesBefore)throw Error('Rejection allocated/attached a mesh');
        const cover=find('cover');if(!cover.ok)throw Error('Cover fixture failed');
        const coverMesh=c.environmentBoxForTest(parent,{...cover,width:.8,depth:.6,height:1.1,yaw:.1},occupied);if(!coverMesh)throw Error('Cover refused');
        const slabs=c.environmentPlacementSolidsForTest().slice(before);
        if(!slabs.length||slabs.some(s=>Math.abs(s.bottomY-cover.baseZ)>.00001||Math.abs(s.topY-cover.topY)>.00001))throw Error('Physical cover height mismatch');
        if(!c.probeBlocked(cover.x-2,cover.y,cover.baseZ+.5,cover.x+2,cover.y,cover.baseZ+.5)
            ||c.probeBlocked(cover.x-2,cover.y,cover.topY+.5,cover.x+2,cover.y,cover.topY+.5))throw Error('Low/over-cover blocking failed');
        return {decorationSolidDelta:0,coverSolidDelta:c.solidCount-before,decorationBounds:{min:b.min.toArray(),max:b.max.toArray()},slabs,
            parentAttached:!!parent.parent,occupied:occupied.length};
    });
    assert.equal(results.gateway.parentAttached,false);assert.deepEqual(errors,[]);
    console.log('PASS environmental placement browser integration',name);
}finally{
    results.errors=errors;writeFileSync(resolve(out,`environment-placement-${name}.json`),JSON.stringify(results,null,2));await browser.close();
    rmSync(headSite,{recursive:true,force:true});
}
