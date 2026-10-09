# Milestone 4.1 — additional refinement

## Result and baseline

**COMPLETE — implementation and final acceptance checks pass.** Continued
`milestone-4.1` from accepted corrective commit
`da87c60a9911d3130f10f6f598b55f54fa6b1111`. Audited README, prior 3.9/4.0/4.1
reports, existing tests, campaign/save/reward/menu histories (`5a83aad`, `7ef6176`,
`0b9fa87`) and current runtime ownership. No applicable `AGENTS.md` was found.

Initial unrelated work is preserved and excluded: modified `Credits.txt`; the
pre-existing untracked m38 capture folders/archives, m39 traversal before/after
JSONs, and m40 traversal after JSONs listed by the initial `git status`.

Before edits: `combat-state`, `objective-hud-state`, plus Firefox
`runtime-stability --campaign`, `corrective-refinement` and `endless-hud` all passed.

## Menus and fresh boundaries

- Main **CAMPAIGN** opens **START NEW GAME**, **SELECT MISSION**,
  **CONTINUE LAST CHECKPOINT**, and Back. Continue is disabled without valid
  progress. Overwriting an existing campaign requires a clear confirmation.
- The existing mission selector is retained; Back returns to Campaign. New/Select
  explicitly ignore continuation payloads and reset actors, resources, commands
  and old combat. Select sessions remain isolated from the persistent campaign.
- **ENDLESS HORDE** opens deployment directly with no valid save. A valid save
  instead offers **CONTINUE LAST SAVED WAVE**, **START NEW GAME**, and Back.
  Discard confirmation precedes a new deployment; cancellation/Back preserve the
  prior run. The old save is discarded only when the confirmed fresh run starts.
- Existing sound selection, transitions, shared Options/Guide and pointer-lock
  handling are reused. All affected text uses canonical Glitch Slap.
- Campaign death Retry starts the current mission with fresh authored state while
  retaining campaign unlocks; ordinary Continue remains a distinct pre-death
  checkpoint restore. Endless Retry is a fresh wave-0 run in the existing chosen
  configuration/arena, never a resurrection of invalidated wave progress.

## State ownership, schemas and compatibility

Runtime owners remain `playerCombat`, `player`, `squadMembers`, `craft`,
`campaignRun` and `endlessRun`. `src/progression.js` is a pure helper module for
validation, bounded scalar copying, storage replacement/backup, balance and seeded
randomness; it does not maintain another inventory or campaign implementation.

### Campaign

- Existing key **`cf_campaign_v1`** is retained. Profile and newly written
  checkpoint snapshots use **version 4**; combat magazine/shared-cartridge records
  retain **version 3** and their accepted v2/legacy migration.
- Removed empty intermediate continuation writes from mission initialization and
  transition completion. The stable incoming mission checkpoint carries the
  outgoing authoritative actors/resources after world/progression initialization.
  Continue prefers that snapshot's mission identity over stale profile hints.
- This also prevents a Continue operation from replacing its valid disk snapshot
  with an empty continuation until the next periodic save.
- Durable player/squad data now includes health/shield maxima and values, owned
  weapon/magazine identities and rounds, cartridges, ability selections/cooldowns,
  Bulwark duration, relevant upgrade multipliers and living/downed status. Player
  weapon upgrades are whitelisted separately from transient action state.
- Scrap, cells, medkits, electric grenades, progression, discoveries, optional
  choices/remaining locker quantities and route progress are retained.
- Pending world pickups are restored as plain records. Living hostile records
  retain relevant health, position, faction focus, attack cooldown and committed
  Runner fuse state; dead actors are excluded. This prevents replaying accounted
  death drops while avoiding persisted engine objects/projectiles/interpolation.
- Active relay defense progress, health, timer/spawn budget and escort progress are
  retained. Older snapshots without these fields keep the supported older restore
  behavior. Mission 3/4 progression and the accepted M4 emergency safety floor
  remain; that floor applies at the authored transition, not repeatedly on load.
- Older compatible profiles/checkpoints migrate in place. Missing new actor fields
  use authored defaults; earned old ammunition retains its existing migration.
  A legacy Sensors choice can infer Alpha intel; completed legacy survey state
  reconstructs Gamma/intel flags without granting inventory again. Legacy lockers
  with no new remaining-item record do not receive a duplicate retroactive reward.
