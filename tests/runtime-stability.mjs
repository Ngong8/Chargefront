// Real media lifecycle + fixed-tick movement probes. --observe records the
// unmodified baseline without enforcing the new 3.9 invariants.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const { chromium, firefox } = await import(process.env.PLAYWRIGHT_PACKAGE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const ff = process.argv.includes('firefox'), observe = process.argv.includes('--observe');
const artifactDir = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m39');
mkdirSync(artifactDir, { recursive: true });
const browser = await (ff ? firefox : chromium).launch(ff ? { headless: !process.argv.includes('--headed') }
    : { headless: !process.argv.includes('--headed'), executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
if (process.argv.includes('--baseline')) {
    const html = execFileSync('git', ['show', '25ee482:chargefront.html'], { maxBuffer: 8 * 1024 * 1024 }).toString();
    await page.route('**/chargefront.html*', route => route.fulfill({ body: html, contentType: 'text/html' }));
}
const errors = [], results = {};
page.on('pageerror', e => errors.push(e.message));
await page.addInitScript(() => {
    window.__audioTrace = [];
    const Original = window.Audio;
    window.Audio = function(src) {
        const el = new Original(src);
        if (/Spaceship/.test(src || '')) {
            window.__introMedia ||= []; window.__introMedia.push(el);
            const record = event => window.__audioTrace.push({ event, src, at: performance.now(), time: el.currentTime,
                duration: Number.isFinite(el.duration) ? el.duration : null, volume: el.volume, loop: el.loop, ended: el.ended });
            for (const event of ['playing', 'ended', 'pause', 'volumechange']) el.addEventListener(event, () => record(event));
            const pause = el.pause.bind(el);
            el.pause = () => { record('pauseCall'); pause(); };
        }
        return el;
    };
});
const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics', '1');
if (!process.argv.includes('--baseline')) url.searchParams.set('movementDiagnostics', '1');
const load = async () => { await page.goto(url.href); await page.waitForFunction(() => window.__cf?.renderer, undefined, { timeout: 120000 }); };
const quiet = () => page.evaluate(() => { const c = __cf; c.setNoSpawn(true); c.setInvulnerable(true); c.clearTestEnemies(); c.setNoAggro(true); });
try {
    await load();
    // Use a genuine gesture to enable media playback before starting the intro.
    await page.locator('#btn-start').click();
    await page.locator('[data-sound-mode="full"]').click();
    await page.locator('#btn-sound-start').click();
    await page.waitForFunction(() => __cf.intro && !__cf.intro.prewarmPending, undefined, { timeout: 120000 });
    await page.waitForFunction(() => !__cf.intro, undefined, { timeout: 90000 });
    await page.waitForTimeout(3500);
    results.audioNormal = await page.evaluate(() => ({ trace: __audioTrace, live: (__introMedia || []).filter(a => !a.paused && !a.ended).length,
        mission: __cf.missionId, ship: __cf.spacecraftState }));
    const landedPause = results.audioNormal.trace.find(e => e.event === 'pauseCall' && /Landed/.test(e.src) && e.time > .1 && !e.ended);
    console.log('Normal audio', JSON.stringify({ ...results.audioNormal, trace: results.audioNormal.trace.filter(e => e.event !== 'volumechange') }));
    if (!observe) {
        assert(!landedPause, 'Normal intro truncated the landing one-shot'); assert.equal(results.audioNormal.live, 0);
        assert(results.audioNormal.trace.some(e => e.event === 'ended' && /Landed/.test(e.src)), 'Touchdown audio did not actually play to completion');
        assert(results.audioNormal.trace.some(e => e.event === 'pauseCall' && e.time > .1 && e.volume === 0 && e.loop), 'Engine did not fade to silence');
    }
    await quiet();
    await page.evaluate(() => { __cf.completeMission(); window.__audioTrace.length = 0; __cf.startMission('dead_signal', 'mission_select'); });
    await page.waitForFunction(() => __cf.intro && !__cf.intro.prewarmPending, undefined, { timeout: 120000 });
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    results.audioSkip = await page.evaluate(() => ({ trace: __audioTrace, live: __introMedia.filter(a => !a.paused && !a.ended).length,
        intro: !!__cf.intro, locked: !!document.pointerLockElement }));
    console.log('Skipped audio', JSON.stringify({ ...results.audioSkip, trace: results.audioSkip.trace.filter(e => e.event === 'pauseCall') }));
    assert(!results.audioSkip.intro && results.audioSkip.live === 0 && results.audioSkip.locked);
    if (!observe) {
        await page.evaluate(() => { __audioTrace.length = 0; __cf.startMission('dead_signal', 'mission_select'); });
        await page.waitForFunction(() => __cf.intro?.landed, undefined, { timeout: 90000 });
        await page.waitForFunction(() => __introMedia.some(a => /Landed/.test(a.src) && !a.paused && a.currentTime > .05), undefined, { timeout: 10000 });
        await page.keyboard.press('Space'); await page.waitForTimeout(500);
        results.audioLateSkip = await page.evaluate(() => ({ live: __introMedia.filter(a => !a.paused && !a.ended).length,
            cachedElements: __introMedia.length, intro: !!__cf.intro, trace: __audioTrace }));
        assert.equal(results.audioLateSkip.live, 0); assert.equal(results.audioLateSkip.cachedElements, 2);
        assert(!results.audioLateSkip.intro);
        const stop = results.audioLateSkip.trace.find(e => e.event === 'pauseCall' && /Landed/.test(e.src) && e.time > .05 && !e.ended);
        assert(stop && stop.volume === 0, 'Late skip did not fade touchdown cleanly');
        console.log('Late skip', JSON.stringify({ live: results.audioLateSkip.live, cachedElements: results.audioLateSkip.cachedElements, stop }));
    }
    await quiet();
    await page.evaluate(() => {
        const c = __cf; c.startMission('power_through', 'mission_select'); c.clearTestEnemies();
        c.move(360 - c.player.pos.x, 628 - c.player.pos.y); c.player.yaw = Math.PI / 2; c.player.lastMoveYaw = c.player.yaw;
        c.commandSquad('assist'); window.__movement = { squad: [], enemy: [], camera: [] };
        for (let i = 0; i < c.squad.length; i++) { const m = c.squad[i], spot = m.formationSpot(); m.pos.x = spot.x; m.pos.y = spot.y; }
        const m = c.squad[0], update = m.update;
        m.update = function() { const x = this.pos.x, y = this.pos.y; update.call(this);
            __movement.squad.push({ dx: this.pos.x - x, dy: this.pos.y - y, distance: Math.hypot(this.formationSpot().x - this.pos.x, this.formationSpot().y - this.pos.y) }); };
        let previous = performance.now();
        const sample = now => { if (!window.__sampling) return; __movement.camera.push({ ms: now - previous, x: c.camera.position.x, y: c.camera.position.y, px: c.player.pos.x, py: c.player.pos.y }); previous = now; requestAnimationFrame(sample); };
        window.__sampling = true; requestAnimationFrame(sample);
    });
    await page.keyboard.down('w'); await page.waitForTimeout(6500); await page.keyboard.up('w');
    await page.waitForTimeout(2500);
    results.follow = await page.evaluate(() => { window.__sampling = false; const samples = __movement.squad;
        const moving = samples.slice(120, 330); let toggles = 0;
        for (let i = 1; i < moving.length; i++) if ((Math.hypot(moving[i].dx, moving[i].dy) < 1e-6) !== (Math.hypot(moving[i-1].dx, moving[i-1].dy) < 1e-6)) toggles++;
        return { toggles, stoppedTicks: moving.filter(s => Math.hypot(s.dx, s.dy) < 1e-6).length, ticks: moving.length, samples, camera: __movement.camera }; });
    console.log('FOLLOW stop/go', JSON.stringify({ toggles: results.follow.toggles, stoppedTicks: results.follow.stoppedTicks, ticks: results.follow.ticks }));
    // Deliberately reduced speed is a diagnostic slow-target scenario, not a
    // new gameplay slow-walk control. Exercise formation arrival pacing.
    await page.evaluate(() => {
        const c = __cf; c.move(360 - c.player.pos.x, 628 - c.player.pos.y); c.player.speed = 2;
        for (const m of c.squad) { const p = m.formationSpot(); m.pos.x = p.x; m.pos.y = p.y; }
        __movement.squad.length = 0;
    });
    await page.keyboard.down('w'); await page.waitForTimeout(4000); await page.keyboard.up('w');
    results.slowFollow = await page.evaluate(() => {
        __cf.player.speed = 5.2;
        const s = __movement.squad.slice(40); let toggles = 0;
        for (let i = 1; i < s.length; i++) if ((Math.hypot(s[i].dx, s[i].dy) < 1e-6) !== (Math.hypot(s[i-1].dx, s[i-1].dy) < 1e-6)) toggles++;
        return { ticks: s.length, toggles, samples: s };
    });
    console.log('Slow-target FOLLOW', JSON.stringify({ ticks: results.slowFollow.ticks, toggles: results.slowFollow.toggles }));
    await page.evaluate(() => {
        const c = __cf; c.setNoAggro(false); c.clearTestEnemies(); c.commandSquad('hold');
        for (const m of c.squad) { m.pos.x = 600; m.pos.y = 300; m.holdPos.x = 600; m.holdPos.y = 300; }
        c.move(360 - c.player.pos.x, 654 - c.player.pos.y);
        const e = c.spawnTestEnemy('runner', 0, -26); e.hp = e.maxHp = 100000;
        const update = e.update; e.update = function() { const x = this.pos.x, y = this.pos.y; update.call(this);
            __movement.enemy.push({ x: this.pos.x, y: this.pos.y, dx: this.pos.x-x, dy: this.pos.y-y, stuck: this.stuckT, side: this.stuckSide ?? null }); };
    });
    await page.waitForTimeout(1000);
    results.pursuit = await page.evaluate(() => { const s = __movement.enemy; return { ticks: s.length,
        lateralTicks: s.filter(p => Math.abs(p.dx) > .02).length, falselyStuck: s.filter(p => p.stuck > .25).length,
        travel: s.length ? s.at(-1).y - s[0].y : 0, samples: s }; });
    console.log('Open pursuit', JSON.stringify({ ticks: results.pursuit.ticks, lateralTicks: results.pursuit.lateralTicks, falselyStuck: results.pursuit.falselyStuck }));
    assert(results.pursuit.travel > 5, 'Pursuit probe did not actually move');
    if (!observe) { assert.equal(results.pursuit.falselyStuck, 0); assert.equal(results.pursuit.lateralTicks, 0); assert(results.slowFollow.toggles < 8); }
    await quiet();
    results.playerScenarios = [];
    for (const [label, keys, x, y, yaw] of [
        ['walk', ['w'], 360, 636, Math.PI / 2], ['sprint', ['w', 'Shift'], 360, 636, Math.PI / 2],
        ['strafe', ['d'], 360, 636, Math.PI / 2], ['diagonal', ['w', 'd'], 360, 636, Math.PI / 2],
        ['wall contact', ['w'], 333, 648, Math.PI], ['reverse', ['s'], 360, 636, Math.PI / 2],
    ]) {
        await page.evaluate(({ x, y, yaw }) => { __cf.move(x - __cf.player.pos.x, y - __cf.player.pos.y); __cf.player.yaw = yaw; }, { x, y, yaw });
        for (const k of keys) await page.keyboard.down(k);
        await page.waitForTimeout(900);
        for (const k of keys) await page.keyboard.up(k);
        const p = await page.evaluate(() => ({ pos: [__cf.player.pos.x, __cf.player.pos.y], camera: __cf.camera.position.toArray(),
            solid: __cf.insideSolid(__cf.player.pos.x, __cf.player.pos.y) }));
        assert(!p.solid, `${label}: collision failed`);
        assert(Math.hypot(p.pos[0] - x, p.pos[1] - y) > .5, `${label}: did not move`);
        assert(Math.hypot(p.pos[0] - p.camera[0], p.pos[1] - p.camera[1]) < .001, `${label}: camera/player transform disagreement`);
        results.playerScenarios.push({ label, ...p });
    }
    console.log('Player scenarios', JSON.stringify(results.playerScenarios));
    await page.evaluate(() => { __cf.completeMission(); __cf.setNoSpawn(true); __cf.clearTestEnemies(); });
    assert.equal(await page.evaluate(() => __introMedia.filter(a => !a.paused && !a.ended).length), 0, 'Intro audio leaked into next chapter');
    if (process.argv.includes('--campaign')) {
        // Contiguous accelerated campaign acceptance: objective setups use
        // teleports, but E interactions and the Gamma return / interior / M4
        // doorway walking are real inputs. Timed defenses use existing hooks.
        const milestones = [];
        const note = async () => { const s = await page.evaluate(() => ({ mission: __cf.missionId, phase: __cf.phaseName, prompt: __cf.interactionPrompt })); milestones.push(s); console.log('Campaign', JSON.stringify(s)); };
        const setup = async (x, y) => {
            await page.evaluate(({ x, y }) => { const c = __cf; c.move(x - c.player.pos.x, y - c.player.pos.y);
                c.setNoSpawn(true); c.setInvulnerable(true); c.clearTestEnemies();
                for (let i = 0; i < c.squad.length; i++) { c.squad[i].pos.x = x - 2 + i * 2; c.squad[i].pos.y = y - 3; }
            }, { x, y });
            await page.waitForTimeout(350);
        };
        const hold = async expected => {
            await page.keyboard.down('e');
            try { await page.waitForFunction(expected => __cf.phaseName === expected, expected, { timeout: 12000 }); }
            catch (e) { console.log('Interaction timeout', await page.evaluate(() => ({ phase: __cf.phaseName, prompt: __cf.interactionPrompt,
                pos: [__cf.player.pos.x, __cf.player.pos.y], security: __cf.campaignContent.lab?.securityConsole?.pos }))); throw e; }
            finally { await page.keyboard.up('e'); }
            await note();
        };
        const walk = async (x, y) => {
            const deadline = Date.now() + 60000; let arrived = false;
            await page.keyboard.down('w');
            try {
                while (Date.now() < deadline) {
                    const s = await page.evaluate(({ x, y }) => { const c = __cf, d = Math.hypot(x-c.player.pos.x, y-c.player.pos.y);
                        c.player.yaw = Math.atan2(y-c.player.pos.y, x-c.player.pos.x);
                        return { d, solid: c.insideSolid(c.player.pos.x, c.player.pos.y), pos: [c.player.pos.x,c.player.pos.y] }; }, { x, y });
                    assert(!s.solid, `Campaign walk embedded ${s.pos}`);
                    if (s.d < .4) { arrived = true; break; }
                    await page.waitForTimeout(100);
                }
                assert(arrived, `Campaign walk stalled toward ${x},${y}`);
            } finally { await page.keyboard.up('w'); }
        };
        await page.evaluate(() => { __cf.resetCampaignProgress(); __cf.startMission('dead_signal', 'new_campaign'); __cf.skipIntro(); });
        await quiet();
        await page.waitForFunction(() => __cf.phaseName === 'M1_MOVE_FAC', undefined, { timeout: 12000 });
        await setup(360, 613); await page.waitForFunction(() => __cf.phaseName === 'M1_INVESTIGATE');
        await setup(324, 603); await hold('M1_RESTORE_POWER');
        await setup(347, 630); await hold('M1_COMMAND');
        await setup(382, 648); await hold('MOVE_R1');
        for (let i = 0; i < 3; i++) {
            const p = await page.evaluate(i => ({ x: __cf.relays[i].pos.x + 6.2, y: __cf.relays[i].pos.y }), i);
            await setup(p.x, p.y); await hold(['DEFEND_R1', 'DEFEND_R2', 'DEFEND_R3'][i]);
            await page.evaluate(i => { __cf.completeRelay(i); __cf.clearTestEnemies(); }, i); await note();
        }
        const route = await page.evaluate(() => __cf.routeInfo().route);
        for (const [x,y] of route.slice(1)) await walk(x,y);
        await page.screenshot({ path: resolve(artifactDir, `terminal-${ff ? 'firefox' : 'edge'}.png`) });
        await hold('M3_ENTER_LAB');
        for (const [x,y] of [[360,648],[360,667],[360,697],[360,718],[373,718]]) await walk(x,y);
        await hold('M3_REACH_SAMPLE');
        for (const [x,y] of [[360,718],[360,747],[364,774]]) await walk(x,y);
        await hold('M3_STABILIZE');
        await page.screenshot({ path: resolve(artifactDir, `containment-${ff ? 'firefox' : 'edge'}.png`) });
        await page.evaluate(() => __cf.setNoAggro(false));
        await page.waitForTimeout(3000); // genuine squad combat / containment encounter
        await page.evaluate(() => { __cf.completeStabilization(); __cf.clearTestEnemies(); __cf.setNoAggro(true); });
        await note();
        for (const [x,y] of [[395,752],[425,752],[457,752]]) await walk(x,y);
        assert.equal(await page.evaluate(() => __cf.phaseName), 'M4_REACH_LZ');
        await setup(466, 96); await hold('M4_HOLD_LZ');
        await page.evaluate(() => __cf.completeExtractionHoldout());
        await setup(450, 80); await hold('M4_DEPART');
        await page.evaluate(() => __cf.completeExtractionDeparture()); await note();
        assert.equal(await page.evaluate(() => __cf.phaseName), 'DONE');
        results.campaign = milestones;
        results.movementTrace = await page.evaluate(() => __cfMovement?.report());
        await page.screenshot({ path: resolve(artifactDir, `campaign-result-${ff ? 'firefox' : 'edge'}.png`) });
    }
    assert.deepEqual(errors, []);
    console.log('PASS runtime stability' + (process.argv.includes('--campaign') ? ' / accelerated campaign' : ''));
} finally {
    results.errors = errors;
    mkdirSync(artifactDir, { recursive: true });
    writeFileSync(resolve(artifactDir, `runtime-${ff ? 'firefox' : 'edge'}-${observe ? 'before' : 'after'}.json`), JSON.stringify(results, null, 2));
    await browser.close();
}
