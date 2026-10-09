# Milestone 4.1 — adaptive routes and continuous reloads

## Result and baseline

**COMPLETE — focused acceptance and regression gates pass.** Branch
`milestone-4.1`, accepted baseline `f95e57af2ae24f15f2b89feb68761c8bb6574c87`.
Audited README, all three existing 4.1 reports, physical collision/door/terrain
data, objective/reward/checkpoint ownership, player and AI navigation, four
viewmodels, procedural arm transforms, combat reload accounting and existing tests.
No applicable workspace `AGENTS.md` was found. Baseline: three existing Node
suites and ARC/additional-refinement browser suites pass in Edge and Firefox.

Unrelated modified `Credits.txt` and the initial untracked m38/m39/m40 playtest
artifacts remain untouched and excluded. Generated evidence stays in the already
ignored `_playtest/m41/regressions/` namespace. No Milestone 4.2 work.

## Previous failure mechanisms

- Intel guidance persisted an irreversible waypoint index. Bypassing an authored
  point did not advance it; the marker and minimap could keep pointing backward.
  The ground guides were fixed corridor poles rather than the current walkable path.
- Each gun's cartridge used a different removal/insertion branch and fixed
  visibility percentages. Its local pose reset between those branches even when
  the mesh remained on-screen. Hand reach deadlines did not match cartridge
  removal deadlines, and lock slaps displaced the hand independently of its grip.
  ARC removal was downward despite its side-mounted socket; PX hid/showed the
  entire support hand. These were hierarchy/timeline problems, independent of FOV.

## Adaptive guidance

`src/relay-routing.js`: deterministic eight-neighbour **4 m grid A***, augmented
with exact authored corridor nodes, exact Commander origin and relay approach.
The physical world authorizes every edge: existing solid spatial buckets and
footprints inflated by **.65 m**, world boundaries, and terrain samples at no more
than **.75 m** intervals. Conservative slope checks avoid cliff shortcuts.
Diagonal edges receive the same complete clearance check, so they cannot cut corners.

Authored Alpha/Gamma corridors supply a continuous distance-weighted preference
(cost multiplier 1–1.9), not mandatory intermediate visits. Collision-authorized
string pulling reduces point density while preserving corridor costs. A valid old
suffix within **4%** of the new path cost is retained to stabilize equivalent paths.
Player-only arrays/edge caches are separate from squad/Infested steering; their
navigation functions and `src/world/facility.js` are unchanged.

Authoritative inputs and lifecycle:

- Origin: actual `player.pos.x/y`, after movement/collision resolution.
- Destination: current `relayByPhase()` position, **6 m** along the validated
  authored approach direction: Alpha **(211,575)**, Gamma **(569,585)**. Both are
  outside the relay base and inside the existing interaction area.
- Eligibility: Mission 2 Alpha travel + acquired `alphaIntel` (M1 Sensors);
  Mission 2 Gamma travel + existing completed-scan `betaSurvey`. Drone hostile
  HUD intel remains on its original bounded/LOS-authorized path.
- Ordinary motion: one solve per **1 simulation second**, only after >.35 m
  displacement since the last solve. Stationary actors perform no repeated solve.
  Cadence tests observe ticks **59,119,179,239** over four seconds.
- Objective changes, restore/reset, teleport-sized displacement, solid enable/
  disable changes and effective door locks bypass the cadence gate. Failure to
  attach the Commander to the old path also triggers a bounded immediate solve
  on the 10 Hz display update. No-path results hide enhanced guidance and retain
  the ordinary objective marker/compass.
- Arrival uses the **same `<7 m` predicate as relay activation**. New additive
  `alphaRouteArrived` / `gammaRouteArrived` reward flags retire guidance even if
  the player leaves again without pressing E. Powering/powered relays, phase or
  mission exit, death, menu exit and restart also clear the transient guide.
- Automatic unlocked doors are planner-permeable; locked doors block. The ground
  line omits any segment intersecting the currently closed physical door until
  its existing automatic mechanism opens. Door animation does not rebuild A*.

One prepared/prewarmed cyan `LineSegments`, material and fixed **4096-vertex**
dynamic buffer are reused. Terrain-following samples are approximately 2 m apart,
.12 m above ground. Changed vertices upload at **10 Hz**; stationary geometry is
not repeatedly rewritten. The minimap uses the same current simplified path.
Intermediate cyan markers remain; the final approach uses the ordinary relay
marker to avoid overlapping duplicate labels. Main HUD text and compass remain.

### Save compatibility and skipped-point evidence

