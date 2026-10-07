# Milestone 4.1 — Endless loadouts, mutators & HUD

## Audit and implementation plan (before edits)

Accepted baseline: `cd60d51`, branch `milestone-4.1`. Tracked tree clean; prior
untracked 3.8/3.9/4.0 playtest artifacts are preserved. Inspected `src/combat.js`,
`chargefront.html`, all combat tests and the 4.0 report/authoritative runner.

- Combat owns two records, active ID, switch/fire timers; player fields are derived
  getters. Extend the frozen catalog to four while separating **owned slots** from
  catalog indices. Campaign reset/restore always enforces rifle + scatter.
- Retained ARC/PX models are inside an uncalled builder. Pre-4.0 ARC directly
  selected/damaged enemies without solid checks; PX splash was horizontal and
  ignored LOS; spent-cell ejection allocated per shot. Reuse presentation once at
  preparation, replace attack dispatch with collision-authorized pooled shots,
  LOS/range-bounded chains/blasts, and prewarm bounded electrical effects. Do not
  reactivate legacy attack/ejection functions.
- Replace per-gun reserves with `combat.cartridges`; magazines stay independent.
  New checkpoint version 3 saves only Campaign pair magazines and shared reserve.
  Migrate v2/legacy by summing each known Campaign weapon's saved reserve **once**,
  capped at 12; missing entries add zero, active/cache duplicate uses active data.
  If no combat ammo data exists keep authored supplies. New supplies: Campaign
  9/8/6/5 cartridges (old totals), Endless 8; carry cap 12 (old combined cap).
- CRW: 20-round magazine, 60 m reach (formerly 12 / 34 m; BUL remains 153 m),
  preserve eight pellets/.105 spread/.68 cadence/heavy recoil; verify live hits.
- Add .12 s terminal opacity/shrink within valid lifetime, clamp final movement
  to remaining range, never explode or damage after expiry, reset pooled visuals.
- Sanitized deeply frozen deployment object: distinct pair, starting slot,
  per-operator weapon/ability, posture. Native selects, compact two-column grid,
  horizontal footer; gameplay reads configuration only at reset.
- Lightweight squad loadout overlays authored identity: canonical gun, AI-scaled
  damage/cadence/range/accuracy and selected ability, no player state machine.
  Restore Campaign definitions on reset. Ability execution receives actual actor;
  autonomy considers all eligible operators rather than fixed-name ownership.
- Canvas HUD: combined bottom-left team/vitals; upper-left combat/supplies with
  magazine always visible, RELOADING plus fill, no percentage; maintain objective,
  minimap/commands. Remove enemy option/projected markers and omniscient radar
  dots; preserve mission intel/debug state and hit confirmations.
- Automatic mutators: waves 1–5 null; 6+ random modifier or NONE, exclude previous
  modifier, preserve existing buffs/rewards, clear at wave end/restart. No N menu.

### Exact existing terrain lifecycle — preserve

`startEndless(configuration)` → `resetEndlessRun()` →
`endlessRun.arena = ENDLESS_ARENAS[randInt(ENDLESS_ARENAS.length)]` →
`buildEndlessWorld()` → `buildMapGrid()` / `buildTerrain()` →
`terrainHeight()` (mode dispatch) → `endlessTerrainHeight(x,y)`.

`ENDLESS_ARENAS`: `valley` (LUMEN VALLEY), `crater` (IMPACT CRATER), `ridges`
(SHATTERED RIDGES). Uniform existing `randInt` selection occurs on fresh run reset.
All use three noise layers, rim and flattened relay pad; crater subtracts an
18 m Gaussian; ridges add two 8/4 m sine layers; final `clamp(h,0,130)` gives
the crater's flat interior. There is no separate flat/uneven checkbox or preset.
`restartEndlessRun()` saves `currentArena`, resets the run, restores that arena,
and places actors without rebuilding terrain/facility. Preserve this path and
both observed styles. No terrain generation changes are planned.

### Validation/evidence plan

Extend state tests and migrate relevant 4.0 assertions to the intentionally new
ammo/catalog/UI schema without weakening navigation/performance checks. Add
focused 4.1 browser tests for all pair/ability ownership/mutator/fade/lifecycle
paths; run 4.0 authoritative runner sequentially in Edge + Firefox. Guided headed
Edge and Firefox browser input passes cover A/B/C loadouts, restart, Campaign
boundaries and repeated fresh terrain choices. Keep ten selected final captures
and compact JSON receipts under `_playtest/m41/`; distinguish guided browser
coverage from subjective human acceptance. Complete docs and coherent passing
commits after validation. Environment/prop/art work remains Milestone 4.2.

