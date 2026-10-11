// CP2-R2: actual file:// runtime inventory, strict accepted-R1 preservation,
// cabinet/door clearance and matched normal/diagnostic screenshots.
// Run --stage=before before editing; subsequent stages compare that immutable baseline.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const { firefox, chromium } = await import(process.env.PLAYWRIGHT_PACKAGE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const ff = process.argv.includes('firefox'), name = ff ? 'firefox' : 'edge';
const stage = process.argv.find(a => a.startsWith('--stage='))?.slice(8) || 'after';
const captureEnabled = !process.argv.includes('--verify-only');
const root = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m42/cp2r2-20261011');
const out = resolve(root, stage, name);
assert(!existsSync(out), 'Use a fresh stage; preserve earlier evidence'); mkdirSync(out, { recursive: true });
const source = readFileSync('src/world/facility.js', 'utf8');
if (stage === 'before' && !existsSync(resolve(root, 'accepted-r1-facility.js'))) writeFileSync(resolve(root, 'accepted-r1-facility.js'), source);
const browser = await (ff ? firefox.launch({ headless: true }) : chromium.launch({ headless: true,
    executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    args: ['--allow-file-access-from-files', '--enable-unsafe-swiftshader'] }));
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } }), errors = [];
page.on('pageerror', e => errors.push(e.message));
const report = { stage, browser: name, sourceSha256: createHash('sha256').update(source).digest('hex'), seed: 420042, views: [], errors };
async function snapshot() {
    return page.evaluate(() => {
        const c = __cf, F = ChargefrontFacility;
        const mesh = o => ({ name: o.name, geometry: o.geometry?.type, parameters: o.geometry?.parameters,
            position: o.position.toArray(), rotation: o.rotation.toArray(), scale: o.scale.toArray(),
            instances: o.isInstancedMesh ? Array.from(o.instanceMatrix.array) : null, count: o.count });
        const selected = names => names.map(n => mesh(c.scene.getObjectByName(n)));
        const all = []; c.scene.traverse(o => { if (o.isMesh) all.push(o); });
        const lab = []; c.campaignContent.lab.root.traverse(o => { if (o.isMesh && o.name !== 'FacilityEmergencyExitSign' && o !== c.campaignContent.lab.field && o !== c.campaignContent.lab.turret.head) lab.push(mesh(o)); });
        const exterior = c.scene.getObjectByName('ExteriorIdentity'), details = [];
        exterior.traverse(o => { if (o.isMesh) details.push(mesh(o)); });
        const staging = all.find(o => o.geometry.type === 'PlaneGeometry' && o.position.x === 316 && o.position.y === 576.8);
        return { solids: c.solidsForTest().map(({ x0, y0, x1, y1, topY, bottomY, overhead, portal }) => ({ x0, y0, x1, y1, topY, bottomY, overhead: !!overhead, portal: portal || null })),
            map: [...F.MAP_SEGMENTS, ...F.LAB_MAP_SEGMENTS], sections: c.facilitySections(),
            core: selected(['FacilityHallRoof', 'FacilityVaultRoof', 'ResearchCeiling', 'ContainmentCeiling', 'EmergencyPassageCeiling',
                'HallEastPerimeterWall', 'ContainmentNorthReturnWall', 'LabSouthReturnWallWest', 'LabSouthReturnWallEast', 'FacilityRoofCoping', 'FacilityCraneMast', 'FacilityNameSign']),
            portals: all.filter(o => o.name === 'DoorPortalBatch').map(mesh), lab, staging: mesh(staging),
            supports: details.filter(o => /EquipmentPlinth|CapGasket|HvacSkid|DuctFoot|NameBacking|NameBracket|NameUpright/.test(o.name)),
            doors: c.facilityDoors.map(d => ({ id: d.id, base: d.base, axis: d.axis, panels: d.panels.map(p => ({ offC: p.offC, offO: p.offO,
                geometry: p.g.children[0].geometry.parameters, seam: p.seam.geometry.parameters })), top: d.solid.topY })),
            inventory: all.map(o => o.name).filter(Boolean), details,
            resources: c.performanceInfo() };
    });
}
async function capture(label, pos, target, fill) {
    await page.evaluate(({ pos, target, fill }) => {
        const c = __cf; c.pause(false); c.setHud(false); c.hideViewmodel(true);
        c.move(pos[0] - c.player.pos.x, pos[1] - c.player.pos.y);
        c.setCoverPose([pos[0], pos[1], pos[2] ?? c.terrainHeight(pos[0], pos[1]) + 1.7, ...target]);
        for (const m of c.squad) { m.pos.x = pos[0] - 30; m.pos.y = pos[1] - 30; }
        document.querySelector('#cf-perf-diagnostics').style.display = 'none';
        if (!window.__refineFill) {
            let h, d; c.scene.traverse(o => { if (!h && o.isHemisphereLight) h = o; if (!d && o.isDirectionalLight) d = o; });
            const a = new h.constructor(0xa9c8dd, 0x2a2438, 1.15), b = new d.constructor(0xc8d8e8, .9);
            b.position.set(120, -80, 180); a.castShadow = b.castShadow = false; c.scene.add(a, b);
            window.__refineFill = { lights: [a, b], exposure: c.renderer.toneMappingExposure };
        }
        for (const light of window.__refineFill.lights) light.visible = fill;
        c.renderer.toneMappingExposure = fill ? 1.25 : window.__refineFill.exposure;
    }, { pos, target, fill });
    await page.waitForTimeout(700);
    const receipt = await page.evaluate(() => { const c = __cf; c.pause(true); c.render();
        window.__refineRender = true; const r = () => { if (!window.__refineRender) return; c.render(); requestAnimationFrame(r); }; requestAnimationFrame(r);
        return { camera: c.camera.position.toArray(), exposure: c.renderer.toneMappingExposure, fog: [c.scene.fog.near, c.scene.fog.far],
            calls: c.performanceInfo().render.calls, triangles: c.performanceInfo().render.triangles, mission: c.missionId }; });
    await page.screenshot({ path: resolve(out, label + '.png') });
    await page.evaluate(() => { window.__refineRender = false; });
    report.views.push({ label, pos, target, fill, ...receipt }); console.log('CAPTURED', label);
}
const views = [
    ['entrance', [360, 594, null], [360, 618, 5]],
    ['west-side', [310, 640, null], [330, 640, 5]],
    ['east-side', [412, 640, null], [390, 640, 5]],
    ['service-yard', [450, 684, null], [412, 662, 4]],
    ['overview', [285, 575, 62], [378, 712, 0]],
    ['roof-detail', [304, 590, 32], [360, 646, 9]],
    ['power-north', [446, 794, null], [428, 770, 5]],
];
try {
    const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics', '1');
    await page.goto(url.href, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__cf?.renderer, undefined, { timeout: 120000 });
    await page.evaluate(() => { const c = __cf, old = Math.random; Math.random = ChargefrontProgression.seedRandom(420042);
        try { c.resetCampaignProgress(); if (!c.startMission('dead_signal', 'new_campaign')) throw Error('Campaign fixture failed'); }
        finally { Math.random = old; } c.skipIntro(); c.completeMission(); c.setNoSpawn(true); c.setNoAggro(true); c.setInvulnerable(true); c.clearTestEnemies(); });
    await page.evaluate(() => __cf.waitCombatPreparation()); await page.waitForTimeout(1500);
    report.structure = await snapshot();
    if (stage !== 'before') {
        const before = JSON.parse(readFileSync(resolve(root, 'before', name, 'manifest.json'), 'utf8'));
        for (const key of ['solids', 'map', 'sections', 'core', 'portals', 'lab', 'staging', 'supports', 'doors'])
            assert.deepEqual(JSON.parse(JSON.stringify(report.structure[key])), before.structure[key], 'Accepted R1 changed: ' + key);
        assert.equal(report.structure.resources.budgetLights.slots, 8);
        assert.equal(report.structure.resources.budgetLights.total, before.structure.resources.budgetLights.total);
        report.refinement = await page.evaluate(() => {
            const c = __cf, forbidden = ['ExteriorIdentityAirSign', 'FacilityLoadingSign', 'FacilityPowerSign', 'ExteriorIdentityArchiveSign',
                'ExteriorIdentityArchiveBacking', 'ExteriorIdentityWeathering', 'ExteriorIdentityFacadePanel', 'ExteriorIdentityPowerPanel',
                'ExteriorIdentityEgressBacking', 'ExteriorIdentityEgressMount', 'ExteriorIdentityEgressBracket'];
            const present = forbidden.filter(n => c.scene.getObjectByName(n)); // existence, not visibility
            const e = c.scene.getObjectByName('FacilityEmergencyExitSign'), id = c.scene.getObjectByName('FacilityExitIdentifier');
            c.scene.updateMatrixWorld(true);
            const boxes = []; c.scene.getObjectByName('ExteriorIdentity').traverse(o => {
                if (!o.isMesh) return; o.geometry.computeBoundingBox();
                for (let i = 0; i < (o.isInstancedMesh ? o.count : 1); i++) {
                    const m = o.matrixWorld.clone(); if (o.isInstancedMesh) { const a = m.clone(); o.getMatrixAt(i, a); m.multiply(a); }
                    const b = o.geometry.boundingBox.clone().applyMatrix4(m); boxes.push({ name: o.name, min: b.min.toArray(), max: b.max.toArray() });
                }
            });
            const cabinets = boxes.filter(b => b.name === 'ExteriorIdentityMaintenanceCabinet');
            const projection = b => b.min[0] > 410 ? 735.3 - b.min[1] : b.max[0] < 330 ? 329 - b.min[0] : b.max[0] - 391;
            const maxProjection = cabinets.map(projection);
            const serviceProjection = boxes.filter(b => /MaintenanceCabinet|CabinetStatus|WallRaceway/.test(b.name)).map(projection);
            const sweepHits = []; for (const b of boxes) for (const d of c.facilityDoors) {
                const ax = d.axis === 'x', [x, y] = d.base;
                for (const p of d.panels) {
                    const g = p.g.children[0].geometry.parameters, along = ax ? g.width : g.depth;
                    const a0 = Math.min(p.offC, p.offO) - along / 2, a1 = Math.max(p.offC, p.offO) + along / 2;
                    const s = ax ? { x0: x + a0, x1: x + a1, y0: y - .16, y1: y + .16 } : { x0: x - .16, x1: x + .16, y0: y + a0, y1: y + a1 };
                    if (b.min[2] < 8.2 && b.max[2] > 0 && b.min[0] < s.x1 && b.max[0] > s.x0 && b.min[1] < s.y1 && b.max[1] > s.y0) sweepHits.push(b.name + ':' + d.id);
                }
            }
            return { forbiddenPresent: present, cabinets, maxProjection, serviceProjection, sweepHits,
                exitSign: { pos: e.position.toArray(), scale: e.scale.toArray(), rotation: e.rotation.toArray(), parent: e.parent.name },
                identifier: { pos: id.position.toArray(), text: id.userData.text },
                northOrRearIdentity: boxes.filter(b => b.max[1] > 769.9 && !/Equipment|CapGasket|HvacSkid|DuctFoot/.test(b.name)) };
        });
        assert.deepEqual(report.refinement.forbiddenPresent, [], 'Removed runtime objects remain');
        assert.equal(report.refinement.cabinets.length, 3);
        assert(report.refinement.cabinets.every(b => b.min[2] >= .3 && b.max[2] <= 2.1));
        assert(report.refinement.maxProjection.every(p => p <= .3 + 1e-6), 'Cabinet projects into actor stand-off');
        assert(report.refinement.serviceProjection.every(p => p <= .35), 'Service trim projects into actor stand-off');
        assert.deepEqual(report.refinement.sweepHits, [], 'Decoration intersects door sweep');
        assert.deepEqual(report.refinement.northOrRearIdentity, [], 'Unnecessary north/rear wall detail remains');
        assert.equal(report.refinement.exitSign.parent, 'DeepLaboratory');
        assert(report.refinement.exitSign.pos[0] < 449.05 && report.refinement.exitSign.pos[2] >= 8.2);
        assert.equal(report.refinement.identifier.text, 'E-04');
    }
    if (captureEnabled) for (const [label, pos, target] of views) for (const fill of [false, true]) await capture(label + (fill ? '-diagnostic' : '-normal'), pos, target, fill);
    await page.evaluate(() => { __cf.setCoverPose(null); __cf.pause(false); __cf.completeMission(); __cf.completeMission(); __cf.clearTestEnemies(); });
    await page.waitForTimeout(1200);
    for (const [label, pos, target] of [
        ['exit-outside', [464, 752, null], [449, 752, 6.3]],
        ['exit-inside', [420, 752, null], [452, 752, 4]],
        ['exit-sign-detail', [436, 752, 4], [449, 752, 8.55]],
        ['power-yard', [435, 719, null], [430, 736, 4]],
    ]) if (captureEnabled) for (const fill of [false, true]) await capture(label + (fill ? '-diagnostic' : '-normal'), pos, target, fill);
    if (stage !== 'before') {
        const before = JSON.parse(readFileSync(resolve(root, 'before', name, 'manifest.json'), 'utf8'));
        report.comparison = report.views.map(v => { const b = before.views.find(q => q.label === v.label); return { label: v.label, callsBefore: b.calls, callsAfter: v.calls, delta: v.calls - b.calls }; });
    }
    assert.deepEqual(errors, []); report.passed = true;
    console.log('PASS CP2-R2 refinement', stage, name);
} finally { writeFileSync(resolve(out, 'manifest.json'), JSON.stringify(report, null, 2)); await browser.close(); }
