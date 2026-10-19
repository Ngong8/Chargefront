# Milestone 4.3 — CP1 Tactical AI / CP2 Campaign Combat

> Packaging update: see the [consolidated implementation snapshot](_playtest/m43/implementation-snapshot/README.md)
> for the subsequently authorized local commit scope and curated evidence. The
> stop/uncommitted statements below describe their original historical handoffs.

> **Current handoff: CP2-R corrections implemented and verified; awaiting manual
> acceptance.** The corrective section below supersedes the original Campaign
> resource values and the shared no-contact fallback. Prior CP1/CP2 implementation,
> diagnostics and evidence remain preserved. Full Endless economy CP3 has not begun.

**IMPLEMENTED AND VERIFIED — STOP AFTER CP2 FOR MANUAL ACCEPTANCE.**
Review index: [`_playtest/m43/cp1-cp2/INDEX.html`](_playtest/m43/cp1-cp2/INDEX.html).
CP3 resource balancing has not begun. All pre-existing CP0-R work is retained.

## Safety and inspected baseline

- Actual branch `milestone-4.3`, HEAD `8223bcd4afe4e1ed90f996ec852837bf36d6ae0e`.
  Contrary to the starting prompt, CP0-R is **present but uncommitted**. The user
  explicitly chose **Use current tree** after this mismatch was reported. Continue
  from that accepted working tree, preserving all CP0-R files, prior tests/evidence
  and the existing GitHub Desktop stash. Index initially empty; no reset/clean,
  staging, commit, merge or push. No workspace AGENTS.md found.
- Read CP0-R's final amendment, 4.2 CP4 acceptance/terrain constraints and the 4.2
  CP3-E security seal/turret integration record. Current canonical world has 301
  solids, 28 map segments, six doors, 32 permanent luminaires/eight budget slots.
- Inspected `Infested`, shared LOS/collision/terrain queries, M2 facility bypass,
  squad targeting/formation/abilities, spawn/Director ownership, M1–M4 states,
  sample lockdown and extraction, turret rig/acquisition/firing and save restores.
  Existing result screens and persisted Endless gate remain the accepted baseline.

## Plan before behavioural edits

1. Capture controlled runtime perception, lost-contact, blocked-ranged movement,
   assigned-target and first-hit observations. Measure normal-speed shared-AI
   cost on fixed arena/actor fixtures, retaining source hashes and renderer data.
2. Implement staggered perception, visible-candidate acquisition/retention,
   bounded last-seen search and consistent assigned objective/actor ownership.
   Avoid consulting a moving hidden victim as a navigation destination.
3. Reuse actual solids/terrain/doors for a bounded persistent local detour; avoid
   per-frame global pathfinding or geometry/nav reconstruction. Preserve M2's
   existing front/bypass routing and every sealed-door restriction.
4. Differentiate existing ranged/assault/support roles with engagement decisions,
   obstruction recovery and readable wind-ups. Keep base HP/damage/speed, Runner
   fuse/blast rules, spawn budgets and resource balance unchanged.
5. Reproduce the turret independently in M3 and carried/standalone M4. Inspect
   activation, hostility, 42 m range, pivot and muzzle LOS, cooldown and actual HP
   changes. Fix only a demonstrated defect; do not enable an unearned standalone
   turret or extend its role/range to the extraction zone.
6. Verify normal-speed 90-second drone defence/transfer/east evacuation, targeted
   AI runtime cases, Campaign progression/results/Endless gate regressions and
   matched before/after performance. Stop after CP2 for manual acceptance.

## Source-proven limitations to reproduce

- Constructor assigns `target`, then unconditionally sets `focus=player`.
- Ambient alert uses proximity alone; the LOS flag initially starts true.
- Last-seen arrival clears memory and immediately resumes live hidden-target
  steering. The existing ground-level LOS also ignores flyer/target eye heights.
- Ranged stopping uses distance to a navigation waypoint rather than confirmed
  firing opportunity. Obstruction can leave actors stationary in their range band.
- Stuck steering randomly changes side after .7 s; no remembered obstacle corner.
- First melee strike can occur immediately; its visual pose follows damage.
- Tunneler relocation samples around the live player independent of target/LOS;
  support healing ignores walls. These need fair role-specific restrictions.
- The laboratory turret already has accepted active-state carry/restore,
  bounded .12 s scans, 22 raw hitscan damage / .72 s cooldown / 42 m range,
  3D obstruction checks and actual-shot diagnostics. A new defect is not assumed.

## CP3 economy ledger — inspection only, no rebalance

`src/progression.js` scrap chance / inclusive bundle range:

| Archetype | Chance | Bundle |
|---|---:|---:|
| Skitter, Runner | .32 | 2–3 |
| Spitter, Screecher, Drone | .45 | 3–4 |
| Shielded | .50 | 3–5 |
| Tunneler | .60 | 4–5 |
| Support | .55 | 4–5 |
| Brute | .65 | 4–6 |
| Artillery | .65 | 4–6 |
| Carrier | .70 | 5–6 |
| Boss | 1.00 | 10–14 |

`Infested.die()` also gates power/grenade rolls behind a shared .32 roll:
power base .08 conditional (**2.56% unconditional**), plus Endless cell upgrades
and corrosive .22 conditional; grenade .06 conditional (**1.92% unconditional**).
Cell Refinery's +.08 therefore yields **5.12%**, corrosive alone **9.60%**, and
both together **12.16%** unconditional power-cell chance, before other changes.
Endless DNA has its independent .14 roll. Kamikaze detonations and hostile-on-
hostile deaths also call `die()` and reward drops; administrative destroy does not.
Carrier deaths can release three more reward-bearing Skitters. The 160-pickup
cap affects visible/retained drops. All of this remains unchanged in CP1/CP2.

