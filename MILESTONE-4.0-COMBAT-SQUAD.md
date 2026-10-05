# Milestone 4.0 — Combat, weapons & squad identity

## Phase A: baseline audit (before implementation)

Baseline `main`: `ef3ad59 fix: stabilize runtime movement and finalize landing cinematic`.
Branch: `milestone-4.0-combat-squad-identity`. Tracked baseline clean; earlier untracked
playtest artifacts preserved. Inspected the HTML, sole extracted module
`src/world/facility.js`, all seven existing browser harnesses, README, 3.9 report,
and facility architecture. No 4.1 work is in scope.

| Concern | Baseline ownership / data flow |
|---|---|
| Player weapons | HTML `PLAYER_WEAPONS`: BUL-117 rifle, CRW-8 scattergun, experimental ARC-9 chain attack and PX-4 explosive plasma. Q cycles four. All FPS models built once. |
| Ammo | Active `player.weapon`; inactive copies in `player.weaponStates`. Magazine rounds plus reserve **cartridges**, each cartridge replaces one magazine. Partial reload discards remaining rounds intentionally. |
| Fire/reload/switch | One fixed-tick `updateWeapon`, LMB → `fireWeapon`; reload timer on weapon, fire timer on player; pending weapon/index plus active index and copied weapon. Reload prevents switching; swap resolves halfway through animation. |
| HUD/input | Canvas HUD reads active weapon directly; no combat DOM. 1/2/3 reserved for squad commands; upgrade terminal also uses 1/2/3 in its modal context. |
| Shots/feedback | Fast pooled bolts with terrain and height-aware solid collision. Scatter emits eight bolts; ARC bypasses projectile collision and lacks proper wall checks. Existing muzzle/recoil/arms, impacts/sparks/hit marker and cached SFX. Pools grow on first use. |
| Saves | `cf_campaign_v1` profile; M1–M3 checkpoint and separate M4 continuation paths serialize active weapon and inactive cache. Restoration merges arbitrary saved weapon fields, including obsolete IDs. Chapter transitions retain player state and persistent world. |
| Campaign | Four canonical world snapshots define initial combat supplies and squad condition. New/Select resets actors; Continue applies checkpoint; seamless chapters do not reset magazines or rebuild world. M4 safety floor grants an emergency cartridge to an exhausted active weapon. |
| Resupply | V spends scrap to add one active-weapon cartridge; T shares one cartridge. M1 locker is one-use gear drops, M4 E cache is one-use +2 active cartridges. No proximity ammo refill loop. |
| Squad | ROOK heavy eight-pellet laser/Bulwark, VEX fast SMG/Medic Pulse, KADE precise long-range rifle/Designator. Acquisition every .3s with threat/ally/objective scoring and assignment penalty. Shared movement closes to 80% of max range; LOS every tick; engagement break/regroup and local separation/evasion already exist. |
| Endless | Menu → sound selection → start/reset, random existing arena, all three squadmates. Restart resets actors/upgrades/ammo in the same arena without rebuilding. Existing DNA/relay upgrades retained, not expanded. |
| Infested | Spawn-time focus on player/squad/objective; recent damage often forces player chase. Throttled LOS/last-seen navigation, nearby-cell separation, accepted 3.9 displacement-based stuck detection. Melee may damage player and a nearby squadmate in one attack; attack checks can conflate waypoint distance and victim distance. |

### Intended implementation

- Canonical **BUL-117 + CRW-8**, using existing models, audio and projectile behavior.
  Retire ARC/PX from selectable definitions and firing dispatch. Any retained
  presentation/effect helpers are explicitly dormant legacy assets, never availability.
