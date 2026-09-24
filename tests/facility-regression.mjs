// Run with PLAYWRIGHT_PACKAGE pointing to an installed playwright/index.mjs,
// or install Playwright locally. Uses the actual file:// game and its test hooks.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const packagePath = process.env.PLAYWRIGHT_PACKAGE;
const { chromium, firefox } = await import(packagePath ? pathToFileURL(resolve(packagePath)).href : 'playwright');
const browserPath = [process.env.CHROME_PATH, 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find((path) => path && existsSync(path));
const useFirefox = process.argv[2] === 'firefox';
if (!useFirefox) assert(browserPath, 'Set CHROME_PATH to a Chrome/Edge executable');
const browser = useFirefox ? await firefox.launch({ headless: true })
    : await chromium.launch({ executablePath: browserPath, headless: true,
        args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const errors = [];
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
const url = pathToFileURL(resolve('chargefront.html'));
url.searchParams.set('perfDiagnostics', '1');
const check = async (label, fn) => {
    const result = await page.evaluate(fn);
    console.log(label, JSON.stringify(result));
    return result;
};

try {
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__cf && window.__cf.renderer && window.__cfPerf, undefined, { timeout: 90000 });
    const m1 = await check('M1', () => {
        const cf = window.__cf;
        cf.resetCampaignProgress();
        if (!cf.startMission('dead_signal', 'new_campaign')) throw Error('M1 did not start');
        cf.skipIntro(); cf.setNoAggro(true); cf.setInvulnerable(true); cf.clearTestEnemies();
        return { mission: cf.missionId, origin: cf.runOrigin, ship: cf.spacecraftState,
            sections: cf.facilitySections().map((section) => section.name), solids: cf.solidCount,
            shell: cf.scene.getObjectByName('FacilityHallRoof') !== undefined };
    });
    assert.equal(m1.mission, 'dead_signal');
    assert(m1.shell && m1.solids > 0);
    assert.deepEqual(m1.sections, ['shell', 'hall', 'staging', 'laboratory', 'exterior', 'interior']);

    const geometry = await check('Routes and collision', () => {
        const cf = window.__cf;
        return {
            routes: ['m1', 'm2_alpha', 'm2_beta', 'm2_gamma', 'm2_return', 'm3', 'm4'].map((name) => [name, cf.routeClearance(name, 120)]),
            hallWall: cf.insideSolid(330, 638), frontOpening: cf.insideSolid(360, 611),
            bypass: cf.insideSolid(360, 585), west: cf.insideSolid(285, 610),
            wallBlocksShot: cf.probeBlocked(320, 638, 1.7, 340, 638, 1.7),
            mapSegments: window.ChargefrontFacility.MAP_SEGMENTS.length + window.ChargefrontFacility.LAB_MAP_SEGMENTS.length,
        };
    });
    assert(geometry.hallWall && !geometry.frontOpening && !geometry.bypass && geometry.wallBlocksShot);
    assert.equal(geometry.mapSegments, 20);

    const continuity = await check('M1→M4', () => {
        const cf = window.__cf;
        const initialShell = cf.scene.getObjectByName('FacilityHallRoof');
        const initialSolids = cf.solidCount;
        const pointLights = () => {
            let count = 0;
            cf.scene.traverse((object) => {
                if (!object.isPointLight) return;
                for (let p = object; p; p = p.parent) {
                    if (!p.visible) return;
                }
                count++;
            });
            return count;
        };
        const initialLights = pointLights();
        const snapshots = [];
        for (const id of ['power_through', 'sample_zero', 'break_contact']) {
            cf.completeMission(); cf.setNoAggro(true); cf.setInvulnerable(true); cf.clearTestEnemies();
            snapshots.push({ mission: cf.missionId, ship: cf.spacecraftState, sameShell: initialShell === cf.scene.getObjectByName('FacilityHallRoof'),
                sameSolids: initialSolids === cf.solidCount, pointLights: pointLights() });
        }
        return { snapshots, initialLights, save: cf.campaignProfile.operation, doors: cf.scene.getObjectByName('DeepLaboratory')?.visible };
    });
    assert.deepEqual(continuity.snapshots.map((s) => s.mission), ['power_through', 'sample_zero', 'break_contact']);
    assert(continuity.snapshots.every((s) => s.sameShell && s.sameSolids));
    assert(continuity.snapshots.every((s) => s.pointLights === continuity.initialLights));
    assert(continuity.doors);

    const navigation = await check('Squad / Infested / relay guidance / shooting', () => {
        const cf = window.__cf;
        cf.startMission('power_through', 'mission_select');
        cf.setNoAggro(true); cf.setInvulnerable(true); cf.clearTestEnemies();
        const westEast = cf.navigationWaypoint(245, 748, 575, 585);
        const eastWest = cf.navigationWaypoint(575, 585, 245, 748);
        const squad = cf.squadInfo();
        cf.commandSquad('assist');
        const infested = cf.spawnTestEnemy('runner', 8, 0);
        const enemyWaypoint = cf.navigationWaypoint(245, 748, 575, 585);
        const blockedShot = cf.probeBlocked(320, 638, 1.7, 340, 638, 1.7);
        const clearShot = cf.probeBlocked(355, 630, 1.7, 365, 630, 1.7);
        cf.fire();
        const shots = cf.shots.length;
        cf.clearTestEnemies();
        return { westEast, eastWest, squadCount: squad.length, squadPositions: squad.map((m) => m.position),
            enemy: infested.type, enemyWaypoint, blockedShot, clearShot, shots };
    });
    assert(navigation.westEast && navigation.eastWest && navigation.enemyWaypoint);
    assert(navigation.squadCount === 3 && navigation.enemy === 'runner');
    assert(navigation.blockedShot && !navigation.clearShot);

    const select = await check('Mission Select / Continue', () => {
        const cf = window.__cf;
        const selected = cf.startMission('power_through', 'mission_select');
        const missionSelect = { selected, mission: cf.missionId, ship: cf.spacecraftState };
        const saved = JSON.parse(localStorage.cf_campaign_v1);
        const continued = cf.startMission(saved.operation.worldSnapshot, 'continue_campaign');
        const continuation = { continued, mission: cf.missionId, ship: cf.spacecraftState };
        return { missionSelect, continuation, savedMission: saved.operation.worldSnapshot };
    });
    assert(select.missionSelect.selected && select.continuation.continued);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__cf && window.__cf.renderer, undefined, { timeout: 90000 });
    const restored = await check('Continue after reload', () => {
        const cf = window.__cf;
        const stored = cf.campaignProfile.operation;
        const started = cf.startMission(stored.worldSnapshot, 'continue_campaign');
        return { started, mission: cf.missionId, ship: cf.spacecraftState, phase: cf.phaseName,
            snapshotMission: stored.continuedState?.missionId, sections: cf.facilitySections().length };
    });
    assert(restored.started && restored.mission === 'break_contact' && restored.snapshotMission === 'break_contact');
    assert.equal(restored.sections, 6);

    const m4 = await check('M4 purge → board → result', () => {
        const cf = window.__cf;
        cf.setNoAggro(true); cf.setInvulnerable(true);
        cf.setPhase(26); // M4_CALL_EXTRACTION, after reaching the extraction beacon
        const hold = cf.startExtraction();
        cf.clearTestEnemies();
        const purge = cf.completeExtractionHoldout();
        const infestation = cf.infestationInfo();
        const board = cf.boardExtraction();
        const depart = cf.completeExtractionDeparture();
        return { hold, purge, cleared: infestation?.cleared, board, depart, phase: cf.phaseName, ship: cf.spacecraftState };
    });
    assert(m4.cleared && m4.depart === 'DONE' && m4.phase === 'DONE');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__cf && window.__cf.renderer, undefined, { timeout: 90000 });
    const endless = await check('Endless independent world', () => {
        const cf = window.__cf;
        cf.startEndlessMode();
        return { mode: cf.mode, phase: cf.phaseName, facilitySections: cf.facilitySections().length };
    });
    assert.equal(endless.mode, 'endless');
    assert.equal(endless.facilitySections, 0);

    // Fresh page, same path as the diagnostic baseline: LZ → facility → Alpha →
    // Beta → west/east bypass → Gamma → facility, forward and reverse at 14 m/RAF.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__cf && window.__cf.renderer && window.__cfPerf, undefined, { timeout: 90000 });
    const benchmark = await page.evaluate(async () => {
        const cf = window.__cf, perf = window.__cfPerf;
        cf.startMission('power_through', 'mission_select');
        cf.setNoAggro(true); cf.setInvulnerable(true); cf.clearTestEnemies();
        const shell = cf.scene.getObjectByName('FacilityHallRoof');
        const sections = cf.facilitySections();
        const solidCount = cf.solidCount;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        perf.reset();
        const legs = [
            [[450, 80], [360, 580]],
            [[360, 606], [405, 643], [425, 705]],
            [[425, 705], [360, 580], [205, 575], [245, 748]],
            [[245, 748], [285, 690], [285, 585], [450, 570], [575, 585]],
            [[575, 585], [505, 605], [455, 625], [392, 644], [360, 650]],
        ];
        const counts = [];
        for (const route of legs) {
            for (const points of [route, [...route].reverse()]) for (let i = 0; i < points.length - 1; i++) {
                const [ax, ay] = points[i], [bx, by] = points[i + 1];
                const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 14);
                for (let j = 1; j <= n; j++) {
                    const t = j / n;
                    cf.move(ax + (bx - ax) * t - cf.player.pos.x, ay + (by - ay) * t - cf.player.pos.y);
                    await new Promise((resolve) => requestAnimationFrame(resolve));
                }
            }
            counts.push(perf.summary().counters);
        }
        const summary = perf.summary(), info = cf.performanceInfo();
        const frames = perf.report().frames;
        const minimapFrames = frames.filter((frame) => frame.ops.drawMinimap).length;
        const linkFrames = frames.map((frame, index) => ({ frame, index }))
            .filter(({ frame }) => frame.delta.linkProgram)
            .slice(0, 8).map(({ frame, index }) => ({ index, ms: frame.ms, renderMs: frame.renderMs,
                position: frame.state ? [frame.state.x, frame.state.y] : null, links: frame.delta.linkProgram,
                programs: frame.events.filter((e) => e.name === 'shaderPrograms').flatMap((e) => e.newPrograms || []) }));
        return { frames: summary.frames, p95Ms: summary.p95Ms, worstMs: summary.worstMs,
            over100: summary.over100, links: summary.counters.linkProgram || 0,
            geometryCreated: summary.counters.geometriesCreated || 0,
            materialsCreated: summary.counters.materialsCreated || 0,
            worldBuilds: summary.counters.buildCampaignWorld || 0,
            navRebuilds: summary.counters.collisionNavRebuild || 0,
            drawCalls: info.render.calls, meshes: info.counts.meshes, solids: info.solids,
            lightSlots: info.budgetLights.slots, programs: cf.renderer.info.programs.length, minimapFrames, linkFrames,
            staticFacility: cf.scene.getObjectByName('FacilityHallRoof') === shell
                && JSON.stringify(cf.facilitySections()) === JSON.stringify(sections) && cf.solidCount === solidCount };
    });
    console.log('A–E traversal', JSON.stringify(benchmark));
    assert.equal(benchmark.worldBuilds, 0);
    assert.equal(benchmark.navRebuilds, 0);
    assert.equal(benchmark.lightSlots, 8);
    assert(benchmark.staticFacility); // encounter spawns may allocate transient enemy meshes
    assert(benchmark.minimapFrames > 0);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS facility regression');
} finally {
    await browser.close();
}
