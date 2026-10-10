// Milestone 4.1: real deployment/input and guided rendered gameplay. Bounded
// fixtures accelerate wave counters and position contacts; controls remain real.
import assert from 'node:assert/strict';
import {endlessDeployment} from './menu-helpers.mjs';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium, firefox } = await import(process.env.PLAYWRIGHT_PACKAGE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const ff = process.argv.includes('firefox'), name = ff ? 'firefox' : 'edge';
const out = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m41'), evidence = resolve(out, 'evidence'); mkdirSync(evidence, { recursive: true });
const browser = await (ff ? firefox : chromium).launch(ff ? { headless: true } : {
    headless: process.argv.includes('--headless'), executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [], consoles = [], results = { runs: [], terrains: [] };
page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') consoles.push(m.text()); });
const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics', '1');
const ready = () => page.waitForFunction(() => !!window.__cf?.renderer, undefined, { timeout: 120000 });
const quiet = () => page.evaluate(() => { __cf.setNoSpawn(true); __cf.setNoAggro(true); __cf.setInvulnerable(true); __cf.clearTestEnemies(); });
const capture = async (label, locator = null) => {
    if (ff) return;
    await page.locator('#cf-perf-diagnostics').evaluate(el => el.style.display = 'none');
    if (locator) await page.locator(locator).screenshot({ path: resolve(evidence, label + '.png') });
    else await page.screenshot({ path: resolve(evidence, label + '.png') });
};
const select = async index => {
    await page.bringToFront();
    if (await page.locator('#pause-screen').isVisible()) await page.locator('#btn-resume').click();
    await page.keyboard.press(String(index + 1));
    try { await page.waitForFunction(i => __cf.player.weaponIndex === i && !__cf.player.swapT, index); }
    catch(error) { console.log('selection timeout',await page.evaluate(()=>({index:__cf.player.weaponIndex,swap:__cf.player.swapT,phase:__cf.phaseName,pause:document.getElementById('pause-screen').className,lock:!!document.pointerLockElement}))); throw error; }
};
const hud = () => page.evaluate(() => __cf.inspectHUD());
const configA = { player: { slot1: 'rifle', slot2: 'scatter', ability:'surge' }, squad: {
    rook: { weapon: 'arc', ability: 'medic_pulse' }, vex: { weapon: 'plasma', ability: 'target_designator' }, kade: { weapon: 'scatter', ability: 'bulwark' } }, posture: 'escort' };
const configB = { player: { slot1: 'arc', slot2: 'plasma', ability:'surge' }, squad: {
    rook: { weapon: 'rifle', ability: 'target_designator' }, vex: { weapon: 'scatter', ability: 'bulwark' }, kade: { weapon: 'arc', ability: 'medic_pulse' } }, posture: 'screen' };
const configC = { player: { slot1: 'scatter', slot2: 'arc', ability:'surge' }, squad: {
    rook: { weapon: 'plasma', ability: 'bulwark' }, vex: { weapon: 'arc', ability: 'medic_pulse' }, kade: { weapon: 'rifle', ability: 'target_designator' } }, posture: 'balanced' };
const configD = { player: { slot1: 'plasma', slot2: 'rifle', ability:'surge' }, squad: {
    rook: { weapon: 'scatter', ability: 'target_designator' }, vex: { weapon: 'rifle', ability: 'medic_pulse' }, kade: { weapon: 'plasma', ability: 'bulwark' } }, posture: 'balanced' };
async function setup(config, index) {
    await page.goto(url.href); await ready(); await endlessDeployment(page);
    // Native duplicate prevention: free slot 1's requested gun before selecting.
    const current1 = await page.locator('#endless-slot1').inputValue(), current2 = await page.locator('#endless-slot2').inputValue();
    if (config.player.slot1 === current2) await page.locator('#endless-slot2').selectOption(['rifle','scatter','arc','plasma'].find(id=>id!==current1&&id!==config.player.slot1));
    await page.locator('#endless-slot1').selectOption(config.player.slot1);
    await page.locator('#endless-slot2').selectOption(config.player.slot2);
    await page.locator('#endless-player-ability').selectOption(config.player.ability);
    for (const id of ['rook', 'vex', 'kade']) {
        await page.locator('#endless-' + id + '-weapon').selectOption(config.squad[id].weapon);
        await page.locator('#endless-' + id + '-ability').selectOption(config.squad[id].ability);
    }
    await page.locator('#endless-squad-posture').selectOption(config.posture);
    assert.equal(await page.locator('#endless-slot1 option:not(:disabled)').count(), 3);
    assert.equal(await page.locator('#endless-slot2 option:not(:disabled)').count(), 3);
    const footer = await page.locator('.cf-deployment-footer button').evaluateAll(buttons => buttons.map(b => { const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
    assert.equal(footer[0].y, footer[1].y); assert.equal(footer[0].w, footer[1].w); assert(footer[1].x + footer[1].w < 1280);
    const box = await page.locator('#endless-setup-panel').boundingBox(); assert(box.y >= 0 && box.y + box.height <= 720);
    if (index === 0) { await capture('01-deployment'); await capture('04-horizontal-footer', '.cf-deployment-footer'); }
    if (index === 1) await capture('02-player-arc-px-pair');
    if (index === 2) await capture('03-squad-customization');
    // Draft survives Back; native keyboard navigation and footer focus order.
    await page.locator('#btn-endless-back').click(); await endlessDeployment(page);
    assert.equal(await page.locator('#endless-slot1').inputValue(), config.player.slot1);
    await page.locator('#endless-player-ability').focus(); await page.keyboard.press('Home');
    assert.equal(await page.locator('#endless-player-ability').inputValue(),'surge');
    await page.locator('#btn-endless-ready').focus(); await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'btn-endless-back');
    await page.locator('#btn-endless-ready').click(); await page.locator('[data-sound-mode="full"]').click(); await page.locator('#btn-sound-start').click();
    await page.waitForFunction(() => __cf.mode === 'endless', undefined, { timeout: 120000 });
    await page.mouse.click(640, 360); await quiet(); await page.waitForTimeout(500);
    const deployed = await page.evaluate(() => ({ config: __cf.endlessConfiguration, combat: __cf.combat.snapshot(), squad: __cf.squadInfo(),
        weaponTuning: __cf.squad.map(m => ({ weapon: m.def.weapon, preferred: m.def.combat.preferredRange, cadence: m.def.cd, damage: m.def.dmg, ability: m.def.ability.id })) }));
    assert.deepEqual(deployed.config, config); assert.equal(Object.keys(deployed.combat.weapons).length, 2);
    assert.equal(deployed.combat.activeId, config.player.slot1); assert.equal(deployed.combat.cartridges, 8);
    for (let i = 0; i < 3; i++) assert.equal(deployed.weaponTuning[i].weapon, config.squad[['rook', 'vex', 'kade'][i]].weapon);
    return deployed;
}
async function recordTerrain() {
    const terrain = await page.evaluate(() => {
        const values = []; for (let y = 330; y <= 470; y += 20) for (let x = 330; x <= 470; x += 20) values.push(__cf.terrainHeight(x, y));
        return { arena: __cf.endless.arena.id, min: Math.min(...values), max: Math.max(...values), flatSamples: values.filter(h => h === 0).length, samples: values.length };
    });
    results.terrains.push(terrain);
    if (terrain.arena === 'crater' && !results.flatCapture || terrain.arena === 'ridges' && !results.heightCapture) {
        await page.evaluate(() => { __cf.setHud(false); __cf.hideViewmodel(true); __cf.setCoverPose([380, 490, 12, 400, 365, 1]); });
        await page.waitForTimeout(200); await capture(terrain.arena === 'crater' ? '09-flat-terrain' : '10-elevated-terrain');
        if (terrain.arena === 'crater') results.flatCapture = terrain; else results.heightCapture = terrain;
        await page.evaluate(() => { __cf.setCoverPose(null); __cf.setHud(true); __cf.hideViewmodel(false); });
    }
    return terrain;
}
try {
    // Guard exact accepted terrain code path without forcing a random outcome.
    const html = readFileSync('chargefront.html', 'utf8');
    assert(html.includes('endlessRun.arena = ENDLESS_ARENAS[randInt(ENDLESS_ARENAS.length)]'));
    assert(html.includes("if (mode === 'endless') return endlessTerrainHeight(x, y)"));
    assert(!/drawEnemyMarkers|opt-markers|KeyN|CONTRACT/.test(html));
    for (const [index, config] of [configA, configB, configC, configD].entries()) {
        console.log('RUN', name, 'configuration', index + 1);
        const deployed = await setup(config, index), terrain = await recordTerrain();
        // Stage an open, high-health contact; real movement/fire/input follows.
        await page.evaluate(() => {
            const c = __cf; c.move(420 - c.player.pos.x, 450 - c.player.pos.y); c.player.yaw = 0; c.player.pitch = 0;
            for (const m of c.squad) { m.fireT = 100; m.abilityCd = 100; }
            const e = c.spawnTestEnemy('brute', 20, 0); e.hp = e.maxHp = 100000; e.speed = 0;
            window.__contact = e;
        });
        const weapons = [];
        for (const slot of [0, 1]) {
            await select(slot);
            await page.evaluate(() => { const e = window.__contact, p = __cf.player; p.yaw = Math.atan2(e.pos.y - p.pos.y, e.pos.x - p.pos.x); p.pitch = Math.atan2(e.z + .8 - p.zPos - p.eye, Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y)); });
            const before = await page.evaluate(() => ({ mag: __cf.player.weapon.mag, hp: __contact.hp }));
            await page.mouse.down(); await page.waitForTimeout(1000); await page.mouse.up(); await page.waitForTimeout(400);
            const after = await page.evaluate(() => ({ id: __cf.player.weapon.id, mag: __cf.player.weapon.mag, hp: __contact.hp }));
            assert(after.mag < before.mag); assert(after.hp < before.hp, `${after.id} must actually hit`); weapons.push({ before, after });
            if (index === 1 && slot === 1) await capture('07-px-gameplay');
        }
        await page.keyboard.press('q'); await page.waitForFunction(() => __cf.player.weaponIndex === 0 && !__cf.player.swapT);
        if (index === 0) {
            await select(1);
            const moderate = await page.evaluate(() => {
                const c = __cf, p = c.player; c.clearTestEnemies();
                for (let i = 0; i < 16; i++) {
                    const a = i * Math.PI / 8, x = p.pos.x + Math.cos(a) * 45, y = p.pos.y + Math.sin(a) * 45;
                    if (!c.probeLOS(p.pos.x,p.pos.y,x,y) || c.insideSolid(x,y)) continue;
                    const z=c.terrainHeight(x,y)+.8, startZ=p.zPos+p.eye-.1;
                    if(c.probeBlocked(p.pos.x,p.pos.y,startZ,x,y,z,.1)) continue;
                    let clear=true;
                    for(let j=1;j<45;j++) if(c.terrainHeight(p.pos.x+Math.cos(a)*j,p.pos.y+Math.sin(a)*j)+.35>startZ+(z-startZ)*j/45) {clear=false;break;}
                    if(!clear) continue;
                    const e = c.spawnTestEnemy('brute',x-p.pos.x,y-p.pos.y); e.hp=e.maxHp=100000; e.speed=0;
                    window.__moderate=e; p.yaw=a; p.pitch=Math.atan2(e.z+.8-p.zPos-p.eye,45);
                    return {hp:e.hp,distance:45,position:[x,y],mag:p.weapon.mag};
                }
                throw Error('No clear moderate-range fixture');
            });
            await page.mouse.down({button:'right'}); await page.mouse.down();
            for(let i=0;i<6;i++) {
                await page.evaluate(() => { const e=__moderate,p=__cf.player; p.yaw=Math.atan2(e.pos.y-p.pos.y,e.pos.x-p.pos.x); p.pitch=Math.atan2(e.z+.8-p.zPos-p.eye,Math.hypot(e.pos.x-p.pos.x,e.pos.y-p.pos.y)); });
                await page.waitForTimeout(450);
            }
            await page.mouse.up(); await page.mouse.up({button:'right'}); await page.waitForTimeout(600);
            const after = await page.evaluate(() => ({hp:__moderate.hp,position:[__moderate.pos.x,__moderate.pos.y],mag:__cf.player.weapon.mag,pause:document.getElementById('pause-screen').className}));
            results.crwModerate = {before:moderate,after,damage:moderate.hp-after.hp}; console.log('moderate',JSON.stringify(results.crwModerate));
            assert(after.hp < moderate.hp,'CRW must deliver real moderate-distance pressure');
            await page.evaluate(() => { __cf.clearTestEnemies(); const e=__cf.spawnTestEnemy('brute',20,0); e.hp=e.maxHp=100000; e.speed=0; window.__contact=e; __cf.player.yaw=0; __cf.player.pitch=0; });
            await select(0);
        }
        await page.keyboard.down('w'); await page.waitForTimeout(500); await page.keyboard.up('w');
        if (index === 0) await capture('05-consolidated-hud');
        const h = await hud();
        for (const label of ['VITALS', 'COMMANDER', 'ROOK', 'VEX', 'KADE', 'COMBAT', 'SUPPLIES', 'CARTRIDGES']) assert(h.text.some(t => t.value === label));
        const pair = await page.evaluate(() => __cf.combat.slots.map((id,index) => ({slot:index+1,name:__cf.combat.weapons[id].name,mag:__cf.combat.weapons[id].mag,size:__cf.combat.weapons[id].magSize})));
        for(const weapon of pair) {assert(h.text.some(t=>t.value==='['+weapon.slot+'] '+weapon.name));assert(h.text.some(t=>t.value===weapon.mag+' / '+weapon.size));}
        const vitals=h.panels.find(p=>p.x===148&&p.height===296);
        assert(h.text.filter(t => ['COMMANDER','ROOK','VEX','KADE'].includes(t.value)).every(t => t.y > vitals.y-vitals.height/2));
        assert(h.text.find(t => t.value.startsWith('SCRAP ')).y < 300);
        await page.keyboard.press('r'); await page.waitForFunction(() => __cf.player.weapon.reloading);
        const reload1 = await hud(); await page.waitForTimeout(350); const reload2 = await hud();
        const bar = h => h.bars.find(b => b.width === 100 && b.y === 91);
        assert(reload1.text.some(t => t.value === 'RELOADING')); assert(bar(reload2).progress > bar(reload1).progress);
        assert(!reload2.text.some(t => /RLD.*%|RELOADING.*%/.test(t.value)));
        if (index === 0) await capture('06-reload-progress');
        const reserve = await page.evaluate(() => __cf.combat.cartridges);
        await select(1); assert.equal(await page.evaluate(() => __cf.combat.cartridges), reserve); assert(!(await hud()).text.some(t => t.value === 'RELOADING'));
        await page.keyboard.press('r'); await page.waitForFunction(() => __cf.player.weapon.reloading);
        await page.waitForFunction(() => !__cf.player.weapon.reloading); assert.equal(await page.evaluate(() => __cf.combat.cartridges), reserve - 1);
        assert(!(await hud()).bars.some(b => b.width === 100 && b.y === 91));
        const craftBefore = await page.evaluate(() => { __cf.giveScrap(4); return { reserve: __cf.combat.cartridges, scrap: __cf.scrap }; });
        await page.keyboard.press('v'); await page.waitForFunction(r => __cf.combat.cartridges === r + 1, craftBefore.reserve);
        assert.equal(await page.evaluate(() => __cf.scrap), craftBefore.scrap - 4);
        // Selected ability execution and effect origin belong to the actual actor.
        const abilities = await page.evaluate(() => {
            const c = __cf, rows = []; c.pause(true);
            c.player.hp = 40; c.player.shield = 0;
            for (let i = 0; i < 3; i++) {
                const m = c.squad[i]; m.pos.x = c.player.pos.x + (i - 1) * 4; m.pos.y = c.player.pos.y + 2; m.z = c.terrainHeight(m.pos.x, m.pos.y); m.hp = 40; m.shield = 0; m.abilityCd = 0;
                const origin = [m.pos.x, m.pos.y], ok = c.useSquadAbility(i);
                rows.push({ name: m.def.name, ability: m.def.ability.id, ok, cooldown: m.abilityCd, bulwark: m.bulwarkT,
                    origin, effects: c.effectInfo().impacts, lastUser: c.abilityCoordinationInfo().lastUser });
            }
            c.pause(false); return rows;
        });
        for (const row of abilities) {
            assert(row.ok && row.cooldown > 0); assert.equal(row.lastUser, row.name);
            assert(row.effects.some(p => p[0] === row.origin[0] && p[1] === row.origin[1]), `${row.name} effect origin`);
            if (row.ability === 'bulwark') assert.equal(row.bulwark, 9);
        }
        // Squad shoots with configured weapon; bounded acquisition/navigation unchanged.
        await page.evaluate(() => { __cf.commandSquad('hold'); for (const m of __cf.squad) { m.fireT = 0; m.breakT = 0; m.engageT = 0; m.engageTarget = null; m.target = __contact; m.hp = m.maxHp; m.evadeCd = 100; } __cf.evaluateDirector(); __cf.evaluateSquadTactics(); });
        const squadMags = await page.evaluate(() => __cf.squad.map(m => m.mag));
        await page.waitForTimeout(2000);
        const squadAfter = await page.evaluate(() => __cf.squad.map(m => ({ mag: m.mag, position: [m.pos.x,m.pos.y], preferred: m.def.combat.preferredRange, target: m.target?.type || null, range: m.def.range, fireT: m.fireT, reaction: m.reactionT })));
        results.lastSquadAttempt = { squadMags, squadAfter };
        assert(squadAfter.every((m,i) => m.mag < squadMags[i] && m.position.every(Number.isFinite)));
        // Performance after all effects/models prepared, including chains/blasts.
        await page.evaluate(() => { for (const m of __cf.squad) m.fireT = 100; __cfPerf.reset(); });
        await select(0); await page.mouse.down(); await page.waitForTimeout(1400); await select(1); await page.waitForTimeout(1800); await page.mouse.up();
        const performance = await page.evaluate(() => ({ summary: __cfPerf.summary(), pools: __cf.combatPoolInfo(), effects: __cf.effectInfo() }));
        for (const key of ['materialsCreated','geometriesCreated','linkProgram','buildEndlessWorld','buildTerrain','buildFacility','collisionNavRebuild']) assert.equal(performance.summary.counters[key] || 0, 0, `config ${index + 1} ${key}`);
        assert.equal(performance.pools.shots + performance.pools.shotPool, 192); assert.equal(performance.effects.arcs + performance.effects.arcPool, 40);
        // Automatic wave assignment/cleanup; accelerated counters, real runtime activation.
        await quiet(); const mutators = await page.evaluate(() => {
            const c = __cf, rows = []; c.pause(true);
            for (let wave = 1; wave <= 24; wave++) {
                c.endless.waveActive = false; c.startWave();
                rows.push({ wave: c.endless.wave, id: c.endless.mutator?.id || null, shield: c.player.shield });
                c.endless.budgetLeft = 0; c.advanceEncounterSystems(0);
                if (c.endless.mutator !== null || c.endless.waveActive) throw Error('Mutator leaked past wave clear');
            }
            c.pause(false); return rows;
        });
        assert(mutators.slice(0,5).every(m => m.id === null)); assert(mutators.slice(5).some(m => m.id));
        for (let i = 6; i < mutators.length; i++) if (mutators[i].id) assert.notEqual(mutators[i].id, mutators[i-1].id);
        assert(mutators.filter(m => m.id === 'storm').every(m => m.shield === 0));
        if (index === 1) {
            // Bounded random attempts retain a naturally selected modified wave.
            await page.evaluate(() => {
                for (let i = 0; i < 12; i++) { __cf.endless.waveActive = false; __cf.startWave(); if (__cf.endless.mutator) break; }
            });
            // Let the accelerated previous-clear toast expire; announcement lasts 5 s.
            await page.waitForTimeout(4100);
            await capture('08-automatic-mutator');
        }
        // Pause restart is the product menu path; same arena/resources fresh, no save write.
        const saved = await page.evaluate(() => localStorage.cf_campaign_v1 || null);
        await page.evaluate(() => document.exitPointerLock()); await page.waitForFunction(() => !document.getElementById('pause-screen').classList.contains('hidden'));
        await page.locator('#btn-restart').click(); await page.waitForFunction(() => __cf.endless.wave === 0);
        const restarted = await page.evaluate(() => ({ config: __cf.endlessConfiguration, combat: __cf.combat.snapshot(), arena: __cf.endless.arena.id,
            mutator: __cf.endless.mutator, previous: __cf.endless.previousMutatorId, cooldowns: __cf.squad.map(m => m.abilityCd), save: localStorage.cf_campaign_v1 || null,
            shotsFired:__cf.combat.shotsFired, fullMagazines:Object.fromEntries(__cf.combat.slots.map(id=>[id,{mag:__cf.weaponDefinitions.find(w=>w.id===id).magSize}])) }));
        // Deployment's later gameplay lock-acquisition click can fire a round.
        // Restart promises fresh canonical magazines, not that post-click sample;
        // the restart menu click must never leak into gameplay as a shot.
        assert.deepEqual(restarted.config, config);
        assert.deepEqual(restarted.combat, {...deployed.combat,weapons:restarted.fullMagazines});
        assert.equal(restarted.shotsFired,0);assert.equal(restarted.arena, terrain.arena);
        assert.equal(restarted.mutator, null); assert.equal(restarted.previous, null); assert(restarted.cooldowns.every(c => c === 0)); assert.equal(restarted.save, saved);
        results.runs.push({ deployed, weapons, reload: [bar(reload1),bar(reload2)], abilities, squadAfter, mutators, restarted, performance });
    }
    // Exact fade, range expiry and secondary LOS rules through real shot processing.
    results.projectiles = await page.evaluate(() => {
        const c = __cf; c.pause(true); c.clearTestEnemies(); c.advanceShots(10); const rows = [];
        for (const w of c.weaponDefinitions) {
            if(w.id==='arc'){const before=c.shots.length;c.spawnTestShot(400,450,150,1,0,0,'arc');const hit=c.arcHitInfo();rows.push({id:w.id,mechanism:hit.mechanism,range:hit.range,projectiles:c.shots.length-before});continue;}
            c.spawnTestShot(400, 450, 150, 1, 0, 0, w.id); const s = c.shots[c.shots.length - 1], material = s.bolt.material;
            c.advanceShots(w.range / 85 - .15); const full = s.bolt.material.opacity;
            c.advanceShots(.09); const faded = s.bolt.material.opacity, travel = s.x - s.ox;
            c.advanceShots(.2); rows.push({ id: w.id, full, faded, travel, finalTravel: s.x - s.ox, pooled: !c.shots.includes(s), sameMaterial: s.bolt.material === material });
        }
        const target = (x,y) => { const e=c.spawnTestEnemy('brute',0,0); e.pos.x=x; e.pos.y=y; e.z=149.2; e.hp=e.maxHp=100000; return e; };
        const chain = [target(410,450),target(414,453),target(420,450)];
        c.spawnTestShot(400,450,150,1,0,0,'arc'); c.advanceShots(.12);
        const chainDamage=chain.map(e=>100000-e.hp), chainStun=chain.map(e=>e.stunT); c.clearTestEnemies();
        const blast=[target(410,450),target(414,450)];
        c.spawnTestShot(400,450,150,1,0,0,'plasma'); c.advanceShots(.12);
        const blastDamage=blast.map(e=>100000-e.hp); c.clearTestEnemies();
        const edgeChain=[target(468,450),target(473,450)];
        c.spawnTestShot(400,450,150,1,0,0,'arc'); c.advanceShots(.8);
        const edgeChainDamage=edgeChain.map(e=>100000-e.hp); c.clearTestEnemies();
        const edgeBlast=[target(509,450),target(511,450)];
        c.spawnTestShot(400,450,150,1,0,0,'plasma'); c.advanceShots(1.29);
        const edgeBlastDamage=edgeBlast.map(e=>100000-e.hp); c.clearTestEnemies();
        // Wall between ARC/PX and target: neither primary nor splash reaches it.
        c.resetCampaignProgress();
        if (!c.startMission('dead_signal','new_campaign')) throw Error('Campaign New failed');
        const isolationBoundary = {combat:c.combat.snapshot(),abilities:c.squad.map(m=>m.def.ability.id)};
        if(JSON.stringify(c.combat.slots)!==JSON.stringify(['rifle','scatter'])) throw Error('Endless pair leaked into Campaign New');
        c.skipIntro(); c.completeMission(); c.completeMission();
        if (!c.startMission('sample_zero','mission_select')) throw Error('Campaign Mission Select failed');
        c.pause(true); c.clearTestEnemies();
        const e = c.spawnTestEnemy('brute',0,0); e.pos.x = 394; e.pos.y = 644; e.z = c.terrainHeight(394,644); e.hp = e.maxHp = 100000;
        const before = e.hp;
        for (const id of ['arc','plasma']) { c.spawnTestShot(386,644,c.terrainHeight(386,644)+1.25,1,0,0,id); c.advanceShots(.2); }
        const blockedDamage = before - e.hp; c.clearTestEnemies();
        // Beyond range cannot take direct OR explosive damage, even when final dt is large.
        const far = c.spawnTestEnemy('brute',0,0); far.pos.x=511; far.pos.y=450; far.z=149.2; far.hp=far.maxHp=100000;
        const farBefore = far.hp; c.spawnTestShot(400,450,150,1,0,0,'plasma'); c.advanceShots(3);
        const outOfRangeDamage = farBefore - far.hp; c.clearTestEnemies(); c.pause(false);
        return { rows, chainDamage, chainStun, blastDamage, edgeChainDamage, edgeBlastDamage, blockedDamage, outOfRangeDamage, isolationBoundary, pool: c.combatPoolInfo() };
    });
    for (const row of results.projectiles.rows) {if(row.id==='arc'){assert.equal(row.mechanism,'hitscan');assert.equal(row.range,72);assert.equal(row.projectiles,0);continue;}assert.equal(row.full,.95); assert(row.faded > 0 && row.faded < .95); assert(row.pooled && row.sameMaterial); assert(row.finalTravel <= ({rifle:153,scatter:60,plasma:110})[row.id]+1e-8); }
    assert.equal(results.projectiles.blockedDamage,0); assert.equal(results.projectiles.outOfRangeDamage,0);
    assert(results.projectiles.chainDamage.every(d=>d>0)); assert(results.projectiles.chainStun.every(t=>t===.65)); assert(results.projectiles.blastDamage.every(d=>d>0));
    assert(results.projectiles.edgeChainDamage[0]>0); assert.equal(results.projectiles.edgeChainDamage[1],0);
    assert(results.projectiles.edgeBlastDamage[0]>0); assert.equal(results.projectiles.edgeBlastDamage[1],0);
    // Authored Campaign boundary explicitly ignores exotic deployment state.
    results.campaign = await page.evaluate(() => {
        const rows=[];
        for (const origin of ['new_campaign','mission_select','continue_campaign']) {
            if (!__cf.startMission(origin === 'new_campaign' ? 'dead_signal' : 'power_through',origin)) throw Error('Campaign origin failed: ' + origin);
            __cf.skipIntro();
            rows.push({ origin, combat: __cf.combat.snapshot(), squad: __cf.squad.map(m=>({ role:m.def.role, ability:m.def.ability.id, preferred:m.def.combat.preferredRange })), checkpoint: __cf.checkpoint() });
        }
        return rows;
    });
    for (const row of results.campaign) { assert.deepEqual(Object.keys(row.combat.weapons),['rifle','scatter']); assert.deepEqual(row.squad.map(m=>m.ability),['bulwark','medic_pulse','target_designator']); assert.deepEqual(row.squad.map(m=>m.preferred),[13,22,34]); }
    assert.equal(await page.locator('#opt-markers').count(),0);
    // Actual fresh menu starts until both observed terrain styles, bounded at 18.
    for (let i=0;i<18 && (!results.flatCapture || !results.heightCapture);i++) { await setup(configA, -1); await recordTerrain(); }
    assert(results.flatCapture && results.heightCapture, 'Repeated random fresh starts must still expose flat crater and elevated ridges');
    assert.equal(results.flatCapture.flatSamples,results.flatCapture.samples); assert(results.heightCapture.max > 2);
    assert.deepEqual(errors,[]); assert.deepEqual(consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);
    results.passed = true;
    console.log('PASS milestone 4.1',name,JSON.stringify({ configs:results.runs.length, terrains:results.terrains, projectileBounds:results.projectiles, performance:results.runs.map(r=>({p95:r.performance.summary.p95Ms,worst:r.performance.summary.worstMs})) }));
} finally {
    await page.mouse.up().catch(()=>{}); for(const key of ['w','e']) await page.keyboard.up(key).catch(()=>{});
    writeFileSync(resolve(out,`endless-hud-${name}.json`),JSON.stringify({results,errors,consoles},null,2)); await browser.close();
}