- Narrow classic-script combat module (file:// compatible): permanent two-weapon
  records, one active ID, switch timer and fire timer. Cancel reload on selection
  without spending ammo; select/HUD immediately, short fire lockout; latest direct
  selection wins. No listeners or geometry creation on equip.
- Fixed Campaign starts: full magazines; rifle reserves 6/5/4/3 by M1–M4 snapshot,
  scatter reserves 3/3/2/2. Seamless chapters preserve both; safe checkpoint restore
  cancels transient actions and migrates old cache/active fields. Endless receives
  a sanitized immutable run configuration, fresh full magazines and four cartridges
  per weapon. Restart retains that configuration and resets supplies.
- Direct 1/2 weapon selection, Q cycle; 4/5/6 squad commands. Modal upgrade keys
  remain 1/2/3. Setup chooses starting weapon and squad posture, all three deployed.
- Preserve roles/abilities; add preferred ranges, priority weights, reaction and
  commitment windows, bounded lateral lanes/reposition and exact muzzle line-of-fire.
  Retain accepted formation arrival easing, navigation and collision.
- Minimal Infested attack correction: single committed victim, real victim range
  and fresh LOS; preserve existing roster/spawners/routes/stuck detection.
- Pre-size bounded shot/impact/spark pools during existing preparation; canvas-only
  low/empty/switch/reload and kill feedback. No lighting/world changes.

## Implementation and validation

**Implemented and validated for review. No commit, push or 4.1 work.** Automated
state/integration gates and all existing authoritative suites pass. Guided
rendered-browser gameplay and inspected captures are complete; human subjective
feel/listening and the normal desktop Firefox profile remain acceptance items.

### Canonical architecture and controls

`src/combat.js` loads as a classic script before the main module. Its frozen
definition list contains exactly two weapons. `playerCombat` owns two permanent
weapon records, `activeId`, one switch timer, one fire timer and a diagnostic
accepted-shot counter. `player.weapon`, `weaponIndex`, `swapT` and `swapDuration`
are **derived getters**, not independently writable copies. The old inactive
cache, pending weapon/index and redundant player reload flags are removed.

| Weapon | Role | Damage / cadence | Magazine / reload | Accuracy / reach |
|---|---|---|---|---|
| **1: BUL-117** | Precise sustained fire, distant threats | 22 per bolt, .095 s cadence | 50, 1.7 s | .012 base spread; existing 153 m projectile lifetime/range |
| **2: CRW-8** | Immediate close-range burst, spreading pressure | 8 × 13 pellets, .68 s cadence | 12 bursts, 2.05 s | .105 base spread; **34 m** projectile range; heavier recoil/muzzle response |

ADS retains the existing .4 spread multiplier; airborne fire is less accurate.
Both use existing fast bolts and height-aware collision, not a new hitscan or
shader path. Existing grenade equipment remains equipment, not a third gun.

- **1 / 2** select directly, **Q** cycles the two. **4 / 5 / 6** issue
  ASSIST / SPREAD / HOLD. Existing Z / X / Y abilities remain.
- Selection changes active identity/HUD/model visibility immediately. A **.32 s**
  readying interval prevents firing/reload. Repeated same-weapon selection is a
  no-op; during alternation the latest valid selection wins.
- Switching cancels the outgoing reload with **no magazine or reserve change**.
  The global shot cooldown continues through switches, preventing cadence bypass.
  Firing remains in the one existing fixed-tick update, with an additional
  consume-shot gate. No equip-time listeners, timers or model construction.
- Magazines and reserve cartridges belong to each permanent weapon record.
  Completion of reload consumes one cartridge and replaces the magazine;
  unfinished reload spends nothing. The accepted cartridge model still discards
  leftover rounds when a partial reload completes. Empty-trigger audio is
  throttled to .35 s. HUD shows selection, magazine/capacity, reserves, readying,
  reload percentage, orange low ammo and EMPTY. Player kills give a warm-colored
  hit confirmation; cached recoil, muzzle and reload-hand presentation remain.
- Existing Endless global damage/rate/spread upgrades now affect both owned
  weapons. Rifle-labelled magazine/rail upgrades explicitly affect BUL-117.
  POWER STORM buffs BUL-117 damage by 20% instead of the retired ARC; CORROSIVE
  RAIN buffs grenade blast by 50% instead of retired plasma. Existing progression
  is adapted, not expanded. ARC/PX presentation assets and attack/ejection helpers
  are quarantined and unreachable from equip/fire; retired model builders are
  never called. The active FPS model registry contains only rifle and scatter.

### Campaign configuration / resupply

Campaign always deploys ROOK, VEX, KADE and both canonical guns, initially BUL-117.
No Campaign loadout editor. New Campaign and standalone Mission Select use:

| Authored entry | Rifle | Scatter | Other combat supply |
|---|---|---|---|
| M1 | 50 + 6 cartridges | 12 + 3 cartridges | Existing M1 health/shields/gear/squad snapshot |
| M2 | 50 + 5 cartridges | 12 + 3 cartridges | Existing M2 snapshot |
| M3 | 50 + 4 cartridges | 12 + 2 cartridges | Existing M3 snapshot |
| M4 | 50 + 3 cartridges | 12 + 2 cartridges | Existing M4 snapshot |

Seamless M1→M2→M3→M4 retains active ID and **both** magazines/reserves; transient
reload/switch actions are cancelled. Existing M4 emergency safety logic now
grants one cartridge to each completely exhausted weapon, without refilling
magazines. This is an explicit authored M4 exception, not general chapter resupply.

V crafts one cartridge for the active gun at the existing scrap cost. T shares
one active-gun cartridge with a squadmate. The M1 locker retains its one-use gear
drops. The **one-use E-operated M4 cache** grants +2 cartridges to each gun,
capped at six, and retains its saved used flag. Remaining nearby does not refill.

Campaign resets movement speed, recovery timers and all existing player/squad
upgrade modifiers to authored values. Shared cap/crafting/damage/regeneration
helpers now check mode, preventing old Endless upgrades affecting Campaign.
Normal menu mode changes still use the accepted reload/world lifecycle.

### Endless configuration

The menu now enters ENDLESS DEPLOYMENT before sound selection. Native labelled
selects support mouse and keyboard; Back/re-enter preserves the edited controls.
Confirm creates one sanitized immutable configuration passed into `startEndless`:

```js
{ startingWeapon: 'rifle' | 'scatter', squadPosture: 'balanced' | 'escort' | 'screen' }
```

Both weapons are always available, each with a full magazine and four cartridges.
All three named squadmates deploy. Balanced uses normal formation/leash; Close
Escort scales assist formation offsets to .7 and combat leash to 28 m; Wide Screen
scales offsets to 1.4 and leash to 48 m (balanced 38 m). Explicit SPREAD/HOLD and
objective defense retain their existing command behavior. Menu controls are only
an uncommitted draft; gameplay reads the immutable run configuration, never DOM.
Death/result restart retains configuration and arena, resets both guns/squad/
upgrades/counters, and does not rebuild the arena. Campaign checkpoints contain
neither this configuration nor Endless modifiers.

### Squad identities and lightweight AI

Existing loadouts, health, accuracy, abilities and role assets are retained.

| Member | Preferred range / lane | Reaction / commitment / reacquire | Recognizable behavior |
|---|---|---|---|
| **ROOK** | 13 m / −2.5 m | .16 s / 1.1 s / .28 s | Heavy eight-pellet interception, strongest close-threat weight, faster reaction, less evasion (.35 chance), Bulwark |
| **VEX** | 22 m / +3 m | .22 s / 1.4 s / .34 s | Fast SMG cover for vulnerable allies (46 priority weight), more evasive (.8), Medic Pulse |
| **KADE** | 34 m / −4 m | .32 s / 1.8 s / .42 s | Precise rifle support, highest danger weighting (12), longer commitment, Target Designator |

Combat lanes are recomputed only every .45/.60/.75 s. Blocked or over-leash
guesses fall back to the existing formation spot. Low-health operators seek a
slightly longer range. Navigation remains the accepted waypoint/collision system;
3.9 formation arrival easing, separation and aim-facing ownership are preserved.
Target commitments expire or invalidate on death/occlusion/range, not an expensive
new search framework. Exact muzzle-to-target solid checks and existing terrain
LOS authorize actual shots; blocked shots consume no ammunition. Last-seen
pursuit is bounded to 2.5 s and the player tether. Tactical ENGAGE no longer
persists simply because distant hostiles exist or an old engagement reference
remains. Squad commands are saved/restored alongside condition/ammo/position;
reload is safely cancelled at restore. All three slots remain stable.

### Minimal Infested / encounter pass

Spawn-assigned focus now remains the victim for approach and attack instead of
nearby-player aggro overriding a squad focus each tick (ambient player aggro
remains intentional). Invalid/downed victims fall back to player. A strike uses
the **real victim distance**, not a navigation waypoint/last-seen distance, and
fresh LOS. Melee damages one victim, removing the old simultaneous player +
nearby-squad hit. Existing ranged attacks, roster, spawn budgets, cell separation,
door pursuit and the accepted displacement-based stuck fix remain. No new roster,
boss, pathfinding framework or Campaign rewrite.

### Persistence and migration

The profile key/schema `cf_campaign_v1` is retained. Both M1–M3 checkpoints and
the M4 continuation payload now embed:

```js
player.combat = { version: 2, activeId, weapons: {
  rifle: { mag, reserve }, scatter: { mag, reserve }
} }
```

No transient reload/switch/fire state is saved. Restoration uses authored
definitions and finite bounded ammunition. Legacy `player.weapon` plus
`weaponStates` are read at the boundary; known gun ammo is preserved, missing
inactive guns use the authored entry supply, retired ARC/PX IDs fall back to
BUL-117, and arbitrary old damage/capacity/ID fields cannot overwrite definitions.
Legacy mission/route migrations and the rest of the checkpoint remain intact.
Pure tests cover retired IDs and invalid ammo; browser tests restore both active
guns and 17/50 + 6/12 magazines for **all four missions** through actual reloads.

### Performance findings

Existing preparation preallocates **192 reusable shot records/pairs, 41 impacts
and 160 sparks**. Reuse updates existing materials/transforms; caps bound effect
pressure. No new lights or postprocessing. Retired gun models are no longer built.
The profiler originally counts first scene/group attachment as resource creation;
prepared pool entries are now registered during preparation so first reuse is
not incorrectly attributed as shot-time construction. Assertions were retained.
Prepared resource totals are independently asserted constant during real firing.

Final sequential 1280×720 regression samples, Edge 154 / headless Firefox 155:

| Sample | Edge p95 / worst ms | Firefox p95 / worst ms |
|---|---|---|
| M1 exterior | 33.5 / 50.0 | 50.0 / 83.4 |
| M2 Alpha | 16.8 / 33.4 | 33.4 / 50.0 |
| M2 Beta | 17.0 / 17.4 | 16.7 / 33.3 |
| M2 Gamma | 16.9 / 33.4 | 33.3 / 50.0 |
| M2 front return | 33.4 / 50.0 | 33.4 / 50.0 |
| Facility interior | 33.4 / 33.5 | 50.0 / 66.7 |
| M4 service/exit | 16.8 / 17.1 | 33.3 / 50.0 |
| Campaign combat | 33.4 / 50.0 | 50.0 / 66.7 |
| Endless early combat | 16.9 / 33.5 | 33.3 / 50.0 |
| Endless later combat | 17.0 / 17.5 | 16.7 / 33.4 |

All ten samples in each browser had zero shader links and world/facility/static
grid rebuilds. Quiet traversal had zero resource additions/uploads. Prepared
Campaign combat had zero material/geometry additions. Early Endless still creates
existing enemy templates/actor resources (15 / 11 observed materials), rather
than per-shot gun materials; this is not a claim that every enemy is pooled.
The isolated two-gun fight independently passed zero material/geometry/shader/
world/facility/grid assertions: final headed Edge p95/worst **16.9/33.4 ms**;
final Firefox guided sample **66.7/83.3 ms**. Scheduling/random/diagnostic overhead
varies; these are not controlled desktop FPS or universal performance claims.

The unchanged fast A–E spatial sweep still has tail intervals: Edge worst
**133.4 ms**, Firefox **216.7 ms** (1 / 4 intervals >100 ms), with zero links,
builds, resource creation/disposal. Both keep **8 light slots, 23 programs, 306
solids, 28 map segments**. This is a high-speed debug stress sweep, not ordinary
walking. Short combat/traversal samples do not certify long-duration GC or every
previously reported Firefox hitch. No recurring new shader/rebuild stall was found.

### Automated validation

| Suite | Edge | Firefox |
|---|---|---|
| `combat-state.mjs` (Node) | Pass, shared pure state suite | Same |
| `combat-squad.mjs` | Pass | Pass (headless) |
| `combat-playtest.mjs` | Pass (headed) | Pass (headless) |
| `intro-smoke.mjs` | Pass | Pass |
| `m2-progression.mjs` | Pass | Pass |
| `runtime-stability.mjs --campaign` | Pass | Pass |
| `traversal-performance.mjs` | Pass | Pass |
| `facility-regression.mjs` | Pass | Pass |
| `facility-playthrough.mjs` | Pass | Pass |
| `transition-diagnose.mjs` | Pass | Pass |

Final full runner: `regressions/results-edge-firefox.json`, all **14** existing
browser suite executions successful. No existing assertion was weakened.
`CF_ARTIFACT_DIR` was added to the two historical capture-producing tests so these
runs preserve tracked 3.9 evidence. New coverage checks direct selection,
independent ammo, repeated/rapid switching, cooldown gating, reload then switch,
switch then reload, empty state, no new input registrations, legacy migration,
eight mission/active-gun checkpoint combinations, squad priority differentiation,
live shooting/finite bounded state/follow→engage→regroup, wall occlusion, single
victim melee, UI draft retention/keyboard selection, paid ammo craft, configured
restart and Campaign isolation including damage/capacity/movement speed.

The accepted intro black fade and hold remain **1.25 + 1.25 s**, with five cuts
and original final-approach offsets. Landing audio reached its real 4.318948 s
`ended` event in both browsers. Slow-target FOLLOW recorded zero stop/go toggles;
flat pursuit recorded zero false-stuck/lateral ticks. Full W-key M2 front return,
all-three squad reformation, bidirectional pursuit and M4 door traversal pass.
Accelerated Campaign reaches its final extraction/result with original counters.

### Browser gameplay / visual review

Performed an additional **headed Edge** guided rendered-browser session and the
same real-input gameplay pass in headless Firefox. Inspected primary captures.

- Campaign: both guns, firing + rapid 1/2, interrupted reload, doorway movement
  while squad fights, immediate post-combat chapter boundaries, all four mission
  combat contexts, real E security override, one-use M4 resupply with a subsequent
  proximity wait, and **Continue through the actual menu after checkpoint/reload**.
- Endless: mouse setup for CRW-8 + Wide Screen; separate integration test checks
  keyboard Close Escort and Back/re-enter. Actual configured deployment, firing/
  switching while moving, a bounded dense contact fixture, differentiated squad
  fire, paid V resupply, actual Infested death and result-key restart. Restart has
  full fresh guns, wave zero, three squadmates and original selected configuration.
- Console/page-error watches remained clean in final gameplay/integration passes;
  expected file:// audio-XHR fallback diagnostics are explicitly distinguished.
- Fixtures use setup teleports, invulnerability/high-health prepared contacts and
  accelerated mission completion hooks; movement/fire/reload/E/menu/restart input
  is real. Authoritative Campaign tests separately walk the actual progression.
  These are **guided browser playtests**, not full-duration unassisted human runs
  or a subjective listening/mouse-feel certification.

Headed Playwright Firefox native click delivery timed out while the page remained
responsive. A bounded startup probe reproduced the same failure on accepted
`ef3ad59` and current code, both rendering at ~16.7 ms p95 after initial prep.
Headless real-input suites pass. No game input semantics were changed to mask
that environment limitation. The debug renderer getter is now safe while async
initialization is incomplete. Diagnostics are saved in
`firefox-startup-{baseline,current}.json`. Human play in normal desktop Firefox,
perceptual audio/recoil/mouse feel and a longer Endless soak remain review gates.

### Evidence and reproduction

Primary gallery: `_playtest/m40/evidence/` (eight selected Edge PNGs; Firefox
mirrors are cross-browser supplementary evidence):

1. `01-weapon1-campaign-edge.png` — BUL-117, depleted rifle magazine, Campaign contact.
2. `02-weapon2-campaign-edge.png` — CRW-8 active in the same combat context.
3. `03-combat-hud-reload-edge.png` — ammo/reserves and reload progress.
4. `04-squad-doorway-combat-edge.png` — three live shooters at different positions,
   unlocked Containment threshold, enemy pressure; backed by the all-three-shoot assertion.
5. `05-endless-setup-edge.png` — CRW-8 + Wide Screen setup.
6. `06-endless-selected-deployment-edge.png` — starting scattergun, three deployed operators.
7. `07-infested-pressure-edge.png` — close Infested pressure and scattergun HUD.
8. `08-endless-squad-combat-edge.png` — active Endless squad combat after switching stress.

`playtest-{edge,firefox}.json` records scenarios, ammo, squad, isolated combat
counters/pool totals, console results and configured restart. Root
`combat-squad-{edge,firefox}.json` contains focused checkpoint/role/mode assertions.
`regressions/` contains logs, final result manifest, profiler recordings/summaries
and accelerated Campaign terminal/containment/result captures. Previous milestone
artifacts are preserved.

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
node tests/combat-state.mjs
node tests/combat-squad.mjs
node tests/combat-squad.mjs firefox
node tests/m40-regressions.mjs
node tests/combat-playtest.mjs
node tests/combat-playtest.mjs firefox
# For bounded accepted/current Firefox startup comparison:
node tests/browser-startup-diagnose.mjs --headed --baseline
node tests/browser-startup-diagnose.mjs --headed
```

### Review limitations / deliberately deferred

- Human full-length Campaign balance and normal-profile Firefox feel/listening
  remain manual acceptance, with guided/accelerated coverage clearly identified.
- Short performance traces do not replace a multi-hour Endless soak or eliminate
  baseline high-speed sweep/driver/scheduling tails.
- Existing enemy first-use templates and electrical/grenade effects are retained;
  this is not a global actor/resource-pooling rewrite.
- Squad lane selection is lightweight and can fall back behind cover; no cover
  planner, global navmesh, new micromanagement or individual deployment/removal UI.
- Reserve cartridges retain accepted partial-reload round discard. Legacy retired
  experimental weapon ammo has no equivalent canonical gun and is not converted.
- Campaign balance remains authored; no inventory/loot, new progression, new
  enemy roster, chapter, third gun, facility/terrain or lighting redesign.

**Milestone 4.1 has not begun.** The implementation is left uncommitted for review.

### Changed files / final Git review

Modified: `chargefront.html`, `README.md`, `FACILITY-ARCHITECTURE.md`,
`tests/runtime-stability.mjs`, `tests/traversal-performance.mjs`.

New: `src/combat.js`, this report, `tests/combat-state.mjs`,
`tests/combat-squad.mjs`, `tests/combat-playtest.mjs`,
`tests/browser-startup-diagnose.mjs`, `tests/m40-regressions.mjs`, plus generated
evidence/logs under `_playtest/m40/`. `src/world/facility.js` is unmodified.

Final `git diff --check`: pass (only repository line-ending normalization notices).
Tracked-file `git diff --stat` (untracked additions are listed separately above):

```text
 FACILITY-ARCHITECTURE.md        |  15 ++
 README.md                       |  24 +--
 chargefront.html                | 424 +++++++++++++++++++++-------------------
 tests/runtime-stability.mjs     |  13 +-
 tests/traversal-performance.mjs |   7 +-
 5 files changed, 267 insertions(+), 216 deletions(-)
```

`git status`: on `milestone-4.0-combat-squad-identity`; the five modified tracked
files are unstaged, the seven new source/test/doc files and `_playtest/m40/` are
untracked, and earlier untracked 3.8/3.9 archives/recordings remain as found.
Nothing staged, committed or pushed.
