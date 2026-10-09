// Run existing authoritative suites sequentially (no GPU contention), preserving
// accepted 3.9 captures. Optional browser argument: edge or firefox; default both.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const dir = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m40/regressions'); mkdirSync(dir, { recursive: true });
const browsers = process.argv.includes('edge') ? ['edge'] : process.argv.includes('firefox') ? ['firefox'] : ['edge', 'firefox'];
const suites = ['intro-smoke', 'm2-progression', 'runtime-stability', 'traversal-performance', 'facility-regression', 'facility-playthrough', 'transition-diagnose'];
// Opt-in M4.1 corrective coverage reuses this sequential GPU-safe runner.
if (process.argv.includes('--corrective')||process.argv.includes('--additional')) suites.push('corrective-refinement', 'hud-refinement', 'hud-navigation',
    'objective-hud-flow', 'arc-presentation', 'screecher-wings', 'runner-kamikaze', 'sprint-recovery',
    'combat-squad', 'combat-playtest', 'endless-hud');
if(process.argv.includes('--additional'))suites.push('additional-refinement');
// Bounded batches let long browser runs finish within terminal-operation budgets.
const selection = process.argv.find(arg=>arg.startsWith('--suites='))?.slice(9).split(',');
if (selection) {
    if (selection.some(suite=>!suites.includes(suite))) throw new Error('Unknown suite selection');
    for (let i=suites.length-1;i>=0;i--) if (!selection.includes(suites[i])) suites.splice(i,1);
}
const results = [];
for (const browser of browsers) for (const suite of suites) {
    const args = [`tests/${suite}.mjs`, ...(browser === 'firefox' ? ['firefox'] : []),
        ...(suite === 'runtime-stability' ? ['--campaign'] : []),
        ...(process.argv.includes('--headed') && ['runtime-stability','traversal-performance','corrective-refinement','additional-refinement'].includes(suite) ? ['--headed'] : [])];
    const start = Date.now(); console.log(`RUN ${browser} ${suite}`);
    const child = spawnSync(process.execPath, args, { env: { ...process.env, CF_ARTIFACT_DIR: dir }, encoding: 'utf8', timeout: 600000, maxBuffer: 32 * 1024 * 1024 });
    writeFileSync(resolve(dir, `${suite}-${browser}.log`), (child.stdout || '') + (child.stderr || '') + (child.error ? String(child.error) : ''));
    const row = { browser, suite, status: child.status, signal: child.signal, seconds: (Date.now() - start) / 1000 };
    results.push(row); writeFileSync(resolve(dir, `results-${browsers.join('-')}.json`), JSON.stringify(results, null, 2)); console.log(JSON.stringify(row));
    if (child.status !== 0) { console.error(child.stdout, child.stderr, child.error || ''); process.exit(1); }
}
console.log('PASS authoritative regressions', browsers.join(' + '));