- Legacy progression-only profiles can explicitly resume the unlocked mission
  entry with fresh supplies; the submenu explains that no actor checkpoint exists.

### Endless

Separate key **`cf_endless_v1`**, **version 1**, stores:

- Sanitized pair/operator/posture/Commander ability configuration, active equipped
  weapon, arena ID and scenery seed.
- Wave number and boundary type (`waveActive`), chosen mutator, complete fresh-wave
  spawn budget, upgrade ownership/stacks, DNA/milestone values and live modifiers.
- Durable actors, resources, pending pickups, command, offers and score counters.

Boundary policy:

1. Save fresh wave 0 after deployment.
2. Save **after** each wave's mutator/start-refresh effects and **before** spawning.
3. Save completed-wave intermission **after** paying rewards.
4. Mid-wave menu return/reload keeps the most recent saved start, not partial kills,
   resources or encounters. The save helper rejects an in-progress wave write.
5. Intermission menu return/reload can save the safe current intermission state.
6. Restore applies saved state directly, without running upgrade/reward/refresh
   grants again; active waves restart their budget from the saved boundary.
7. Genuine Endless death/extraction clears both primary and backup resume records.
   Fresh restart preserves configuration/arena/scenery but resets resources,
   upgrades and wave number. Campaign data is not affected.

Endless scenery generation uses a stored seeded random stream only during the
synchronous existing builder, restoring normal randomness in `finally`. Terrain
formula/arena choices are unchanged. Tree positions/scales/rotations match after a
browser reload; collision scenery no longer reshuffles around saved actors/loot.
An older compatible record missing the optional seed uses seed 0. Random gameplay
encounters still replay as fresh encounters at the saved wave start.

### Storage failure strategy

Serialize/validate before writing. `setItem` replaces one complete primary record;
the previous valid record is kept under the same namespace's `.backup` key. Load
tries validated primary, then validated backup. Corrupt/unsupported data produces
menu feedback instead of an automatic reset. Quota/permission failures preserve
the previous disk record and report failure. No profile is silently erased merely
because loading failed; deliberate New Game/Game Over deletion uses the intended
mode namespace only. Storage availability is a browser/host capability.

## Fresh health and ammunition balance

Fresh Commander health/shields use the immutable configured maxima (currently
100/100), and operators use their individual maxima:
ROOK **130 HP / 104 shield**, VEX **100 / 80**, KADE **110 / 88**.
Select Mission no longer applies the old authored attrition fractions to a fresh
squad. Restoring a valid checkpoint applies its saved maxima/values afterward.

All magazines remain full at fresh start: Campaign BUL-117 **50**, CRW-8 **20**;
authored squad magazine capacities **30 / 70 / 50** remain unchanged.

| Fresh mission | Player reserve before → after | Each operator before → after |
|---|---:|---:|
| M1 — Dead Signal | 9 → **6** | 4 → **3** |
| M2 — Power Through | 8 → **5** | 3 → **2** |
| M3 — Sample Zero | 6 → **4** | 3 → **2** |
| M4 — Break Contact | 5 → **3** | 3 → **2** |

Central definition: `ChargefrontProgression.reserves`, consumed by the canonical
world snapshots/fresh reset. Continue never reduces earned cartridges to these
baselines. Existing capacity/crafting/reload semantics remain. Endless initial
reserves stay **8 player / 4 per operator**, with full selected magazines.

### Difficulty-weighted scrap

One optional bundle per death; quantity resolves once at death, not on collection.
The existing one-time death guard and bounded **160** world-loot limit remain.
Previously every type used 32% chance for 1–2 objects × 2–4 scrap each (mean 1.44
scrap per death); the new centralized table is:

| Enemy | Chance | Scrap units if dropped |
|---|---:|---:|
| Skitter / Runner | 32% | 2–3 |
| Spitter / Screecher / Drone | 45% | 3–4 |
| Shielded | 50% | 3–5 |
| Support | 55% | 4–5 |
| Tunneler | 60% | 4–5 |
| Brute / Artillery | 65% | 4–6 |
| Carrier | 70% | 5–6 |
| Harvester boss | 100% | 10–14 |