Economy dependencies to evaluate together in CP3: base medkit 6 scrap, cartridge
4 scrap, grenade 1 power cell; Ammo Forge (3 scrap), Auto-Craft Matrix (4/2 scrap),
reserve/medkit/grenade capacity upgrades, Supply Drop on wave clear, mutator
rewards, corrosive/cell-chance upgrades, DNA milestones and scrap bonus, Twin
Barrels' duplicated shots (not duplicated pickups), pickup vacuum, restart resets
and exact wave-start/intermission saves.
Campaign authored supplies/reserves and optional locker/cache rewards are separate
from random death drops. Improved AI can change kill rate and pickup opportunity;
do not infer an economy fix from combat-pressure changes alone.

## CP1 implementation and gameplay rationale

Production ownership remains in the existing HTML coordinator and `Infested`
class. `src/enemy-tactics.js` is a small classic-script pure policy module, like
the existing combat/progression helpers; it owns no actors, world, damage or saves.

| Change | Runtime behaviour / rationale |
|---|---|
| Correct assigned focus | Constructor honours its target argument. Explicit objective/faction targets remain assigned; the older generic spawner no longer randomly overwrites a non-player target with a squadmate. Visible squad targets can be retained; downed/dead/destroyed targets release focus. |
| Staggered perception | Roughly .30–.40 s per actor, at most four human candidates; scripted objective/faction focus queries one target. Ambient acquisition is 26 m; alerted/scripted human perception is bounded at 95 m. A visible target gets a 1.2 s commitment; a substantially closer visible threat can win after commitment. No whole-enemy scan every frame for targeting. |
| Real eye-height LOS | Uses actual enemy/target height, 3D slab intersection, disabled-door state, and terrain samples. Initially unseen, un-emerged or descending targets are not treated as automatically visible. Cold ground actors initialize their elevation before the first sight query. A known relay's own body is not misclassified as an occluding wall at its endpoint. |
| Bounded knowledge | Visible positions are remembered for 5 s, then a 3 s local search uses .9 s steps. Reaching that point does not switch to the moving hidden actor's live position. Non-ambient actors may investigate their initial spawn order/location, but it is a snapshot, not an updated hidden-position feed. Ambient enemies do not acquire through a wall just because the player is near. |
| Engagement decisions | Distance to a path waypoint no longer masquerades as firing range. Blocked ranged actors investigate/reposition. Skitters take short flanks; Shielded/Brute/Carrier advance frontally; Spitters withdraw to stand-off; Drones strafe and Screechers orbit within their bands; Artillery holds longer range. Offset destinations inside solids fall back or use the other side. |
| Persistent local navigation | .55–.70 s planning cadence; at most 12 blockers / 48 corner candidates plus five short escape probes. An eight-corner, time-bounded history reduces reversals. Terrain step limits, existing circle clearance, world bounds and door solids remain authoritative. Overhead lintels block shots/vision but are correctly excluded from ground path clearance, matching the existing movement solver. No navmesh, global per-frame A* or environment reconstruction. |
| Fair attacks | .3 s acquisition response, followed by an existing-model body/ring wind-up: .28 s Skitter/Drone, .38 s Shielded, .4 s Spitter/Screecher, .55 s Carrier, .65 s Brute/Artillery, .75 s Harvester. Range/LOS/target loss cancels commitment; stun cancels and requires recovery. A fresh 3D check authorizes execution. No catch-up burst after a delay. Ranged actors can execute a valid attack while repositioning rather than becoming inert. |
| Preserve kamikaze identity | Runner/Tunneler retain the accepted stationary two-second fuse, beeps, single blast and existing raw radii/damage. Burrowing requires observed contact, a clear existing movement connection and at least 10 m from living operators at re-emergence; it cannot jump a sealed portal toward an unseen Commander. |
| Support role | Retains 20 HP / 2.2 s repair and existing retreat preference; repair cannot pass through a wall. Tests show a blocked ally stays at 10 HP and an unobstructed ally reaches 30 HP. No increased healing/stat budget. |

Base HP, speed, damage, shields, attack cooldown definitions and Endless stat
scaling are unchanged. No extra enemies, models or missions were added. Perception
and planning counters in `__cf.enemyTacticalInfo()` are read-only diagnostics.

## CP2 confirmed refinements

### Campaign initialization, pursuit and objective ownership

- Fixed the target-argument/focus mismatch shared by authored indoor spawns,
  relay/escort orders and faction encounters. The existing explicitly paired
  laboratory Drone/creature conflict retains its intended target ownership.
- Reused the existing Hall front/bypass anchors for **outdoor hostile entry in
  every Campaign chapter**, not just the old M2-only helper. The Hall still has
  one exterior entrance. No shortcut through its east wall was invented, and the
  squad's existing routing was not rewritten.
- A baseline Drone at `(398,638)` with the Commander at `(376,638)` was stationary
  behind the Hall wall. It now walks around to the front and physically enters.
  Runtime tests also reach engagement up Beta/down Gamma and around an existing
  Power Wing generator without embedding or changing a collider.
- No mission objective, relay budget, spawn composition, defence duration,
  checkpoint dependency, scripted seal or extraction requirement was changed.

### Confirmed mortar-cover defect

