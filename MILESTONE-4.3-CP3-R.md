# Milestone 4.3 — CP3-R corrective refinements

Base: `milestone-4.3`, committed HEAD `0f1b230`. CP3-A–D were already present
as uncommitted work. This pass stops at CP3-R.

## Changes

- Fresh Endless initialization now supplies **6 player reserve cartridges** and
  **3 reserve magazines per squadmate**, including custom loadouts and Replay.
  Selected weapon magazines still start full. The saved-run restore path is
  unchanged, so Continue retains stored reserves and partial magazines.
- Removed `DroneAlert.wav` calls from sky descent, ambient drone detection,
  facility patrol spawning and evacuation reinforcements. Drone laser, hit,
  explosion and movement logic and Screecher wing sounds remain intact.
- The alarm now plays once at the secured-DNA **Campaign M3→M4 chapter start**,
  after stabilization/transfer. Explicit guards require Campaign mode,
  `break_contact`, `M4_BREAK_CONTACT`, `dnaSecured`, and emergency state. A
  `m4AlarmPlayed` world-state latch is included in the chapter checkpoint.
  Restoring a checkpoint does not call the alarm event.
- Updated current README guidance and the existing economy/Replay test starting
  reserve expectations. Extended the CP2-R protected-source normalization only
  for these authorized fresh-reserve and drone-detection sound substitutions.

## Relay turret investigation

The purchase system **already exists and works**; no new mechanic was added.

| Question | Finding |
|---|---|
| Item | `r_turret`, **RELAY TURRET**, one-time epic Tier 3 upgrade |
| Unlock | `relayTierUnlocked()` returns Tier 3 at **wave 10**, not wave 12 |
| Cost | **24 scrap**, no power cell |
| Prerequisites | Tier 3 unlocked and not already purchased; no prerequisite upgrade, DNA milestone, or weapon requirement |
| Control | Within **8 m** of the central relay, press **U** between waves. If offered, its card occupies one of the three slots; press the corresponding **1/2/3** key. |
| Why absent | Only three weighted offers are selected without replacement. Epic weight is 2 versus rare 4 / common 9, further weighted by unpurchased stacks. Wave 10 makes it eligible, not guaranteed. |
| Refresh | A wave clear refreshes offers. Reopening retains the set; exhausting all three offers can also refresh eligible upgrades. Continue retains saved offers. |
| Behavior | Relay-mounted 45 m / 14 damage auto-turret, active during waves; ownership restores on Continue and resets on fresh Replay. |

No incorrect UI condition or missing prerequisite was found. Purchase visibility,
price, insufficient-funds handling, ownership exclusion and restore all passed.
At wave 10 the player must finish the wave before reopening the terminal through
normal input. Pre-unlock offers do not acquire a turret merely by reopening.

## Focused verification

`tests/cp3r.mjs` uses an isolated headless Edge browser context and test-only
in-memory observation hooks; it does not modify user browser saves or write over
historical evidence. Campaign defense/transfer and wave progression are bounded
fixtures, not a claimed repeat of the user's 30-minute playtest. Audio verification
observes actual sound-dispatch calls rather than subjective speaker output.

Passed:

- Default rifle/scatter and custom ARC/PX deployments: **6 / 3 reserves**, all
  selected player/squad magazines full.
- Native debrief **Replay**: fresh **6 / 3** supplies.
- **Continue**: stored player reserve 8, squad reserves 4/5/6, and partial player
  and squad magazines retained exactly.
- Turret excluded at wave 9; selected and drawn at wave 10 with correct numbered
  card and 24-scrap label. Purchase denied at 23; installed at 24. Purchased turret
  excluded from further offers and restored on Continue.
- Multiple Endless drone constructions/descent: **zero alarm calls**.
- Campaign M3 retains **4 player / 2 squad reserves**. Sample retrieval/lockdown
  does not fire the alarm; completing defense/transfer produces **one** alarm at
  M4 start. Further M4 drones produce no additional alarm.
- Campaign→Endless transition and subsequent wave/drone spawning: **zero alarm
  calls**. All **64** mission/mode/phase/DNA/emergency guard combinations were
  exercised twice to verify the latch and rejection paths.
- **120 deterministic Director plans** across three seeds / waves 1–40 retain
  pressure bounds, archetype unlocks and boss cadence. Actual CP3-C banking at
  milestone 21 still pays the expected 12 scrap.
- HTML module and relevant JS/MJS syntax checks; browser **zero page errors**.
- `node tests/cp2r-state.mjs`: Campaign balance and drop RNG, save ammunition,
  magazine cost, protected crafting/progression/attack/results code passed.
- `git diff --check`: passed.

Runtime test command in this environment:

```powershell
$env:PLAYWRIGHT_PACKAGE="C:/Users/User/AppData/Local/Temp/opencode/chargefront-cp3r-tools/node_modules/playwright/index.mjs"
node tests/cp3r.mjs
node tests/cp2r-state.mjs
git diff --check
```

The pre-existing shared temporary Playwright installation lacked its entrypoint;
test tooling was installed in the separate temporary path above. Project
dependencies and existing evidence/saves/stashes were preserved. No staging,
commit, merge or push was performed.
