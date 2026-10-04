// A real uninstrumented New Campaign intro: the loading cover must clear,
// cinematic shots must run, and the ship must remain landed afterwards.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium, firefox } = await import(process.env.PLAYWRIGHT_PACKAGE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const useFirefox = process.argv.includes('firefox');
const executablePath = [process.env.CHROME_PATH, 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find((p) => p && existsSync(p));
if (!useFirefox) assert(executablePath, 'Set CHROME_PATH to Chrome/Edge');
const browser = useFirefox ? await firefox.launch({ headless: true })
    : await chromium.launch({ executablePath, headless: true, args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
    await page.goto(pathToFileURL(resolve('chargefront.html')).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__cf?.renderer, undefined, { timeout: 90000 });
    assert(await page.evaluate(() => window.__cf.startMission('dead_signal', 'new_campaign')));
    await page.waitForFunction(() => window.__cf.intro?.prewarmPending && !!document.getElementById('cf-intro-loading'), undefined, { timeout: 30000 });
    await page.waitForFunction(() => window.__cf.intro && !window.__cf.intro.prewarmPending, undefined, { timeout: 120000 });
    const during = await page.evaluate(() => ({ stageT: window.__cf.intro.stageT,
        coverGone: !document.getElementById('cf-intro-loading'),
        menuGone: document.getElementById('start-screen').classList.contains('hidden'),
        fadeDuration: window.__cf.intro.fadeEnd - window.__cf.intro.fadeStart,
        fadeHold: window.__cf.intro.fadeHold,
        touchdown: window.__cf.intro.touchdownT, fadeStart: window.__cf.intro.fadeStart,
        gearStart: window.__cf.intro.gearStart, gearDuration: window.__cf.intro.gearDuration,
        cuts: window.__cf.intro.shotTimes.length }));
    assert(during.coverGone && during.menuGone && during.stageT >= 0 && during.stageT < 3, JSON.stringify(during));
    assert(Math.abs(during.fadeDuration - 1.25) < 1e-9, 'M1 post-landing fade must last 1.25 seconds');
    assert(Math.abs(during.fadeHold - 1.25) < 1e-9, 'M1 full-black hold must last 1.25 seconds');
    assert(during.fadeStart > during.touchdown && during.cuts === 5);
    assert(during.gearStart > 0 && during.gearStart < during.touchdown && during.gearStart + during.gearDuration <= during.touchdown, 'Gear must deploy from before touchdown');

    // Record the authored stage time, landing-gear height, and fade once per
    // rendered frame to verify gradual deployment and the full-black hold.
    await page.evaluate(() => {
        window.__cinematicSamples = [];
        const tick = () => {
            const i = window.__cf.intro;
            if (!i) { window.__cinematicDone = true; return; }
            const gear = i.ship && i.ship.userData.landingGear ? i.ship.userData.landingGear.map(g => +g.position.y.toFixed(5)) : null;
            window.__cinematicSamples.push({ t: i.stageT, fade: i.fade, landed: i.landed, gear });
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });

    await page.waitForFunction(() => window.__cf.intro.stageT >= window.__cf.intro.touchdownT - 4.4, undefined, { timeout: 60000 });
    const descent = await page.evaluate(() => {
        const i = window.__cf.intro;
        return { landed: i.landed,
            cameraOffset: [window.__cf.camera.position.x - i.ship.position.x, window.__cf.camera.position.y - i.ship.position.y,
                window.__cf.camera.position.z - i.ship.position.z] };
    });
    assert(!descent.landed, 'Mid-descent sample must be airborne');
    for (const [index, expected] of [-46.2, -40.6, 21.1].entries()) assert(Math.abs(descent.cameraOffset[index] - expected) < 1e-6, 'Mid-descent framing changed unexpectedly');
    await page.waitForFunction(() => window.__cf.intro.stageT >= window.__cf.intro.touchdownT - .25, undefined, { timeout: 60000 });
    const approach = await page.evaluate(() => {
        const i = window.__cf.intro;
        return { landed: i.landed, airborneHeight: i.ship.position.z - window.__cf.terrainHeight(i.land.x, i.land.y) - 2.3,
            gear: i.ship.userData.landingGear.map(g => g.position.y),
            cameraOffset: [window.__cf.camera.position.x - i.ship.position.x, window.__cf.camera.position.y - i.ship.position.y,
                window.__cf.camera.position.z - i.ship.position.z] };
    });
    assert(!approach.landed && approach.airborneHeight > 0 && approach.gear.every(y => Math.abs(y) < 1e-6), 'Gear must be fully extended before contact');
    for (const [index, expected] of [21, -32.2, 7].entries()) assert(Math.abs(approach.cameraOffset[index] - expected) < 1e-6, 'Touchdown framing changed unexpectedly');
    await page.waitForFunction(() => !window.__cf.intro, undefined, { timeout: 90000 });

    const cinematic = await page.evaluate(() => window.__cinematicSamples);
    const withGear = cinematic.filter(s => s.gear);
    assert(withGear.length > 20, 'Cinematic sampler did not capture enough frames');
    assert(withGear.filter(s => s.t < during.gearStart).every(s => Math.max(...s.gear) > 1.3), 'Gear must begin the approach retracted');
    assert(withGear.some(s => Math.min(...s.gear) > 0.2 && Math.max(...s.gear) < 1.2), 'Gear must pass through a visibly intermediate deployment');
    assert(withGear.filter(s => !s.landed && s.t > during.gearStart + during.gearDuration).every(s => Math.max(...s.gear) < 1e-6), 'Gear must lock before touchdown');
    let maxSlope = 0;
    for (let i = 1; i < withGear.length; i++) { const dt = withGear[i].t - withGear[i-1].t; if (dt < 1e-4) continue;
        maxSlope = Math.max(maxSlope, Math.abs(withGear[i].gear[0] - withGear[i-1].gear[0]) / dt); }
    assert(maxSlope < 6, `Gear must extend gradually, not snap (max ${maxSlope.toFixed(2)}/s)`);
    assert(withGear.every((s, i, arr) => i === 0 || s.gear[0] <= arr[i-1].gear[0] + 1e-6), 'Gear must not re-stow during the landing');
    const fullBlack = cinematic.filter(s => s.fade >= 0.999).map(s => s.t);
    assert(fullBlack.length > 0, 'Fade never reached full black');
    assert(Math.max(...fullBlack) - Math.min(...fullBlack) > 1.0, 'Full-black hold was too short');
    const after = await page.evaluate(() => ({ mission: window.__cf.missionId, phase: window.__cf.phaseName,
        ship: window.__cf.spacecraftState, coverGone: !document.getElementById('cf-intro-loading') }));
    assert(after.coverGone && after.ship === 'LANDED_LOCKED' && after.mission === 'dead_signal', JSON.stringify(after));
    assert.deepEqual(errors, []);
    console.log('PASS intro without diagnostics / cinematic timing', JSON.stringify({ during, descent, approach, after }));
} finally {
    await browser.close();
}
