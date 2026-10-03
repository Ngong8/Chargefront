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
    assert.equal(geometry.mapSegments, 28); // continuous Hall wall replaces two side-door segments

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

    const interior = await check('Facility rooms / floor / cover / exit', () => {
        const cf = window.__cf;
        const open = [[360, 610], [360, 625], [360, 645], [360, 673], [360, 696], [360, 704],
            [360, 714], [367, 718], [373, 718], [360, 727], [360, 748],
            [360, 766], [368, 774], [360, 783], [352, 774], [430, 752], [446, 752]];
        const blocked = open.filter(([x, y]) => cf.insideSolid(x, y));
        const grade = open.map(([x, y]) => +cf.terrainHeight(x, y).toFixed(2));
        const labCover = cf.probeBlocked(333, 710, 0.9, 343, 710, 0.9);
        const overCover = cf.probeBlocked(333, 710, 3.0, 343, 710, 3.0);
        const researchWall = cf.probeBlocked(361, 708, 2, 378, 708, 2);
        const partitionOpening = cf.probeBlocked(361, 718, 2, 373, 718, 2);
        const exitWall = cf.probeBlocked(444, 741, 2, 455, 741, 2);
        const info = cf.performanceInfo();
        return { blocked, grade, labCover, overCover, researchWall, partitionOpening, exitWall,
            researchBenches: cf.scene.getObjectsByProperty('name', 'AnalysisBench').length,
            securityStations: cf.scene.getObjectsByProperty('name', 'SecurityWorkstation').length,
            serviceGenerators: cf.scene.getObjectsByProperty('name', 'ServiceGenerator').length,
            triangles: info.render.triangles, lights: info.budgetLights.slots };
    });
    assert.deepEqual(interior.blocked, []);
    assert(interior.grade.slice(1).every((height) => height < 0.2));
    assert(interior.labCover && !interior.overCover && interior.researchWall && !interior.partitionOpening && interior.exitWall);
    assert(interior.researchBenches >= 2 && interior.securityStations >= 2 && interior.serviceGenerators === 4);
    const perimeter = await check('Repaired structural perimeter / retired side entrance', () => {
        const cf = window.__cf;
        const leaks = [];
        for (const x of [391, 396, 400, 404, 409]) for (const z of [0.5, 1.8, 8.8]) {
            if (!cf.probeBlocked(x, 731, z, x, 739, z) || !cf.probeBlocked(x, 739, z, x, 731, z)) leaks.push([x, z]);
        }
        return { leaks, wall: cf.scene.getObjectByName('ContainmentNorthReturnWall')?.geometry.parameters,
            gapSolid: cf.insideSolid(400, 735), eastSolid: cf.insideSolid(390, 644),
            eastBlocksShot: cf.probeBlocked(386, 644, 1.8, 394, 644, 1.8),
            removedAccess: !cf.scene.getObjectByName('RelayServiceAccess'),
            retainedArchive: !!cf.scene.getObjectByName('ArchiveMonitorBay'),
            openM4Lane: !cf.probeBlocked(412, 752, 1.8, 447, 752, 1.8) };
    });
    assert.deepEqual(perimeter.leaks, []);
    assert.equal(perimeter.wall.height, 9);
    assert.equal(perimeter.wall.depth, 1.4);
    assert(perimeter.gapSolid && perimeter.eastSolid && perimeter.eastBlocksShot && perimeter.removedAccess && perimeter.retainedArchive && perimeter.openM4Lane);

    const readability = await check('Indoor cover / door sightlines / identity', () => {
        const cf = window.__cf;
        const shot = (ax, ay, az, bx, by, bz = az) => cf.probeBlocked(ax, ay, az, bx, by, bz);
        const labels = ['InteriorIdentity', 'DeconWallPanel', 'ResearchWallPanel', 'ResearchInstrument',
            'SecurityMonitor', 'ContainmentCoolGuide', 'PowerBus', 'EmergencyExitThreshold'];
        const root = cf.scene.getObjectByName('DeepLaboratory');
        const lights = root.children.filter((object) => object.isPointLight);
        return {
            hallLow: shot(336, 640, 0.9, 342, 640), hallOver: shot(336, 640, 1.8, 342, 640),
            hallTall: shot(332, 626, 1.8, 336, 626), vaultCross: shot(350, 672, 1.8, 370, 672),
            deconCross: shot(353, 697, 1.8, 367, 697),
            researchLow: shot(343, 714, 0.9, 351, 714), researchOver: shot(343, 714, 1.8, 351, 714),
            researchDiagonal: shot(350, 708, 1.8, 357, 728),
            securityLow: shot(373, 718, 0.9, 379, 718), securityOver: shot(373, 718, 1.8, 379, 718),
            securityTall: shot(384.5, 716, 1.8, 388.6, 716),
            containmentLow: shot(347, 755, 0.9, 353, 755), containmentOver: shot(347, 755, 1.8, 353, 755),
            containmentLane: shot(352, 772, 1.8, 352, 780),
            serviceTall: shot(414, 742, 1.8, 422, 742), serviceLane: shot(412, 752, 1.8, 448, 752),
            identity: labels.map((name) => [name, !!cf.scene.getObjectByName(name)]),
            detailBatched: !!cf.scene.getObjectByName('ResearchWallPanel')?.isInstancedMesh,
            sourceCount: lights.length, sourceColors: lights.map((light) => [Math.round(light.position.y), light.color.getHex()]),
        };
    });
    assert(readability.hallLow && !readability.hallOver && readability.hallTall);
    assert(!readability.vaultCross && !readability.deconCross);
    assert(readability.researchLow && !readability.researchOver && !readability.researchDiagonal);
    assert(readability.securityLow && !readability.securityOver && readability.securityTall);
    assert(readability.containmentLow && !readability.containmentOver && !readability.containmentLane);
    assert(readability.serviceTall && !readability.serviceLane);
    assert(readability.identity.every(([, found]) => found) && readability.detailBatched && readability.sourceCount === 7);
    await page.waitForTimeout(450);
    const emergencyColors = await check('M4 emergency light hierarchy', () => {
        const cf = window.__cf, lab = cf.scene.getObjectByName('DeepLaboratory');
        return Object.fromEntries(lab.children.filter((object) => object.isPointLight)
            .map((light) => [Math.round(light.position.y), light.color.getHex()]));
    });
    assert.equal(emergencyColors[718], 0xff493d); // Security pulses red.
    assert.equal(emergencyColors[724], 0xaedfff); // Research retains cool fill.
    assert.equal(emergencyColors[774], 0xbfeeff); // Specimen remains cool amid the alarm.

    const specimen = await check('M3 override / vial / emergency', () => {
        const cf = window.__cf;
        cf.startMission('sample_zero', 'mission_select');
        cf.setNoAggro(true); cf.setInvulnerable(true); cf.clearTestEnemies();
        cf.setPhase(21); // at the Security console after reaching the lab
        cf.move(373 - cf.player.pos.x, 718 - cf.player.pos.y);
        const unlocked = cf.interact(2);
        const securityDoor = cf.scene.getObjectByName('DeepLaboratory')?.visible;
        cf.move(364 - cf.player.pos.x, 774 - cf.player.pos.y);
        const secured = cf.interact(2);
        const tube = cf.scene.getObjectByName('DeepLaboratory');
        return { unlocked, securityDoor, secured, tubeVisible: tube?.visible, phase: cf.phaseName,
            containmentSolid: cf.insideSolid(360, 774), playerSolid: cf.insideSolid(cf.player.pos.x, cf.player.pos.y) };
    });
    assert(specimen.securityDoor && specimen.unlocked === 'M3_REACH_SAMPLE');
    assert(specimen.secured === 'M3_STABILIZE' && !specimen.playerSolid && !specimen.containmentSolid);

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
        // Sample the generous south bypass and entrance shoulder independently
        // of intentional relay pads and the old prop at (320, 582).
        const bypassBlocked = [];
        for (let x = 335; x <= 440; x += 5) if (cf.insideSolid(x, 560)) bypassBlocked.push([x, 560]);
        for (let y = 595; y <= 610; y += 5) for (const x of [354, 360, 366]) {
            if (cf.insideSolid(x, y)) bypassBlocked.push([x, y]);
        }
        const bypassShot = cf.probeBlocked(350, 560, 1.7, 430, 560, 1.7);
        cf.fire();
        const shots = cf.shots.length;
        cf.clearTestEnemies();
        return { westEast, eastWest, squadCount: squad.length, squadPositions: squad.map((m) => m.position),
            enemy: infested.type, enemyWaypoint, blockedShot, clearShot, bypassBlocked, bypassShot, shots };
    });
    assert(navigation.westEast && navigation.eastWest && navigation.enemyWaypoint);
    assert(navigation.squadCount === 3 && navigation.enemy === 'runner');
    assert(navigation.blockedShot && !navigation.clearShot);
    assert.deepEqual(navigation.bypassBlocked, []);
    assert(!navigation.bypassShot);

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
        cf.setNoSpawn(true);   // isolate facility/world churn from random ambient encounters
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
        const geometries = new Set(), materials = new Set();
        cf.scene.traverse((object) => {
            if (object.geometry) geometries.add(object.geometry.uuid);
            if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material.uuid);
        });
        const frames = perf.report().frames;
        const minimapFrames = frames.filter((frame) => frame.ops.drawMinimap).length;
        const linkFrames = frames.map((frame, index) => ({ frame, index }))
            .filter(({ frame }) => frame.delta.linkProgram)
            .slice(0, 8).map(({ frame, index }) => ({ index, ms: frame.ms, renderMs: frame.renderMs,
                position: frame.state ? [frame.state.x, frame.state.y] : null, links: frame.delta.linkProgram,
                programs: frame.events.filter((e) => e.name === 'shaderPrograms').flatMap((e) => e.newPrograms || []) }));
        return { frames: summary.frames, p95Ms: summary.p95Ms, p99Ms: summary.p99Ms, worstMs: summary.worstMs,
            over100: summary.over100, links: summary.counters.linkProgram || 0,
            geometryCreated: summary.counters.geometriesCreated || 0,
            materialsCreated: summary.counters.materialsCreated || 0,
            worldBuilds: summary.counters.buildCampaignWorld || 0,
            navRebuilds: summary.counters.collisionNavRebuild || 0,
            facilityBuilds: ['buildFacility', 'buildFacilityExpansion', 'buildDeepLaboratory', 'buildFacilityExteriorDetail', 'buildInteriorIdentity'].reduce((count, name) => count + (summary.counters[name] || 0), 0),
            geometryDisposes: summary.counters.geometryDisposes || 0, materialDisposes: summary.counters.materialDisposes || 0,
            drawCalls: info.render.calls, triangles: info.render.triangles,
            geometries: geometries.size, materials: materials.size, meshes: info.counts.meshes, solids: info.solids,
            lightSlots: info.budgetLights.slots, programs: cf.renderer.info.programs.length, minimapFrames, linkFrames,
            staticFacility: cf.scene.getObjectByName('FacilityHallRoof') === shell
                && JSON.stringify(cf.facilitySections()) === JSON.stringify(sections) && cf.solidCount === solidCount };
    });
    console.log('A–E traversal', JSON.stringify(benchmark));
    assert.equal(benchmark.worldBuilds, 0);
    assert.equal(benchmark.navRebuilds, 0);
    assert.equal(benchmark.lightSlots, 8);
    assert.equal(benchmark.links, 0);
    assert.equal(benchmark.geometryCreated, 0);
    assert.equal(benchmark.materialsCreated, 0);
    assert.equal(benchmark.facilityBuilds, 0);
    assert.equal(benchmark.geometryDisposes, 0);
    assert.equal(benchmark.materialDisposes, 0);
    assert(benchmark.staticFacility); // encounter spawns may allocate transient enemy meshes
    assert(benchmark.minimapFrames > 0);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS facility regression');
} finally {
    await browser.close();
}