## Implemented architecture

### Four definitions, exactly two owned slots

`ChargefrontCombat.definitions` is the frozen catalog. `playerCombat.slots` is the
ordered, immutable owned pair; `playerCombat.weapons` contains **only those two**
records. `index` is the slot index, never the catalog index. Player weapon/index/
swap getters remain derived from combat. `1` / `2` directly select slots; Q cycles
two, including ARC/PX pairs. Existing .32 s readying, global shot cooldown,
independent magazines, reload cancellation and checkpoint-safe transient cleanup
remain. Availability does not come from model registry or DOM.

| ID / weapon | Damage / cadence | Magazine / reload | Projectile reach / identity |
|---|---|---|---|
| `rifle` / BUL-117 | 22 / .095 s | 50 / 1.7 s | 153 m; precise sustained bolts |
| `scatter` / CRW-8 | 8 × 13 / .68 s | **20 / 2.05 s** | **60 m**; .105 spread, heavy recoil, close/mid pressure |
| `arc` / ARC-9 | 42 / .42 s | 32 / 1.9 s | 72 m; collision-authorized electrical bolt + up to 3 chains |
| `plasma` / PX-4 | 74 / .8 s | 10 / 2.2 s | 110 m; orange plasma bolt + 6.5 m blast |

ARC/PX retain the older concept's damage, cadence, magazine and existing model.
All four now share canonical range/reload/action state and `spawnShot()` →
`updateShots()` terrain/height-aware solid collision. No legacy auto-target ARC
dispatch remains. `chainArcShot()` executes **after a real impact**, checks each
hop's 12 m radius, terrain LOS and height-aware solids, excludes buried/dead
targets and already-hit actors, and caps hops at three. PX explosion is 3D,
LOS/solid checked, excludes buried targets, and does not double-hit the direct
victim. Chains and blast damage also stay inside the originating gun's range.
Lifetime expiry does not trigger PX explosions. Legacy allocating spent-cell
ejection was removed. Existing gun models/arms/reload parts are prepared once;
electrical lines, bolts, impacts and sparks are prewarmed/bounded/reused.

CRW's .105 spread, eight pellets, .68 s cadence and heavy presentation recoil
remain; it is still dramatically shorter-ranged than BUL. Guided **45 m ADS**
contact produced damage in both browsers (final 416 / 442 damage over five bursts).
Shot direction now snapshots the current aim **before** applying camera recoil;
the recoil changes the next sight picture rather than pre-deflecting the accepted
shot. ADS accuracy and subsequent recoil still require aim correction. This is
a guided usability check, not a full Campaign/Endless balance certification.

### Universal cartridges / persistence

Only `playerCombat.cartridges` owns player reserves. Gun records have `mag` and
`magSize`, **no reserve field**. Reload completion spends exactly one shared
cartridge and replaces that gun's magazine; partial leftovers are discarded as
before. Cancellation spends nothing. V adds one universal cartridge at the
existing scrap price; T transfers one from that pool into the selected squad
member's lightweight reserve. The director's ammo-pressure estimate counts
shared supply once, using mean magazine capacity.

Campaign authored snapshot supplies are explicitly **9 / 8 / 6 / 5** cartridges
for M1–M4. Endless starts with **8**, full selected magazines. Base cap **12**
preserves the combined old carrying cap; existing Endless cap upgrades still
work. The one-use M4 cache adds **4 universal cartridges** (old combined +2/+2),
capped at 12, plus the existing grenade. The M4 safety floor grants **one**
cartridge only if the pool and **both** magazines are exhausted; it does not
refill magazines, and repeated restoration cannot duplicate that floor.

The existing `cf_campaign_v1` profile/mission schema stays in place. Both normal
Campaign checkpoints and M4 continuation now embed:

```js
player.combat = {
  version: 3, activeId: 'rifle', cartridges: 3,
  weapons: { rifle: { mag: 17 }, scatter: { mag: 6 } }
};
```

