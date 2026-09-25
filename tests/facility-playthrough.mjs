// Short real-input traversal of the authored facility (Playwright/Edge or Firefox).
// PLAYWRIGHT_PACKAGE may point to an externally installed playwright/index.mjs.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const packagePath = process.env.PLAYWRIGHT_PACKAGE;
const { chromium, firefox } = await import(packagePath ? pathToFileURL(resolve(packagePath)).href : 'playwright');
const useFirefox = process.argv[2] === 'firefox';
const browserPath = [process.env.CHROME_PATH, 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find((path) => path && existsSync(path));
if (!useFirefox) assert(browserPath, 'Set CHROME_PATH to a Chrome/Edge executable');
const browser = useFirefox ? await firefox.launch({ headless: true })
    : await chromium.launch({ executablePath: browserPath, headless: true,
        args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const url = pathToFileURL(resolve('chargefront.html'));
url.searchParams.set('perfDiagnostics', '1');

try {
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__cf?.renderer && window.__cfPerf, undefined, { timeout: 90000 });
    await page.evaluate(() => {
        const cf = window.__cf;
        if (!cf.startMission('dead_signal', 'new_campaign')) throw Error('M1 did not start');
        cf.skipIntro();
        for (let i = 0; i < 3; i++) cf.completeMission();
        if (cf.missionId !== 'break_contact') throw Error('M4 did not unlock');
        cf.setNoAggro(true); cf.setInvulnerable(true); cf.clearTestEnemies();
    });
    await page.waitForTimeout(350);
    await page.evaluate(() => window.__cfPerf.reset());
    const walk = async (label, x, y, yaw, ms, minimum) => {
        await page.evaluate(({ x, y, yaw }) => {
            const cf = window.__cf;
            cf.move(x - cf.player.pos.x, y - cf.player.pos.y);
            cf.player.yaw = yaw;
        }, { x, y, yaw });
        await page.keyboard.down('w');
        await page.waitForTimeout(ms);
        await page.keyboard.up('w');
        const result = await page.evaluate(() => ({ x: window.__cf.player.pos.x, y: window.__cf.player.pos.y,
            solid: window.__cf.insideSolid(window.__cf.player.pos.x, window.__cf.player.pos.y),
            phase: window.__cf.phaseName, paused: !document.getElementById('pause-screen').classList.contains('hidden'),
            locked: !!document.pointerLockElement, focus: document.activeElement?.tagName,
            squad: window.__cf.squadInfo().map((unit) => [Math.round(unit.position.x), Math.round(unit.position.y)]) }));
        console.log(label, JSON.stringify(result));
        assert(!result.solid, `${label}: player inside a solid`);
        assert(yaw === 0 ? result.x > minimum : result.y > minimum, `${label}: blocked before doorway`);
    };
    await walk('Main Hall entrance', 360, 612, Math.PI / 2, 3000, 620);
    await walk('Vault entrance', 360, 655, Math.PI / 2, 2700, 662);
    await walk('Decontamination access', 360, 686, Math.PI / 2, 3000, 694);
    await walk('Research threshold', 360, 699, Math.PI / 2, 3000, 708);
    await walk('Security partition', 361, 718, 0, 2600, 369);
    await walk('Containment access', 360, 729, Math.PI / 2, 2800, 737);
    await walk('Service wing', 405, 752, 0, 3100, 414);
    await walk('Emergency exit', 443, 752, 0, 3100, 453);
    const exitCheckpoint = await page.evaluate(() => JSON.parse(localStorage.cf_campaign_v1)?.operation?.continuedState);
    assert.equal(exitCheckpoint?.extraction?.phase, 25, 'Exit did not save the M4_REACH_LZ checkpoint');
    assert(exitCheckpoint.player.position.x > 454, 'Exit checkpoint was saved before crossing the outer door');

    // FOLLOW is tested with the squad nearby, not left hundreds of metres
    // behind by the test's setup teleports.
    await page.evaluate(() => {
        const cf = window.__cf;
        cf.setNoAggro(true); cf.clearTestEnemies(); cf.commandSquad('assist');
        for (let i = 0; i < cf.squad.length; i++) {
            cf.squad[i].pos.x = 357 + i * 3;
            cf.squad[i].pos.y = 610;
        }
    });
    await walk('Squad FOLLOW through hall', 360, 613, Math.PI / 2, 3800, 630);
    const following = await page.evaluate(() => window.__cf.squadInfo().map((unit) => ({
        y: unit.position.y, blocked: window.__cf.insideSolid(unit.position.x, unit.position.y), mode: unit.mode,
    })));
    console.log('Squad FOLLOW', JSON.stringify(following));
    assert(following.filter((unit) => unit.y > 621 && !unit.blocked).length >= 2, 'Squad could not pass the entrance');
    const traversal = await page.evaluate(() => window.__cfPerf.summary().counters);
    console.log('Interior traversal gate', JSON.stringify({ links: traversal.linkProgram || 0,
        worldBuilds: traversal.buildCampaignWorld || 0, navRebuilds: traversal.collisionNavRebuild || 0,
        geometryCreated: traversal.geometriesCreated || 0, materialsCreated: traversal.materialsCreated || 0,
        geometryDisposes: traversal.geometryDisposes || 0, materialDisposes: traversal.materialDisposes || 0 }));
    assert.equal(traversal.linkProgram || 0, 0);
    assert.equal(traversal.collisionNavRebuild || 0, 0);
    assert.equal(traversal.buildCampaignWorld || 0, 0);

    const combat = await page.evaluate(() => {
        const cf = window.__cf;
        cf.setNoAggro(false); cf.clearTestEnemies();
        const enemy = cf.spawnTestEnemy('runner', 8, 0);
        window.__facilityCombatTarget = enemy;
        return { hp: enemy.hp };
    });
    await page.waitForTimeout(2800);
    const squadCombat = await page.evaluate(() => {
        const cf = window.__cf;
        const enemy = window.__facilityCombatTarget;
        return { enemyHp: enemy.hp, dead: enemy.dead, modes: cf.squadInfo().map((unit) => unit.mode) };
    });
    console.log('Squad combat', JSON.stringify({ before: combat.hp, ...squadCombat }));
    assert(squadCombat.dead || squadCombat.enemyHp < combat.hp, 'Squad could not engage a hall Infested');

    // Keep the squad away from the front door so it cannot kill the pursuit
    // target before crossing the hall threshold in either direction.
    const frontPursuit = await page.evaluate(() => {
        const cf = window.__cf;
        cf.clearTestEnemies();
        for (const member of cf.squad) { member.pos.x = 442; member.pos.y = 710; }
        cf.commandSquad('hold');
        cf.move(360 - cf.player.pos.x, 627 - cf.player.pos.y);
        const enemy = cf.spawnTestEnemy('runner', 0, -16);
        window.__facilityFrontTarget = enemy;
        return enemy.pos.y;
    });
    await page.waitForTimeout(3000);
    const intoHall = await page.evaluate(() => ({ y: window.__facilityFrontTarget.pos.y,
        dead: window.__facilityFrontTarget.dead }));
    console.log('Infested exterior → hall', JSON.stringify({ start: frontPursuit, ...intoHall }));
    assert(!intoHall.dead && intoHall.y > 620, 'Infested stalled outside the Main Hall');

    const rearPursuit = await page.evaluate(() => {
        const cf = window.__cf;
        cf.clearTestEnemies(); cf.move(360 - cf.player.pos.x, 607 - cf.player.pos.y);
        const enemy = cf.spawnTestEnemy('runner', 0, 25);
        window.__facilityRearTarget = enemy;
        return enemy.pos.y;
    });
    await page.waitForTimeout(3500);
    const outOfHall = await page.evaluate(() => ({ y: window.__facilityRearTarget.pos.y,
        dead: window.__facilityRearTarget.dead }));
    console.log('Infested hall → exterior', JSON.stringify({ start: rearPursuit, ...outOfHall }));
    assert(!outOfHall.dead && outOfHall.y < 617, 'Infested stalled inside the Main Hall');

    // Hostiles must use both the interior service threshold and the outer exit.
    const interiorPursuit = await page.evaluate(() => {
        const cf = window.__cf;
        cf.setNoAggro(false); cf.commandSquad('hold'); cf.clearTestEnemies();
        cf.move(425 - cf.player.pos.x, 752 - cf.player.pos.y);
        const enemy = cf.spawnTestEnemy('runner', -21, 0);
        window.__facilityInteriorTarget = enemy;
        return enemy.pos.x;
    });
    await page.waitForTimeout(2800);
    const across = await page.evaluate(() => ({ x: window.__facilityInteriorTarget.pos.x,
        dead: window.__facilityInteriorTarget.dead }));
    console.log('Infested interior pursuit', JSON.stringify({ start: interiorPursuit, ...across }));
    assert(!across.dead && across.x > 411, 'Infested stalled at the interior service door');
    const pursuit = await page.evaluate(() => {
        const cf = window.__cf;
        cf.setNoAggro(false); cf.commandSquad('hold'); cf.clearTestEnemies();
        cf.move(457 - cf.player.pos.x, 752 - cf.player.pos.y);
        const enemy = cf.spawnTestEnemy('runner', -12, 0);
        window.__facilityOuterTarget = enemy;
        return { start: enemy.pos.x };
    });
    await page.waitForTimeout(2800);
    const chase = await page.evaluate(() => ({
        enemy: window.__facilityOuterTarget.pos.x,
        dead: window.__facilityOuterTarget.dead,
        player: window.__cf.player.pos.x,
        phase: window.__cf.phaseName,
    }));
    console.log('Infested pursuit', JSON.stringify({ start: pursuit.start, ...chase }));
    assert(chase.enemy > pursuit.start + 2, 'Infested stalled in the service wing');
    assert.equal(chase.phase, 'M4_REACH_LZ', 'Escape objective did not trigger beyond the exit');
    const perf = await page.evaluate(() => ({ summary: window.__cfPerf.summary(), world: window.__cf.performanceInfo() }));
    console.log('Traversal diagnostics', JSON.stringify({ links: perf.summary.counters.linkProgram || 0,
        builds: perf.summary.counters.buildCampaignWorld || 0, lightSlots: perf.world.budgetLights.slots,
        calls: perf.world.render.calls, triangles: perf.world.render.triangles }));
    assert.equal(perf.summary.counters.buildCampaignWorld || 0, 0);
    const checkpoint = await page.evaluate(() => JSON.parse(localStorage.cf_campaign_v1)?.operation?.continuedState);
    assert.equal(checkpoint?.extraction?.phase, 25, 'Exit did not save the M4_REACH_LZ checkpoint');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__cf?.renderer, undefined, { timeout: 90000 });
    const restored = await page.evaluate(() => {
        const cf = window.__cf, saved = cf.campaignProfile.operation;
        if (!cf.startMission(saved.worldSnapshot, 'continue_campaign')) throw Error('Continue failed');
        return { phase: cf.phaseName, position: [cf.player.pos.x, cf.player.pos.y],
            blocked: cf.insideSolid(cf.player.pos.x, cf.player.pos.y),
            lightSlots: cf.performanceInfo().budgetLights.slots };
    });
    console.log('Continue after emergency exit', JSON.stringify(restored));
    assert.equal(restored.phase, 'M4_REACH_LZ');
    assert(!restored.blocked && restored.lightSlots === 8);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS facility real-input traversal');
} finally {
    await page.keyboard.up('w');
    await browser.close();
}