Types were balanced from real health/attack/role threat, not palette alone. One
bundle avoids extra clutter. Existing power-cell/grenade/DNA rules remain;
ordinary deaths never spawn the new reserve-cartridge objects. This is a targeted
economy change, not a certification of full-campaign survival balance.

## Optional mission rewards and guidance

### M1: mutually exclusive aux cell

- **Sensors:** retains tactical contact feedback and unlocks `alphaIntel`, carried
  to M2. The cyan route activates only while Relay Alpha is the travel objective.
- **Supply Locker:** selection grants no immediate inventory. Two prepared
  scene-owned objects appear near the locker at **(373,624)** and **(379,624)**:
  a cyan/gold cartridge pack (**3 cartridges**) and the existing electric grenade
  visual (**2 ESG-180 grenades**). Bottom bounds rest **.03 m** above the floor.
- Explicit **hold E for .6 s**, **2.4 m** range and LOS are required. Capacity-full
  attempts leave the items intact with feedback; partial capacity grants only the
  available amount and saves the remainder. Successful collection saves it.
- Remaining quantities are deep-copied into checkpoints and drive visibility on
  restore, without re-running selection/grant side effects. Mission end/reset
  hides the two reusable objects. The special ammo objects have no enemy-drop path.
- Activation/collection creates **zero** materials, geometries or shader links
  after the prepared campaign resources; measured in both browsers.

### M2: Survey Drone

Actual successful scan completion preserves `betaSurvey`/hostile contact benefits
and records Gamma intel. Contacts are bounded to eight visible, LOS-authorized
hostiles within 95 m, with no omniscient default radar or restored minimap legend.
The cyan Gamma route activates only at the Relay Gamma travel objective; Alpha/
Beta phases are not redirected. Checkpoints retain completion/reward state.

### Authored route coordinates

Alpha: **(382,646) → (360,628) → (360,622) → (360,610) → (360,580) →
(300,575) → (212,575)**.

This explicitly exits command/the Hall through the front automatic entrance,
then follows the known staging service road to an Alpha interaction approach.

Gamma: **(250,741) → (285,690) → (285,585) → (450,570) → (568,585)**.

This leaves the Beta area, follows the western/southern compound bypass and
approaches Gamma outside its solid base. The paths reuse established road terrain.
They are fixed, data-driven records; a checkpointed sequential index advances only
when the player reaches authored points. The HUD shows one next cyan point plus
the unchanged actual objective; the minimap shows the unlocked fixed cyan path.

Validation: **232 Alpha / 456 Gamma** dense samples, **zero permanent blocked
samples**, maximum per-metre height step **.109 / .214 m** (<2.6 m limit). The far
player probe sees the front door closed at (360,618); it is an operable existing
door, not a permanent wall. Both browsers separately **walked the entire Alpha
sequence with real W input**, including opening/exiting that door, and verified
saved route progress. Existing M2/facility tests verify Gamma, return and later
navigation independently.

### Default guidance

Removed normal intermediate-waypoint substitution, default minimap route lines
and always-visible route guide groups. Ordinary main markers point to the real
current objective, retain distance, and use the accepted direction-aware compass.
Offscreen text aligns inward to avoid edge clipping. A direct marker does not
promise a walkable straight line. Terrain shaping, route data used by spawning,
facility/squad/Infested pathfinding and actual map markers remain intact.

## Animation and UI

- Screecher movement/idle/stun share a subtly smoothed hover offset:
  **6 m + .22 m × sin(1.6 × time + stable phase)**, followed at
  `1-exp(-5*dt)`. The old ±1.5 m fluctuation and movement-dependent phase offset
  are removed. Measured range is approximately **5.79–6.21 m**, with exact rendered
  root/hitbox-height alignment. Wings, combat tuning, attack origin ownership and
  navigation remain. This does not introduce global position interpolation.
- Loading text uses Glitch Slap and a restrained **2.8 s** color/text-shadow cycle
  (2–5 px glow); reduced motion disables the cycle. No WebGL assets/lights are
  allocated. Intro/camera/landing audio/fade/prewarm protections are unchanged.