`restore()` always reinstates Campaign's rifle/scatter definitions and rejects
saved pair/upgrade/experimental identity changes. Version 2 reserves are summed
once per known Campaign gun and capped at 12. Legacy active `weapon` takes
precedence over its duplicate `weaponStates[id]`; inactive known entries are
read once. Missing entries contribute **zero**, never additional authored reserve.
Unknown ARC/PX legacy Campaign reserves are ignored. Invalid/negative/nonfinite
amounts are bounded, magazines capped to current canonical capacity, and no
transient timers/actions are serialized. If no known saved ammo entry exists,
the already-reset authored supply remains. Version 3 reads only its single pool,
so a migrated snapshot can be restored repeatedly without duplicating ammunition.

### Projectile terminal fade

All pooled bolt presentations use the last **.12 s** of valid lifetime for a
linear opacity fade; glow shrinks up to 20%. Most travel remains fully visible.
At 85 m/s this is the last 10.2 m. BUL, CRW, ARC and PX use the same terminal rule
while preserving color/shape: elongated bolts, shorter cyan electrical core,
larger orange plasma core/glow. ARC chain lines already have a .14 s visual fade.
`updateShots()` clamps each travel step to remaining lifetime and rejects targets
beyond origin range. At expiry shots return immediately to the 192-record pool;
no damaging extra tail or expiry blast exists. Spawn resets all style/opacity/
scale state; no shot-time materials or geometry are created after preparation.

### Squad weapons and ability ownership

`squadLoadout(base, selection)` creates one frozen lightweight overlay at run
reset, retaining each operator's authored suit/health/lane/reaction/commitment/
reacquisition tuning. It points to the selected canonical weapon and ability.
Endless damage is 48% of player per-projectile damage; cadence is the gun cadence
with .16 s minimum; maximum engagement range is capped at 70 m; accuracy uses
gun spread. Preferred engagement range is weapon-derived:

| Selected gun | Preferred range | Cadence | Lightweight magazine |
|---|---|---|---|
| BUL-117 | 34 m | .16 s | 50 |
| CRW-8 | 18 m | .68 s | 20 |
| ARC-9 | 26 m | .42 s | 32 |
| PX-4 | 32 m | .8 s | 10 |

Squad shots use the same collision/secondary-effect path, with existing simple
AI mag/reserve/reload state; no player switch/inventory state machine is copied.
Player leash, bounded lane guesses, throttled reacquisition/reposition, LOS,
accepted waypoint steering and local separation remain. Rifle-only upgrades are
excluded from offers when BUL is absent, and guarded against missing gun state.

Every operator supports all four guns and all three abilities. Campaign still
restores `SQUAD_DEFS`: ROOK heavy/Bulwark (13 m), VEX SMG/Medic Pulse (22 m),
KADE rifle/Designator (34 m). Endless defaults are editable: ROOK CRW/Bulwark,
VEX ARC/Medic Pulse, KADE BUL/Designator. There are no fixed Endless role locks.

`activateSquadAbility(slot)` resolves the actual operator and calls
`executeSquadAbility(member, source, preferredTarget)`. Execution reads that
operator's chosen definition; cooldown, Bulwark duration and source/time belong
to that member. Notices name the actor, pulses originate at their position,
and Designator includes feedback at the acting operator plus its legitimate
target impact. Autonomy iterates eligible holders of each ability instead of
stopping at one hard-coded identity. The existing squad-wide short suppression
window prevents simultaneous pulse spam. Run reset clears cooldowns/durations/
coordination/targets/damage modifiers. No stale duplicate ability state survives
restart. Weapon meshes retain authored lightweight third-person role assets;
there is no new squad gun-model allocation/swap subsystem.

### Deployment / HUD / markers

- Deployment uses a compact two-column PLAYER / ROOK / VEX / KADE grid and a
  SQUAD posture row. Both slot selects expose the four names; the other slot's
  chosen option is disabled. Runtime sanitizer independently repairs duplicates.
  Starting slot is independent of pair order. Confirm/Back share an equal-width
  horizontal footer. Native labels/selects, visible focus and Tab/arrows/Enter
  work. No scrolling at tested 1280×720; narrow layouts use one column.
- Confirm passes one deeply frozen `{ player, squad, posture }` object through
  sound selection → `startEndless()`. Gameplay/reset reads that object, never
  controls. Back/re-entry preserves draft values; restart preserves committed
  configuration while refreshing actors/resources/upgrades/wave counters.
