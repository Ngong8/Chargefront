// Bounded Firefox startup/input diagnosis; --baseline serves accepted ef3ad59
// without modifying the checkout. Does not weaken any gameplay regression gate.
import { resolve } from 'node:path';
import {campaignClick} from './menu-helpers.mjs';
import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const { firefox } = await import(process.env.PLAYWRIGHT_PACKAGE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const baseline = process.argv.includes('--baseline'), results = { baseline, events: [] }, start = Date.now();
const browser = await firefox.launch({ headless: !process.argv.includes('--headed') });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const note = (event, details) => { const row = { seconds: (Date.now() - start) / 1000, event, details }; results.events.push(row); console.log(JSON.stringify(row)); };
for (const type of ['pageerror','crash','requestfailed']) page.on(type, e => note(type, type === 'requestfailed' ? { url: e.url(), failure: e.failure() } : String(e)));
page.on('response', r => { if (/unpkg|jsdelivr/.test(r.url())) note('response', { status: r.status(), url: r.url() }); });
if (baseline) {
    const html = execFileSync('git', ['show', 'ef3ad59:chargefront.html'], { maxBuffer: 8 * 1024 * 1024 }).toString();
    await page.route('**/chargefront.html*', route => route.fulfill({ body: html, contentType: 'text/html' }));
}
try {
    const url = pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics','1');
    await page.goto(url.href, { waitUntil: 'commit', timeout: 60000 }); note('committed');
    await page.waitForFunction(() => { try { return !!window.__cf?.renderer; } catch { return false; } }, undefined, { timeout: 120000 }); note('renderer');
    await page.waitForTimeout(4000);
    const before = await page.evaluate(() => { const p = __cfPerf.summary(); return { ready: document.readyState, ua: navigator.userAgent, time: __cf.performanceInfo(), perf: { frames: p.frames, p95: p.p95Ms, worst: p.worstMs, counters: p.counters } }; }); note('before-click', before);
    try { await campaignClick(page); note('click-receipt'); } catch (e) { note('click-failed', String(e)); }
    const after = await Promise.race([page.evaluate(() => { const p = __cfPerf.summary(); return { soundPanel: !document.getElementById('sound-panel').classList.contains('hidden'), intro: !!__cf.intro, mode: __cf.mode, perf: { frames: p.frames, p95: p.p95Ms, worst: p.worstMs, counters: p.counters } }; }), new Promise(resolve => setTimeout(() => resolve({ evaluationTimedOut: true }), 10000))]);
    note('after-click', after);
} catch (e) {
    note('failed', String(e));
    note('dom', await Promise.race([page.evaluate(() => ({ state: document.readyState, text: document.body.innerText.slice(-600), canvases: document.querySelectorAll('canvas').length })), new Promise(resolve => setTimeout(() => resolve({ evaluationTimedOut: true }), 10000))]));
    process.exitCode = 1;
}
finally {
    const dir = resolve('_playtest/m40'); mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, `firefox-startup-${baseline ? 'baseline' : 'current'}.json`), JSON.stringify(results, null, 2));
    await browser.close();
}
