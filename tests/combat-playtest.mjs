// Guided rendered-browser gameplay/evidence pass. Defaults to headed Edge.
// Scenario placement and accelerated chapter completion use existing debug hooks;
// firing, switching, reload, movement, resupply, setup and restart use real input.
// This is reproducible browser playtest evidence, not a human feel certification.
import assert from 'node:assert/strict';
import {campaignClick,endlessDeployment} from './menu-helpers.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium, firefox } = await import(process.env.PLAYWRIGHT_PACKAGE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const ff = process.argv.includes('firefox'), name = ff ? 'firefox' : 'edge';
const out = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m41/compatibility'); mkdirSync(out, { recursive: true });
const browser = await (ff ? firefox : chromium).launch(ff ? { headless: true } : { headless: process.argv.includes('--headless'),
    executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }), errors = [], consoles = [], results = {};
page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') consoles.push(m.text()); });
const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics','1');
const ready = () => page.waitForFunction(() => { try { return !!window.__cf?.renderer; } catch { return false; } }, undefined, { timeout: 120000 });
const capture = async label => {
    await page.locator('#cf-perf-diagnostics').evaluate(el => { el.style.display = 'none'; });
    await page.screenshot({ path: resolve(out, `${label}-${name}.png`) });
};
const quiet = () => page.evaluate(() => { __cf.setNoSpawn(true); __cf.setInvulnerable(true); __cf.clearTestEnemies(); __cf.setNoAggro(true); });
const select = async i => {
    await page.bringToFront();
    if(await page.locator('#pause-screen').isVisible()) await page.locator('#btn-resume').click();
    await page.keyboard.press(String(i + 1)); await page.waitForFunction(i => __cf.player.weaponIndex === i && !__cf.player.swapT, i);
};
const setup = async (x, y, yaw, contacts = 3) => {
    await quiet();
    await page.evaluate(({x,y,yaw,contacts}) => {
        const c = __cf; c.move(x-c.player.pos.x,y-c.player.pos.y); c.player.yaw = yaw; c.player.pitch = 0; c.player.lastMoveYaw = yaw; c.commandSquad('assist');
        for (let i = 0; i < 3; i++) { const m = c.squad[i]; m.pos.x = x-2+i*2; m.pos.y = y-4; m.abilityCd = 100; }
        for (let i = 0; i < contacts; i++) { const e = c.spawnTestEnemy(i % 2 ? 'skitter' : 'runner', Math.cos(yaw)*14 + (i-1)*3, Math.sin(yaw)*14); e.hp = e.maxHp = 10000; }
    }, { x,y,yaw,contacts });
};
try {
    await page.goto(url.href); await ready();
    await campaignClick(page); await page.locator('[data-sound-mode="full"]').click(); await page.locator('#btn-sound-start').click();
    await page.waitForFunction(() => __cf.intro && !__cf.intro.prewarmPending, undefined, { timeout: 120000 }); await page.keyboard.press('Space');
    await setup(360,604,Math.PI/2);
    await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up(); await capture('01-weapon1-campaign');
    await select(1); await page.mouse.down(); await page.waitForTimeout(900); await page.mouse.up(); await capture('02-weapon2-campaign');
    const depleted = await page.evaluate(() => __cf.player.weapon.mag);
    await page.keyboard.press('r'); await page.waitForFunction(() => __cf.player.weapon.reloading); await capture('03-combat-hud-reload');
    await select(0); assert.equal(await page.evaluate(() => __cf.combat.weapons.scatter.mag), depleted);
    await page.evaluate(() => __cf.setNoAggro(false));
    await page.keyboard.down('w'); await page.mouse.down();
    for (let i = 0; i < 12; i++) { await page.keyboard.press(String(i%2+1)); await page.waitForTimeout(90); }
    await page.mouse.up();
    const doorwayDeadline = Date.now()+15000;
    while (Date.now()<doorwayDeadline) {
        const d = await page.evaluate(() => { const p=__cf.player; p.yaw=Math.atan2(632-p.pos.y,360-p.pos.x); return Math.hypot(360-p.pos.x,632-p.pos.y); });
        if(d<.6) break;
        await page.waitForTimeout(100);
    }
    await page.keyboard.up('w');
    results.frontDoorCombat = await page.evaluate(() => ({ pos: [__cf.player.pos.x,__cf.player.pos.y], solid: __cf.insideSolid(__cf.player.pos.x,__cf.player.pos.y), squad: __cf.squadInfo(), combat: __cf.combat.snapshot() }));
    assert(results.frontDoorCombat.pos[1] > 620 && !results.frontDoorCombat.solid);
    await capture('04-squad-doorway-combat');
    results.chapters = [];
    for (const [id,x,y,yaw] of [['power_through',360,630,Math.PI/2],['sample_zero',360,729,Math.PI/2],['break_contact',405,752,0]]) {
        const before = await page.evaluate(() => __cf.combat.snapshot());
        await page.evaluate(() => __cf.completeMission());
        const after = await page.evaluate(() => __cf.combat.snapshot()); assert.deepEqual(after,before);
        assert.equal(await page.evaluate(() => __cf.missionId), id);
        await setup(x,y,yaw); await page.evaluate(() => __cf.setNoAggro(false));
        await select(0); await page.mouse.down(); await page.keyboard.down('w'); await page.waitForTimeout(1800);
        await select(1); await page.waitForTimeout(1800); await page.mouse.up(); await page.keyboard.up('w');
        await page.keyboard.press('r'); await page.waitForTimeout(200); await select(0);
        results.chapters.push(await page.evaluate(() => ({ mission: __cf.missionId, phase: __cf.phaseName, pos: [__cf.player.pos.x,__cf.player.pos.y],
            solid: __cf.insideSolid(__cf.player.pos.x,__cf.player.pos.y), combat: __cf.combat.snapshot(), squad: __cf.squadInfo() })));
    }
    assert(results.chapters.every(row => !row.solid && row.squad.every(m => Number.isFinite(m.position.x) && Number.isFinite(m.position.y))));
    // Emergency cache: spend one intentional interaction, then remain in range.
    await quiet();
    await page.evaluate(() => { const c=__cf, p=c.campaignContent.extraction.cache.pos; c.setPhase(25); c.move(p.x-c.player.pos.x,p.y-c.player.pos.y); });
    const cacheBefore = await page.evaluate(() => __cf.combat.snapshot());
    await page.keyboard.down('e'); await page.waitForFunction(() => __cf.campaignContent.extraction.cache.used); await page.keyboard.up('e');
    const cacheAfter = await page.evaluate(() => __cf.combat.snapshot());
    assert.equal(cacheAfter.cartridges, Math.min(12, cacheBefore.cartridges + 4));
    await page.waitForTimeout(1500); assert.deepEqual(await page.evaluate(() => __cf.combat.snapshot()),cacheAfter); results.emergencyCache = { cacheBefore,cacheAfter };
    // Real Continue menu after checkpoint/reload, including active weapon 2.
    await select(1); await page.evaluate(() => __cf.checkpoint()); const saved = await page.evaluate(() => __cf.combat.snapshot());
    await page.reload(); await ready(); await campaignClick(page,'btn-continue-campaign'); await page.locator('#btn-sound-start').click();
    await page.waitForFunction(() => __cf.mode==='campaign' && __cf.missionId==='break_contact' && document.getElementById('start-screen').classList.contains('hidden'), undefined, { timeout: 120000 });
    await page.waitForFunction(() => __cf.player.weapon.id==='scatter'); await quiet();
    assert.deepEqual(await page.evaluate(() => __cf.combat.snapshot()), saved); results.continue = saved;

    // Isolated ordinary combat: after actor/model preparation, no per-shot
    // material/geometry creation, no shader links and bounded effect totals.
    await page.evaluate(() => { __cf.startMission('power_through','mission_select'); }); await quiet();
    // The authored initial drone deployment is not a firing allocation. Let the
    // 3.5-second deployment finish, then isolate prepared, nonlethal contacts.
    await page.waitForFunction(() => __cf.phaseName==='MOVE_R1'); await setup(360,632,Math.PI/2);
    await select(0); await page.waitForTimeout(1500); await page.evaluate(() => __cfPerf.reset());
    await page.mouse.down(); await page.waitForTimeout(1300); await select(1); await page.waitForTimeout(2700); await page.mouse.up();
    results.isolatedCombat = await page.evaluate(() => { const p=__cfPerf.summary(); return { counters:p.counters,p95:p.p95Ms,worst:p.worstMs,pools:__cf.combatPoolInfo(),fired:__cf.combat.shotsFired }; });
    assert(results.isolatedCombat.fired>0);
    for (const key of ['materialsCreated','geometriesCreated','linkProgram','buildCampaignWorld','buildFacility','collisionNavRebuild']) assert.equal(results.isolatedCombat.counters[key]||0,0,`isolated combat ${key}`);
    const pool = results.isolatedCombat.pools; assert.equal(pool.shots+pool.shotPool,192); assert.equal(pool.impacts+pool.impactPool,41); assert.equal(pool.sparks+pool.sparkPool,160);

    // Evidence framing: the player stands behind the fighting line, so all three
    // role positions are visible rather than photographing an empty doorway.
    await page.evaluate(() => __cf.startMission('sample_zero','mission_select')); await quiet();
    await page.waitForFunction(() => __cf.phaseName!=='DEPLOY');
    await page.evaluate(() => { const c=__cf; c.setPhase(21); c.move(373-c.player.pos.x,718-c.player.pos.y); });
    await page.keyboard.down('e'); await page.waitForFunction(() => __cf.phaseName==='M3_REACH_SAMPLE'); await page.keyboard.up('e');
    await setup(360,730,Math.PI/2,0);
    await page.evaluate(() => {
        const c=__cf;
        for(let i=0;i<3;i++) { const m=c.squad[i]; m.pos.x=356+i*4; m.pos.y=740; m.hp=m.maxHp; m.evadeCd=100; m.breakT=0; m.engageT=0; m.engageTarget=null; m.target=null; m.lastSeenTarget=null; m.commitT=0; }
        for(const [type,dx,dy] of [['runner',-6,26],['runner',7,32],['brute',8,37]]) { const e=c.spawnTestEnemy(type,dx,dy); e.hp=e.maxHp=10000; }
        c.player.yaw=Math.PI/2; c.player.pitch=0;
    });
    await page.waitForFunction(()=>__cf.squad.filter(m=>m.target && m.mag<m.magSize).length===3,undefined,{timeout:10000});
    await page.evaluate(() => { __cf.player.yaw=Math.PI/2; __cf.player.pitch=0; });
    await capture('04-squad-doorway-combat');
    results.squadEvidence=await page.evaluate(() => __cf.squadInfo());
    assert.equal(await page.evaluate(() => __cf.squad.filter(m=>m.target && m.mag<m.magSize).length),3,'Squad evidence must show three live shooters');

    // Endless real UI, wide screen configuration, pressure and restart.
    await page.goto(url.href); await ready(); await endlessDeployment(page);
    await page.locator('#endless-player-ability').selectOption('surge'); await page.locator('#endless-squad-posture').selectOption('screen'); await capture('05-endless-setup');
    await page.locator('#btn-endless-ready').click(); await page.locator('#btn-sound-start').click(); await page.waitForFunction(() => __cf.mode==='endless',undefined,{timeout:120000});
    await page.mouse.click(640,360); await quiet(); await page.waitForTimeout(500);
    await page.evaluate(() => { __cf.player.yaw=Math.PI; __cf.player.pitch=-.04; }); await page.waitForTimeout(100); await capture('06-endless-selected-deployment');
    await page.evaluate(() => { __cf.setNoAggro(false); __cf.setNoSpawn(false); __cf.startWave(); });
    await page.mouse.down(); await page.keyboard.down('w'); await page.waitForTimeout(2200); await select(0); await page.waitForTimeout(2200); await page.mouse.up(); await page.keyboard.up('w');
    await page.evaluate(() => { const c=__cf; c.setNoSpawn(true); for(let i=0;i<10;i++) c.spawnTestEnemy(i%2?'runner':'skitter',Math.cos(i*.63)*12,Math.sin(i*.63)*12); });
    const aimAtContact = () => page.evaluate(() => {
        const c=__cf; let target=null, best=Infinity;
        for(const e of c.enemies) { const d=Math.hypot(e.pos.x-c.player.pos.x,e.pos.y-c.player.pos.y); if(!e.dead&&!e.dying&&d>2&&d<best) {best=d;target=e;} }
        if(target) { c.player.yaw=Math.atan2(target.pos.y-c.player.pos.y,target.pos.x-c.player.pos.x); c.player.pitch=Math.atan2(target.z+.8-c.player.zPos-c.player.eye,best); }
    });
    await select(1); await page.mouse.down(); await page.waitForTimeout(1000); await aimAtContact(); await page.waitForTimeout(100); await capture('07-infested-pressure');
    for(let i=0;i<16;i++) { await page.keyboard.press(String(i%2+1)); await page.waitForTimeout(70); } await page.mouse.up();
    await page.waitForFunction(()=>!__cf.player.swapT); await aimAtContact(); await page.waitForTimeout(100); await capture('08-endless-squad-combat');
    results.endless = await page.evaluate(() => ({ config:__cf.endlessConfiguration, combat:__cf.combat.snapshot(), squad:__cf.squadInfo(), enemies:__cf.enemies.length }));
    await page.evaluate(() => { const c=__cf; c.clearTestEnemies(); c.setNoSpawn(true); c.setInvulnerable(false); c.setPlayerHealth(1,0); c.commandSquad('hold');
        for(const m of c.squad) { m.pos.x=m.holdPos.x=600; m.pos.y=m.holdPos.y=600; } const e=c.spawnTestEnemy('runner',1,0); e.hp=100000; e.attackT=0; c.damagePlayer(200); });
    await page.waitForFunction(() => __cf.phaseName==='DEAD'); await page.waitForTimeout(2200); await page.keyboard.press('Space'); await page.waitForFunction(() => __cf.phaseName==='ENDLESS');
    results.restart = await page.evaluate(() => ({ config:__cf.endlessConfiguration, combat:__cf.combat.snapshot(), wave:__cf.endless.wave, squad:__cf.squad.length }));
    assert.equal(results.restart.combat.activeId,'rifle'); assert.equal(results.restart.config.posture,'screen'); assert.equal(results.restart.wave,0); assert.equal(results.restart.squad,3);
    assert.deepEqual(errors,[]); assert.deepEqual(consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);
    results.passed = true;
    console.log('PASS guided browser gameplay/evidence',name,JSON.stringify({ isolatedCombat:results.isolatedCombat, checkpoints:true, chapters:results.chapters.map(r=>r.mission), restart:results.restart }));
} finally {
    await page.mouse.up().catch(()=>{}); await page.keyboard.up('w').catch(()=>{}); await page.keyboard.up('e').catch(()=>{});
    writeFileSync(resolve(out,`playtest-${name}.json`),JSON.stringify({ results,errors,consoles },null,2)); await browser.close();
}