- Bottom-left **TEAM / VITALS** combines player HP/shield (conditional stamina)
  with compact ROOK/VEX/KADE bars, condition and selected ability/cooldown.
- Upper-left **COMBAT & SUPPLIES** contains active slot/gun, always-visible
  magazine, universal cartridges, grenades, medkits, scrap/cells/craft shortcuts.
  `RELOADING` and a 100×5 canvas fill replace percentage text; magazine dims.
  Fill increases smoothly, cancels on switch and vanishes on completion. Short
  readying uses the same fill. No per-frame DOM changes were introduced.
- Objective top-center, minimap top-right and command strip bottom-center remain.
  Enemy Markers option/wiring/projected diamonds/arrows are removed, along with
  omniscient enemy minimap dots. Mission intel/designation state remains internal;
  objective/interactable/squad information, hit confirmation and damage-direction
  feedback remain. No replacement always-on tracking system was added.

### Automatic wave mutators

`startEndlessWave()` increments the wave once, then calls `chooseMutator()`.
Waves **1–5** return null. Wave **6+** chooses uniformly from NONE plus valid
existing mutators, excluding the immediately preceding modifier. NONE has 20%
probability with the full pool, or 25% while one previous modifier is excluded.
NONE resets the preceding ID, allowing a modifier after an intervening clear
wave. Modified-wave HUD shows `WAVE n MUTATOR — name` plus description for 5 s;
unmodified starts retain the ordinary wave notice. Gameplay is never interrupted.

Storm disables shield regeneration and boosts BUL damage; Corrosive retains cell
drop/grenade effects; Armoured retains hostile HP/critical modifiers; Blackout
retains navigation-marker suppression/player damage. Existing survival rewards
are paid once at clear. `endlessRun.mutator = null` clears all live modifiers at
wave end; restart also clears previous ID and all progression. N/Contract UI,
interaction/key hints and manual selection state/function are removed.

### Terrain and Campaign isolation results

The selection path documented in the audit is retained exactly. No changes to
`endlessTerrainHeight()`, arena definitions, terrain generation, placement or
`src/world/facility.js`. Fresh menu starts still randomly produce crater/valley/
ridges. In both browsers, a 64-point interior sample grid confirms crater
**0–0 m**, ridges **0–6.318 m**; valley observed **.034–1.506 m**. Fixed camera
captures show both styles. The enclosing rim is naturally elevated even for the
flat-floor crater. Restart saves/restores the preset and reuses existing geometry.

Campaign New, Continue, Mission Select, all eight mission/active-slot checkpoint
combinations, and M1→M4 continuity pass. An exotic PX/BUL Endless deployment
entering Campaign New immediately becomes authored BUL/CRW + authored abilities.
Endless upgrades/posture/configuration do not enter checkpoint/profile payloads
or change the Campaign save during restart. Authored supplies/operators and
existing seamless world lifecycle remain. ARC/PX are Endless choices only.

## Validation and playtest findings

All final suites pass. Existing navigation/performance assertions were retained.
Combat expectations were updated for deliberate new catalog/magazine/shared-ammo
schema. The guided squad evidence fixture now clears old break/commit state and
waits for **all three actual shooters** instead of a fixed 2.2 s photograph;
headed input restores native Resume if external focus loss opened Pause. No
product input or AI semantics were altered to accommodate the harness.

| Suite | Edge | Firefox |
|---|---|---|
| `combat-state.mjs` | Node pass, 24 pair/starting-slot cases + migration | Same pure suite |
| `endless-hud.mjs` | Pass, **headed** | Pass, headless real input |
| `combat-squad.mjs` | Pass | Pass |
| `combat-playtest.mjs` | Pass, **headed** | Pass, headless real input |
| `intro-smoke.mjs` | Pass | Pass |
| `m2-progression.mjs` | Pass | Pass |
| `runtime-stability.mjs --campaign` | Pass | Pass |
| `traversal-performance.mjs` | Pass | Pass |
| `facility-regression.mjs` | Pass | Pass |
| `facility-playthrough.mjs` | Pass | Pass |
| `transition-diagnose.mjs` | Pass | Pass |