Existing Campaign namespace/schema and reward restoration are retained. Old
`*RouteIndex` fields are tolerated but never consulted. No path, geometry, search
cache or animation state is serialized. Restore clears the guide and solves from
the restored Commander; acquired rewards and arrival latches survive without
granting rewards again. Endless save format is unchanged.

Browser fixtures bypass/reverse/leave/rejoin authored points and validate every
computed segment against real collision/terrain. At **(300,575)** Alpha becomes
a direct authorized path to **(211,575)** without revisiting the Hall/staging.
At **(450,570)** Gamma becomes an authorized path to **(569,585)** without returning
west. The direct **(285,690)→(569,585)** line is rejected through the facility;
the calculated path uses **(285,585)→(450,570)** instead. Real W-input walks cover
the Hall/front door and relay arrival. Collision fault injection verifies immediate
invalidation, no-path fallback and stationary reopening; arrival/restore/death/
mission-boundary tests verify retirement and reconstruction.

## Reload architecture

`src/fps-reload.js` is presentation-only. It reads normalized progress from the
existing `playerCombat` reload clock; it has no ammo, firing gate or second reload
timer. Existing duration, shared-cartridge spending, partial-mag replacement,
switch cancellation and save accounting remain in untouched `src/combat.js`.

Hierarchy: camera → `ViewModelRoot` → weapon mount/model/socket, with the shared
arm rig under the same viewmodel root. The cartridge starts model-mounted.
At grasp, `Object3D.attach()` preserves its world pose while moving ownership to
the viewmodel; its trajectory is evaluated in the weapon socket frame and converted
to viewmodel space. The hand follows the cartridge's configured grip exactly.
At seating, attachment transfers back with the exact socket pose. Updating the
viewmodel root before cartridge/arm evaluation removes stale-coordinate ambiguity.

Shared normalized timeline, smoothstep eased and combat-duration scaled:

| Progress | Action |
|---|---|
| 0–.20 | Ready/support hand → reach and establish grip; cartridge stays seated |
| .20–.32 | Withdraw along the actual near-side socket clearance direction |
| .32–.46 | Hand + used cartridge travel together below the camera boundary |
| .46–.54 | Offscreen retrieval/exchange at one continuous hand pose |
| .54–.68 | Replacement enters already gripped, then reaches the cleared approach |
| .68–.82 | Continuous insertion into the actual socket |
| .82–.86 | Seated lock hold; existing weapon-specific feedback remains |
| .86–1 | Release/support return and weapon-ready blend |

The existing single prepared cartridge proxy is recycled as old/new only outside
the visible frame, preventing duplication or per-reload mesh creation. A conservative
camera-space bounding sphere (including glove margin) must clear a frustum side
plane before hiding. The offscreen trajectory uses actual FOV, aspect, projection
depth and sprint-FOV allowance; it never pushes the whole weapon away to conceal
the exchange. The proxy returns from that same offscreen pose without a phase reset.

| Gun | Preserved cartridge body dimensions (m) | Side withdrawal | Existing duration / details |
|---|---|---:|---|
| BUL-117 | .032 × .108 × .22 | .22 m | 1.7 s; slim cyan cell and existing lock indicator |
| CRW-8 | .040 × .118 × .22 | .25 m | 2.05 s; wider cell, heavy handling pose and emitter feedback |
| ARC-9 | .038 × .125 × .26 | .22 m | 1.9 s; raised socket; constant flat cyan magazine, existing animated front-channel power-down/up |
| PX-4 | .050 × .178 × .41 | .30 m | 2.2 s; large orange cell; idle left hand remains offscreen and enters/returns continuously |

All four actual playable models use universal energy cartridges; none has an
individual-shell reload. Their geometry, materials, sockets, grip offsets and
handling poses remain distinct. PX cartridge scale/brightness replacement tricks
are removed; ARC magazine opacity/scale remain constant.

Cancellation policy: weapon switching cancels the existing combat action without
spending a cartridge, restores all pooled parts to their sockets, and immediately
retargets the shared hand to the newly equipped gun. Fresh/restarted/restored runs
reuse that reset. Pause freezes the existing simulation clock and ownership;
resume continues. Sprint/movement layers remain on their accepted smooth blends.

## Validation and evidence

**Four Node suites PASS:** `combat-state`, `objective-hud-state`,
`progression-state`, new `relay-routing-state`.

**All 20 suites PASS in each browser** (40 combinations):

| Suites | Edge / Chromium | Firefox |
|---|---|---|
| New `route-reload-refinement` | PASS, headless + headed | PASS, headless + headed |
| `intro-smoke`, `m2-progression`, `runtime-stability --campaign`, `traversal-performance` | PASS | PASS |
| `facility-regression`, `facility-playthrough`, `transition-diagnose` | PASS | PASS |
| `corrective-refinement`, `hud-refinement`, `hud-navigation`, `objective-hud-flow` | PASS | PASS |
| `arc-presentation`, `screecher-wings`, `runner-kamikaze`, `sprint-recovery` | PASS | PASS |
| `combat-squad`, `combat-playtest`, `endless-hud`, `additional-refinement` | PASS | PASS |

