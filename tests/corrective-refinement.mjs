// M4.1 corrective acceptance: real inputs/Fullscreen API, shared menus and
// deterministic simulation probes for fuse cancellation, hit timing and poses.
import assert from 'node:assert/strict';
import {campaignClick} from './menu-helpers.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium, firefox } = await import(process.env.PLAYWRIGHT_PACKAGE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const ff = process.argv.includes('firefox'), name = ff ? 'firefox' : 'edge';
const out = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m41/regressions/corrective');
mkdirSync(out, { recursive: true });
const browser = await (ff ? firefox : chromium).launch(ff ? { headless:!process.argv.includes('--headed') } : {
    headless:!process.argv.includes('--headed'), executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args:['--enable-unsafe-swiftshader','--allow-file-access-from-files'],
});
const page = await browser.newPage({ viewport:{width:1780,height:832} });
const errors = [], consoleErrors = [], results = {};
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics','1');
const shotCount = () => page.evaluate(() => __cf.combat.shotsFired);
const capture = label => page.screenshot({ path:resolve(out,`${label}-${name}.png`) });
const hud = () => page.evaluate(() => __cf.inspectHUD());
const viewports = [{width:1780,height:832},{width:1280,height:720},{width:1920,height:1080},{width:1280,height:540}];
async function guideChecks(entry, label) {
    await page.locator(entry).click();
    results[label] = [];
    for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(120);
        const layout = await page.evaluate(() => {
            const panel = document.querySelector('#guide-panel'), body = panel.querySelector('.cf-guide');
            const rect = el => { const r=el.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}; };
            return {panel:rect(panel),heading:rect(panel.querySelector('h2')),back:rect(panel.querySelector('.back')),
                body:rect(body),scrollHeight:body.scrollHeight,clientHeight:body.clientHeight,scrollWidth:body.scrollWidth,clientWidth:body.clientWidth,
                outer:document.querySelector('#start-screen').scrollTop,page:window.scrollY,
                font:[panel,body,body.querySelector('.key'),panel.querySelector('.back')].map(el=>getComputedStyle(el).fontFamily)};
        });
        const margin = viewport.height < 600 ? 16 : 32;
        assert(layout.panel.top >= margin-1 && layout.panel.bottom <= viewport.height-margin+1);
        assert(layout.heading.top >= layout.panel.top && layout.back.bottom <= layout.panel.bottom);
        assert(layout.body.bottom <= layout.back.top);
        assert(layout.scrollWidth<=layout.clientWidth,'Guide must not clip/scroll horizontally');
        assert(layout.font.every(font=>font.startsWith('"Glitch Slap"')));
        const region = page.locator('#guide-panel .cf-guide');
        await region.hover(); await page.mouse.wheel(0,1000); await page.waitForTimeout(200);
        const scrolled = await region.evaluate(el=>el.scrollTop);
        if (layout.scrollHeight > layout.clientHeight) assert(scrolled>0,'Wheel scrolls only guide body');
        await region.focus(); await page.keyboard.press('Home'); await page.waitForTimeout(250);
        await page.keyboard.press('PageDown'); await page.waitForTimeout(250);
        if (layout.scrollHeight > layout.clientHeight) assert(await region.evaluate(el=>el.scrollTop)>0,'Keyboard guide scrolling');
        assert.equal(await page.evaluate(()=>window.scrollY),0);
        assert.equal(await page.locator('#start-screen').evaluate(el=>el.scrollTop),0);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),viewport.height);
        results[label].push({viewport,...layout,scrolled});
    }
    await page.setViewportSize(viewports[0]);
    await page.locator('#guide-panel .cf-guide').evaluate(el=>{el.scrollTop=0;el.blur();});await page.waitForTimeout(200);await capture(label);
    await page.locator('#btn-guide-back').click();
}
async function fullscreenChecks(entry, label) {
    await page.locator(entry).click();
    const button = page.locator('#opt-fullscreen');
    assert((await button.evaluate(el=>getComputedStyle(el).fontFamily)).startsWith('"Glitch Slap"'));
    for(const viewport of viewports.slice(0,3)){
        await page.setViewportSize(viewport);await page.waitForTimeout(100);
        const bounds=await page.locator('#options-panel').boundingBox();
        assert(bounds.y>=31&&bounds.y+bounds.height<=viewport.height-31);
        assert(await page.locator('#btn-options-back').isVisible());
        assert(await page.locator('#options-panel').evaluate(panel=>[...panel.querySelectorAll('span,select,button,h2')].every(el=>getComputedStyle(el).fontFamily.startsWith('"Glitch Slap"'))));
    }
    await page.setViewportSize(viewports[0]);
    const supported = await page.evaluate(()=>document.fullscreenEnabled);
    if (supported) {
        await button.click(); await page.waitForTimeout(400);
        assert(await page.evaluate(()=>!!document.fullscreenElement),'User-gesture fullscreen entry');
        assert.equal(await button.getAttribute('aria-pressed'),'true');
        const resized = await page.evaluate(()=>({w:innerWidth,h:innerHeight,aspect:__cf.camera.aspect,
            canvas:[...document.querySelectorAll('#cf-root canvas')].map(c=>({width:c.width,height:c.height,rect:c.getBoundingClientRect().toJSON()}))}));
        assert(Math.abs(resized.aspect-resized.w/resized.h)<.01,'Fullscreen camera aspect');
        await button.click(); await page.waitForTimeout(300);
        assert(!await page.evaluate(()=>document.fullscreenElement));
        await button.click(); await page.waitForTimeout(200);
        // Browser API exit models an external ESC/system exit; state must sync.
        await page.evaluate(()=>document.exitFullscreen()); await page.waitForTimeout(250);
        assert.equal(await button.getAttribute('aria-pressed'),'false');
        results[label] = {supported,entered:true,exited:true,externalExit:true,resized};
    } else {
        assert(await button.isDisabled()); results[label]={supported:false,feedback:await page.locator('#fullscreen-status').textContent()};
    }
    // Hosting rejection and unsupported feedback, without changing game semantics.
    await page.evaluate(()=>{window.__requestFS=document.documentElement.requestFullscreen;
        document.documentElement.requestFullscreen=()=>Promise.reject(new Error('fixture: host denies fullscreen'));});
    if (supported) { await button.click(); assert.match(await page.locator('#fullscreen-status').textContent(),/declined/); }
    await page.evaluate(()=>{document.documentElement.requestFullscreen=window.__requestFS;
        Object.defineProperty(document,'fullscreenEnabled',{configurable:true,value:false}); document.dispatchEvent(new Event('fullscreenchange'));});
    assert(await button.isDisabled()); assert.match(await page.locator('#fullscreen-status').textContent(),/unavailable/);
    await page.evaluate(()=>{delete document.fullscreenEnabled; document.dispatchEvent(new Event('fullscreenchange'));});
    await capture(label); await page.locator('#btn-options-back').click();
}
try {
    await page.addInitScript(()=>{
        window.__hudFonts=[];const fill=CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText=function(text,...args){
            if(/^(COMBAT|VITALS|COMMANDER|CARTRIDGES|CRAFTING|RES \d+|[◈◀▶] \d+ m)$/.test(String(text))){
                __hudFonts.push({text:String(text),font:this.font});if(__hudFonts.length>200)__hudFonts.shift();
            }
            return fill.call(this,text,...args);
        };
    });
    await page.goto(url.href); await page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
    await page.locator('#cf-perf-diagnostics').evaluate(el=>el.style.display='none');
    assert(await page.evaluate(()=>document.fonts.check('12px "Glitch Slap"')));
    await guideChecks('#btn-guide','main-guide');
    await fullscreenChecks('#btn-options','main-options');
    await campaignClick(page); await page.locator('#btn-sound-start').click();
    await page.waitForFunction(()=>__cf.intro&&!__cf.intro.prewarmPending,undefined,{timeout:120000}); await page.keyboard.press('Space');
    await page.waitForFunction(()=>__cf.phaseName==='M1_MOVE_FAC');
    await page.evaluate(()=>{const c=__cf;c.setNoSpawn(true);c.setNoAggro(true);c.clearTestEnemies();c.setInvulnerable(true);});
    await page.mouse.click(890,416);
    // Both weapon slots: walk/fire -> sprint owns held fire -> fresh fire cancels.
    results.sprint=[];
    for (const [key,index] of [['1',0],['2',1]]) {
        await page.keyboard.press(key); await page.waitForFunction(i=>__cf.combat.index===i&&!__cf.player.swapT,index);
        await page.evaluate(()=>{__cf.player.stamina=100;__cf.player.sprintExhausted=false;__cf.player.weapon.mag=__cf.player.weapon.magSize;});
        await page.keyboard.down('w'); const initial=await shotCount(); await page.mouse.down();
        await page.waitForFunction(n=>__cf.combat.shotsFired>n,initial);
        await page.keyboard.down('ShiftLeft'); await page.waitForFunction(()=>__cf.player.sprinting);
        const sprintCount=await shotCount(); await page.waitForTimeout(550); assert.equal(await shotCount(),sprintCount);
        assert(await page.evaluate(()=>__cf.player.sprinting));
        await page.mouse.up(); await page.waitForTimeout(30);
        // One short click during cooldown is retained until weapon eligibility.
        await page.evaluate(()=>__cf.combat.fireT=.25);
        await page.mouse.down(); await page.waitForFunction(()=>!__cf.player.sprinting&&__cf.player.sprintFireBlocked);
        await page.mouse.up(); await page.waitForFunction(n=>__cf.combat.shotsFired>n,sprintCount);
        assert.equal(await shotCount(),sprintCount+1); await page.waitForTimeout(180);
        assert(!await page.evaluate(()=>__cf.player.sprinting),'Held Shift cannot re-enter after fire cancel');
        await page.keyboard.up('ShiftLeft'); await page.keyboard.down('ShiftLeft'); await page.waitForFunction(()=>__cf.player.sprinting);
        await page.keyboard.up('ShiftLeft'); await page.waitForFunction(()=>!__cf.player.sprinting);
        const ordinary=await shotCount(); await page.mouse.down(); await page.waitForFunction(n=>__cf.combat.shotsFired>n,ordinary);
        await page.mouse.up(); await page.keyboard.up('w'); results.sprint.push({index,initial,sprintCount,after:await shotCount()});
    }
    // Live authoritative bearings and target changes, without replacing mission data.
    results.compass=[];
    for (const delta of [0,Math.PI/4,-Math.PI/4,Math.PI-.01,-Math.PI+.01]) {
        await page.evaluate(d=>{const c=__cf,p=c.player;const parts=c.objectiveCompassInfo().key.split(':');
            p.yaw=Math.atan2(+parts.at(-1)-p.pos.y,+parts.at(-2)-p.pos.x)-d;p.pitch=0;},delta);
        await page.waitForTimeout(500); const info=await page.evaluate(()=>__cf.objectiveCompassInfo());
        if (delta===0) assert(Math.abs(info.offset)<.03);
        else assert(Math.sign(info.offset)===-Math.sign(delta));
        if(Math.abs(delta)>Math.PI/2) assert(Math.abs(info.offset)>.99);
        const text=(await hud()).text.find(t=>/^[◈◀▶] \d+ m$/.test(t.value)&&t.y===24);
        assert(text); assert((delta===0&&Math.abs(text.x-890)<4)||delta!==0);
        results.compass.push({delta,...info,text});
    }
    const oldKey=results.compass[0].key;
    await page.evaluate(()=>{__cf.setPhase(15);}); // existing P.M1_INVESTIGATE
    await page.waitForTimeout(100); assert.notEqual((await page.evaluate(()=>__cf.objectiveCompassInfo())).key,oldKey);
    await page.evaluate(()=>__cf.setPhase(14));
    // Actual squad reload/resupply feeds restored labels without a second cache.
    await page.evaluate(()=>{const c=__cf;c.pause(true);for(let i=0;i<3;i++){c.squad[i].reserve=i;c.squad[i].mag=0;}});
    let labels=(await hud()).text.filter(t=>/^RES \d+$/.test(t.value)); assert.deepEqual(labels.map(t=>t.value),['RES 0','RES 1','RES 2']);
    await page.evaluate(()=>{const c=__cf;c.giveSquadAmmo(0);const m=c.squad[1];m.reloading=true;m.reloadT=.001;m.update();});
    labels=(await hud()).text.filter(t=>/^RES \d+$/.test(t.value)); assert.deepEqual(labels.map(t=>t.value),['RES 1','RES 0','RES 2']);
    results.layouts=[];
    for (const viewport of viewports) {
        await page.setViewportSize(viewport); await page.waitForTimeout(150); const h=await hud();
        const panels=h.panels.filter(p=>p.width===264); assert.equal(panels.length,2);
        assert(panels.every(p=>p.y-p.height/2>=0&&p.y+p.height/2<=viewport.height));
        assert(panels[0].x!==panels[1].x||panels[0].y-panels[0].height/2>panels[1].y+panels[1].height/2);
        const crafting=h.text.find(t=>t.value==='CRAFTING'), resources=h.text.find(t=>/^SCRAP /.test(t.value)), keys=h.text.find(t=>t.value.startsWith('[C]'));
        assert(resources.y<crafting.y&&crafting.y<keys.y); assert(keys.y<274-8);
        results.layouts.push({viewport,panels}); await capture(`hud-${viewport.width}x${viewport.height}`);
    }
    // Deterministic fuse probes in the real loaded game. Native Sound.play calls
    // are counted; no fake timers, damage substitutes or input rule changes.
    results.runners=await page.evaluate(async()=>{
        const c=__cf, L=await import('https://cdn.jsdelivr.net/npm/littlejsengine@1.18.25/dist/littlejs.esm.min.js');
        c.pause(true);c.setNoAggro(false);c.setInvulnerable(false);c.clearTestEnemies();
        // Stable open outdoor point with no props/walls, isolate ally blast recipients.
        c.player.pos.set(360,550);c.player.zPos=c.terrainHeight(360,550);
        for(const m of c.squad){m.pos.set(650,550);m.z=c.terrainHeight(650,550);m.target=null;m.fireT=1e9;}
        const calls=[],original=L.Sound.prototype.play;
        L.Sound.prototype.play=function(pos,vol,pitch,...args){calls.push({vol,pitch});return original.call(this,pos,vol,pitch,...args);};
        const rows=[];
        try {
            for(const type of ['runner','tunneler']) {
                c.setPlayerHealth(100,100);c.player.shieldDelayT=c.player.hpDelayT=1e9;
                const e=c.spawnTestEnemy(type,3.2,0);e.specialT=99;const baseCalls=calls.length;e.update();
                const locked=[e.pos.x,e.pos.y,e.z], beeps=[0];
                let explosionCount=0;const originalDetonate=e.detonate.bind(e);
                e.detonate=()=>{if(!e.detonated&&!e.dead)explosionCount++;originalDetonate();};
                e.scatter={x:100,y:100};e.stunT=3;e.specialT=0; // cannot break commitment
                c.player.pos.x-=12;
                let moved=0, ticks=0;
                while(!e.dead&&ticks<180){const before=e.armBeep;e.update();ticks++;
                    moved=Math.max(moved,Math.hypot(e.pos.x-locked[0],e.pos.y-locked[1],e.z-locked[2]));
                    if(e.armBeep>before)beeps.push(ticks*L.timeDelta);}
                e.detonate();
                rows.push({type,armedAt:locked,moved,beeps,explosionCount,played:calls.slice(baseCalls).filter(v=>v.vol===.7&&v.pitch>=1&&v.pitch<1.3).length,
                    blast:c.runnerInfo().find(r=>r.type===type)?.blast,outOfRangeHealth:c.player.hp+c.player.shield});
                c.clearTestEnemies();c.player.pos.x=360;
                // Kill before fuse completion and advance longer than its full fuse.
                const killed=c.spawnTestEnemy(type,3.2,0);killed.specialT=99;killed.update();const beforeKill=killed.armBeep;
                killed.takeDamage(99999);for(let i=0;i<130;i++)if(!killed.destroyed)killed.update();
                rows.at(-1).killed={beforeKill,after:killed.armBeep,detonated:killed.detonated,armed:killed.armed};
                c.clearTestEnemies();
                // In-range damage is a single existing shield-authorized radial hit.
                c.setPlayerHealth(100,100);const hit=c.spawnTestEnemy(type,3.2,0);hit.specialT=99;hit.update();
                for(let i=0;i<130&&!hit.dead;i++)hit.update();rows.at(-1).damage=200-c.player.hp-c.player.shield;
                hit.detonate();rows.at(-1).repeatDamage=200-c.player.hp-c.player.shield;c.clearTestEnemies();
            }
            c.setPlayerHealth(100,100);c.setInvulnerable(true);
            const many=['runner','tunneler','runner','tunneler'].map((type,i)=>{const e=c.spawnTestEnemy(type,3,i*.1);e.specialT=99;e.update();return e;});
            for(let i=0;i<130;i++)for(const e of many)if(!e.dead)e.update();
            rows.push({simultaneous:many.map(e=>({type:e.type,beeps:e.armBeep,detonated:e.detonated}))});c.clearTestEnemies();
            // Attack envelope and gait must not snap to -0.35/zero. Damage remains
            // immediate in the existing attack tick, independent of pose blend.
            const e=c.spawnTestEnemy('skitter',1.7,0);e.speed=0;e.attackT=0;c.setInvulnerable(false);c.setPlayerHealth(100,100);
            const hp=c.player.hp+c.player.shield;e.update();const attack={damage:hp-c.player.hp-c.player.shield,tilt:e.mesh.rotation.x};
            e.pos.x+=15;e.speed=10;const poses=[];for(let i=0;i<20;i++){e.update();poses.push(e.mesh.rotation.x);}
            e.speed=0;for(let i=0;i<30;i++){e.update();poses.push(e.mesh.rotation.x);}
            rows.push({attack,largestPoseStep:Math.max(...poses.slice(1).map((v,i)=>Math.abs(v-poses[i])))});c.clearTestEnemies();
            // Each squad member transitions real movement -> stationary without
            // directly resetting legs; heading/authoritative positions stay owned by AI.
            for(const m of c.squad){const samples=[];m.animT=1.2;m.moveBlend=0;m.motionStartX=m.pos.x;m.motionStartY=m.pos.y;
                for(let i=0;i<12;i++){m.motionStartX=m.pos.x;m.pos.x+=.08;m.animT+=L.timeDelta*10;m.updatePose(L.timeDelta,true);samples.push(m.mesh.userData.legs[0].rotation.y);}
                const last=samples.at(-1);m.motionStartX=m.pos.x;m.updatePose(L.timeDelta,false);const exit=m.mesh.userData.legs[0].rotation.y;
                rows.push({squad:m.def.name,last,exit,step:Math.abs(exit-last)});}
        } finally { L.Sound.prototype.play=original;c.setInvulnerable(true);c.setNoAggro(true); }
        return rows;
    });
    for(const r of results.runners.slice(0,2)){
        assert.equal(r.moved,0);assert.equal(r.beeps.length,7);assert.equal(r.played,7);assert.equal(r.explosionCount,1);
        const intervals=r.beeps.slice(1).map((v,i)=>v-r.beeps[i]);assert(intervals.every((v,i)=>!i||v<intervals[i-1]));
        assert.equal(r.outOfRangeHealth,200);assert(!r.killed.armed&&!r.killed.detonated);assert.equal(r.killed.beforeKill,r.killed.after);
        assert(r.damage>0);assert.equal(r.damage,r.repeatDamage);
    }
    assert(results.runners[1].blast.radius>results.runners[0].blast.radius);assert(results.runners[1].blast.damage>results.runners[0].blast.damage);
    assert(results.runners[2].simultaneous.every(r=>r.beeps===7&&r.detonated));
    assert(results.runners[3].attack.damage>0);assert(Math.abs(results.runners[3].attack.tilt)<.1);assert(results.runners[3].largestPoseStep<.1);
    assert.equal(results.runners.slice(4).length,3);assert(results.runners.slice(4).every(r=>r.step<.06&&r.exit!==0),'Squad gait exit blends instead of resetting');
    await page.setViewportSize(viewports[0]);
    // Opening via the real browser lock-loss path proves shared pause entry points.
    await page.evaluate(()=>{__cf.pause(false);document.exitPointerLock();});
    await page.waitForFunction(()=>!document.querySelector('#pause-screen').classList.contains('hidden'));
    await guideChecks('#btn-pause-guide','pause-guide');
    await fullscreenChecks('#btn-pause-options','pause-options');
    const frozen=await page.evaluate(()=>({pos:[__cf.player.pos.x,__cf.player.pos.y],shots:__cf.combat.shotsFired}));
    await page.locator('#btn-pause-guide').click();await page.keyboard.press('w');await page.keyboard.press('1');await page.mouse.wheel(0,500);
    const after=await page.evaluate(()=>({pos:[__cf.player.pos.x,__cf.player.pos.y],shots:__cf.combat.shotsFired}));assert.deepEqual(after,frozen);
    await page.locator('#btn-guide-back').click();await page.locator('#btn-resume').click();
    await page.waitForTimeout(100);assert.equal(await shotCount(),frozen.shots,'Menu clicks must not fire on resume');
    await page.evaluate(()=>__cfPerf.reset());await page.waitForTimeout(800);
    results.counters=await page.evaluate(()=>__cfPerf.summary().counters);
    results.canvasFonts=await page.evaluate(()=>__hudFonts);
    assert(results.canvasFonts.length>0&&results.canvasFonts.every(sample=>/Glitch Slap/.test(sample.font)),'Actual canvas HUD glyphs use Glitch Slap after render-state resets');
    for(const key of ['materialsCreated','geometriesCreated','linkProgram','buildTerrain','buildFacility'])assert.equal(results.counters[key]||0,0);
    assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);
    results.passed=true; console.log('PASS corrective refinement',name,JSON.stringify({sprint:results.sprint,runners:results.runners,layouts:results.layouts}));
} finally {
    await page.mouse.up().catch(()=>{});for(const key of ['w','ShiftLeft'])await page.keyboard.up(key).catch(()=>{});
    writeFileSync(resolve(out,`corrective-${name}.json`),JSON.stringify({results,errors,consoleErrors},null,2));await browser.close();
}
