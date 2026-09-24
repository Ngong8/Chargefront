import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium, firefox } = await import(process.env.PLAYWRIGHT_PACKAGE
    ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');

const engine = process.argv[2] === 'firefox' ? firefox : chromium;
const options = process.argv[2] === 'firefox' ? { headless: !process.argv.includes('headed') } : {
    headless: true, executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--enable-unsafe-swiftshader', '--allow-file-access-from-files'],
};
const browser = await engine.launch(options);
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (error) => console.log('PAGE_ERROR', error.message));
const url = pathToFileURL(resolve('chargefront.html'));
url.searchParams.set('perfDiagnostics', '1');
if (process.argv.includes('sync')) url.searchParams.set('perfGpuSync', '1');
try {
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__cf && window.__cf.renderer && window.__cfPerf, undefined, { timeout: 120000 });
    console.log('browser', await page.evaluate(() => navigator.userAgent));
    const seenPrograms = new Set();
    const step = async (label, expression, delayMs = 1200) => {
        const data = await page.evaluate(expression);
        await page.waitForTimeout(delayMs);
        const report = await page.evaluate(() => {
            const perf = window.__cfPerf.report();
            const renderer = window.__cf.renderer;
            const programs = renderer.info.programs || [];
            const owners = {};
            window.__cf.scene.traverse((object) => {
                if (!object.material) return;
                for (const material of (Array.isArray(object.material) ? object.material : [object.material])) {
                    const active = renderer.properties.get(material)?.programs;
                    if (!active) continue;
                    for (const program of active.values()) {
                        const list = owners[program.id] || (owners[program.id] = []);
                        if (list.length < 4) list.push({ mesh: object.name, parent: object.parent?.name,
                            position: object.position.toArray().map((v) => Math.round(v)), type: material.type,
                            geometry: object.geometry?.type, transparent: material.transparent, side: material.side,
                            depthTest: material.depthTest, color: material.color?.getHexString() });
                    }
                }
            });
            return { mission: window.__cf.missionId, phase: window.__cf.phaseName,
                programs: programs.map((p) => ({ id: p.id, name: p.name, cacheKey: String(p.cacheKey).slice(0, 1100), owners: owners[p.id] || [] })),
                cuts: perf.frames.flatMap((f) => f.events.filter((e) => e.name === 'introCut' || e.name === 'introPrewarmView')
                    .map((e) => ({ name: e.name, step: e.step, shot: e.shot, inside: e.inside, programs: e.programs, frameMs: f.ms, links: f.delta.linkProgram || 0 }))).slice(-12),
                frames: perf.frames.filter((f) => f.ms > 100 || (f.delta.linkProgram || 0) > 0)
                    .map((f) => ({ ms: f.ms, renderMs: f.renderMs, phase: f.state?.phase, links: f.delta.linkProgram || 0,
                        events: f.events.filter((e) => ['shaderPrograms', 'introCut', 'mainThreadHeartbeatLag', 'introCabinPrewarm', 'combatPrewarm'].includes(e.name))
                            .map((e) => e.name === 'shaderPrograms' ? { name: e.name, before: e.before, after: e.after,
                                newPrograms: e.newPrograms?.map((p) => ({ id: p.id, type: p.key.split(',')[0], owner: p.owners[0]?.type })) } : e),
                        ops: Object.fromEntries(Object.entries(f.ops).filter(([, v]) => v.ms >= 10)) })).slice(-12),
                summary: { frames: perf.frames.length, counters: perf.counters, worst: perf.worstMs },
                entries: PerformanceObserver.supportedEntryTypes,
            };
        });
        const newPrograms = report.programs.filter((p) => !seenPrograms.has(p.id));
        for (const p of newPrograms) seenPrograms.add(p.id);
        console.log(label, JSON.stringify({ action: data, mission: report.mission, phase: report.phase,
            programCount: report.programs.length, cuts: report.cuts,
            newPrograms: label.startsWith('INTRO') ? newPrograms.length : newPrograms,
            frames: report.frames,
            summary: report.summary, entries: report.entries }));
        return report;
    };
    await step('INTRO_STARTED', () => { window.__cf.resetCampaignProgress(); window.__cf.startMission('dead_signal', 'new_campaign'); return window.__cf.intro?.shotTimes; });
    await page.waitForFunction(() => !window.__cf.intro, undefined, { timeout: 120000 });
    const introReport = await step('INTRO_FINISHED', () => true, 250);
    const visibleCuts = introReport.cuts.filter((cut) => cut.name === 'introCut');
    assert.equal(visibleCuts.length, 5, 'Expected all five cinematic shots after hidden prewarm');
    assert(visibleCuts.every((cut) => cut.links === 0 && cut.frameMs < 250), 'First-use shader stall leaked into a visible cinematic cut');
    await step('TO_M2', () => { window.__cf.completeMission(); return window.__cf.missionId; });
    const m3 = await step('TO_M3', () => { window.__cfPerf.reset(); window.__cf.completeMission(); return window.__cf.missionId; }, 2000);
    assert.equal(m3.summary.counters.linkProgram || 0, 0);
    const m4 = await step('TO_M4', () => { window.__cfPerf.reset(); window.__cf.completeMission(); return window.__cf.missionId; }, 2000);
    assert.equal(m4.summary.counters.linkProgram || 0, 0);
    const result = await step('M4_RESULT', () => {
        window.__cfPerf.reset();
        window.__cf.setPhase(26); // extraction request after reaching the beacon
        window.__cf.startExtraction();
        window.__cf.clearTestEnemies();
        window.__cf.completeExtractionHoldout();
        window.__cf.boardExtraction();
        window.__cf.completeExtractionDeparture();
        return window.__cf.phaseName;
    }, 1800);
    assert.equal(result.summary.counters.linkProgram || 0, 0);
    console.log('PASS visible intro cuts and campaign transitions');
} finally {
    await browser.close();
}