Focused reload coverage: **36 gun/FOV/viewport combinations per browser**, each
with **241 sequential pose samples**; 60/75/100° and 1280×720, 1780×832,
1920×1080. Grip error while held is floating-point noise; hidden proxies are
completely outside the projected frame; cartridge depth stays beyond the near
plane; adjacent samples and exact socket seating pass. Native R-input full reloads
also sample live frames while strafing, turning, sprinting and pausing/resuming.
Tests verify one-cartridge spending, no-reserve rejection, firing gates, cancellation,
and restart cleanup. No unexpected page/console errors in focused acceptance.

Visual evidence, locally retained:

- `route-reload-baseline/`: pre-edit ARC/additional browser receipts.
- `route-reload-regressions/`: all 19 existing suites' logs per browser.
- `route-reload-evidence/`: complete headed route/reload acceptance receipts.
- `route-reload-route-final/`: invalid-origin recheck and Alpha/Gamma ground/HUD captures.
- `route-reload-visual-final/`: clean headed **27-frame ordered sequences** and
  individual PNGs for every gun in both browsers. `rifle`, `scatter`, `arc`,
  `plasma` `-sequence-{edge,firefox}.png` show ready, grip, withdrawal, viewport
  exit, replacement entry, insertion and return, including ±.005 transition frames.
- `route-reload-acceptance/`: final complete focused acceptance receipts and
  expanded **35-frame** sequences, with extra viewport-exit/entry/insertion frames.

Each gun's rendered sequence was visually reviewed, including adjacent transition
frames; this accompanies dense numerical continuity and native live reload checks.
Capture workers await rendered frames. Staged images temporarily exclude the DOM
pause overlay and restore its style afterward. Paused firing fixtures drain their
real projectiles before close-ups; initial obstructed/lagged captures are superseded.
These are controlled browser fixtures and real input/render tests, not an unassisted
Campaign survival run or a subjective human animation-quality certification.

### Performance and limitations

Ordinary route/reload updates produce **zero new materials/geometries/shader links**
in both browsers. Cartridge ownership transfers reuse objects; only ordinary
attach/remove events occur. Route traversal headed samples: Edge **16.9 ms p95 /
50.1 ms worst**, Firefox **33.3 / 100 ms**. Initial/invalidated A* can take tens of
milliseconds (observed search maxima about **52 / 59 ms**); cached/rejoined solves
are commonly a few milliseconds. Existing actor/texture first-use events remain;
the route does not introduce a render-resource disposal/reallocation cycle.
Existing traversal/Firefox stability gates pass. These are short traces, not a soak.

The 4 m grid is conservative for unauthored very narrow passages; exact authored
nodes cover the intended entrances/corridors. If clearance cannot be established,
ordinary guidance is used. Ground vertices update at 10 Hz rather than curved
interpolation that might cut a wall. Hands retain the accepted low-poly procedural
arm/mitten geometry, without articulated fingers or an art redesign. Multi-hour
soak, unassisted balance and subjective tactile/audio feel remain manual limits.

## Changed files and reproduction

Runtime: `chargefront.html`, new `src/relay-routing.js`, new `src/fps-reload.js`.
Tests: new `tests/relay-routing-state.mjs`, new `tests/route-reload-refinement.mjs`,
updated `tests/additional-refinement.mjs` (adaptive arrival instead of saved index).
Docs: `README.md`, this report. No ammunition, combat balancing, AI steering,
facility geometry, progression schema or inventory implementation changes.

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
$env:CF_ARTIFACT_DIR='_playtest/m41/regressions/route-reload-review'
node tests/combat-state.mjs
node tests/objective-hud-state.mjs
node tests/progression-state.mjs
node tests/relay-routing-state.mjs
node tests/route-reload-refinement.mjs
node tests/route-reload-refinement.mjs firefox
node tests/route-reload-refinement.mjs --headed
node tests/route-reload-refinement.mjs firefox --headed
node tests/m40-regressions.mjs --additional edge
node tests/m40-regressions.mjs --additional firefox
```

Long regression batches may use the runner's existing `--suites=a,b` selection.
Focused `--route-only` / `--reload-only` options isolate subsequent rechecks.

Git policy: one consolidated task commit only after final acceptance/review;
no intermediate commits, amend, push or merge. Prior user changes/artifacts excluded.
