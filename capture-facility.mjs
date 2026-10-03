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
    ['interior_decon', 'facility_interior_decon.png'],
    ['interior_research', 'facility_interior_research.png'],
    ['interior_security', 'facility_interior_security.png'],
    ['interior_lab', 'facility_interior_lab.png'],
    ['interior_corridor', 'facility_interior_corridor.png'],
    ['interior_deeplab', 'facility_interior_deeplab.png'],
    ['containment_wall', 'facility_containment_wall.png'],
    ['interior_service', 'facility_interior_service.png'],
    ['containment_gap_interior', 'facility_containment_gap_interior.png'],
    ['containment_gap_exterior', 'facility_containment_gap_exterior.png'],
    ['containment_transition', 'facility_containment_transition.png'],
    ['east_wall', 'facility_east_wall.png'],
    ['m2_return', 'facility_m2_return.png'],
    ['m2_front', 'facility_m2_front.png'],
    ['m2_terminal', 'facility_m2_terminal.png'],
    ['overview', 'facility_cutaway_overview.png', true, true],
    ['topdown', 'facility_cutaway_topdown.png', true, true],
];
const requestedView = process.argv[3];
const gameplayLights = process.argv.includes('--gameplay-lights');
const emergency = process.argv.includes('--emergency');
const mission2 = process.argv.includes('--mission2');
const objective = process.argv.includes('--objective');
const captures = requestedView === 'cutaway'
    ? allCaptures.filter(([, , cutaway]) => cutaway)
    : requestedView === 'correction'
        ? allCaptures.filter(([view, , cutaway]) => ['containment_gap_interior', 'containment_gap_exterior',
            'containment_wall', 'containment_transition', 'interior_deeplab', 'rear_right', 'east_wall', 'front',
            'm2_return', 'm2_front', 'm2_terminal'].includes(view) || cutaway)
    : requestedView === 'interior'
        ? allCaptures.filter(([view]) => ['interior_hall', 'interior_vault', 'interior_decon',
            'interior_research', 'interior_security', 'interior_deeplab', 'interior_service'].includes(view))
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
    if (gameplayLights) url.searchParams.set('facilityGameplayLights', '1');
    if (emergency) url.searchParams.set('facilityEmergency', '1');
    if (mission2 || view.startsWith('m2_')) url.searchParams.set('facilityMission2', '1');
    if (objective || view.startsWith('m2_')) url.searchParams.set('facilityObjective', '1');
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
        ], { encoding: 'utf8', timeout: 90000 });
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
