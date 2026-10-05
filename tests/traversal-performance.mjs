// Short ordinary W-key traversal samples, not a desktop FPS benchmark.
// --shadow-control adds a test-only same-route shadow-refresh ablation.
// --observe records baseline; --headed allows on-device/manual visual capture.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium, firefox } = await import(process.env.PLAYWRIGHT_PACKAGE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const ff = process.argv.includes('firefox'), observe = process.argv.includes('--observe');
const artifactDir = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m39');
if (process.argv.includes('--report')) {
    const saved = JSON.parse(readFileSync(resolve(artifactDir, `traversal-${ff ? 'firefox' : 'edge'}-${observe ? 'before' : 'after'}.json`)));
    for (const r of saved.results) console.log(r.label, JSON.stringify({ ...r.summary, gl: r.gl,
        linkFrames: r.frames.filter(f => f.delta.linkProgram).map(f => ({ ms: f.ms, renderMs: f.renderMs, events: f.events })) }));
    process.exit(0);
}
const browser = await (ff ? firefox : chromium).launch(ff ? { headless: !process.argv.includes('--headed') }
    : { headless: !process.argv.includes('--headed'), executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const results = [], errors = [];
page.on('pageerror', e => errors.push(e.message));
const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics', '1');
const load = async () => {
    await page.goto(url.href); await page.waitForFunction(() => __cf?.renderer && __cfPerf, undefined, { timeout: 120000 });
    await page.evaluate(() => {
        const gl = __cf.renderer.getContext();
        for (const key of ['createTexture', 'texImage2D', 'texSubImage2D', 'compressedTexImage2D']) {
            const fn = gl[key]; gl[key] = function(...args) { window.__glCounts[key] = (window.__glCounts[key] || 0) + 1; return fn.apply(this, args); };
        }
        window.__glCounts = {};
    });
};
const sample = async (label, x, y, yaw, control = false, combat = false, ms = 6000) => {
    await page.evaluate(({ x, y, yaw, control, combat }) => {
        const c = __cf; c.move(x - c.player.pos.x, y - c.player.pos.y); c.player.yaw = yaw;
        c.setInvulnerable(true); c.setNoSpawn(!combat); c.setNoAggro(!combat); if (!combat) c.clearTestEnemies();
        c.commandSquad('assist');
        for (let i = 0; i < c.squad.length; i++) { c.squad[i].pos.x = x - 2 + i * 2; c.squad[i].pos.y = y - 5; }
        window.__shadowControl = control;
        if (!window.__controlInstalled) { const r = c.renderer, render = r.render; r.render = function(...args) {
            if (window.__shadowControl) r.shadowMap.needsUpdate = false;
            return render.apply(this, args);
        }; window.__controlInstalled = true; }
    }, { x, y, yaw, control, combat });
    await page.waitForTimeout(1000);
    await page.evaluate(() => { __cfPerf.reset(); __glCounts = {}; });
    await page.keyboard.down('w');
    if (combat) await page.mouse.down();
    await page.waitForTimeout(ms);
    await page.keyboard.up('w'); if (combat) await page.mouse.up();
    const result = await page.evaluate(label => {
        const p = __cfPerf.report(), c = __cf;
        const gl = c.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info');
        return { label, browser: navigator.userAgent, summary: { frames: p.frames.length, p95: p.p95Ms, p99: p.p99Ms, worst: p.worstMs,
            over100: p.over100, counters: p.counters }, gl: __glCounts, position: [c.player.pos.x, c.player.pos.y],
            entities: c.performanceInfo().entities, sfx: c.sfxDebug,
            wave: c.endless.wave, kills: c.campaignRun.kills,
            renderer: { version: gl.getParameter(gl.VERSION), vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : null,
                device: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null },
            frames: p.frames, hitches: p.hitches };
    }, label);
    results.push(result);
    console.log(label, JSON.stringify({ ...result, frames: undefined, hitches: result.hitches.filter(f => f.ms > 100).slice(0, 4).map(f => ({ ms: f.ms, renderMs: f.renderMs, delta: f.delta,
        expensiveOps: Object.fromEntries(Object.entries(f.ops).filter(([, op]) => op.ms > 5)) })) }));
    for (const key of ['buildCampaignWorld', 'buildFacility', 'collisionNavRebuild']) assert.equal(result.summary.counters[key] || 0, 0, key);
    if (!combat) for (const key of ['geometriesCreated', 'materialsCreated', 'linkProgram']) assert.equal(result.summary.counters[key] || 0, 0, `${label}: ${key}`);
};
try {
    await load();
    await page.evaluate(() => { __cf.resetCampaignProgress(); __cf.startMission('dead_signal', 'new_campaign'); __cf.skipIntro(); });
    await sample('M1 exterior', 445, 150, Math.PI / 2);
    await page.evaluate(() => __cf.completeMission());
    await sample('M2 Alpha', 196, 542, Math.PI / 2);
    await sample('M2 Beta', 245, 713, Math.PI / 2);
    await sample('M2 Gamma', 575, 548, Math.PI / 2);
    await page.evaluate(() => { for (let i = 0; i < 3; i++) { __cf.startDefense(i); __cf.completeRelay(i); } });
    await sample('M2 return/front', 360, 605, Math.PI / 2);
    await page.evaluate(() => __cf.completeMission());
    await sample('Facility interior', 360, 620, Math.PI / 2);
    if (process.argv.includes('--shadow-control')) await sample('Facility shadow control', 360, 620, Math.PI / 2, true);
    await page.evaluate(() => __cf.completeMission());
    await sample('M4 service/exit', 422, 752, 0);
    await page.evaluate(() => { __cf.setNoSpawn(false); __cf.setNoAggro(false); __cf.clearTestEnemies(); __cf.spawnTestEnemy('runner', 0, 12); });
    await sample('Campaign combat', 480, 190, Math.PI / 2, false, true, 10000);
    await load(); await page.evaluate(() => { __cf.startEndlessMode(); __cf.startWave(); });
    await sample('Endless early combat', 400, 375, Math.PI / 2, false, true, 15000);
    await page.waitForTimeout(30000);
    await page.evaluate(() => { if (!__cf.waveActive) __cf.startWave(); });
    await sample('Endless later combat', 400, 375, Math.PI / 2, false, true, 15000);
    assert(results.at(-1).summary.counters.sceneObjectsAdded > 0, 'Endless combat did not run');
    await page.evaluate(() => {
        const c = __cf; c.move(400 - c.player.pos.x, 375 - c.player.pos.y); c.clearTestEnemies(); c.setNoSpawn(true);
        c.setInvulnerable(false); c.setPlayerHealth(1, 0); c.commandSquad('hold');
        for (const m of c.squad) { m.pos.x = m.holdPos.x = 600; m.pos.y = m.holdPos.y = 600; }
        const e = c.spawnTestEnemy('runner', 1, 0); e.hp = 100000; e.attackT = 0;
    });
    await page.waitForFunction(() => __cf.phaseName === 'DEAD', undefined, { timeout: 10000 });
    await page.waitForTimeout(2200);
    await page.evaluate(() => __cfPerf.reset());
    await page.keyboard.press('Space');
    await page.waitForFunction(() => __cf.phaseName === 'ENDLESS' && __cf.player.hp === 100, undefined, { timeout: 10000 });
    const restart = await page.evaluate(() => ({ wave: __cf.endless.wave, squad: __cf.squad.length,
        counters: __cfPerf.summary().counters, enemies: __cf.enemies.length }));
    console.log('Endless death/restart', JSON.stringify(restart));
    assert.equal(restart.wave, 0); assert.equal(restart.squad, 3);
    assert.equal(restart.counters.buildEndlessWorld || 0, 0);
    assert.deepEqual(errors, []);
} finally {
    mkdirSync(artifactDir, { recursive: true });
    const path = resolve(artifactDir, `traversal-${ff ? 'firefox' : 'edge'}-${observe ? 'before' : 'after'}`);
    writeFileSync(path + '.json', JSON.stringify({ results, errors }));
    writeFileSync(path + '-summary.json', JSON.stringify(results.map(({ frames, hitches, ...r }) => r), null, 2));
    await browser.close();
}
