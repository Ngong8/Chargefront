// CP2-R2 final correction: matched player-eye normal-lighting evidence and
// strict preservation of geometry, collision, lights, fog and shader count.
// Capture --stage=before before editing. Later stages compare its immutable receipt.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const { firefox, chromium } = await import(process.env.PLAYWRIGHT_PACKAGE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const ff = process.argv.includes('firefox'), name = ff ? 'firefox' : 'edge';
const stage = process.argv.find(a => a.startsWith('--stage='))?.slice(8) || 'after';
const root = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m42/cp2r2-visibility-20261011'), out = resolve(root, stage, name);
assert(!existsSync(out), 'Use a fresh stage; preserve previous evidence'); mkdirSync(out, { recursive: true });
const source = readFileSync('src/world/facility.js', 'utf8');
if (stage === 'before' && !existsSync(resolve(root, 'accepted-r2-facility.js'))) writeFileSync(resolve(root, 'accepted-r2-facility.js'), source);
const browser = await (ff ? firefox.launch({ headless: true }) : chromium.launch({ headless: true,
    executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    args: ['--allow-file-access-from-files', '--enable-unsafe-swiftshader'] }));
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } }), errors = [];
page.on('pageerror', e => errors.push(e.message));
const report = { stage, browser: name, sourceSha256: createHash('sha256').update(source).digest('hex'), views: [], errors };
async function sceneState() {
    return page.evaluate(() => {
        const c = __cf, geometry = [], lights = [], materials = [];
        c.scene.traverse(o => {
            if (o.isLight) lights.push({ type: o.type }); // slots/FX change intensity and pose at runtime
            // Side-service material batches may split once to leave the Power
            // cabinet unchanged. Compare individual shape/pose instances, not
            // batching layout or resource UUIDs.
            if (!o.isMesh) return;
            o.geometry.computeBoundingBox();
            for (let i = 0; i < (o.isInstancedMesh ? o.count : 1); i++) {
                const m = o.matrix.clone(); o.updateMatrix(); m.copy(o.matrix);
                if (o.isInstancedMesh) { const a = m.clone(); o.getMatrixAt(i, a); m.multiply(a); }
                geometry.push({ name: o.name, parameters: o.geometry.parameters, matrix: Array.from(m.elements),
                    indices: o.geometry.index?.count, vertices: o.geometry.attributes.position.count });
            }
            const x = o.position.x, y = o.position.y;
            if ((x === 330 || x === 390) && y === 639 && o.geometry.parameters?.height === 9) {
                const a = Array.isArray(o.material) ? o.material : [o.material];
                materials.push({ side: x === 330 ? 'west' : 'east', faces: a.map(m => ({ color: m.color.getHex(), emissive: m.emissive.getHex(),
                    emissiveIntensity: m.emissiveIntensity, roughness: m.roughness, metalness: m.metalness })), groups: o.geometry.groups });
            }
        });
        geometry.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        return { geometry, lights, materials, solids: c.environmentPlacementSolidsForTest(), map: [...ChargefrontFacility.MAP_SEGMENTS, ...ChargefrontFacility.LAB_MAP_SEGMENTS],
            exposure: c.renderer.toneMappingExposure, fog: [c.scene.fog.near, c.scene.fog.far], slots: c.performanceInfo().budgetLights.slots,
            programs: c.renderer.info.programs.length };
    });
}
try {
    const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics', '1');
    await page.goto(url.href, { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.__cf?.renderer, undefined, { timeout: 120000 });
    await page.evaluate(() => { const c = __cf, old = Math.random; Math.random = ChargefrontProgression.seedRandom(420042);
        try { c.resetCampaignProgress(); if (!c.startMission('dead_signal', 'new_campaign')) throw Error('Campaign failed'); }
        finally { Math.random = old; } c.skipIntro(); c.completeMission(); c.setNoSpawn(true); c.setNoAggro(true); c.setInvulnerable(true); c.clearTestEnemies(); });
    await page.evaluate(() => __cf.waitCombatPreparation()); await page.waitForTimeout(1500);
    report.state = await sceneState();
    for (const [label, x, y, tx, ty, tz] of [
        ['west-eye', 310, 640, 330, 640, 5], ['east-eye', 412, 640, 390, 640, 5],
        ['west-service-eye', 320, 638, 330, 638, 2.4], ['east-service-eye', 400, 638, 390, 638, 2.4],
    ]) {
        await page.evaluate(({ x, y, tx, ty, tz }) => { const c = __cf; c.pause(false); c.setHud(false); c.hideViewmodel(true);
            c.move(x - c.player.pos.x, y - c.player.pos.y); c.setCoverPose([x, y, c.terrainHeight(x, y) + c.player.eye, tx, ty, tz]);
            c.squad.forEach((m, i) => { m.pos.x = 360 + i; m.pos.y = 580; });
            document.querySelector('#cf-perf-diagnostics').style.display = 'none'; }, { x, y, tx, ty, tz });
        await page.waitForTimeout(700);
        const view = await page.evaluate(() => { const c = __cf; c.pause(true); c.render();
            window.__visRender = true; const r = () => { if (!window.__visRender) return; c.render(); requestAnimationFrame(r); }; requestAnimationFrame(r);
            const gl = c.renderer.getContext(), rgba = new Uint8Array(4), samples = [];
            // Samples on an unobstructed wall patch (not the lamp hotspot or HUD).
            for (const y of [1.8, 2.6, 3.4]) for (const z of [3.2, 4, 4.8]) {
                const west = c.camera.position.x < 330, p = new c.camera.position.constructor(west ? 328.99 : 391.01, 638 + y, z).project(c.camera);
                if (p.z < -1 || p.z > 1 || Math.abs(p.x) >= 1 || Math.abs(p.y) >= 1) continue;
                gl.readPixels(Math.floor((p.x * .5 + .5) * gl.drawingBufferWidth), Math.floor((p.y * .5 + .5) * gl.drawingBufferHeight), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
                samples.push(Array.from(rgba.slice(0, 3)));
            }
            return { camera: c.camera.position.toArray(), eye: c.player.eye, normalLighting: true, exposure: c.renderer.toneMappingExposure,
                fog: [c.scene.fog.near, c.scene.fog.far], calls: c.performanceInfo().render.calls, programs: c.renderer.info.programs.length, samples }; });
        await page.screenshot({ path: resolve(out, label + '.png') }); await page.evaluate(() => { window.__visRender = false; });
        report.views.push({ label, ...view }); console.log('CAPTURED normal', label);
    }
    if (stage !== 'before') {
        const originalBefore = resolve(root, 'before', name, 'manifest.json');
        // The checkpoint includes compact receipts rather than entire scene
        // dumps. Preserve local raw evidence; both carry the same geometry hash.
        const before = JSON.parse(readFileSync(existsSync(originalBefore) ? originalBefore : resolve(root, 'baselines', `before-${name}.json`), 'utf8'));
        // Startup FX/enemy/pickup poses are time-dependent. Fixed world-coordinate
        // facility boxes have invariant dimensions/poses; full doors/supports and
        // enclosure are additionally covered by the authoritative existing suites.
        const fixedBoxes = a => a.filter(o => o.parameters?.depth !== undefined && o.matrix[12] >= 329 && o.matrix[12] <= 451.1 && o.matrix[13] >= 600 && o.matrix[13] <= 796);
        const digest = a => createHash('sha256').update(JSON.stringify(a)).digest('hex');
        report.fixedGeometry = { before: before.state.geometryDigest || digest(fixedBoxes(before.state.geometry)), after: digest(fixedBoxes(report.state.geometry)) };
        assert.equal(report.fixedGeometry.after, report.fixedGeometry.before, 'Fixed facility box geometry/poses changed');
        before.state.lights = before.state.lights.map(o => ({ type: o.type }));
        for (const k of ['lights', 'solids', 'map', 'exposure', 'fog', 'slots', 'programs'])
            assert.deepEqual(JSON.parse(JSON.stringify(report.state[k])), before.state[k], 'Accepted shape/render state changed: ' + k);
        report.comparison = report.views.map(v => { const b = before.views.find(q => q.label === v.label);
            const luminance = a => a.samples.reduce((sum, p) => sum + .2126 * p[0] + .7152 * p[1] + .0722 * p[2], 0) / a.samples.length;
            return { label: v.label, callsDelta: v.calls - b.calls, luminanceBefore: luminance(b), luminanceAfter: luminance(v), programs: v.programs }; });
        // The first camera tour reveals existing renderer variants not yet used
        // by the initial pose (also present in the before run). Compare the fully
        // exposed tour, not its cold-start count. No additional variant is allowed.
        const beforePrograms = Math.max(...before.views.map(v => v.programs));
        assert.equal(Math.max(...report.views.map(v => v.programs)), beforePrograms, 'Additional side-wall shader variant');
        report.warmedTour = await page.evaluate(() => {
            const c = __cf, before = c.renderer.info.programs.length;
            for (const [x,y,tx] of [[310,640,330],[412,640,390],[320,638,330],[400,638,390]]) {
                c.setCoverPose([x,y,c.terrainHeight(x,y)+c.player.eye,tx,y,3]); c.render();
            }
            return { before, after: c.renderer.info.programs.length };
        });
        assert.equal(report.warmedTour.after, report.warmedTour.before, 'Shader compilation during warmed camera tour');
        report.materialBenchmark = await page.evaluate(async () => {
            const c = __cf, walls = [], changed = [];
            c.scene.traverse(o => { if (!o.isMesh) return;
                if (Array.isArray(o.material) && o.position.y === 639 && [330,390].includes(o.position.x)) walls.push(o);
                if (o.name === 'ExteriorIdentitySideVentFrame' || o.name === 'ExteriorIdentityMaintenanceCabinet' && o.count === 2) changed.push(o);
            });
            const saved = [...walls, ...changed].map(o => ({ o, material: o.material }));
            const originalFrame = c.scene.getObjectByName('ExteriorIdentityAirIntakeFrame').material;
            const powerCabinet = c.scene.getObjectsByProperty('name', 'ExteriorIdentityMaintenanceCabinet').find(o => o.count === 1).material;
            const gl = c.renderer.getContext(), samples = { before: [], after: [] }, draws = {}, programStart = c.renderer.info.programs.length;
            const median = a => [...a].sort((a,b) => a-b)[Math.floor(a.length/2)];
            try {
                c.pause(true);
                // Balanced ABBA blocks at both unchanged eye-level poses. These
                // synchronous render timings include a GPU completion barrier;
                // they estimate material/pass overhead, not gameplay FPS.
                for (const [x,tx] of [[310,330],[412,390]]) {
                    c.setCoverPose([x,640,c.terrainHeight(x,640)+c.player.eye,tx,640,5]);
                    for (const mode of ['before','after','after','before']) {
                        saved.forEach(({o,material}) => { o.material = mode === 'after' ? material : walls.includes(o) ? material[0] : o.name === 'ExteriorIdentitySideVentFrame' ? originalFrame : powerCabinet; });
                        c.render(); gl.finish();
                        for (let i = 0; i < 24; i++) {
                            await new Promise(requestAnimationFrame); gl.finish(); const start = performance.now();
                            c.render(); gl.finish(); samples[mode].push(performance.now() - start); draws[mode] = c.performanceInfo().render.calls;
                        }
                    }
                }
                const before = median(samples.before), after = median(samples.after);
                return { samplesPerState: samples.before.length, medianBeforeMs: before, medianAfterMs: after, ratio: after / before,
                    drawCalls: draws, programStart, programEnd: c.renderer.info.programs.length };
            } finally { saved.forEach(({o,material}) => { o.material = material; }); }
        });
        assert.equal(report.materialBenchmark.programEnd, report.materialBenchmark.programStart, 'Benchmark created shader variants');
    }
    assert.deepEqual(errors, []); report.passed = true; console.log('PASS normal-lighting side visibility', stage, name);
} finally { writeFileSync(resolve(out, 'manifest.json'), JSON.stringify(report, null, 2)); await browser.close(); }
