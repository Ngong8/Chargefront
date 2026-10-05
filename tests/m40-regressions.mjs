// Run existing authoritative suites sequentially (no GPU contention), preserving
// accepted 3.9 captures. Optional browser argument: edge or firefox; default both.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const dir = resolve('_playtest/m40/regressions'); mkdirSync(dir, { recursive: true });
const browsers = process.argv.includes('edge') ? ['edge'] : process.argv.includes('firefox') ? ['firefox'] : ['edge', 'firefox'];
const suites = ['intro-smoke', 'm2-progression', 'runtime-stability', 'traversal-performance', 'facility-regression', 'facility-playthrough', 'transition-diagnose'];
const results = [];
for (const browser of browsers) for (const suite of suites) {
    const args = [`tests/${suite}.mjs`, ...(browser === 'firefox' ? ['firefox'] : []),
        ...(suite === 'runtime-stability' ? ['--campaign'] : []),
        ...(process.argv.includes('--headed') && ['runtime-stability','traversal-performance'].includes(suite) ? ['--headed'] : [])];
    const start = Date.now(); console.log(`RUN ${browser} ${suite}`);
    const child = spawnSync(process.execPath, args, { env: { ...process.env, CF_ARTIFACT_DIR: dir }, encoding: 'utf8', timeout: 600000, maxBuffer: 32 * 1024 * 1024 });
    writeFileSync(resolve(dir, `${suite}-${browser}.log`), (child.stdout || '') + (child.stderr || '') + (child.error ? String(child.error) : ''));
    const row = { browser, suite, status: child.status, signal: child.signal, seconds: (Date.now() - start) / 1000 };
    results.push(row); writeFileSync(resolve(dir, `results-${browsers.join('-')}.json`), JSON.stringify(results, null, 2)); console.log(JSON.stringify(row));
    if (child.status !== 0) { console.error(child.stdout, child.stderr, child.error || ''); process.exit(1); }
}
console.log('PASS authoritative regressions', browsers.join(' + '));