Independent actual-projectile reproduction against preserved pre-CP1 HTML:
an Artillery mortar was launched with clear sight, a wall then intervened, and
the Commander behind it still lost HP **100 → 89.704**. The cause was radial
`explodeEnemyShot` damage checking distance without cover, with the impact
position already integrated into the blocking volume.

Mortar impacts now remain on the incoming side of a collided solid, and splash
authorization checks the line to each victim against the existing geometry.
The same protected scenario stays at **100 HP** in both browsers; an open blast
still reduces HP to approximately **86.896**. Raw24 damage, radius5.5, projectile
speed17 and crafting/drop balance are unchanged. The regression uses an explicit
isolated collision fixture, not a production facility modification.

## Mission 4 turret — diagnosis and disposition

**No new in-role firing failure was reproduced in the accepted starting source.**
This is not presented as a newly fixed gun: the 4.2 CP3-E record already fixed the
historical emergency-only firing condition, inverse/head-only aim and missing
beam feedback. That implementation is present in this working tree.

Independent baseline and current tests trace the full lifecycle:

1. Optional security-console activation through real E input sets the friendly
   laboratory turret active, before emergency/defence. It is not a separate M4
   emplacement at the extraction LZ.
2. Activation carries through the actual M3 defence/transfer → M4 transition and
   relevant cold Continue restores. M4's north portal seals normally; the turret
   remains inside Containment and keeps its original field of fire.
3. Candidates come only from the hostile `enemies` collection, excluding dead,
   dying and un-emerged actors. Squad/Survey Drone objects are not candidates.
4. Original **42 m horizontal range**, pivot LOS, aimed muzzle LOS, **.12 s scan**,
   **.72 s cooldown**, direct **22 raw damage** and existing marked-target bonus
   remain intact. Live hits are **1000 → 978 → 948.3 HP**, with a real beam and
   matching damage events, both before emergency and in carried M4.
5. The M4 contact at `(399,751)` is **57.428 m** away and correctly remains at
   1000 HP. A northern target behind the sealed structure is occluded. With only
   friendly operators present, no shot or friendly damage occurs.
6. Fresh standalone M4 has no earned M3 optional restoration, so its turret is
   intentionally inactive. Auto-enabling it would change its accepted role.

Added bounded diagnostic reasons (`inactive`, `no-hostile`, `out-of-range`,
`occluded`, `muzzle-blocked`, `tracking`, `cooldown`, `fired`) and eligible/rejected
scan counts through `__cf.labTurretInfo()`. Acquisition/damage/activation rules
were not relaxed to make it fire. One-time construction, aim rig, meshes, lights,
range and damage remain accepted. If the user's earlier symptom involved a
restored, in-range, unobstructed hostile, that specific case remains unreproduced
and is a manual-review item; current evidence does not justify a speculative fix.

## Preservation and normal-speed evidence

`sample-lockdown-live.mjs`, turret enabled, passes **both browsers at normal
simulation speed**: full 90-second Drone-only operation, visible DNA payload and
permanent glass at 15/30/45/60/75/89 s, 3.5-second transfer, squad shots/ammunition
use, Safe Staged Seal and real W-key east evacuation into M4 pursuit. Recorded
wall durations for the live segment are **97.463 s Edge / 96.328 s Firefox**,
including transfer and capture/observation overhead. Actual implementation names
this defence `M3_STABILIZE`; it precedes seamless M4 entry. It was not moved to a
different mission to match terminology.

These are normal-speed controlled playtests, not unassisted survival: setup
relocations and an invulnerable Commander keep the operation observable. Turret,
squad and enemy updates/attacks remain real; no time scale or defence shortcut is
used in that test. Separate accelerated tests exercise save/phase boundaries.

Byte/hash comparisons against the preserved accepted working-tree source confirm:

- `src/world/facility.js`, `src/progression.js` and `src/combat.js` unchanged.
- Campaign definitions, persisted Endless-gate code, result renderer/navigation,
  timed defence/extraction state machine and death-drop roll block unchanged.
- Fixed Campaign weapons, 301 canonical solids, 28 map segments, six doors,
  persistent32 fixtures/eight budget slots, .78 exposure and accepted legacy
  security-portal recovery remain supported. Existing disabled ship-hull history
  records from in-memory checkpoint restore remain the old qualification.

CP0-R runtime regression also passes: **18:30 / 48 / 14 / 10**, optional counts
**2,1,1,0**, failure/retry/Continue, standalone chains, result layout/navigation,
20 Campaign-gate scenarios per browser, retained unlock on reload/New Game and
Campaign/Endless save isolation. No direct Endless action reappears in results.

## Tests and exact final results

Joined receipt: [`verified/summary.json`](_playtest/m43/cp1-cp2/verified/summary.json).
It validates **34 successful browser-suite executions**, empty reported error
arrays for direct suites, final-source hashes and unchanged protected modules.

