// Canonical M2: Alpha -> Beta -> Gamma -> front entrance -> command -> M3.
// Real E activations, W-key return/door traversal; timed defenses use the
// existing completion hook. No navigation/controller semantics are bypassed
// during the return walk. Set PLAYWRIGHT_PACKAGE to an installed index.mjs.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium, firefox } = await import(process.env.PLAYWRIGHT_PACKAGE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const useFirefox = process.argv.includes('firefox');
const executablePath = [process.env.CHROME_PATH, 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find((p) => p && existsSync(p));
const browser = useFirefox ? await firefox.launch({ headless: true }) : await chromium.launch({ executablePath, headless: true, args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics', '1');
const state = () => page.evaluate(() => {
    const cf = window.__cf;
    return { phase: cf.phaseName, mission: cf.missionId, objective: cf.objectiveText, prompt: cf.interactionPrompt,
        pos: [cf.player.pos.x, cf.player.pos.y], relays: cf.relays.map((r) => r.powered), route: cf.routeInfo().route,
        world: cf.campaignRun.worldState, saved: JSON.parse(localStorage.cf_campaign_v1).operation.continuedState };
});
const resume = async (save) => {
    if (save) await page.evaluate((data) => { localStorage.cf_campaign_v1 = JSON.stringify(data); }, save);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__cf?.renderer, undefined, { timeout: 90000 });
    await page.evaluate(() => { const cf = window.__cf; if (!cf.startMission('power_through', 'continue_campaign')) throw Error('Continue failed'); cf.setNoAggro(true); cf.setNoSpawn(true); cf.setInvulnerable(true); cf.clearTestEnemies(); });
    return state();
};
const holdE = async () => {
    await page.keyboard.down('e'); await page.waitForTimeout(1850); await page.keyboard.up('e');
};
const walkTo = async (x, y) => {
    const deadline = Date.now() + 60000;
    await page.keyboard.down('w');
    let result;
    try {
        while (Date.now() < deadline) {
            result = await page.evaluate(({ x, y }) => {
                const cf = window.__cf;
                const distance = Math.hypot(x - cf.player.pos.x, y - cf.player.pos.y);
                cf.player.yaw = Math.atan2(y - cf.player.pos.y, x - cf.player.pos.x);
                return { distance, pos: [cf.player.pos.x, cf.player.pos.y], blocked: cf.insideSolid(cf.player.pos.x, cf.player.pos.y) };
            }, { x, y });
            assert(!result.blocked, `Walk embedded at ${result.pos}`);
            if (result.distance < 1.3) return result;
            await page.waitForTimeout(180);
        }
        assert.fail(`Walk stalled heading to ${x},${y}: ${JSON.stringify(result)}`);
    } finally { await page.keyboard.up('w'); }
};
try {
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__cf?.renderer && window.__cfPerf, undefined, { timeout: 90000 });
    await page.evaluate(() => { const cf = window.__cf; cf.startMission('dead_signal', 'new_campaign'); cf.skipIntro(); cf.completeMission(); cf.setNoSpawn(true); cf.setNoAggro(true); cf.setInvulnerable(true); cf.clearTestEnemies(); });
    await page.waitForFunction(() => window.__cf.phaseName === 'MOVE_R1');
    const activate = async (index, defend, next) => {
        await page.evaluate((i) => {
            const cf = window.__cf, pos = cf.relays[i].pos;
            // The general debug teleport may choose a safe point outside the
            // 7 m activation radius; set up at a clear interaction-height ring.
            let found = false;
            for (let a = 0; a < 64; a++) {
                const angle = a * Math.PI / 32, x = pos.x + Math.cos(angle) * 6.2, y = pos.y + Math.sin(angle) * 6.2;
                if (cf.insideSolid(x, y)) continue;
                cf.move(x - cf.player.pos.x, y - cf.player.pos.y);
                for (let j = 0; j < cf.squad.length; j++) { cf.squad[j].pos.x = x - 3 - j; cf.squad[j].pos.y = y - 3; }
                found = true; break;
            }
            if (!found) throw Error('No clear relay interaction point');
        }, index);
        await page.waitForTimeout(350);
        const approach = await state();
        console.log('Relay approach', JSON.stringify({ phase: approach.phase, pos: approach.pos, prompt: approach.prompt }));
        await holdE();
        assert.equal((await state()).phase, defend);
        await page.evaluate((i) => { window.__cf.completeRelay(i); window.__cf.clearTestEnemies(); }, index);
        const current = await state();
        assert.equal(current.phase, next);
        console.log(`Relay ${index + 1}`, JSON.stringify({ phase: current.phase, relays: current.relays, objective: current.objective }));
        return current;
    };
    await activate(0, 'DEFEND_R1', 'MOVE_R2');
    let current = await activate(1, 'DEFEND_R2', 'MOVE_R3');
    assert.deepEqual(current.relays, [true, true, false]);
    assert.deepEqual(current.route.at(-1), [575, 585]);
    assert(!('relayServiceUnlocked' in current.world) && !('relayFeedRerouted' in current.world));
    const beforeGammaSave = await page.evaluate(() => JSON.parse(localStorage.cf_campaign_v1));
    current = await resume();
    assert.equal(current.phase, 'MOVE_R3'); assert.deepEqual(current.relays, [true, true, false]);
    // No side-door actor or interaction remains.
    const removed = await page.evaluate(() => {
        const cf = window.__cf;
        return { blocked: cf.probeBlocked(386, 644, 1.8, 394, 644, 1.8), wall: cf.insideSolid(390, 644),
            access: !!cf.campaignContent.serviceAccess, meshes: ['RelayServiceAccess', 'RelayBreakerStatus', 'RelayBusStatus'].filter((name) => cf.scene.getObjectByName(name)) };
    });
    assert(removed.blocked && removed.wall && !removed.access && removed.meshes.length === 0);
    await page.evaluate(() => { const cf = window.__cf; cf.move(394 - cf.player.pos.x, 644 - cf.player.pos.y); cf.player.yaw = Math.PI; });
    await page.keyboard.down('w'); await page.waitForTimeout(1500); await page.keyboard.up('w');
    const eastAttempt = await state();
    console.log('Former side entry blocked by wall', JSON.stringify(eastAttempt.pos));
    assert(eastAttempt.pos[0] >= 391.49, 'Player crossed the removed east doorway');
    current = await activate(2, 'DEFEND_R3', 'M2_CONFIRM');
    assert.equal(current.mission, 'power_through'); assert.deepEqual(current.relays, [true, true, true]);
    assert(current.objective.includes('front entrance'));
    assert(current.route.some(([x, y]) => x === 360 && y === 610));
    assert.deepEqual(current.route.at(-1), [382, 648]);
    const afterGammaSave = await page.evaluate(() => JSON.parse(localStorage.cf_campaign_v1));
    current = await resume();
    assert.equal(current.phase, 'M2_CONFIRM'); assert.deepEqual(current.relays, [true, true, true]);
    await page.evaluate(() => window.__cfPerf.reset());
    // Walk the complete authored return from the Gamma pad; no return teleports.
    for (const [x, y] of current.route.slice(1)) console.log('Return W', JSON.stringify(await walkTo(x, y)));
    await page.waitForTimeout(6000);
    current = await state();
    assert(current.prompt?.includes('REACTIVATE FACILITY TERMINAL'));
    const follow = await page.evaluate(() => window.__cf.squadInfo().map((unit) => ({ x: unit.position.x, y: unit.position.y, mode: unit.mode, solid: window.__cf.insideSolid(unit.position.x, unit.position.y) })));
    console.log('Front-return FOLLOW', JSON.stringify(follow));
    assert.equal(follow.filter((unit) => unit.y > 619 && unit.x < 389 && !unit.solid).length, 3);
    const traversal = await page.evaluate(() => window.__cfPerf.summary().counters);
    console.log('Canonical return counters', JSON.stringify(traversal));
    for (const name of ['linkProgram', 'buildCampaignWorld', 'buildFacility', 'collisionNavRebuild', 'geometriesCreated', 'materialsCreated', 'geometryDisposes', 'materialDisposes']) assert.equal(traversal[name] || 0, 0, name);
    // Persist at the terminal via the ordinary periodic checkpoint.
    await page.waitForTimeout(10500);
    current = await resume();
    assert.equal(current.phase, 'M2_CONFIRM');
    assert(Math.hypot(current.pos[0] - 382, current.pos[1] - 648) < 4);
    await holdE();
    current = await state();
    assert.equal(current.mission, 'sample_zero'); assert.equal(current.phase, 'M3_ENTER_LAB');

    // Migration for temporary phase 30, both unfinished and all relays online.
    for (const allOnline of [false, true]) {
        const save = structuredClone(allOnline ? afterGammaSave : beforeGammaSave);
        const cp = save.operation.continuedState;
        cp.phase = 30; cp.worldState.relayServiceUnlocked = true; cp.worldState.relayFeedRerouted = false;
        cp.player.position = { x: 390, y: 644 }; // repaired-wall overlap is resolved
        current = await resume(save);
        assert.equal(current.phase, allOnline ? 'M2_CONFIRM' : 'MOVE_R3');
        assert.equal(current.saved.phase, allOnline ? 18 : 6);
        assert(!('relayServiceUnlocked' in current.world) && !('relayFeedRerouted' in current.saved.worldState));
        assert(!(await page.evaluate(() => window.__cf.insideSolid(window.__cf.player.pos.x, window.__cf.player.pos.y))));
        console.log('Temporary save migration', JSON.stringify({ allOnline, phase: current.phase, savedPhase: current.saved.phase, position: current.pos }));
    }
    // Exterior pursuit must route around the closed east wall to the front.
    await resume(afterGammaSave);
    await page.evaluate(() => {
        const cf = window.__cf; cf.clearTestEnemies(); cf.setNoAggro(false); cf.commandSquad('hold');
        for (const member of cf.squad) { member.pos.x = 450; member.pos.y = 710; }
        cf.move(360 - cf.player.pos.x, 627 - cf.player.pos.y);
        window.__frontReturnEnemy = cf.spawnTestEnemy('runner', 36, 2);
    });
    const enemySamples = [];
    let crossedFront = false;
    const pursuitDeadline = Date.now() + 25000;
    while (Date.now() < pursuitDeadline) {
        await page.waitForTimeout(250);
        const p = await page.evaluate(() => ({ x: window.__frontReturnEnemy.pos.x, y: window.__frontReturnEnemy.pos.y, dead: window.__frontReturnEnemy.dead }));
        assert(!p.dead);
        if (p.y < 619 && p.x > 350 && p.x < 370) crossedFront = true;
        if (enemySamples.length < 12) enemySamples.push([Math.round(p.x), Math.round(p.y)]);
        if (p.y > 620 && p.x < 389) break;
    }
    const end = await page.evaluate(() => ({ x: window.__frontReturnEnemy.pos.x, y: window.__frontReturnEnemy.pos.y }));
    console.log('East hostile -> FRONT -> Hall', JSON.stringify({ crossedFront, enemySamples, end }));
    assert(crossedFront && end.y > 620 && end.x < 389);
    assert(await page.evaluate(() => window.__cf.startMission('power_through', 'mission_select')));
    await page.waitForFunction(() => window.__cf.phaseName === 'MOVE_R1');
    assert.deepEqual((await state()).relays, [false, false, false]);
    assert.deepEqual(errors, []);
    console.log('PASS canonical M2 front-entry progression');
} finally { await page.keyboard.up('w'); await page.keyboard.up('e'); await browser.close(); }
