// CP2-R permanent enclosure regression on the real file:// game.
// 1. Outside-in flood fill (actor radius) per mission state: with every door
//    closed no room cell is reachable; with live mission door state only the
//    deliberate M4 emergency exit admits entry.
// 2. Real W-key walks between both exterior recesses and the locked Vault,
//    in both directions.
// 3. Door portals: lintel collision above DOOR_CLEAR, posts solid, panels never
//    intersect posts, full passage width, all six door mechanisms cycle.
// 4. Minimap segments lie on actual structure, including the y684 closure.
// Usage: PLAYWRIGHT_PACKAGE=... node tests/facility-enclosure.mjs [firefox]
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium, firefox } = await import(process.env.PLAYWRIGHT_PACKAGE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const useFirefox = process.argv.includes('firefox');
const edgePath = [process.env.CHROME_PATH, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && existsSync(p));
const browser = useFirefox ? await firefox.launch({ headless: true })
    : await chromium.launch({ headless: true, executablePath: edgePath, args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }), errors = [];
page.on('pageerror', e => errors.push(e.message));
const report = { browser: useFirefox ? 'firefox' : 'edge', states: [], walks: [], errors };
const out = process.env.CF_ARTIFACT_DIR ? resolve(process.env.CF_ARTIFACT_DIR) : null;

// In-page flood fill over the facility surroundings at actor radius (0.4 m).
const flood = (forceClosed, extraClosed = []) => page.evaluate(({ forceClosed, extraClosed }) => {
    const c = __cf, doors = c.facilityDoors, saved = doors.map(d => d.solid.disabled);
    doors.forEach(d => { if (forceClosed || extraClosed.includes(d.id)) d.solid.disabled = false; });
    try {
        const rooms = { hall: [330, 390, 618, 660], vault: [342, 378, 660, 684], vestibule: [331, 389, 685, 689], decon: [330, 390, 690, 704],
            research: [330, 390, 704, 735], containment: [330, 410, 735, 795], power: [410, 450, 736, 770] };
        const step = .5, X0 = 300, X1 = 480, Y0 = 590, Y1 = 820, nx = Math.round((X1 - X0) / step) + 1, ny = Math.round((Y1 - Y0) / step) + 1;
        const seen = new Uint8Array(nx * ny), q = [0]; seen[0] = 1;
        const free = k => !c.insideSolid(X0 + (k % nx) * step, Y0 + Math.floor(k / nx) * step);
        while (q.length) {
            const k = q.pop(), i = k % nx, j = Math.floor(k / nx);
            for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
                if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
                const n = b * nx + a; if (seen[n]) continue; seen[n] = 2;
                if (free(n)) { seen[n] = 1; q.push(n); }
            }
        }
        const reach = {};
        for (const [name, [x0, x1, y0, y1]] of Object.entries(rooms)) {
            let n = 0; const sample = [];
            for (let x = x0 + 1.5; x <= x1 - 1.5; x += step) for (let y = y0 + (name === 'vestibule' ? .5 : 1.5); y <= y1 - (name === 'vestibule' ? .5 : 1.5); y += step) {
                const k = Math.round((y - Y0) / step) * nx + Math.round((x - X0) / step);
                if (seen[k] === 1) { n++; if (sample.length < 3) sample.push([x, y]); }
            }
            reach[name] = { cells: n, sample };
        }
        return { mission: c.missionId, phase: c.phaseName, reach, doors: doors.map(d => ({ id: d.id || 'front', disabled: d.solid.disabled, locked: !!d.locked, forceOpen: !!d.forceOpen, enabled: d.enabled })) };
    } finally { doors.forEach((d, i) => { d.solid.disabled = saved[i]; }); }
}, { forceClosed, extraClosed });
const total = r => Object.values(r.reach).reduce((s, v) => s + v.cells, 0);
// Park the player/squad far from every door and let proximity doors close.
const settle = async () => {
    await page.evaluate(() => { const c = __cf; c.pause(false); c.setCoverPose(null); c.move(450 - c.player.pos.x, 560 - c.player.pos.y);
        for (const m of c.squad) { m.pos.x = 452 + Math.random(); m.pos.y = 555; } c.clearTestEnemies(); });
    await page.waitForTimeout(1600);
};
const pos = () => page.evaluate(() => ({ x: +__cf.player.pos.x.toFixed(2), y: +__cf.player.pos.y.toFixed(2) }));
const walkTo = async (tx, ty, maxMs = 6000) => {
    const t0 = Date.now(); await page.keyboard.down('w');
    while (Date.now() - t0 < maxMs) {
        const p = await pos(); if (Math.hypot(tx - p.x, ty - p.y) < .8) break;
        await page.evaluate(([tx, ty]) => { const p = __cf.player.pos; __cf.player.yaw = Math.atan2(ty - p.y, tx - p.x); __cf.player.pitch = 0; }, [tx, ty]);
        await page.waitForTimeout(60);
    }
    await page.keyboard.up('w'); await page.waitForTimeout(120); return pos();
};
const walk = async (name, start, points, pass) => {
    await page.evaluate(([x, y]) => { const c = __cf; c.pause(false); c.move(x - c.player.pos.x, y - c.player.pos.y); }, start);
    await page.waitForTimeout(200); const trail = [];
    for (const [x, y] of points) trail.push(await walkTo(x, y));
    const end = trail.at(-1), row = { name, start, trail, end, pass: pass(end) }; report.walks.push(row);
    console.log('WALK', JSON.stringify({ name, end, pass: row.pass })); return row;
};
const inVault = p => p.x > 342.5 && p.x < 377.5 && p.y > 660.5 && p.y < 683.5;
const inVestibule = p => p.x > 330.5 && p.x < 389.5 && p.y > 684.5 && p.y < 689.5;