| Suite | Edge | Firefox | Receipt under `_playtest/m43/cp1-cp2/` |
|---|---|---|---|
| New `tactical-ai.mjs` | PASS | PASS | `tactics-final/{browser}/tactical-ai.json`; 15 runtime observations, recorded paths and actual role movements/projectiles |
| New `campaign-tactics.mjs` | PASS | PASS | `campaign-01/{browser}/campaign-tactics.json`; 9 turret/Campaign observations |
| New `enemy-cover.mjs` | PASS | PASS | `mortar-final/edge/cover.json`, `mortar-firefox-verified/firefox/cover.json`; blocked and open actual mortar damage |
| New `tactical-performance.mjs` | PASS | PASS | `performance-01/{browser}/performance.json`; paired accepted/current protocols |
| Existing `facility-e0.mjs` | PASS | PASS | `facility-e0/{browser}/manifest.json`; activation, cooldown, seal/recovery and native Continue |
| Existing `sample-lockdown-live.mjs` | PASS | PASS | `live-defence/live-{browser}/manifest.json`; unaccelerated operation/exit |
| Existing `m2-progression`, `facility-playthrough`, `transition-diagnose` | 3 PASS | 3 PASS | `regression-progression/results-edge-firefox.json` and per-suite logs |
| Existing `traversal-performance`, `runner-kamikaze`, `combat-squad`, `combat-playtest`, `endless-hud`, `additional-refinement` | 6 PASS | 6 PASS | `regression-edge/results-edge.json`, `regression-firefox/results-firefox.json` and logs |
| Existing CP0-R `results-flow.mjs` | PASS | PASS | `results-compatibility/{browser}/results.json`; 15 viewport cases per browser |
| Existing CP0-R `endless-unlock.mjs` | PASS | PASS | `unlock-compatibility/{browser}/unlock.json`; 20 gate/navigation scenarios each |

**Eight Node suites PASS:** new `enemy-tactics-state` and existing `results-state`,
`progression-state`, `combat-state`, `objective-hud-state`, `relay-routing-state`,
`environment-placement-state`, `campaign-terrain-state`. New policy tests include
realistic visibility/retention decisions, blocked engagement, bounded corner
probes and unchanged base stats. With `CF_AI_BASELINE` they also compare protected
accepted source sections. These supplement, not replace, the runtime tests.
HTML module/new source/new test syntax checks and `git diff --check` PASS.

## Matched performance comparison

Same browser, 1280×720, Crater, seed **430012**, 18 identical initial archetypes
and positions. Fresh isolated contexts load preserved pre-CP1 HTML or current
HTML; only the baseline evidence copy's asset base URL is adjusted. Arena/seed
are injected **after** reload and asserted. Both use the same timed prototype
update wrapper and eight-second sample. Stationary policy isolates decision cost;
normal-speed combat allows intended trajectory/attack differences after warm-up.

| Browser / protocol | p95 frame ms before → after | Worst ms before → after | Enemy update ms/actor before → after | Added projected CPU for18 actors/tick |
|---|---:|---:|---:|---:|
| Edge stationary policy |16.8 →16.8|17.7 →33.4|.0162 →.0213|+.091 ms|
| Firefox stationary policy |50 →50|83.3 →66.7|.0103 →.0132|+.053 ms|
| Edge live combat |49.9 →33.5|67.1 →83.3|.0118 →.0226|+.194 ms|
| Firefox live combat |83.3 →50|133.3 →66.7|.0133 →.0152|+.033 ms|

Every measured run: **zero shader links, world/facility/nav-grid rebuilds**;
stationary runs also have zero geometry/material creation. Combat keeps existing
dynamic projectile/impact/pool allocations (for example Edge geometries75→60);
different fire/trajectory workloads are intentional, not a pure renderer benchmark.
No FPS improvement is claimed. The isolated higher Edge worst frame is retained,
not explained away or attributed to a specific subsystem without evidence.
Firefox timer precision, GPU scheduling, warm caches and short windows limit the
comparison. Normal-profile/high-refresh acceptance and long late-wave soaks remain
manual/future verification.