Authoritative runner: **14/14** executions. Additional focused/guided browser
passes: **6/6**. Final unexpected console/page errors: **zero** in those passes.
Pure tests also cover invalid duplicate pairs, all ability/weapon combinations,
reload spending/cancellation, global cadence, finite migration, NONE probability
boundaries and previous-mutator exclusion.

Guided browser scenarios (same configs in both browsers):

| Run | Player slots / start | ROOK | VEX | KADE | Posture |
|---|---|---|---|---|---|
| A | BUL / CRW, Slot 2 | ARC / Medic | PX / Designator | CRW / Bulwark | Escort |
| B | ARC / PX, Slot 1 | BUL / Designator | CRW / Bulwark | ARC / Medic | Screen |
| C | CRW / ARC, Slot 2 | PX / Bulwark | ARC / Medic | BUL / Designator | Balanced |
| D | PX / BUL, Slot 2 | CRW / Designator | BUL / Medic | PX / Bulwark | Balanced |

All selected player guns dealt damage through real fire input. All operators
actually shot their selected weapon; each operator used all three abilities with
their own cooldown/source/effect origin. Direct 1/2 and Q, walking/fire, shared
crafting, reload progress/cancel/complete, real Pause-button restart and existing
result-key restart pass. Each accelerated wave sequence covers 1–24 and verifies
activation, no immediate repeat, Storm shield activation, reward/expiry/reset.
Projectile probes verify .95 full opacity → .475 at .06 s remaining, exact final
range, same material identities, positive chains/stuns/blasts, zero beyond-range
secondary damage and zero wall-occluded damage. M4 empty-pool floor grants one,
restoring it remains one; T shares from the universal pool; one-use cache and
Continue through the actual menu preserve checkpoint ammo.

These are real rendered-browser guided playtests, with setup teleports,
invulnerability/high-health contacts, and accelerated wave/chapter fixtures.
Authoritative suites separately walk actual mission/facility progression. They
do not claim an unassisted human full Campaign or 24-wave survival run.

### Performance

Preparation owns **192 shots, 41 impacts, 160 sparks, 40 electrical lines**.
Existing four FPS models compile at preparation; equip/fire/fade creates no new
geometry/material/light. Four final isolated Endless firing samples per browser
assert zero materials/geometries/shader links/world/terrain/facility/nav rebuilds:

| Sample | Edge p95 / worst ms | Firefox p95 / worst ms |
|---|---|---|
| A: BUL / CRW | 17.0 / 17.3 | 16.7 / 50.0 |
| B: ARC / PX | 16.9 / 17.4 | 33.3 / 50.0 |
| C: CRW / ARC | 17.0 / 17.3 | 33.3 / 33.4 |
| D: PX / BUL | 16.9 / 17.4 | 33.3 / 50.0 |
| Isolated Campaign combat | 16.8 / 33.3 | 50.0 / 50.0 |

Final authoritative traversal run (recorded separately, same 1280×720 viewport):

| Sample | Edge p95 / worst ms | Firefox p95 / worst ms |
|---|---|---|
| M1 exterior | 36.0 / 52.6 | 61.4 / 67.5 |
| M2 Alpha | 18.6 / 19.0 | 32.7 / 62.2 |
| M2 Beta | 18.6 / 19.0 | 31.9 / 32.2 |
| M2 Gamma | 18.6 / 19.0 | 32.0 / 61.9 |
| M2 return/front | 18.8 / 36.7 | 47.7 / 63.1 |
| Facility interior | 18.6 / 36.9 | 48.2 / 63.3 |
| M4 service/exit | 18.5 / 19.0 | 32.2 / 61.5 |
| Campaign combat | 35.7 / 37.3 | 61.7 / 64.1 |
| Endless early | 18.5 / 54.8 | 31.6 / 61.6 |
| Endless later | 18.6 / 19.1 | 31.8 / 32.4 |

All ten samples per browser had zero shader links/world/facility/static-grid
rebuilds; quiet traversal had no resource construction/uploads. Existing enemy
first-use resources still appear in unprepared Endless combat (24/11 materials
early, 0/12 later). This is not a whole-actor-pooling rewrite. Frame timings vary
across scheduling/driver/render samples (final isolated samples returned to
16.7/33.3 ms cadence); the historical 4.0 timings are not controlled A/B runs.
No recurring new shader/allocation/rebuild stall was found, and every existing
performance gate passes. Short traces do not certify multi-hour GC/Firefox feel.