try {
    const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics', '1');
    await page.goto(url.href); await page.waitForFunction(() => window.__cf?.renderer, undefined, { timeout: 120000 });
    await page.evaluate(() => { const c = __cf; c.resetCampaignProgress(); if (!c.startMission('dead_signal', 'new_campaign')) throw Error('M1 setup failed');
        c.skipIntro(); c.setNoSpawn(true); c.setNoAggro(true); c.setInvulnerable(true); c.clearTestEnemies(); });
    await page.evaluate(() => __cf.waitCombatPreparation());

    // ---- Structure and minimap
    const structure = await page.evaluate(() => {
        const c = __cf, F = ChargefrontFacility, solids = c.solidsForTest();
        const walls = ['LabSouthReturnWallWest', 'LabSouthReturnWallEast'].map(n => ({ n, p: c.scene.getObjectByName(n)?.geometry.parameters }));
        const shots = [];
        for (const x of [332, 336, 340, 380, 384, 388]) for (const z of [.5, 1.8, 8.8])
            shots.push({ x, z, blocked: c.probeBlocked(x, 680, z, x, 688, z) && c.probeBlocked(x, 688, z, x, 680, z) });
        const near = (x, y) => solids.some(s => !s.overhead && x >= s.x0 - 1 && x <= s.x1 + 1 && y >= s.y0 - 1 && y <= s.y1 + 1);
        const segments = [...F.MAP_SEGMENTS, ...F.LAB_MAP_SEGMENTS], offStructure = [];
        for (const [x0, y0, x1, y1] of segments) {
            const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
            for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (!near(x, y)) offStructure.push([+x.toFixed(1), +y.toFixed(1)]); }
        }
        const has = seg => F.MAP_SEGMENTS.some(s => s.join() === seg.join());
        // Door-less Vault north opening: same portal rules as the doors.
        const vaultNorth = { passLow: !c.probeBlocked(360, 680, 1.7, 360, 688, 1.7), passHigh: !c.probeBlocked(360, 680, 7.9, 360, 688, 7.9),
            lintel: c.probeBlocked(353, 680, 8.6, 353, 688, 8.6) && c.probeBlocked(367, 680, 8.6, 367, 688, 8.6),
            actorClear: [352.45, 360, 367.55].every(x => !c.insideSolid(x, 684)), posts: c.insideSolid(351.7, 682.8) && c.insideSolid(368.3, 685.2) };
        return { walls, shots, vaultNorth, segmentCount: segments.length, offStructure, closure: has([330, 684, 342, 684]) && has([378, 684, 390, 684]),
            doorClear: F.DOOR_CLEAR, portals: F.PORTALS.length, overhead: solids.filter(s => s.overhead).length };
    });
    report.structure = structure; console.log('STRUCTURE', JSON.stringify({ ...structure, shots: structure.shots.filter(s => !s.blocked) }));
    assert(structure.walls.every(w => w.p && w.p.height === 9), 'AC-1 walls missing');
    assert.deepEqual(structure.shots.filter(s => !s.blocked), [], 'y684 closure leaks shots');
    assert.equal(structure.segmentCount, 30); assert(structure.closure, 'Minimap lacks the y684 closure');
    assert.deepEqual(structure.offStructure, [], 'Minimap segment not on structure');
    assert(structure.doorClear >= 8, 'Door clear height below flying-actor envelope');
    assert.equal(structure.portals, 7); assert.equal(structure.overhead, 7);
    assert(Object.values(structure.vaultNorth).every(Boolean), 'Vault north portal wrong');

    // ---- Flood fill per mission state
    for (let i = 0; i < 4; i++) {
        if (i) await page.evaluate(() => { __cf.completeMission(); __cf.setNoSpawn(true); __cf.setNoAggro(true); __cf.setInvulnerable(true); __cf.clearTestEnemies(); });
        await settle();
        const closed = await flood(true), live = await flood(false);
        const row = { mission: live.mission, phase: live.phase, closed: total(closed), live: total(live), liveReach: live.reach, doors: live.doors };
        if (live.mission === 'break_contact') {
            // Only the deliberate M4 emergency exit may admit entry.
            const exitClosed = await flood(false, ['lab_emergency_exit']); row.liveWithExitClosed = total(exitClosed);
            assert.equal(row.liveWithExitClosed, 0, 'M4 interior reachable other than via the emergency exit');
            assert(row.live > 0, 'M4 emergency exit should be open');
        } else assert.equal(row.live, 0, `Interior reachable from outside in ${live.mission}`);
        assert.equal(row.closed, 0, `Enclosure leaks with all doors closed in ${live.mission}`);
        report.states.push(row); console.log('ENCLOSURE', JSON.stringify({ mission: row.mission, closed: row.closed, live: row.live, exitClosed: row.liveWithExitClosed }));
        if (i === 1) {
            // M2: bio_lab locked. Real W-key walking, both recesses, both directions.
            assert(await page.evaluate(() => !__cf.campaignRun?.worldState?.labAccess), 'Fixture expects the Vault locked');
            for (const [name, start, pts] of [
                ['west recess -> vault', [318, 672], [[336, 672], [336, 687], [360, 687], [360, 672]]],
                ['east recess -> vault', [402, 672], [[384, 672], [384, 687], [360, 687], [360, 672]]]]) {
                const r = await walk(name, start, pts, p => !inVault(p) && !inVestibule(p));
                assert(r.pass, 'Breach: ' + name);
            }
            for (const [name, pts] of [['vault -> west recess', [[360, 687], [336, 687], [336, 672], [318, 672]]], ['vault -> east recess', [[360, 687], [384, 687], [384, 672], [402, 672]]]]) {
                const r = await walk(name, [360, 672], pts, p => inVault(p) || inVestibule(p));
                assert(r.pass, 'Reverse breach: ' + name);
            }
        }
    }

    // ---- Portals and door mechanisms (M4 state; all doors enabled)
    const portal = await page.evaluate(() => {
        const c = __cf, F = ChargefrontFacility, doors = c.facilityDoors, rows = [];
        const saved = doors.map(d => ({ forceOpen: d.forceOpen, locked: d.locked, enabled: d.enabled }));
        return { saved, ids: doors.map(d => d.id || 'front') };
    });
    const doorRows = [];
    for (const [index, id] of portal.ids.entries()) {
        const p = await page.evaluate(i => { const d = __cf.facilityDoors[i]; d.enabled = true; d.locked = false; d.forceOpen = true; return d.base; }, index);
        await page.waitForTimeout(1300);
        const opened = await page.evaluate(i => {
            const c = __cf, F = ChargefrontFacility, d = c.facilityDoors[i], p = F.PORTALS.find(q => q.axis === d.axis && q.x === d.base[0] && q.y === d.base[1]);
            const ax = d.axis === 'x', [x, y] = d.base, mid = (p.face0 + p.face1) / 2;
            const across = (a, b, z) => ax ? c.probeBlocked(x + a, p.face0 - 3, z, x + a, p.face1 + 3, z) : c.probeBlocked(p.face0 - 3, y + a, z, p.face1 + 3, y + a, z);
            const centre = (a) => ax ? c.insideSolid(x + a, mid) : c.insideSolid(mid, y + a);
            const panelHeights = d.panels.map(q => q.g.children[0].geometry.parameters.height);
            // Panel world boxes vs. casing posts (posts sit on the faces, outside the wall).
            const boxes = d.panels.map(q => { const g = q.g.children[0].geometry.parameters, w = ax ? g.width : .32, dd = ax ? .32 : g.depth;
                return { x0: q.g.position.x - w / 2, x1: q.g.position.x + w / 2, y0: q.g.position.y - dd / 2, y1: q.g.position.y + dd / 2 }; });
            const posts = [];
            for (const face of [[p.face0 - .25, p.face0], [p.face1, p.face1 + .25]]) for (const s of [-1, 1]) {
                const a0 = Math.min((ax ? x : y) + s * p.half, (ax ? x : y) + s * (p.half + .6)), a1 = Math.max((ax ? x : y) + s * p.half, (ax ? x : y) + s * (p.half + .6));
                posts.push(ax ? { x0: a0, x1: a1, y0: face[0], y1: face[1] } : { x0: face[0], x1: face[1], y0: a0, y1: a1 });
            }
            const hit = (a, b) => a.x0 < b.x1 - 1e-6 && a.x1 > b.x0 + 1e-6 && a.y0 < b.y1 - 1e-6 && a.y1 > b.y0 + 1e-6;
            return { id: d.id || 'front', openT: +d.openT.toFixed(3), solidDisabled: d.solid.disabled, doorTop: d.solid.topY, panelHeights,
                passLow: !across(0, 0, 1.7), passHigh: !across(0, 0, 7.9), lintelBlocks: across(0, 0, 8.6) && across(p.half - .5, 0, 8.6) && across(-p.half + .5, 0, 8.6),
                actorClear: [0, p.half - .45, -(p.half - .45)].every(a => !centre(a)), postSolid: centre(p.half + .3) && centre(-p.half - .3),
                openPanelPostHits: boxes.some(b => posts.some(q => hit(b, q))) };
        }, index);
        await page.evaluate(i => { const d = __cf.facilityDoors[i]; d.forceOpen = false; d.locked = true; }, index);
        await page.waitForTimeout(1300);
        const closed = await page.evaluate(i => {
            const c = __cf, d = c.facilityDoors[i], ax = d.axis === 'x';
            const boxes = d.panels.map(q => { const g = q.g.children[0].geometry.parameters, w = ax ? g.width : .32, dd = ax ? .32 : g.depth;
                return { x0: q.g.position.x - w / 2, x1: q.g.position.x + w / 2, y0: q.g.position.y - dd / 2, y1: q.g.position.y + dd / 2 }; });
            const p = ChargefrontFacility.PORTALS.find(q => q.axis === d.axis && q.x === d.base[0] && q.y === d.base[1]);
            const outsideWall = boxes.some(b => ax ? (b.y0 < p.face0 || b.y1 > p.face1) : (b.x0 < p.face0 || b.x1 > p.face1));
            const [x, y] = d.base;
            return { openT: +d.openT.toFixed(3), solidDisabled: d.solid.disabled, panelLeavesWall: outsideWall,
                blocksLow: ax ? c.probeBlocked(x, p.face0 - 3, 1.7, x, p.face1 + 3, 1.7) : c.probeBlocked(p.face0 - 3, y, 1.7, p.face1 + 3, y, 1.7) };
        }, index);
        await page.evaluate(([i, s]) => { const d = __cf.facilityDoors[i]; d.forceOpen = s.forceOpen; d.locked = s.locked; d.enabled = s.enabled; }, [index, portal.saved[index]]);
        const row = { ...opened, closed }; doorRows.push(row); console.log('DOOR', JSON.stringify(row));
        assert(row.openT > .95 && row.solidDisabled, 'Door did not open: ' + row.id);
        assert(row.passLow && row.passHigh && row.lintelBlocks, 'Portal clearance/lintel collision wrong: ' + row.id);
        assert(row.actorClear && row.postSolid && !row.openPanelPostHits, 'Portal posts/width wrong: ' + row.id);
        assert(closed.openT < .05 && !closed.solidDisabled && closed.blocksLow && !closed.panelLeavesWall, 'Door did not close: ' + row.id);
    }
    report.doors = doorRows;
    const clear = await page.evaluate(() => ChargefrontFacility.DOOR_CLEAR);
    assert(doorRows.every(r => r.panelHeights.every(h => Math.abs(h - clear) < 1e-6) && Math.abs(r.doorTop - clear) < 1e-6), 'Door panels/solids not at DOOR_CLEAR');
    assert.equal(doorRows.length, 6);
    assert.deepEqual(errors, []);
    console.log('PASS facility enclosure', report.browser);
} finally {
    await page.keyboard.up('w').catch(() => {});
    if (out) { mkdirSync(out, { recursive: true }); writeFileSync(resolve(out, `facility-enclosure-${report.browser}.json`), JSON.stringify(report, null, 1)); }
    await browser.close();
}
