// CP3-C: immutable accepted-CP3-B comparison, static identity inventory and
// matched normal-lighting room captures. Existing gameplay suites remain separate.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const { firefox, chromium } = await import(process.env.PLAYWRIGHT_PACKAGE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const ff = process.argv.includes('firefox'), name = ff ? 'firefox' : 'edge';
const stage = process.argv.find(a => a.startsWith('--stage='))?.slice(8) || 'final';
const root = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m42/cp3c-20261012');
const out = resolve(root, stage, name); assert(!existsSync(out), 'Use a fresh stage'); mkdirSync(out, { recursive: true });
const source = readFileSync('src/world/facility.js', 'utf8');
if (stage === 'before' && !existsSync(resolve(root, 'accepted-cp3b-facility.js'))) writeFileSync(resolve(root, 'accepted-cp3b-facility.js'), source);
const before = stage === 'before' ? null : JSON.parse(readFileSync(resolve(root, 'before', name, 'manifest.json'), 'utf8'));
const browser = await (ff ? firefox.launch({ headless: true }) : chromium.launch({ headless: true,
    executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    args: ['--allow-file-access-from-files', '--enable-unsafe-swiftshader'] }));
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } }), errors = [];
page.on('pageerror', e => errors.push(e.message));
const report = { checkpoint: 'CP3-C', stage, browser: name, sourceSha256: createHash('sha256').update(source).digest('hex'), seeds: [], views: [], errors };
async function load(seed) {
    const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics', '1');
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.__cf?.renderer, undefined, { timeout: 120000 });
    await page.evaluate(seed => { const c = __cf, random = Math.random; Math.random = ChargefrontProgression.seedRandom(seed);
        try { c.resetCampaignProgress(); if (!c.startMission('dead_signal', 'new_campaign')) throw Error('Setup failed'); }
        finally { Math.random = random; } c.skipIntro(); c.setNoSpawn(true); c.setNoAggro(true); c.setInvulnerable(true);
        c.completeMission(); c.completeMission(); c.clearTestEnemies(); }, seed);
    await page.evaluate(() => __cf.waitCombatPreparation()); await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => __cf.missionId), 'sample_zero');
}
async function snapshot() {
    return JSON.parse(JSON.stringify(await page.evaluate(() => {
        const c = __cf; c.scene.updateMatrixWorld(true);
        const all = []; c.scene.traverse(o => { if (o.isMesh) all.push(o); });
        const mesh = o => ({ name: o.name, geometry: o.geometry.type, parameters: o.geometry.parameters,
            position: o.position.toArray(), rotation: o.rotation.toArray(), scale: o.scale.toArray(),
            instances: o.isInstancedMesh ? Array.from(o.instanceMatrix.array) : null,
            color: Array.isArray(o.material) ? o.material.map(m => m.color.getHex()) : o.material.color?.getHex(),
            castShadow: o.castShadow, receiveShadow: o.receiveShadow });
        const growthMesh = o => o.geometry.type === 'SphereGeometry' && o.material.color?.getHex() === 0xcc44ff;
        const originals = [];
        c.campaignContent.lab.root.traverse(o => {
            if (o.isMesh && !o.name.startsWith('CP3C') && o !== c.campaignContent.lab.field && o !== c.campaignContent.lab.turret.head) originals.push(mesh(o));
        });
        for (const o of c.scene.children) if (o.isMesh && !o.name.startsWith('CP3C') && !growthMesh(o) && o.position.x >= 295 && o.position.x <= 465 && o.position.y >= 600 && o.position.y <= 800) originals.push(mesh(o));
        for (const n of ['InteriorIdentity', 'FacilityExterior']) c.scene.getObjectByName(n).traverse(o => { if (o.isMesh && !o.name.startsWith('CP3C')) originals.push(mesh(o)); });
        const boxes = o => { o.geometry.computeBoundingBox(); const result = [];
            if(o.name.endsWith('Labels')) { const a=o.geometry.attributes.position;
                for(let i=0;i<a.count;i+=6) { const points=[];for(let j=0;j<6;j++) points.push(new c.camera.position.constructor().fromBufferAttribute(a,i+j));
                    const b=o.geometry.boundingBox.clone().setFromPoints(points).applyMatrix4(o.matrixWorld);result.push({name:o.name,min:b.min.toArray(),max:b.max.toArray()}); }
                return result; }
            for (let i = 0; i < (o.isInstancedMesh ? o.count : 1); i++) { const m = o.matrixWorld.clone();
                if (o.isInstancedMesh) { const a = m.clone(); o.getMatrixAt(i, a); m.multiply(a); }
                const b = o.geometry.boundingBox.clone().applyMatrix4(m); result.push({ name: o.name, min: b.min.toArray(), max: b.max.toArray() }); }
            return result; };
        const details = all.filter(o => o.name.startsWith('CP3C'));
        const sources = []; c.scene.traverse(o => { if (!o.isPointLight || o.userData.budgetMode !== 'campaign') return;
            const p = o.getWorldPosition(c.camera.position.clone()); sources.push({ position: p.toArray(), color: o.color.getHex(), intensity: o.intensity, range: o.distance, decay: o.decay, shadow: o.castShadow }); });
        const shots = []; for (const y of [714, 722]) for (const z of [.5, 1, 1.3, 1.62, 1.7, 2.1]) shots.push(c.probeBlocked(344,y,z,350,y,z));
        for (const y of [712,722]) for (const z of [.5,1.3,1.55,1.62,1.7,2.8]) shots.push(c.probeBlocked(380,y,z,386.1,y,z));
        for (const y of [710,728]) for (const z of [1.3,1.55,1.62,1.7]) shots.push(c.probeBlocked(335,y,z,341,y,z));
        return { originals, sources, growth: all.filter(growthMesh).map(o => ({ position: o.position.toArray(), radius: o.geometry.parameters.radius })),
            solids: c.solidsForTest().map(({x0,y0,x1,y1,topY,bottomY,overhead,portal}) => ({x0,y0,x1,y1,topY,bottomY,overhead:!!overhead,portal:portal||null})),
            map: [...ChargefrontFacility.MAP_SEGMENTS,...ChargefrontFacility.LAB_MAP_SEGMENTS], sections: c.facilitySections(),
            doors: c.facilityDoors.map(d => ({id:d.id,base:d.base,axis:d.axis,top:d.solid.topY,panels:d.panels.map(p=>({offC:p.offC,offO:p.offO,shape:p.g.children[0].geometry.parameters}))})),
            details: details.map(mesh), bounds: details.flatMap(boxes), shots,
            slots:c.performanceInfo().budgetLights.slots, budgetTotal:c.performanceInfo().budgetLights.total,
            exposure:c.renderer.toneMappingExposure, fog:[c.scene.fog.near,c.scene.fog.far] };
    })));
}
// Circle/rectangle contact against the Research room's actual inner wall faces.
const intrudesResearch = p => p.position[1] > 704 && Math.hypot(Math.max(330.7-p.position[0],0,p.position[0]-366.5), Math.max(704.7-p.position[1],0,p.position[1]-734.3)) <= p.radius;
function validate(state, baseline) {
    for (const k of ['originals','solids','map','sections','doors','shots','slots','budgetTotal','exposure','fog']) assert.deepEqual(state[k], baseline[k], 'Accepted CP3-B changed: '+k);
    assert.equal(state.solids.length,329); assert.equal(state.map.length,30); assert.equal(state.doors.length,6); assert.equal(state.slots,8);
    const removed = baseline.growth.filter(intrudesResearch);
    assert.deepEqual(state.growth,baseline.growth.filter(p=>!intrudesResearch(p)),'Growth parity/exclusion failed');
    const definition = l => { if(l.position.join(',') === '360,773.16,2.88') { assert(l.intensity>=3&&l.intensity<=4.4); return {...l,intensity:'existing pulse'}; } return l; };
    const sources = baseline.sources.filter(l=>!removed.some(p=>l.color===0xaa44ff&&Math.abs(p.position[0]-l.position[0])<1e-6&&Math.abs(p.position[1]-l.position[1])<1e-6));
    assert.deepEqual(state.sources.map(definition),sources.map(definition),'Unapproved authored lighting change');
    assert(state.details.length>0); assert(state.details.every(d=>!d.castShadow&&!d.receiveShadow));
    const hits=[];
    for(const b of state.bounds) {
        if(/Research/.test(b.name)&&b.max[0]>334&&b.min[0]<350.5&&b.min[2]<1.6) assert(b.max[2]<=1.53,'Taller research cover silhouette');
        if(/Security/.test(b.name)&&b.min[0]>382&&b.max[0]<385&&b.min[2]<1.6) assert(b.max[2]<=1.5,'Taller security desktop silhouette');
        if(/Hall/.test(b.name)) assert(b.min[0]>379,'New Hall object enters formation lane');
        if(/Containment/.test(b.name)) assert(Math.hypot(Math.max(b.min[0]-360,0,360-b.max[0]),Math.max(b.min[1]-774,0,774-b.max[1]))>12,'Sample annulus occupied');
        for(const d of state.doors) for(const p of d.panels) {
            const ax=d.axis==='x',span=ax?p.shape.width:p.shape.depth,a0=Math.min(p.offC,p.offO)-span/2,a1=Math.max(p.offC,p.offO)+span/2;
            const s=ax?[d.base[0]+a0,d.base[1]-.16,d.base[0]+a1,d.base[1]+.16]:[d.base[0]-.16,d.base[1]+a0,d.base[0]+.16,d.base[1]+a1];
            if(b.min[2]<8.2&&b.max[2]>0&&b.min[0]<s[2]&&b.max[0]>s[0]&&b.min[1]<s[3]&&b.max[1]>s[1]) hits.push(b.name+':'+d.id);
        }
    }
    assert.deepEqual(hits,[],'Added detail crosses door sweep');
    const near=(a,b)=>Math.abs(a-b)<1e-4;
    const hallTops=state.bounds.filter(b=>b.name==='CP3CHallpale');
    assert.equal(hallTops.length,2);assert(hallTops.every(b=>near(b.min[2],1.1)||near(b.min[2],1.3)),'Intake top not seated on accepted station');
    const visitor=state.bounds.find(b=>b.name==='CP3CHallLabels'&&near(b.min[2],1.132));
    assert(visitor&&visitor.min[0]>=385.97&&visitor.max[0]<=386.83,'Visitor plate buried / outside intake top');
    const reception=state.bounds.find(b=>b.name==='CP3CHallLabels'&&b.min[2]>4);
    assert(reception&&reception.min[2]>4.96&&reception.max[2]<5.55,'Reception plate overlaps existing warning / rack border');
    const research=state.bounds.filter(b=>b.name==='CP3CResearchdark');
    assert.equal(research.filter(b=>near(b.min[2],1.27)).length,2,'Analyzer control beds not seated');
    assert.equal(research.filter(b=>near(b.min[2],1.52)).length,2,'Workstation control beds not seated');
    const desktops=state.bounds.filter(b=>b.name==='CP3CSecuritydark'&&b.max[0]<385);
    assert.equal(desktops.length,10);assert(desktops.every(b=>near(b.min[2],1.475)&&b.max[2]<1.48),'Desktop bezels not seated');
    const power=state.bounds.filter(b=>b.name==='CP3CPowersteel');
    const clamps=power.filter(b=>near(b.max[1],769.3));assert.equal(clamps.length,3,'Feeder lacks wall-contacting clamps');
    const drops=power.filter(b=>b.max[2]-b.min[2]>2);assert.equal(drops.length,2);
    assert(drops.every(b=>near(b.min[2],5.59)&&near(b.max[2],7.85)),'Feeder drops disconnected from distribution / upper run');
    const batches=state.details.filter(d=>d.instances); assert(batches.length<=28,'Excessive independent detail batches');
    return { removed, doorSweepHits:hits, contacts:true, batches:batches.length, pieces:batches.reduce((n,b)=>n+b.instances.length/16,0), preservation:true };
}
const views = [
    ['H1-intake',[380,645,null],[386,650,1.5]], ['H2-hall-axis',[360,624,null],[381,651,2.8]],
    ['V1-relay',[360,677,null],[360,682.5,6.8]],
    ['D1-process',[342,697,null],[334,695,1.8]], ['D2-nozzle-mount',[362,697,null],[360,698,8.25]],
    ['R1-analysis',[351,714,null],[346.8,714,1.22]], ['R2-workstation',[343,728,null],[338,728,1.45]],
    ['S1-surveillance',[381,719,null],[387.7,722,3.2]], ['S2-desktop',[380.5,722,null],[383.7,722,1.45]],
    ['C1-sample-composition',[351,762,null],[361,777,2.8]], ['C2-archive',[388,787,null],[394,794,5.8]],
    ['P1-generator',[428,752,null],[434,764,2.1]], ['P2-distribution',[438,760,null],[439,769,5.1]],
];
async function capture(label,pos,target,seed=420042) {
    await page.evaluate(({pos,target})=>{const c=__cf;c.pause(false);c.setHud(false);c.hideViewmodel(true);c.clearTestEnemies();
        c.move(pos[0]-c.player.pos.x,pos[1]-c.player.pos.y);c.setCoverPose([pos[0],pos[1],pos[2]??c.terrainHeight(pos[0],pos[1])+c.player.eye,...target]);
        for(const m of c.squad){m.pos.x=360;m.pos.y=580;m.mesh.visible=false;}document.querySelector('#cf-perf-diagnostics').style.display='none';}, {pos,target});
    await page.waitForTimeout(1000);
    await page.waitForFunction(()=>{const c=__cf,s=c.scene.getObjectByName('LocalLightSlot0');return s.intensity>0&&s.position.distanceTo(c.camera.position)<55;},undefined,{timeout:20000});
    const receipt=await page.evaluate(()=>{const c=__cf;c.pause(true);c.render();window.__cp3cRender=true;
        const r=()=>{if(!window.__cp3cRender)return;c.render();requestAnimationFrame(r);};requestAnimationFrame(r);
        return {camera:c.camera.position.toArray(),fov:c.camera.fov,exposure:c.renderer.toneMappingExposure,fog:[c.scene.fog.near,c.scene.fog.far],slots:c.performanceInfo().budgetLights.slots,render:c.performanceInfo().render,programs:c.renderer.info.programs.length};});
    assert.equal(receipt.exposure,.78);assert.deepEqual(receipt.fog,[40,280]);assert.equal(receipt.slots,8);
    const file=label+'-normal.png';await page.screenshot({path:resolve(out,file)});await page.evaluate(()=>{window.__cp3cRender=false;});
    report.views.push({label,file,seed,lighting:'normal gameplay',...receipt});console.log('CAPTURED',stage,name,file);
}
try {
    for(const seed of [0,1,2147483647,4294967295,420042]) {
        await load(seed);const state=await snapshot(),row={seed,state};report.seeds.push(row);
        if(before) row.validation=validate(state,before.seeds.find(s=>s.seed===seed).state);
        console.log('CHECK',stage,name,seed,JSON.stringify(row.validation||{growth:state.growth}));
        if(seed===0) await capture('R0-growth-exclusion',[351,717,null],[346.65,715.24,.8],0);
    }
    for(const [label,pos,target] of views) await capture(label,pos,target);
    assert.deepEqual(errors,[]);report.passed=true;console.log('PASS CP3-C',stage,name);
} finally {writeFileSync(resolve(out,'manifest.json'),JSON.stringify(report,null,2));await browser.close();}