## Reproduction and investigation ledger

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
$env:CF_AI_BASELINE='_playtest/m43/cp1-cp2/before-fixed'
node tests/enemy-tactics-state.mjs
# Use fresh output roots: direct suites refuse to overwrite evidence.
$env:CF_ARTIFACT_DIR='_playtest/m43/cp1-cp2/review-tactics'
node tests/tactical-ai.mjs
node tests/tactical-ai.mjs firefox
$env:CF_ARTIFACT_DIR='_playtest/m43/cp1-cp2/review-campaign'
node tests/campaign-tactics.mjs
node tests/campaign-tactics.mjs firefox
$env:CF_ARTIFACT_DIR='_playtest/m43/cp1-cp2/review-cover'
node tests/enemy-cover.mjs
node tests/enemy-cover.mjs firefox
$env:CF_ARTIFACT_DIR='_playtest/m43/cp1-cp2/review-performance'
node tests/tactical-performance.mjs
node tests/tactical-performance.mjs firefox
$env:CF_ARTIFACT_DIR='_playtest/m43/cp1-cp2/review-live'
$env:CF_ENABLE_LAB_TURRET='1'
node tests/sample-lockdown-live.mjs
node tests/sample-lockdown-live.mjs firefox
git diff --check
```

Preserved diagnostic/failure provenance:

- `before/`, `before-fixed/`: accepted-source archives and observations prove
  constructor focus mismatch, wall-blind ambient alert, hidden-target fallback,
  stationary ranged actor and damage in100 ms. Preliminary arena forcing was
  overwritten by the old intermission `beforeunload` save; those raw timing rows
  are **not** the matched performance receipt. The final paired harness restores
  after reload and asserts the actual seed/arena for every run.
- `tactics-01`–`tactics-07`: parser typo in a first harness attempt; teleported
  target fixture elevation correction; then real new-planner failures involving
  early corner arrival, adjacent-corner oscillation, lintels mistakenly treated
  as ground blockers and a flank offset entering a wall. Fixes respect existing
  geometry, use precise waypoint arrival/history and reject invalid offsets.
  No test forced an accepted door open or changed an objective to pass.
- `tactics-08`: both browsers PASS before adding explicit Beta/Gamma movement
  assertions; `tactics-final` includes those additional terrain observations.
- `mortar-before/edge/cover.json`: the accepted-source through-wall damage
  reproduction. Earlier `mortar-after` validates protection; final receipts also
  prove open damage. One Firefox final attempt timed out during startup without
  a page error; the cause is unassigned. Its retained receipt is not a success;
  the bounded retry in `mortar-firefox-verified` PASSes all assertions.
- `after-probe/`: intermediate observational run, not the final AI/performance
  acceptance receipt. Use `verified/summary.json` to locate all final results.

## Files changed for CP1/CP2

| File | Change |
|---|---|
| `chargefront.html` | Enemy perception/knowledge/navigation/attack commitment, assigned-focus/spawner correction, mortar cover authorization and read-only AI/turret diagnostics; load the pure policy module. |
| `src/enemy-tactics.js` (new) | Bounded pure target, role-engagement and detour policies. |
| `tests/enemy-tactics-state.mjs` (new) | Pure policy, syntax, tuning and optional accepted-source preservation checks. |
| `tests/tactical-ai.mjs` (new) | Normal-speed perception, focus, search, terrain/door/generator navigation, role, support, projectile and fairness observations. |
| `tests/campaign-tactics.mjs` (new) | Native activation, carried/standalone/continued M4 turret diagnosis and Campaign/result/gate integration. |
| `tests/enemy-cover.mjs` (new) | Actual before/after mortar-cover and open-damage reproduction. |
| `tests/tactical-performance.mjs` (new) | Matched accepted/current policy and combat performance. |
| `README.md`, this report | Current ownership, review link, investigation/results and CP3 handoff. |
| `_playtest/m43/cp1-cp2/` | Preserved sources, scratch baseline/summarizer, screenshots, receipts, logs and review index. |

Existing suites were run without editing their assertions. Other dirty/untracked
files listed by Git belong to the already accepted CP0-R baseline or earlier
evidence and remain preserved; they are not relabelled as CP1/CP2 changes.

## Limits, manual acceptance and CP3 recommendations

- The specific reported M4 turret failure is not reproduced within intended
  activation/range/LOS conditions. Review the carried firing evidence and the
  legitimate inactive/out-of-range/occluded cases before deciding more is needed.
- Navigation is a bounded local planner with known gateways, not a complete
  world navmesh. Arbitrary maze/scatter combinations and every seed are not
  certified. A permanently sealed doorway is deliberately impassable; its actor
  may search/guard instead of magically reaching an unreachable target.
- Perception remains lightweight omnidirectional LOS, not a new sound-propagation
  or directional-FOV simulation. Initial authored spawn orders can include a
  location snapshot. Saved transient perception history is not a new save schema.
- Review wind-up feel and close-range cue readability in the normal browser.
  The accepted emissive close-up Skitter can fill the view; no model/material
  redesign was used to make a screenshot look different. Normal-speed fixtures
  are not a full unassisted Campaign/late-Endless difficulty certification.
- Existing cold/CDN startup and occasional long-frame qualifications, and 4.2
  CP5's outstanding broader manual acceptance, remain unresolved baseline items.

**CP3 recommendations (not implemented):** measure earned-versus-collected scrap,
power, DNA and supplies per wave/type/time, including kamikaze/hostile-on-hostile
deaths and Carrier children. Evaluate those together with `6+5*wave` base budgets,
crafting costs/capacities, upgrades, mutator payouts, Supply Drop and DNA banking.
The Cell Refinery tooltip's “+8%” is conditional under the outer32% gate, not an
eight-percentage-point unconditional increase. DNA banking grants the final
crossed milestone's scrap bonus once and its parity-dependent cell bonus, while
passive genes apply for every crossed milestone; banking cadence matters.
Record pickup-cap loss and whether high observed income is generated loot or
already-collected currency before choosing balance targets. Do not fix the
reported surplus by changing only one probability in isolation.

**STOP after CP2. No CP3 implementation, staging, commit, merge, tag or push.**
HEAD remains `8223bcd` on `milestone-4.3`; the user-authorized accepted working-tree
baseline and all new work await manual acceptance.

---

## CP2-R — Campaign economy and Endless advancement corrections

**COMPLETE FOR MANUAL ACCEPTANCE — STOP HERE.** Continued the actual dirty
`milestone-4.3` working tree at `8223bcd`; index remained empty. Rechecked branch,
HEAD, history, tracked/staged diffs and stash before edits. No reset, reconstruction,
staging or commit. Pre-correction HTML/modules are archived at
`_playtest/m43/cp2-r/before/edge/`; earlier evidence is retained unchanged.

### CP2-R1 investigation and measured rationale

The starting player receives two **full independent magazines** (BUL-11750 rounds,
CRW-8 20 eight-pellet bursts) plus a **shared universal cartridge pool**. One
cartridge replaces the selected gun's magazine on reload completion; it is not
one round or one cartridge per pellet. Partial reload discards the remaining
magazine. Squad actors have their own full30/70/50 magazines and separate reserves.
Fresh Campaign supplies were player6/5/4/3 and squad3/2/2/2 for M1–M4.

The existing seamless transitions carry ammo/materials: they do not issue the next
mission's fresh supply. Mission Select and fresh retry use the authored entry
supplies; Continue restores the saved inventories/magazines. Caps12 cartridges,
3 medkits and5 grenades, fixed loadouts, weapon damage/ranges and crafting remain.

The old seven authored scrap items were unresolved random bundles averaging about
3 each (about21 total), in addition to corpse bundles. Light enemies averaged
.8 scrap/death; common ranged/Drone deaths1.575; Brute/Artillery3.25. Thus collection
could produce many four-scrap cartridges while six initial replacements plus full
guns and the squad already covered early combat. The baseline core play run
retained **all six reserves after M1**, four after Alpha and two halfway through
Beta. The user's reported early surplus is supported by actual runtime inventory.

New values change **future Campaign generation and fresh starts only**:

| Source | Before | CP2-R | Reason / boundary |
|---|---:|---:|---|
| M1 player reserve |6|4|Two fewer replacements; full guns and three squad reserves remain. Rifle-heavy theoretical loaded+reserve damage falls9780→7580 raw, about22.5%, rather than stripping every supply. |
| Fresh M2 player reserve |5|4|One fewer; standalone/retry still have full guns and squad2 each. Seamless M1 carry is not topped up/reset. |
| Fresh M3 / M4 player reserve |4 /3|4 /3|Protect the long Drone operation and evacuation entry. |
| Squad starts |3 /2 /2 /2|Unchanged|Keep squad participation without making player donation mandatory at deployment. |
| Loaded magazines, initial medkits/grenades |Authored values|Unchanged|No blanket cut across all starting resources. |
| New authored world scrap |Legacy random, mean≈3|2 each, 14 total|Predictable finite collection still funds3.5 cartridges if all seven are collected. Only newly generated bundles change. |
| Random Campaign power cell |.32 outer ×.08 conditional =2.56%|.32 ×.05 =1.60%|Reduce random cell income37.5%; preserve the two authored cells and other finite supplies. |
| Random grenade roll |.32 ×.06 =1.92%|Unchanged|Avoid cutting every source; full/partial inventory behaviour is retained. |
| M1 supply locker |3 cartridges +2 grenades|Unchanged|Earned optional alternative to Sensors/intel, still requires collection and preserves partial leftovers. |
| M4 emergency cache |4 cartridges +1 grenade|Unchanged value, correctly single-use|Critical finite evacuation safety supply; duplicate-reset defect fixed below. |
| Cartridge/medkit/grenade crafting |4 scrap /6 scrap /1 cell|Unchanged|One cartridge still reloads either owned gun; grenade craft still grants up to two. |

Mode-specific scrap tables (chance / inclusive quantity; expected scrap per death):

| Enemy | Before / unchanged Endless | Campaign CP2-R | Expected before → Campaign |
|---|---|---|---:|
| Skitter, Runner |.32 /2–3|.26 /1–2|.800 →.390|
| Spitter, Screecher, Drone |.45 /3–4|.34 /2–3|1.575 →.850|
| Shielded |.50 /3–5|.40 /2–4|2.000 →1.200|
| Tunneler |.60 /4–5|.48 /3–4|2.700 →1.680|
| Support |.55 /4–5|.44 /3–4|2.475 →1.540|
| Brute, Artillery |.65 /4–6|.52 /3–5|3.250 →2.080|
| Carrier |.70 /5–6|.56 /4–5|3.850 →2.520|
| Boss |1.00 /10–14|Unchanged|12.000 →12.000|

Common low-cost kills lose the largest surplus; stronger targets retain larger
bundles. The rare boss reward, guaranteed cells, locker and emergency supply are
not blindly reduced. Maintenance Battery/Auxiliary Field Cell quest objects are
not crafting-currency drops and are untouched.

`ChargefrontProgression.economy.campaign/endless` separates scrap, base conditional
power chance and world-scrap generation. Legacy `scrap`/default `scrapReward`
remain the unchanged Endless API; actual enemy death explicitly passes its mode.
Tests compare **120,000 seeded Endless reward results and subsequent RNG state**
against the archived implementation. Endless .08 base cell chance, outer roll,
upgrade/corrosive modifiers, DNA, world-pickup fallback,8 initial cartridges,
wave-start/intermission saves, rewards and crafting modifiers are unchanged.
Higher combat/collection opportunity from restored advancement is not represented
as an unchanged income-per-minute guarantee; that belongs to CP3 measurement.

### Confirmed duplicate-cache defect

The audit reproduced an M4 legacy recovery sequence: collect the cache for4,
rally northern squad actors to reseal, then collect the cache again for another4.
`setFinalMissionWorldState` unconditionally cleared `cache.used` when reconciling
door/emergency visuals. This was a grant/reset defect, not a reason to halve the
cache's intended value.

World-state reconciliation now preserves `used` and keeps collected visuals and
collision disabled. Only a genuinely fresh Campaign mission initialization resets
the cache; checkpoint restore then applies its saved used-state. The same test
remains at **4**, not8, after reseal/reinteraction and restore. Quantities already
earned/stored in old saves are not confiscated or retrospectively audited.

### Save and initialization compatibility

- No save-version change, inventory migration, new cap or retroactive re-roll.
- A cold native Continue restores **11 cartridges, rifle7/scatter3, scrap33,
  cells5, medkits2**, and saved pickup quantities **0 and4** exactly.
- Legacy `quantity:0` keeps its old unresolved collection behaviour. Explicit
  stored corpse/world bundles retain their quantities, even if larger than new
  generation values. New world supplies resolve to2 at generation, not collection.
- Native failure Retry returns to the new fresh M1 supply4. Mission Select entries
  are4/4/4/3, full magazines, and leave the persistent Campaign bytes unchanged.
- M4 cache snapshots preserve `used`; existing zero-ammo escape sanitization and
  the four-cartridge emergency cache remain available under their accepted rules.

### Normal-speed resource evidence

Controlled core protocol: fresh M1, actual objectives/native E, authored supplies,
normal combat/reload/collection/crafting, Alpha60 s and Beta35 s. Travel/setup
uses explicit relocations; Commander invulnerability keeps the observation alive.
Squad AI/resources are normal. No ammo/scrap is granted to the fresh play run.
Automatic patrols are suppressed for comparability, but authored M1 and relay
encounters are real. This is resource-flow evidence, not health/difficulty
certification. Aim alternates aimed and deliberate high-offset intervals;
no exact human accuracy percentage is claimed. RNG/kill/collection trajectories
vary, so these are observed runs, not matched-shot causal timing comparisons.

| Observation | Baseline Edge | Corrected Edge | Corrected Firefox |
|---|---:|---:|---:|
| Fresh reserve |6|4|4|
| Carried reserve after M1 |6|4|4|
| Reserve after Alpha |4|2|3|
| Cartridges crafted by Alpha |0|2|1|
| Reserve halfway through Beta |2|1|1|
| Rifle / scatter remaining at half Beta |25 /20|21 /20|17 /20|
| Cartridges crafted during observed M2 segment |1|2|1|

Receipts: `play-before/edge/economy.json` and
`economy-final/{edge,firefox}/economy.json`. Both corrected core runs retain a
spare cartridge and loaded weapons; finite collection/crafting is useful by Alpha.

An additional **normal-speed continued** Edge run carries the same fresh inventory
through full Beta/Gamma, post-combat scavenging of already-earned drops, native
M3 entry and its90 s defence/transfer, then the native M4 exit and cache. It uses
range-appropriate guns, conservative partial reloads when reserves are scarce,
ammo sharing/abilities and existing finite supplies; it adds no farm waves or
synthetic resources. At Gamma completion it holds **2 cartridges, rifle33,
scatter20**, after13 M2 cartridge crafts. The existing authored cell increases
crafting cells1→2 before M3. M4 entry retains **7 scatter bursts**, then the cache
provides its normal **4 cartridges**. The late margin is deliberately tight;
existing grenades/cells, squad support and emergency rules remain relevant.
See `late-progression-final-tools/edge/economy.json`. The run ends at the M4 cache,
not a falsely reported full Campaign completion.

Earlier extended bot trials are retained as stress/diagnostic data: they exposed
the harness using a rifle's15-round partial-reload threshold on a20-burst shotgun
and staring at a visible enemy with empty guns instead of collecting existing
loot. The controller was corrected to proportional/low-reserve reload decisions,
range-appropriate weapons and supply-priority walking. Production values were not
changed to accommodate those probe mistakes. Trials also demonstrate that ignoring
collection/secondary resources can exhaust ammunition; no all-strategy/no-loot
completion guarantee is claimed. Manual continued-M3 ammo-pressure review remains
important given the thinner buffer and invulnerable-Commander fixture.

### CP2-R2 root cause and mode-specific correction

The actual wave spawner can assign a squad actor after construction. CP1's
`perceive` correctly invalidates old knowledge on focus reassignment, clearing
`spawnGoal`. With no visual contact, `knownGoal` fell back to `home`. Its finite
lost-contact search also ended in GUARD at an old position. Those are appropriate
Campaign behaviours but an invalid default survival-wave objective.

Baseline reproduction uses a **real wave spawn**, assigned to ROOK, with the
whole squad beyond95 m perception: actor starts **192.8 m** from the relay and
moves **0 m in6.5 s**. It did not have an advancement destination.

Endless now has a separate no-contact objective:

1. Newly active/unseen actors advance to a free **8 m approach ring** around the
   relay (12 m alternative if obstructed), not into the solid relay collider.
2. A detected living operator overrides that destination through the existing
   target/role/attack pipeline. LOS, commitment, wind-ups, stats and damage remain.
3. Lost contact gets bounded last-known investigation/search, then returns to
   relay advancement instead of home/GUARD. No hidden moving operator position
   is used to steer this fallback.
4. Far advancement authorizes local32/24/16/8 m legs so distant props do not
   perpetually select remote corners. Existing solid/overhead/terrain rules and
   bounded detours remain authoritative. A1.5 s stalled-progress check invalidates
   a blocked plan, refreshes the approach and tries the other steering side.
5. The relay is **coordinates only**, never assigned as an attack victim. No relay
   health, damage, new failure state or wave-balance rule was added.

Campaign `perceive`, its lost-contact/search body and attack execution are unchanged
by exact archived-source comparison. `knownGoal` only dispatches to the new branch
when mode is Endless. Transient advancement fields are not a new save schema.

Actual runtime verification in both browsers:

- Same real assigned spawn advances from192.8 m into the central area (about
 10.7 m Edge /11.8 m Firefox), rather than remaining at home. At the common6 s
 observation it has already improved relay distance by more than30 m.
- All **12 archetypes × three arenas** (Crater/Valley/Ridges, seeded layouts) reach
 the central arrival area **<18 m** at normal speed, with operators unseen and
 **zero attack executions**. No speed/HP/damage edits are used for advancement.
- Detected Drone engages and fires; after operators move out of perception it
 investigates/searches and resumes ADVANCE. No new attacks execute while unseen.
- A sealed isolated enclosure is not crossed; repeated plans/stall recovery occur.
 Disabling one test wall lets the same actor leave and reach the relay. No actor
 is teleported or forced through a solid.

`advancement-01/{edge,firefox}/advancement.json` contains seven cases per browser,
sampled paths/geometry checks and state/attack counters. Derived charts explicitly
show sample timing and come from those receipts, not an altered game render.

### Final CP2-R verification

Index: [`_playtest/m43/cp2-r/INDEX.html`](_playtest/m43/cp2-r/INDEX.html).
Joined receipt: `verified-final/summary.json` — **29 selected final browser-suite
executions PASS**, including the additional extended Edge resource run.

| Suite / coverage | Result | Evidence root under `cp2-r/` |
|---|---|---|
| New `campaign-economy.mjs` core + initialization/retry/Continue/Select/cache | Edge + Firefox PASS | `economy-final/{browser}/economy.json` |
| Extended same-run resources through Gamma/M3/M4 cache | Edge PASS | `late-progression-final-tools/edge/economy.json` |
| New `endless-advancement.mjs` | Edge + Firefox PASS | `advancement-01/{browser}/advancement.json` |
| Existing `tactical-ai.mjs` — Campaign knowledge, nav, roles, attacks | Edge + Firefox PASS | `campaign-ai-compatibility/{browser}/tactical-ai.json` |
| Existing `m2-progression.mjs` | Edge + Firefox PASS | `m2-regression/results-edge-firefox.json` |
| Existing `campaign-tactics.mjs` — later entries/turret/Continue/results | Edge + Firefox PASS | `later-campaign/{browser}/campaign-tactics.json` |
| Existing normal-speed `sample-lockdown-live.mjs`, turret enabled | Edge + Firefox PASS | `live-defence/live-{browser}/manifest.json` |
| Existing `runner-kamikaze`, `combat-squad`, `combat-playtest`, `endless-hud` | 8/8 PASS | `shared-edge/results-edge.json`, `shared-firefox/results-firefox.json` |
| Existing `additional-refinement` — resources/save isolation | Edge + Firefox PASS | `additional-verified/results-{browser}.json` |
| Existing `results-flow`, `endless-unlock` | 4/4 PASS | `results-compatibility/`, `unlock-compatibility/` |
| Existing paired `tactical-performance` | Edge + Firefox PASS | `performance/{browser}/performance.json` |

**Nine Node suites PASS:** new `cp2r-state` plus `progression-state`, `results-state`,
`combat-state`, `enemy-tactics-state`, `objective-hud-state`, `relay-routing-state`,
`environment-placement-state`, `campaign-terrain-state`. Syntax and final
`git diff --check` PASS. Geometry and weapon modules remain byte-identical.
The unit suite additionally proves unchanged Endless initialization/wave/payout
source, unchanged pickup/crafting/gate/result source and exact Campaign search.

The normal late defence preserves DNA visibility, Drone-only spawning,90/3.5 s,
staged north seal, lighting and east evacuation. CP0-R regression retains
**18:30 /48 /14 /10**, optional2/1/1/0, correct navigation, saved progression and
all20 persisted-gate scenarios per browser. No direct Endless result button returns.

The existing performance harness still compares pre-CP1 HTML to current HTML,
not a fabricated CP2-only before sample. Its guard now protects **Endless** economy
parameters rather than forbidding this authorized Campaign change. Current p95:
stationary18.4 ms Edge /33.3 ms Firefox; live18.7 /33.6 ms. Enemy CPU remains within
the existing bound; zero shader links/world/nav rebuilds in all measured windows.
No FPS improvement or all-seed/late-wave soak certification is claimed.

### Test amendments / retained failures

Only authorized fresh-supply expectations changed in existing tests (M1 6→4,
M2 5→4, Campaign seeded Tunneler bundle4→3); locker, saved inventory and Endless
expectations remain. CP1's optional blanket drop/module byte checks were replaced
with mode-aware protection because Campaign economy now legitimately differs.

One Firefox `additional-refinement` attempt used a fixed120 ms delay before testing
the mid-wave save prohibition. The simulation had not demonstrably advanced;
wave-start saves are legitimately allowed. The test now waits for actual
`waveT >0` before the same prohibition assertion. Product save rules were not
changed. Both browsers subsequently PASS in `additional-verified`; the failed
original receipt remains in `shared-firefox/`. The first resource fixture also
placed a saved four-scrap item directly under the restored player, who correctly
collected it (33→37); the fixture moved the player away before testing preservation.
No product resource fix was inferred from that valid collection.

### CP2-R files and stop boundary

- Production: `chargefront.html`, `src/progression.js`, `src/enemy-tactics.js`.
- New tests: `tests/cp2r-state.mjs`, `tests/campaign-economy.mjs`,
  `tests/endless-advancement.mjs`.
- Updated tests: `progression-state`, `additional-refinement`, `combat-squad`,
  `enemy-tactics-state`, `tactical-performance` (all `.mjs` under `tests/`).
- Documentation: this corrective section and `README.md` current reserves/behaviour.
- New archives, raw runs, screenshots, derived charts and joined receipts:
  `_playtest/m43/cp2-r/`. Previous CP0/CP1/CP2 artifacts are preserved.

Manual acceptance should review the tighter continued-Campaign ammo margin and
collection/crafting rhythm; tests are controlled and do not replace health/feel
playtesting. Local navigation remains bounded; arbitrary enclosed/unreachable
custom maps cannot justify crossing a seal. Existing normal-profile/cold-start
and 4.2 CP5 qualifications remain. Full **Endless economy CP3 is not implemented**.

**STOP for manual acceptance. No stage, commit, merge, tag, push or branch reset.
HEAD remains `8223bcd` on `milestone-4.3`, with all accepted working-tree work retained.**
