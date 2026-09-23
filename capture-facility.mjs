import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(root, 'chargefront.html');
const outputDir = resolve(process.argv[2] || join(root, 'facility-captures'));
const browserCandidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);
const browserPath = browserCandidates.find(existsSync);

if (!browserPath) {
    console.error('No Chrome or Edge executable found. Set CHROME_PATH and retry.');
    process.exit(1);
}

const allCaptures = [
    ['front', 'facility_front.png'],
    ['rear', 'facility_rear.png'],
    ['east', 'facility_east.png'],
    ['west', 'facility_west.png'],
    ['front_left', 'facility_front_left.png'],
    ['front_right', 'facility_front_right.png'],
    ['rear_left', 'facility_rear_left.png'],
    ['rear_right', 'facility_rear_right.png'],
    ['overview', 'facility_overview.png'],
    ['topdown', 'facility_topdown.png'],
    ['interior_hall', 'facility_interior_hall.png'],
    ['interior_vault', 'facility_interior_vault.png'],
    ['interior_lab', 'facility_interior_lab.png'],
    ['interior_corridor', 'facility_interior_corridor.png'],
    ['interior_deeplab', 'facility_interior_deeplab.png'],
    ['overview', 'facility_cutaway_overview.png', true, true],
    ['topdown', 'facility_cutaway_topdown.png', true, true],
];
const requestedView = process.argv[3];
const captures = requestedView === 'cutaway'
    ? allCaptures.filter(([, , cutaway]) => cutaway)
    : requestedView ? allCaptures.filter(([view]) => view === requestedView) : allCaptures;

if (requestedView && captures.length === 0) {
    console.error(`Unknown view: ${requestedView}`);
    process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
let failures = 0;
for (const [view, filename, cutaway = false, referenceLight = false] of captures) {
    const screenshotPath = join(outputDir, filename);
    const profilePath = mkdtempSync(join(tmpdir(), `chargefront-facility-${process.pid}-`));
    rmSync(screenshotPath, { force: true });
    const url = pathToFileURL(htmlPath);
    url.searchParams.set('facilityCapture', '1');
    url.searchParams.set('facilityView', view);
    if (cutaway) url.searchParams.set('facilityCutaway', '1');
    if (referenceLight) url.searchParams.set('facilityReferenceLight', '1');
    let result;
    try {
        result = spawnSync(browserPath, [
            '--headless=new',
            `--user-data-dir=${profilePath}`,
            '--disable-background-networking',
            '--disable-component-update',
            '--disable-sync',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-gpu-sandbox',
            '--enable-unsafe-swiftshader',
            '--allow-file-access-from-files',
            '--hide-scrollbars',
            '--window-size=1600,900',
            '--virtual-time-budget=7000',
            `--screenshot=${screenshotPath}`,
            url.href,
        ], { encoding: 'utf8', timeout: 45000 });
    } catch (error) {
        result = { status: null, stdout: '', stderr: String(error) };
    } finally {
        rmSync(profilePath, { recursive: true, force: true });
    }
    if (!existsSync(screenshotPath)) {
        failures++;
        console.error(`FAILED ${view}${cutaway ? ' cutaway' : ''}: ${result.stderr || result.stdout || `exit ${result.status}`}`);
    } else {
        console.log(`CAPTURED ${view}${cutaway ? ' cutaway' : ''}: ${screenshotPath}`);
    }
}

process.exitCode = failures ? 1 : 0;