- Guide: Use Medkit is in Movement & Combat; 1/2 and Q are separate rows; all four
  actually available weapons have individual descriptions. Shared internal scroll,
  heading/Back, margins and Glitch Slap remain.
- Deployment: Starting Slot is replaced by **Ability → SURGE PULSE**, the only
  implemented Commander ability, still on F with its existing 22 s cooldown.
  Fresh deployment starts in Slot 1; valid saves restore their actual active ID.
  Obsolete config fields are ignored safely. Four cards, operator abilities,
  posture and footer remain; redundant keyboard-navigation hint is removed.
  Compact spacing at short heights keeps the panel within **1280×540** without
  shrinking body text. Native keyboard navigation remains tested.

## Validation and evidence

**38 distinct suite/browser combinations pass**: all 19 below in Chromium/Edge
and Firefox. Three pure Node suites pass; additional final acceptance also passes
**headed in both browsers**. Relevant M2, traversal, facility, HUD navigation and
four-configuration Endless suites were rechecked after the final route/scenery
refinements.

Final diff review also corrected the objective-dot addition's scope: it now runs
inside `drawMinimap`, not boot. A native Canvas2D paint probe verifies the actual
current target (including the maintenance battery, distinct from the generic
facility dot), allowing native pixel rounding. The initially interrupted rerun
was subsequently completed: the full focused acceptance suite passes on the exact
final implementation in both Chromium/Edge and Firefox, with zero unexpected
browser errors. Receipts are under `additional-minimap/`.

| Suite | Edge | Firefox |
|---|---|---|
| `intro-smoke` | PASS | PASS |
| `m2-progression` | PASS | PASS |
| `runtime-stability --campaign` | PASS | PASS |
| `traversal-performance` | PASS | PASS |
| `facility-regression` | PASS | PASS |
| `facility-playthrough` | PASS | PASS |
| `transition-diagnose` | PASS | PASS |
| `corrective-refinement` | PASS | PASS |
| `hud-refinement` | PASS | PASS |
| `hud-navigation` | PASS | PASS |
| `objective-hud-flow` | PASS | PASS |
| `arc-presentation` | PASS | PASS |
| `screecher-wings` | PASS | PASS |
| `runner-kamikaze` | PASS | PASS |
| `sprint-recovery` | PASS | PASS |
| `combat-squad` | PASS | PASS |
| `combat-playtest` | PASS | PASS |
| `endless-hud` | PASS, headed | PASS |
| `additional-refinement` | PASS, headless + headed | PASS, headless + headed |

Pure: `combat-state`, `objective-hud-state`, `progression-state` — PASS.

Focused results include:

- M1→M2 damaged squad, current/max health/shields, spent magazines, earned 11
  cartridges, consumables and cooldown preservation; correct latest mission.
- Full authored health/shields/magazines and new reserves for all four fresh
  Mission Select scenarios; confirmed New Game reset and cancellation.
- Real pickup interaction, full/partial capacity, remaining/collected restore,
  mutual exclusion, .03 m floor placement and zero activation allocations/links.
- One native Tunneler death bundle despite repeated lethal/death calls; no dead
  Tunneler resurrection or duplicated pickups after checkpoint restoration.
- Separate Campaign/Endless records; wave-1 start restores 73/120 HP, ARC/PX,
  active PX, 11 cartridges, 22 scrap and squad state instead of mid-wave values.
  Scenery transforms match after reload; paid wave rewards are not paid again.
- Genuine Game Over clears primary/backup, Retry resets to wave 0/8 cartridges/
  default maxima, and subsequent menu entry opens fresh deployment directly.
- Corrupt primary recovers a valid backup; corrupt Endless resumes are unavailable
  with feedback. Injected quota failure leaves previous disk data unchanged.
- Functional native F/Surge, normal/reduced-motion font/loading behavior, separate
  guide weapon/control rows, modal scroll and deployment bounds at 1780×832,
  1280×720, 1920×1080 and 1280×540.
- Actual current-objective minimap paint matches its expected position within one
  pixel in both browsers; the native raster offset is approximately .5 px.
