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
        menuGone: document.getElementById('start-screen').classList.contains('hidden') }));
    assert(during.coverGone && during.menuGone && during.stageT >= 0 && during.stageT < 3, JSON.stringify(during));
    await page.waitForFunction(() => !window.__cf.intro, undefined, { timeout: 90000 });
    const after = await page.evaluate(() => ({ mission: window.__cf.missionId, phase: window.__cf.phaseName,
        ship: window.__cf.spacecraftState, coverGone: !document.getElementById('cf-intro-loading') }));
    assert(after.coverGone && after.ship === 'LANDED_LOCKED' && after.mission === 'dead_signal', JSON.stringify(after));
    assert.deepEqual(errors, []);
    console.log('PASS intro without diagnostics', JSON.stringify({ during, after }));
} finally {
    await browser.close();
}