### Evidence and reproduction

Selected final gallery: `_playtest/m41/evidence/` (ten PNGs):

1. `01-deployment.png` — full two-column deployment with Run A selections.
2. `02-player-arc-px-pair.png` — two-of-four ARC/PX pair and starting Slot 1.
3. `03-squad-customization.png` — mixed Run C operator guns/abilities.
4. `04-horizontal-footer.png` — equal-weight Confirm/Back row, native focus order.
5. `05-consolidated-hud.png` — combat/supplies and team/vitals.
6. `06-reload-progress.png` — RELOADING fill plus visible magazine/cartridges.
7. `07-px-gameplay.png` — selected PX-4 in damage-verified browser gameplay.
8. `08-automatic-mutator.png` — automatic post-Wave-5 announcement, no menu.
9. `09-flat-terrain.png` — randomly selected flat crater floor.
10. `10-elevated-terrain.png` — randomly selected varied ridge terrain, same camera.

`_playtest/m41/validation-summary.json` is the compact final receipt containing
all regression exits, deployment/restart/ability/damage/mutator/terrain/fade/
checkpoint/cache/performance findings. It is generated only from artifacts marked
passed. Full `_playtest/m41/regressions/`, `compatibility/` and raw focused receipts
are retained locally but ignored to keep redundant captures/large traces out of
Git. Existing earlier milestone evidence is untouched.

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
node tests/combat-state.mjs
node tests/endless-hud.mjs
node tests/endless-hud.mjs firefox
node tests/combat-squad.mjs
node tests/combat-squad.mjs firefox
node tests/combat-playtest.mjs
node tests/combat-playtest.mjs firefox
$env:CF_ARTIFACT_DIR='_playtest/m41/regressions'
node tests/m40-regressions.mjs
Remove-Item Env:CF_ARTIFACT_DIR
node tests/m41-summary.mjs
```

### Limitations / deferred

- Normal-profile desktop Firefox input/feel/listening, unassisted full-length
  balance and multi-hour Endless soak remain human acceptance items; Firefox
  automation is headless, as in accepted 4.0. Headed Edge gameplay was performed.
- Squad retains lightweight authored third-person gun/suit meshes; behavior,
  damage/projectiles/ability ownership are customized. No cover planner/navmesh
  rewrite or player inventory copied onto AI.
- Existing enemy/grenade first-use resource allocations and bounded visual effect
  drops under pool saturation remain. ARC range uses a projectile, deliberately
  replacing unsafe legacy aim-assist/direct damage.
- **Milestone 4.2 — Environment & Final Prop Pass** remains deferred: facility/
  exterior prop placement, terrain decoration, environmental storytelling,
  building/large environment art polish. None started here.

### Changed files and commit organization

Implementation: `src/combat.js`, `chargefront.html`, `README.md`.
Validation: `tests/combat-state.mjs`, `tests/combat-squad.mjs`,
`tests/combat-playtest.mjs`, `tests/m40-regressions.mjs`, new
`tests/endless-hud.mjs`, `tests/m41-summary.mjs`.
Report/evidence: this document, `.gitignore`, ten gallery PNGs and one compact
JSON receipt. `src/world/facility.js` and all prior milestone evidence unchanged.

Two coherent commits: integrated loadout/shared-ammo/HUD/mutator implementation
with passing tests (dependencies make a single systems commit cleaner), then
final documentation/selected evidence/compact validation receipt. No failing
intermediate commits, push or merge. Final review uses `git diff --check`,
`git diff --stat` and `git status`; prior untracked 3.8/3.9/4.0 user artifacts
remain as originally found.

## Follow-up — Combat & Vitals HUD refinement

Presentation-only follow-up on `milestone-4.1`, separately committed as
`refactor: refine combat and vitals hud`.

- COMBAT reads both owned slots directly: active gun/magazine is first, bright
  14/18 px text; partner is directly underneath, dimmer 11/12 px text. Emphasis
  follows 1/2/Q without new weapon state. Controls now sit after medkits and before
  supplies/crafting. Combat frame grows only 16 px (264×262).
- Bottom-left becomes VITALS / COMMANDER, with health/shield/stamina icon + bar
  rows and no numerical health/shield panel labels. Squad entries retain names,
  command/status and ability readiness, with health/shield icons + compact bars.
  Downed entries show dark tracks and red DOWN. Vitals remains 264 px wide and
  uses a 246 px frame, taking existing empty left-side space.
- The old 3 px stamina bar was smaller than the framed helper's 4 px inset;
  its full-width colored edges masked actual depletion. Vitals now use unframed
  dark 6 px tracks with proportional fills, always including full/empty stamina.
  Existing framed reload/progress rendering is preserved, just repositioned.
- `Images/health-normal.svg`, `Images/shield.svg`, `Images/walking-boot.svg` are
  the supplied, unchanged assets. Three cached native Image objects load once;
  the HUD draws the SVGs directly with Canvas2D `drawImage`, preserving aspect
  ratio. White icons pair with green/cyan/yellow fills. No raster asset conversion,
  shape replacement, per-frame loading/tinting, new geometry/materials or DOM UI.
- Objective/minimap/command positions and every accepted gameplay/save/terrain
  system remain unchanged. Changes to the existing test are presentation labels,
  reload-bar coordinates, both-weapon checks and optional artifact output routing.

Validation: `tests/hud-refinement.mjs --headed` (Edge) and `firefox` pass at
1280×720, 1366×768 and 1920×1080. Actual Canvas fill calls confirm 40% stamina
paints 80 px of a 200 px track; exhausted stamina paints only the dark track.
Real Shift+W consumes stamina to ~46–48%, idle recovery reaches 100%. Both-slot
1/2/Q emphasis/ammo, reload cancel/complete, damaged/downed squad bars, FOLLOW /
AFAR / DOWN, cooldown/readiness, icon loads/alignment and text/frame bounds pass.
Pure combat-state tests and full four-configuration Endless suites also pass in
both browsers. HUD rendering and isolated firing record no new materials,
geometry, shader links or world/facility rebuilds. No unexpected page/console
errors. Rendered Edge captures were visually inspected; Firefox uses headless
real input, as in the accepted milestone.

Concise before/after gallery and two compact validation receipts:
`_playtest/m41/hud-refinement/` (`01-before.png`, `02-slot1-full-vitals.png`,
`03-slot2-damaged-vitals.png`, `04-exhausted-vitals.png`,
`validation-{edge,firefox}.json`). Supplemental four-configuration receipts are
local under ignored `_playtest/m41/regressions/hud-refinement/`. Icon source
attributions from the supplied credits edit are included; its unrelated pending
terrain-credit line remains uncommitted. Milestone 4.2 remains deferred.

## Corrective follow-up — sprint recovery

`movePlayer()` previously re-enabled sprint whenever stamina became positive,
causing near-zero drain/regeneration chatter. Runtime-only `sprintExhausted`
latches at zero and clears at **25 / 100** stamina. Held sprint can resume at that
threshold; releasing the key does not bypass the recovery latch. Fresh Campaign
and Endless resets clear it. Existing speeds, drain/regen rates and upgrades are
unchanged. The resolved state drives movement, footsteps, FOV and all weapon
sprint/sway poses. No animation-only timer or save-schema change.
`tests/sprint-recovery.mjs` passes in headed Edge and headless Firefox through
three continuous-held exhaustion/recovery cycles: zero chatter/wrong-speed
frames, recovered WALK pose, and re-entry only after the 25% threshold.

## Corrective follow-up — fixed slots and objective flow

- COMBAT now keeps Slot 1 at y=51 and Slot 2 at y=73. 1/2/Q changes size/color
  emphasis only, with magazines read from their own existing slot records.
- Squad group cadence grows from 48 to 56 px, with ability baseline 38 px after
  its operator name: 14 px from the shield row, **18 px before the next name**.
  Vitals grows only 24 px to 264×270; Commander rows/icons/styles are preserved.
- Textual main/optional objectives and relay/containment/purge progress move into
  a lightweight right-side stack, beginning at y=202 below the unchanged minimap
  and legend. Width is capped at 300 px, shares its right edge with the minimap,
  and wraps long mission strings using a cached Canvas2D measurement context.
  World-space markers, top-center waypoint distances/compass, command strip and
  mutator announcements are preserved.
- `src/hud-objectives.js` owns presentation only: at most one current and one
  retiring row per main/optional category. Stable mission/phase/wave/side-step IDs
  prevent hostile counts, escort HP, repair timers and objective percentages from
  triggering false completion. Completed optional status messages do not stay in
  the current list permanently. Existing progression and optional state remain
  authoritative and unchanged.
- Replaced/completed rows strike through, hold **.45 s**, then fade over **.65 s**
  and disappear (1.10 s total). Smooth collapse plus a canvas clip keeps successors
  moving into freed space without text overlap. Text outlines fade with the glyphs
  so no dark text ghost remains. Cached wrapping updates only on
  text/font/width changes. There are no per-frame DOM nodes or save fields.
  Fresh runs and checkpoint restoration clear transient presentation; seamless
  chapter transitions retain the completion animation and bounded queue.

Final validation: pure combat-state and objective-state suites pass; existing
HUD refinement, combat/squad/checkpoint and four-deployment Endless browser suites
pass in Edge and Firefox. New sprint and objective-flow tests pass in both
browsers (headed Edge, headless Firefox). Actual E interactions collect the main
maintenance battery and finish the optional scan; checks cover optional retirement/
appearance, all M1→M4 objective boundaries, Continue without duplicated rows,
escort health/repair changes, relay percentages, strike/hold/fade/removal and
smooth successor placement. Layout/text bounds pass at 1280×720, 1366×768 and
1920×1080. No unexpected page/console errors. HUD and isolated firing retain zero
new material/geometry/shader links/world/facility rebuilds; final Endless firing
p95 samples were 17.0 ms Edge / 16.7 ms Firefox. Short traces are not a soak test.

Selected evidence: `_playtest/m41/hud-flow/` contains four PNGs —
`01-sprint-recovering.png`, `02-fixed-slots-vitals-objectives.png`,
`03-objective-strike.png`, `04-objective-fade.png` — plus compact
`sprint-{edge,firefox}.json` and `objectives-{edge,firefox}.json` receipts.
Supplemental existing-suite output stays local under ignored
`_playtest/m41/regressions/hud-flow/`. The two follow-ups use separate sprint and
HUD commits. No Milestone 4.2, push or merge.

## Follow-up — navigation status, objective alignment, Commander ability

- Top-center state text (waypoint distance, FINALE distance, wave-mutator
  announcement, transient notifications/EQUIPPED toasts) now renders as a compact
  centered stack beginning at **y=24**, directly beneath the unchanged 14 px
  compass strip (centered y=8). No travel/status text remains at the old mid-screen
  positions, and the crosshair/central view stays clear. `drawStatusStack()` keeps
  lines 12–14 px with 7 px gaps; interaction prompts stay at the bottom action bar.
- The main/optional objective stack below the minimap is now **right-aligned** to
  `W − 16`, sharing the minimap's right edge. Label, body and wrapped lines all
  right-align, the optional progress bar is right-centered, and the strike-through
  tracks each wrapped line's right-aligned span. Width stays capped at 300 px so
  long objectives never spread toward screen center. Hold/fade/collapse unchanged.
- Optional-objective world/HUD markers now appear only within a proximity band:
  **appear at 100 m, hide again past 110 m** (hysteresis prevents threshold
  flicker). Main-objective, route and waypoint markers are unchanged. Completed
  optional objectives never reappear, and per-target marker state is cleared on
  fresh runs, checkpoint/Continue restoration and chapter transitions.
- VITALS adds a Commander ability line in the squad's visual language:
  `[F] SURGE READY` or `[F] SURGE 21.3s`, driven by the existing `player.abilityCd`
  (canonical Surge Pulse on F). It sits after the three Commander stat rows with a
  small separation before ROOK. The panel grows 24 px to **264×296** (top edge
  `H − 312`); all three squad entries keep an 18 px gap between ability text and
  the next operator name. No ability system changed.

Validation: new `tests/hud-navigation.mjs` passes in headed Edge and headless
Firefox (status y=24, right alignment, optional 100/110 hysteresis with no
in-band flicker, transition clearing, SURGE READY→cooldown). Updated
`hud-refinement`, `objective-hud-flow` and `endless-hud` pass in both browsers,
including 1280×720/1366×768/1920×1080 layout/text-bound checks. Pure combat-state
and objective-state suites pass. Evidence: `_playtest/m41/navigation/`
(`01-compass-status-stack`, `02-objectives-right-aligned`,
`03-commander-ability`, `04-optional-far-hidden`, `05-optional-near-visible`,
`navigation-{edge,firefox}.json`).