- No unexpected page/console errors. Existing performance, audio, navigation,
  mission continuation, ARC, sprint/fire and Runner/Tunneler gates pass.

Local evidence (already-ignored `_playtest/m41/regressions/`; no disposable
artifacts are included in the commit):

- `additional-baseline/`: pre-edit state/runtime/corrective/Endless receipts.
- `additional-authoritative/`: seven authoritative suites per browser.
- `additional-edge/`, `additional-firefox/`: twelve corrective/additional suites.
- `additional-recheck/`: final relevant regression rechecks in both browsers.
- `additional-minimap/additional-{edge,firefox}.json`: completed final full focused
  acceptance, including actual minimap paint and all save/reward/UI checks.
- `additional-final/additional-{edge,firefox}.json`: final headed acceptance,
  native route-walk samples, layouts, drop/ground/seed/restore/storage findings.
- `additional-final/01-campaign-submenu-{edge,firefox}.png`.
- `additional-final/02-alpha-intel-{edge,firefox}.png`.
- `additional-final/03-locker-pickups-{edge,firefox}.png` (staged ground camera).
- `additional-final/04-gamma-survey-{edge,firefox}.png`.
- `additional-final/05-deployment-ability-{edge,firefox}.png`.
- `additional-final/06-endless-main-return-{edge,firefox}.png`.
- `additional-final/07-menu-confirm-guide-{edge,firefox}.png`.
- Corrective captures in the browser suite folders include both menu Guide/Options
  interfaces and the accepted HUD at requested sizes.

Rendered menu, deployment, locker, intel and HUD captures were visually reviewed.
These are controlled browser fixtures, real input/renderer tests and established
accelerated campaign harnesses, not an unassisted full-duration survival run.
Subjective hover/combat/audio feel, multi-hour soak and every hosting/storage
policy remain manual acceptance limits. No critical automated acceptance checks
remain open.

### Reproduction

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
$env:CF_ARTIFACT_DIR='_playtest/m41/regressions/additional-review'
node tests/combat-state.mjs
node tests/objective-hud-state.mjs
node tests/progression-state.mjs
node tests/m40-regressions.mjs firefox
node tests/m40-regressions.mjs edge
node tests/m40-regressions.mjs --additional firefox --suites=corrective-refinement,hud-refinement,hud-navigation,objective-hud-flow,arc-presentation,screecher-wings,runner-kamikaze,sprint-recovery,combat-squad,combat-playtest,endless-hud,additional-refinement
node tests/m40-regressions.mjs --additional edge --suites=corrective-refinement,hud-refinement,hud-navigation,objective-hud-flow,arc-presentation,screecher-wings,runner-kamikaze,sprint-recovery,combat-squad,combat-playtest,endless-hud,additional-refinement
node tests/additional-refinement.mjs --headed
node tests/additional-refinement.mjs firefox --headed
```

Existing suites follow the new product submenu and confirmations through the
shared test helper. Assertions were updated only for the deliberate removed
Starting Slot/new baselines, retaining combat/navigation/performance checks.

## Exact changed paths

Runtime/data: `chargefront.html`, `src/combat.js`, `src/progression.js`.

New focused/shared tests: `tests/additional-refinement.mjs`,
`tests/progression-state.mjs`, `tests/menu-helpers.mjs`.

Existing suite updates: `tests/combat-state.mjs`, `tests/combat-squad.mjs`,
`tests/combat-playtest.mjs`, `tests/endless-hud.mjs`, `tests/m40-regressions.mjs`,
`tests/corrective-refinement.mjs`, `tests/hud-navigation.mjs`,
`tests/hud-refinement.mjs`, `tests/objective-hud-flow.mjs`,
`tests/runtime-stability.mjs`, `tests/screecher-wings.mjs`,
`tests/sprint-recovery.mjs`, `tests/browser-startup-diagnose.mjs`.

Documentation: `README.md`, `MILESTONE-4.1-ENDLESS-HUD.md`,
`MILESTONE-4.1-ADDITIONAL-REFINEMENT.md`.

One consolidated commit only after all acceptance checks; unrelated user changes
and generated artifacts excluded. No push, merge, amend, reset or rebase.
No Milestone 4.2 work.
