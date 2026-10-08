// Real browser integration: UI deployment, fixed-tick input, checkpoints,
// differentiated live squad behavior, occlusion, bounded effects, restart.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium, firefox } = await import(process.env.PLAYWRIGHT_PACKAGE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const ff = process.argv.includes('firefox'), name = ff ? 'firefox' : 'edge';
const out = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m41/compatibility'); mkdirSync(out, { recursive: true });
const browser = await (ff ? firefox : chromium).launch(ff ? { headless: !process.argv.includes('--headed') } : {
    headless: !process.argv.includes('--headed'), executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [], consoleErrors = [], results = {};
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
await page.addInitScript(() => {
    window.__inputAdds = 0;
    const add = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, ...args) {
        if (['keydown', 'keyup', 'mousedown', 'mouseup', 'pointerdown', 'mousemove'].includes(type)) window.__inputAdds++;
        return add.call(this, type, ...args);
    };
});
const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics', '1');
const ready = () => page.waitForFunction(() => window.__cf?.renderer, undefined, { timeout: 120000 });
const quiet = () => page.evaluate(() => { __cf.setNoSpawn(true); __cf.setInvulnerable(true); __cf.clearTestEnemies(); __cf.setNoAggro(true); });
const snap = () => page.evaluate(() => __cf.combat.snapshot());
const capture = label => page.screenshot({ path: resolve(out, `${label}-${name}.png`) });
const select = async index => { await page.keyboard.press(String(index + 1)); await page.waitForFunction(i => __cf.player.weaponIndex === i && __cf.player.swapT === 0, index); };
try {
    await page.goto(url.href); await ready();
    await page.locator('#btn-start').click(); await page.locator('[data-sound-mode="full"]').click(); await page.locator('#btn-sound-start').click();
    await page.waitForFunction(() => !!__cf.intro, undefined, { timeout: 120000 });
    await page.waitForFunction(() => !__cf.intro.prewarmPending, undefined, { timeout: 120000 });
    await page.keyboard.press('Space'); await quiet();
    assert.deepEqual(await page.evaluate(() => __cf.combat.slots), ['rifle', 'scatter']);
    assert.deepEqual(await page.evaluate(() => __cf.weaponDefinitions.map(w => w.id)), ['rifle', 'scatter', 'arc', 'plasma']);
    // Unlock authored missions via existing completion hooks, retaining continuity.
    for (let i = 0; i < 3; i++) { await page.evaluate(() => __cf.completeMission()); await quiet(); }
    await page.evaluate(() => { __cf.startMission('power_through', 'mission_select'); __cf.setNoSpawn(true); __cf.clearTestEnemies();
        __cf.move(360 - __cf.player.pos.x, 630 - __cf.player.pos.y); __cf.player.yaw = Math.PI / 2; __cf.player.pitch = 0;
    });
    await quiet();
    await page.mouse.down(); await page.waitForTimeout(600); await page.mouse.up();
    results.weapon1 = await snap(); assert(results.weapon1.weapons.rifle.mag < 50); await capture('01-rifle');
    await select(1); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up();
    results.weapon2 = await snap(); assert(results.weapon2.weapons.scatter.mag < 20); await capture('02-scatter');
    const beforeRapid = await page.evaluate(() => ({ ammo: __cf.combat.weapons.rifle.mag + __cf.combat.weapons.scatter.mag, fired: __cf.combat.shotsFired, listeners: __inputAdds }));
    await page.mouse.down();
    for (let i = 0; i < 30; i++) { await page.keyboard.press(String(i % 2 + 1)); await page.waitForTimeout(40); }
    await page.mouse.up();
    const afterRapid = await page.evaluate(() => ({ ammo: __cf.combat.weapons.rifle.mag + __cf.combat.weapons.scatter.mag, fired: __cf.combat.shotsFired, listeners: __inputAdds }));
    assert.equal(beforeRapid.ammo - afterRapid.ammo, afterRapid.fired - beforeRapid.fired);
    assert.equal(beforeRapid.listeners, afterRapid.listeners, 'Switching registered input listeners');
    results.rapid = { beforeRapid, afterRapid };
    await select(0);
    await page.evaluate(() => { __cf.combat.weapons.rifle.mag = 17; __cf.combat.weapons.scatter.mag = 6; });
    await page.keyboard.press('r'); await page.waitForFunction(() => __cf.player.weapon.reloading);
    const reserve = (await snap()).cartridges;
    await select(1); assert.equal((await snap()).weapons.rifle.mag, 17); assert.equal((await snap()).cartridges, reserve);
    assert.equal(await page.evaluate(() => __cf.combat.weapons.rifle.reloading), false);
    await page.keyboard.press('r'); await page.waitForFunction(() => __cf.player.weapon.reloading); await capture('03-reload-hud');
    await page.waitForFunction(() => !__cf.player.weapon.reloading); assert.equal((await snap()).weapons.scatter.mag, 20); assert.equal((await snap()).cartridges, reserve - 1);
    await page.evaluate(() => { __cf.player.weapon.mag = 0; __cf.combat.cartridges = 0; });
    await page.mouse.down(); await page.waitForTimeout(350); await page.mouse.up(); await select(0);
    assert.equal((await snap()).weapons.scatter.mag, 0); assert.equal((await snap()).weapons.rifle.mag, 17);

    // Checkpoints for every mission, both active weapons, partial magazines,
    // transient reload and squad restoration, through a real browser reload.
    results.checkpoints = [];
    for (const id of ['dead_signal', 'power_through', 'sample_zero', 'break_contact']) for (const index of [0, 1]) {
        await page.evaluate(({ id, index }) => {
            const c = __cf; c.startMission(id, 'new_campaign'); c.skipIntro(); c.setNoSpawn(true); c.clearTestEnemies(); c.setNoAggro(true);
            c.selectWeapon(index); c.combat.tick(1); c.combat.weapons.rifle.mag = 17; c.combat.cartridges = 3;
            c.combat.weapons.scatter.mag = 6;
            c.commandSquad('hold'); c.squad[0].hp = 65; c.squad[0].shield = 31; c.squad[0].mag = 17;
            c.reload(); c.checkpoint();
        }, { id, index });
        await page.reload(); await ready();
        await page.evaluate(id => { __cf.startMission(id, 'continue_campaign'); __cf.setNoSpawn(true); __cf.clearTestEnemies(); __cf.setNoAggro(true); }, id);
        const state = await page.evaluate(() => ({ mission: __cf.missionId, combat: __cf.combat.snapshot(), reload: __cf.player.weapon.reloading,
            command: __cf.command, squad: __cf.squad.map(m => ({ hp: m.hp, shield: m.shield, mag: m.mag })), shell: __cf.facilitySections().length }));
        assert.equal(state.mission, id); assert.equal(state.combat.activeId, index ? 'scatter' : 'rifle');
        assert.deepEqual(state.combat.weapons, { rifle: { mag: 17 }, scatter: { mag: 6 } }); assert.equal(state.combat.cartridges, 3);
        assert(!state.reload); assert.equal(state.command, 'hold'); assert.equal(state.squad[0].hp, 65); assert.equal(state.squad[0].mag, 17); assert.equal(state.shell, 6);
        results.checkpoints.push(state);
    }
    // Persistent world and ammo across all three contiguous chapter boundaries.
    results.transitions = await page.evaluate(() => {
        const c = __cf; c.resetCampaignProgress(); c.startMission('dead_signal', 'new_campaign'); c.skipIntro(); c.setNoSpawn(true); c.setNoAggro(true); c.clearTestEnemies();
        c.selectWeapon(1); c.combat.tick(1); c.combat.weapons.rifle.mag = 17; c.combat.weapons.scatter.mag = 6;
        const shell = c.scene.getObjectByName('FacilityHallRoof'), solids = c.solidCount, rows = [];
        for (let i = 0; i < 3; i++) { c.completeMission(); c.clearTestEnemies(); rows.push({ mission: c.missionId, combat: c.combat.snapshot(), sameShell: shell === c.scene.getObjectByName('FacilityHallRoof'), sameSolids: solids === c.solidCount }); }
        return rows;
    });
    for (const row of results.transitions) { assert(row.sameShell && row.sameSolids); assert.equal(row.combat.activeId, 'scatter'); assert.equal(row.combat.weapons.rifle.mag, 17); assert.equal(row.combat.weapons.scatter.mag, 6); }
    // Authored M4 emergency floor: one shared cartridge only when both guns and
    // the pool are exhausted. Restoring the checkpoint cannot mint another.
    results.emergencyFloor = await page.evaluate(() => {
        const c=__cf; c.startMission('sample_zero','new_campaign'); c.setNoSpawn(true); c.clearTestEnemies();
        c.combat.cartridges=0; for(const w of Object.values(c.combat.weapons)) w.mag=0;
        c.completeMission(); const first=c.combat.snapshot(), saved=c.createMission4Snapshot();
        c.applyMission4Snapshot(saved); return {first,restored:c.combat.snapshot(),mission:c.missionId};
    });
    assert.equal(results.emergencyFloor.mission,'break_contact'); assert.equal(results.emergencyFloor.first.cartridges,1);
    assert.deepEqual(results.emergencyFloor.first.weapons,{rifle:{mag:0},scatter:{mag:0}});
    assert.deepEqual(results.emergencyFloor.restored,results.emergencyFloor.first);

    // Distinct target priorities and commitment windows, then real movement/fire.
    await page.evaluate(() => {
        const c = __cf; c.startMission('sample_zero', 'mission_select'); c.setNoSpawn(true); c.setNoAggro(true); c.clearTestEnemies(); c.setInvulnerable(true);
        c.move(360 - c.player.pos.x, 747 - c.player.pos.y); c.player.yaw = Math.PI / 2; c.player.pitch = 0; c.commandSquad('assist');
        for (let i = 0; i < 3; i++) { const m = c.squad[i]; m.pos.x = 356 + i * 4; m.pos.y = 745; m.hp = m.maxHp; m.evadeCd = 100; }
        const a = c.spawnTestEnemy('runner', -6, 9), b = c.spawnTestEnemy('runner', 7, 15), d = c.spawnTestEnemy('brute', 8, 20);
        for (const e of [a,b,d]) e.hp = e.maxHp = 100000;
        c.squad[0].hp = 40; b.focus = c.squad[0]; window.__targets = [a,b,d];
        c.evaluateDirector(); c.evaluateSquadTactics();
    });
    results.identities = await page.evaluate(() => __cf.squad.map(m => ({ name: m.def.name, combat: m.def.combat, target: __targets.indexOf(m.target) })));
    assert.deepEqual(results.identities.map(m => m.name), ['ROOK', 'VEX', 'KADE']);
    assert.equal(new Set(results.identities.map(m => m.combat.preferredRange)).size, 3);
    assert.equal(results.identities[0].target, 0); assert.equal(results.identities[1].target, 1); assert.equal(results.identities[2].target, 2);
    await page.waitForTimeout(4500);
    results.squadCombat = await page.evaluate(() => __cf.squad.map(m => ({ name: m.def.name, pos: [m.pos.x,m.pos.y], mode: m.aiMode, mag: m.mag,
        targetValid: !m.target || __cf.enemies.includes(m.target) && !m.target.dead, commit: m.commitT })));
    assert(results.squadCombat.every(m => m.pos.every(Number.isFinite) && m.targetValid && m.commit >= 0 && m.commit <= 1.8));
    assert(results.squadCombat.every((m,i) => m.mag < [30,70,50][i]), 'All identities must actually fire');
    assert(new Set(results.squadCombat.map(m => m.pos.map(x => x.toFixed(1)).join(','))).size === 3);
    await capture('04-campaign-squad-combat');
    await page.evaluate(() => __cf.clearTestEnemies()); await page.waitForTimeout(3500);
    assert((await page.evaluate(() => __cf.squadInfo())).every(m => m.mode === 'FOLLOW'));

    // Exact wall occlusion: eye-LOS alone cannot authorize a blocked muzzle shot.
    results.occlusion = await page.evaluate(() => {
        const c = __cf; const m = c.squad[0]; m.pos.x = 386; m.pos.y = 644; m.z = c.terrainHeight(386,644);
        const e = c.spawnTestEnemy('runner', 0, 0); e.pos.x = 394; e.pos.y = 644; e.z = c.terrainHeight(394,644);
        m.target = e; const mag = m.mag, shots = c.shots.length; m.shoot(); c.clearTestEnemies();
        return { consumed: mag - m.mag, shots: c.shots.length - shots };
    });
    assert.deepEqual(results.occlusion, { consumed: 0, shots: 0 });

    // Infested strike damages one committed victim, not both nearby operators.
    results.strike = await page.evaluate(() => {
        const c = __cf; c.setNoAggro(false); c.commandSquad('hold'); c.move(360-c.player.pos.x, 644-c.player.pos.y);
        for (const m of c.squad) { m.pos.x = m.holdPos.x = 361; m.pos.y = m.holdPos.y = 644; m.fireT = 100; }
        const e = c.spawnTestEnemy('runner', 0, 1); e.attackT = 0; e.speed = 0;
        const shields = c.squad.map(m => m.shield); e.update(); const after = c.squad.map(m => m.shield); c.clearTestEnemies(); c.setNoAggro(true);
        return { shields, after };
    });
    assert.deepEqual(results.strike.shields, results.strike.after);

    // UI setup retains edited controls on Back; native selects support keyboard.
    await page.goto(url.href); await ready();
    await page.locator('#btn-endless').click(); await page.locator('#endless-starting-slot').selectOption('2');
    await page.locator('#endless-squad-posture').focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowDown');
    await page.locator('#btn-endless-back').click(); await page.locator('#btn-endless').click();
    assert.equal(await page.locator('#endless-starting-slot').inputValue(), '2');
    assert.equal(await page.locator('#endless-squad-posture').inputValue(), 'escort'); await capture('05-endless-setup');
    await page.locator('#btn-endless-ready').click(); await page.locator('#btn-sound-start').click();
    await page.waitForFunction(() => __cf.mode === 'endless', undefined, { timeout: 120000 });
    await page.mouse.click(640,360); await quiet(); await page.waitForTimeout(500);
    results.deployment = await page.evaluate(() => ({ config: __cf.endlessConfiguration, combat: __cf.combat.snapshot(), squad: __cf.squadInfo() }));
    assert.deepEqual(results.deployment.config.player, { slot1: 'rifle', slot2: 'scatter', startingSlot: 2 }); assert.equal(results.deployment.config.posture, 'escort');
    assert.equal(results.deployment.combat.activeId, 'scatter'); assert.equal(results.deployment.squad.length, 3); await capture('06-endless-deployed');
    await page.evaluate(() => { __cf.setNoSpawn(false); __cf.setNoAggro(false); __cf.startWave(); });
    await page.mouse.down(); await page.keyboard.down('w'); await page.waitForTimeout(3000); await page.keyboard.up('w');
    await select(0); await page.waitForTimeout(1800); await page.mouse.up(); await capture('07-endless-combat');
    // Shared paid craft, never an implicit proximity refill.
    await page.evaluate(() => { __cf.setNoSpawn(true); __cf.clearTestEnemies(); __cf.setNoAggro(true); __cf.combat.cartridges = 1; __cf.giveScrap(4); });
    await page.keyboard.press('v'); await page.waitForFunction(() => __cf.combat.cartridges === 2);
    assert.equal((await snap()).cartridges, 2); await select(1); assert.equal((await snap()).cartridges, 2);
    results.sharedSupply = await page.evaluate(() => {
        const m=__cf.squad[0]; m.reserve=3; const before=__cf.combat.cartridges;
        __cf.giveSquadAmmo(0); return {before,after:__cf.combat.cartridges,squadReserve:m.reserve};
    });
    assert.deepEqual(results.sharedSupply,{before:2,after:1,squadReserve:4});
    const saveBefore = await page.evaluate(() => localStorage.cf_campaign_v1);
    await page.evaluate(() => { __cf.grantUpgrade('r_mag'); __cf.grantUpgrade('r_ammo'); __cf.grantUpgrade('r_player'); });
    await page.evaluate(() => {
        const c = __cf; c.setNoAggro(false); c.setInvulnerable(false); c.setPlayerHealth(1, 0); c.commandSquad('hold');
        for (const m of c.squad) { m.pos.x = m.holdPos.x = 600; m.pos.y = m.holdPos.y = 600; }
        const e = c.spawnTestEnemy('runner', 1, 0); e.hp = 100000; e.attackT = 0;
        c.damagePlayer(200);   // deterministic end-of-run death (runner is a kamikaze now, not a melee attacker)
    });
    await page.waitForFunction(() => __cf.phaseName === 'DEAD'); await page.waitForTimeout(2200);
    await page.keyboard.press('Space');
    await page.waitForFunction(() => __cf.endless.wave === 0 && __cf.player.weapon.id === 'scatter' && __cf.player.hp === 100);
    results.restart = await page.evaluate(() => ({ config: __cf.endlessConfiguration, combat: __cf.combat.snapshot(), ammoSize: __cf.combat.weapons.rifle.magSize, save: localStorage.cf_campaign_v1 }));
    assert.equal(results.restart.save, saveBefore); assert.deepEqual(results.restart.config, results.deployment.config);
    assert.deepEqual(results.restart.combat.weapons, { rifle: { mag: 50 }, scatter: { mag: 20 } }); assert.equal(results.restart.combat.cartridges, 8);
    assert.equal(results.restart.ammoSize, 50);
    results.campaignIsolation = await page.evaluate(() => {
        __cf.grantUpgrade('r_mag'); __cf.grantUpgrade('r_ammo'); __cf.grantUpgrade('r_player'); __cf.grantUpgrade('r_mob');
        __cf.startMission('power_through','mission_select');
        return { mode: __cf.mode, combat: __cf.combat.snapshot(), damage: __cf.player.weapon.dmgMult, magSize: __cf.player.weapon.magSize, speed: __cf.player.speed,
            squad: __cf.squadInfo().map(m => m.formation), posture: __cf.command };
    });
    assert.equal(results.campaignIsolation.mode, 'campaign'); assert.equal(results.campaignIsolation.combat.activeId, 'rifle');
    assert.deepEqual(results.campaignIsolation.combat.weapons, { rifle: { mag: 50 }, scatter: { mag: 20 } }); assert.equal(results.campaignIsolation.combat.cartridges, 8);
    assert.equal(results.campaignIsolation.damage, 1); assert.equal(results.campaignIsolation.magSize, 50); assert.equal(results.campaignIsolation.posture, 'assist');
    assert.equal(results.campaignIsolation.speed, 5.2);
    assert.deepEqual(errors, []);
    // Failed file:// XHR audio buffers intentionally use accepted HTML fallback.
    const unexpectedConsole = consoleErrors.filter(s => !/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s));
    assert.deepEqual(unexpectedConsole, []);
    results.passed = true;
    console.log('PASS combat / squad / checkpoint / mode browser integration', name);
} finally {
    await page.mouse.up().catch(() => {}); await page.keyboard.up('w').catch(() => {});
    writeFileSync(resolve(out, `combat-squad-${name}.json`), JSON.stringify({ results, errors, consoleErrors }, null, 2));
    await browser.close();
}
