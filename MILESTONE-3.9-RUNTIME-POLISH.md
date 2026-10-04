# Milestone 3.9 — runtime stability and gameplay feel

## Status / scope

**Ready for manual review, with the desktop feel/performance acceptance gate still open.** Reproduced audio and AI movement defects have targeted fixes and browser regression coverage. This report does **not** certify that every reported Firefox stall or all visible player/camera jitter is eliminated.

Baseline: `25ee482` (`fix: restore M2 front-entry flow and repair facility perimeter`). Fetched `origin/main` and verified `main...origin/main` was `0 / 0` before creating `milestone-3.9-runtime-polish`. No commit, push, merge, or tag was made. Pre-existing `_playtest/m38*` captures/archives were preserved.

Read `README.md`, `FACILITY-ARCHITECTURE.md`, `MILESTONE-3.8.1-REFINEMENT.md`, both 3.7 diagnosis/transition reports, and all five existing browser harnesses. Facility geometry, navigation architecture, mission definitions, equipment, and accepted 3.8.1 progression are retained. `src/world/facility.js` has no changes.

## 1. Initial symptoms and baseline

- Landing audio sounded abruptly terminated around the M1 gameplay handoff.
- Player/camera, squad, and Infested movement had reported visible jitter; these were investigated separately.
- Short ordinary travel could feel like loading/stalling, especially in Firefox. The resolved 3.7 changing-light-count problem was not presumed to be the cause.

Required tests were run **before product edits**:

| Baseline suite | Edge 154 | Playwright Firefox 155 |
|---|---|---|
| `facility-regression.mjs` | Pass | Pass |
| `facility-playthrough.mjs` | Pass | Pass |
| `m2-progression.mjs` | Pass | Failed twice at terminal E after reload |
| `transition-diagnose.mjs` | Pass | Pass |

Firefox's M2 test had already walked the full return and put all three FOLLOW members inside the Hall. Its fixed 1.85-second wall-clock E hold after a fresh renderer load did not always provide 1.5 seconds of **simulation** interaction. The final harness holds real E until the expected phase changes, with a bounded timeout; gameplay interaction durations are unchanged.

Established A–E debug spatial sweep, 14 m/RAF, 1280×720:

| Metric | Baseline Edge | Final Edge | Baseline Firefox | Final Firefox |
|---|---:|---:|---:|---:|
| Recorded intervals | 272 | 271 | 272 | 271 |
| p95 / p99 interval, ms | 33.4 / 66.7 | 36.3 / 53.6 | 83.4 / 166.7 | 63.9 / 171.2 |
| Worst interval, ms | 183.2 | 179.8 | 300.1 | 388.6 |
| Intervals >100 ms | 2 | 1 | 9 | 4 |
| Traversal shader links | 0 | 0 | 0 | 0 |
| World / facility / solid-grid builds | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Geometry / material creation or disposal | 0 | 0 | 0 | 0 |
| Light slots / programs / solids | 8 / 23 / 306 | 8 / 23 / 306 | 8 / 23 / 306 | 8 / 23 / 306 |

The route is unchanged; the new profiler reset intentionally discards the interval straddling reset, accounting for one fewer recorded interval. This is a fast spatial stress test, **not a walking-speed FPS benchmark**. Timing varies with browser scheduling, load, random content, and diagnostic overhead. Firefox's worst interval did not improve. These figures do not support a general FPS improvement claim.

## 2. Runtime ownership / transform audit

| System | Findings |
|---|---|
| Main loop | LittleJS 1.18.25 has a fixed 1/60 s update, RAF rendering, a 50 ms accumulated-time clamp, and update-time smoothing. Several updates can occur before one render; a short key hold during first-render blocking can contain little simulation time. |
| Player / FPS camera | Input becomes normalized movement, terrain-step check, `resolveCircle`, vertical physics, then camera XY/eye/head-bob and yaw/pitch. Camera alignment to LittleJS 2D is disabled. No competing gameplay camera-position writer was reproduced. Cinematic/reference cameras are separate modes. |
| Model transforms | `ThreeJSObject.update()` syncs actor position and clockwise angle to mesh position / negative mesh Z rotation. Animation writes limb rotations and root sway/roll, not an additional navigation position. There is no render interpolation in the imported plugin. |
| Squad | Formation uses last movement heading, catch-up speed, separation, terrain/collision, then model sync. A hard full-speed arrival threshold caused slow-target stop/go. Engaged movement also wrote facing twice: target aim, then waypoint heading. |
| Infested | Desired chase/last-seen/waypoint motion, separation, collision, wall-slide, height/animation, then model sync. Wall-slide used collision correction distance instead of total movement. |
| Collision / navigation | Count-gated static solid-grid rebuilds; door solids toggle disabled state in place. Enemy-cell grid is intentionally rebuilt each gameplay tick. No ordinary-traversal static/nav rebuild was observed. |
| World / facility | Campaign builds once, sections stay persistent through M1–M4. Snapshot/door/FX state changes retain authored geometry. |
| Rendering / shadows | Eight permanent local light slots remain. Existing 12 Hz shadow refresh remains; test-only refresh suppression did not consistently remove Firefox tail intervals. |
| Encounters / effects | Infested templates, projectile, impact and spark pools already exist. First use of a type/effect can allocate; quiet traversal does not. Per-instance threat-ring materials were cloned but never released on enemy destruction. |
| Audio | File-SFX buffers decode once; fallback pools exist eagerly. Their warm-up nevertheless started all 168 elements simultaneously even when preferred buffers were available. Intro SFX bypassed the volume setting and had unconditional hard stops. Music transitions create a track only when its identity changes. |

No fixed-step loop, navigation rewrite, camera smoothing layer, shadow reduction, or visual-effect deletion was introduced without a reproduced need.

## 3. Intro-audio reproduction, cause, and correction

`tests/runtime-stability.mjs --observe --baseline` intercepts the real `Audio` construction and records native `playing`, `ended`, `pause`, volume changes, and calls to `pause()`. The baseline HTML is loaded from `25ee482` through Playwright request interception; project files are not swapped.

**Measured baseline:** `SpaceshipLanded.wav` is **4.318948 s** long. It was hard-paused at approximately **1.59–1.64 s**, leaving about **2.7 s** unheard. At touchdown, `playIntroSfx()` also immediately paused the 119.92-second engine loop at volume 0.7. At cinematic end, `endIntro()` unconditionally stopped the newly started touchdown one-shot at volume 0.9. These are independent lifecycle cuts, not a broken audio asset.

Changes:

- Reuse one owned HTML media element per intro/extraction SFX resource instead of constructing another on every playback.
- Cross-fade the outgoing engine over **350 ms** at touchdown.
- On **normal** intro completion, retain the finite touchdown tail until its native `ended` event. It can intentionally overlap the first approximately 2.7 seconds of M1 gameplay; this is the landing sound finishing, not an orphaned loop.
- On **skip**, fade all owned intro sounds over **120 ms**, without delaying gameplay or pointer lock. The real skip handler and debug skip hook explicitly identify this path.
- Fade timers use wall time, own a particular element, and are cancelled before element reuse. Cleanup/mission reset, chapter transitions and Endless launch stop all intro/extraction elements and cancel pending fades. An accelerated M1 completion cannot carry a landing tail into M2.
- Intro SFX now respect `opts.sfxVol`; MUSIC ONLY also stops them.

**Final measured results:** Edge and headed Firefox both delivered native `ended` at 4.318948 s, with no premature normal-tail pause. The engine was paused at volume zero. Early skip and skip after touchdown both left zero live intro elements after the bounded check, with only two cached landing elements across repeated plays. Early skip acquired pointer lock. M1→M2 had no live intro audio.

Listening for the *perceptual* landing/engine blend remains a manual review item. Native media completion proves lifecycle correctness, not perceived audio quality.

## 4. Movement findings and changes

### Infested: reproduced wrong-coordinate stuck detection

The old `preX/preY` was captured **after** desired movement and separation, immediately before collision. Therefore `moved = distance(resolved, preCollision)` measured depenetration. A freely advancing enemy had zero correction, was incorrectly classified as stuck, and acquired a perpendicular step after 0.25 s. Once stuck time exceeded 0.7 s, its random side could also be selected again on consecutive ticks.

The flat Hall runner pursuit `(360,628) → player (360,654)` reproduced **46 false-stuck ticks and 46 lateral ticks in 61 ticks**. Fix: measure resolved displacement from the actual start of integration, and bound side reselection to another commitment period when truly blocked. Final probes in both browsers had **zero false-stuck / zero lateral ticks** while still making >5 m of real progress.

Door pursuit still passes exterior→Hall, Hall→exterior, closed-east-wall→front, Containment→Service, and Service→outside. Close melee pursuit reaches the intended stand-off instead of repeatedly overshooting sideways.

### Squad: reproduced arrival stop/go

The slow-target probe uses a **test-only** 2 m/s player speed in the Hall, to expose arrival behavior; it does not add a new slow-walk control. Old squad minimum speed 4.8 m/s and the 1.1 m hard threshold produced **168 moving/stopped toggles in approximately 202 ticks**.

Formation now eases speed by remaining distance to a **0.75 m arrival radius**, with a six-per-second approach rate. Navigation waypoints retain catch-up behavior, and forward steps are bounded by remaining distance. Final slow-target runs recorded **zero stop/go toggles**. Ordinary-speed FOLLOW was continuous before and after. Catch-up multipliers, separation, command behavior and collision remain active.

Engaged squad movement now has **one facing owner**: aim tracks the hostile while steering changes position. Non-combat movement still faces its movement target. Gait activation is based on actual displacement rather than an unreachable desired formation/target distance, reducing walking-in-place presentation at blocked targets.

All three FOLLOW members returned through the M2 front door and re-formed indoors. Facility tests retain combat, turns, walking, sprinting and both service thresholds.

### Player/camera: what is and is not established

Real-input walk, sprint, strafe, diagonal, reverse and wall-contact probes passed collision and exact camera/player XY agreement. Existing tests also walk/sprint the facility entrances/exits. Camera eye bob is intentionally not constant Z. No independent camera-vs-player transform oscillation was established, so player physics/camera code was not rewritten.

Uneven RAF cadence and fixed-tick visual sampling can still look like player/camera stutter, particularly on a high-refresh display or during slow rendering. Mouse feel, quick direction reversals, full obstacle/target-switch behavior and subjective smoothness remain manual acceptance items. The measured AI fixes should not be described as proof that every player-camera symptom is fixed.

`?movementDiagnostics=1` installs `__cfMovement`: 1,800 bounded render samples, raw player/actor positions, camera and rendered mesh transforms, actor angles, ticks per render, and bounded collision corrections with actor identifiers. `playerWaypoint` is a **derived route toward the player**, not a claim that it is every actor's current combat steering target. `.reset()`, `.report()` and `.download()` provide deterministic capture without per-frame console logging. The recorder is absent without the flag.

## 5. Traversal / Firefox investigation

`tests/traversal-performance.mjs` drives ordinary W-key movement for separate six-second M1, Alpha, Beta, Gamma, front-return, interior and M4 samples, then active campaign/Endless combat. Segment setup uses explicit teleports; the movement samples themselves use real input. Some samples deliberately reach a relay pad/prop and stop against collision; they are short regional samples, not proof of walking each complete exterior leg. The complete Gamma→terminal return is independently walked by the progression and campaign harnesses.

The profiler now additionally records texture creation/upload calls, file-audio operations, individual squad/Infested update costs, Endless spawning updates and HUD cost. Existing shader, object addition/removal, allocation/disposal, builder, shadow, update/render and heartbeat records are retained.

### Confirmed secondary issues

1. **Unnecessary audio start/decode burst.** Baseline programmatic intro handoff measured `warmFileSfx` at **149.7 ms**. It started all 168 silent fallback elements irrespective of preferred buffers. Warm-up now skips already-decoded keys, checks again as async decode completes, and starts at most three elements per batch. A warm-up timeout cannot pause an element acquired by a real gameplay sound. This removes the synchronous all-pool burst; it does not prove a general traversal FPS gain.
2. **First-use combat shader preparation omitted in Endless.** Baseline early Endless combat linked basic impact/projectile and line spark variants (two links in the recorded runs). The existing reusable impact/spark prewarm now also runs at Endless entry. Final early/later combat samples linked zero shaders. Initial-load compilation still exists.
3. **Unreleased per-enemy material.** Only the independently cloned threat-ring material is disposed on enemy destruction. Shared template resources remain cached; double destruction cannot decrement the enemy count twice. This is bounded lifecycle hygiene, not a full actor-pooling rewrite.
4. **Profiler reset contamination.** Clearing counters/frames did not clear the in-progress interval or RAF timestamp. A post-change test initially reported a 1,066 ms early-Endless frame with a link/upload in its delta but *zero* such summary counters; its events actually preceded the reset. Reset now discards that straddling interval. Initial-load work is no longer labelled movement-time work by the first sample.

### Findings that did not justify a product optimization

- Quiet region samples and the A–E sweep had no repeated terrain/facility builds, static collision-grid rebuilds, or geometry/material creation/disposal.
- Final quiet region samples had **zero texture creation/uploads and zero shader links** in both browsers.
- Same-Hall-route shadow suppression was inconsistent: one Firefox run p95 66.7→50 ms, another 50→50 ms, with tail frames remaining. This is insufficient evidence to change the authored shadow budget.
- Some pre-fix/post-change long frames spent most recorded time in `gameRenderPost`/HUD, rather than gameplay update, with zero links or allocations. Cold UI drawing can contribute; no repeated spatial HUD trigger was isolated.
- Final Firefox early Endless had a **123.1 ms RAF interval with 4 ms render, no allocation/link event and no expensive recorded operation**. This falls outside the measured game/render work; scheduling, deferred driver/compositor work and GC cannot be distinguished by this trace. It is **unresolved**, not a proven GC diagnosis.
- Final Edge early Endless had one **141.8 ms interval**, including an **89 ms squad update**, without shader links or resource deltas in that interval. Nested audio/LOS/AI and scheduling cost is retained in the trace; one sample did not establish a recurring traversal trigger.

### Final short-route measurements

1280×720, diagnostic flags on, sequential browser runs. Firefox is **headed Firefox 155**; comparison is **headless Edge 154**. These are browser automation measurements, not a controlled desktop FPS comparison.

| Region | Edge p95 / worst ms | Firefox p95 / worst ms |
|---|---:|---:|
| M1 exterior | 54.9 / 94.7 | 62.9 / 63.4 |
| M2 Alpha | 36.4 / 53.4 | 32.1 / 93.4 |
| M2 Beta | 18.6 / 36.3 | 31.9 / 77.7 |
| M2 Gamma | 35.9 / 53.9 | 32.0 / 47.1 |
| M2 return/front | 36.4 / 37.6 | 47.0 / 61.7 |
| Facility interior | 36.3 / 53.9 | 46.8 / 61.3 |
| M4 service/exit | 18.6 / 53.6 | 31.8 / 32.1 |
| Campaign combat | 53.7 / 71.5 | 63.1 / 78.0 |
| Endless early combat | 18.9 / 141.8 | 32.0 / 123.1 |
| Endless later combat | 18.6 / 19.1 | 31.8 / 32.3 |

No quiet traversal sample exceeded 100 ms in this final pass. Earlier runs did, and the fast sweep still has longer intervals. No monotonically increasing hitching was observed during this **short**, roughly one-minute active Endless exercise; this is not a multi-hour soak. Edge exercised waves 1 and 2; the final Firefox run exercised repeated wave-1 spawning/combat without clearing every remaining hostile. Both died through an actual enemy attack and restarted through the real result input; restart kept three squadmates, reset wave to zero, removed enemies, and did not rebuild the arena.

**Renderer caveat:** final Edge reported AMD Radeon graphics through ANGLE/D3D11; final Firefox reported an AMD/ANGLE string ending “or similar” (privacy-reduced). `--enable-unsafe-swiftshader` permits fallback; it does **not** force SwiftShader. Baseline device identity was not captured, so those timings are not labelled as a confirmed software-renderer or hardware-controlled comparison. Historical 3.7 software-WebGL results are not reclassified by this report. Neither the GPU strings nor automation timings replace a test in the user's normal Firefox profile/version and display configuration.

## 6. Coverage and final validation

All four required suites pass **after the fixes in Edge and Firefox**, with no page errors. `intro-smoke.mjs` also passes with diagnostics disabled in both browsers.

Added:

- `tests/runtime-stability.mjs`: genuine menu/audio gesture; natural completion; early and touchdown skip; reusable media ownership; native pause/volume/ended evidence; slow-target arrival; flat pursuit; player input/collision/camera agreement. `--observe --baseline` reproduces old audio/AI behavior without rewriting project files. `--campaign` adds a contiguous accelerated campaign acceptance run and captures.
- `tests/traversal-performance.mjs`: regional real-input performance, texture hooks, counters and exact long-frame records; campaign combat; repeated Endless spawning/combat; death/restart; optional test-only `--shadow-control`. `--report` summarizes a saved run.

Updated:

- `tests/m2-progression.mjs`: bounded state-based real E hold, fixing the reproduced wall-clock test limitation.
- `tests/transition-diagnose.mjs`: page errors now fail the test instead of only printing.

Accelerated campaign acceptance passed in Edge and **headed Firefox**:

M1 gameplay → battery recovery → local power → command → Alpha → Beta → Gamma → **full W-key front return** → terminal → M3 lab/security/sample → containment encounter → M4 **W-key service exit** → purge/boarding → extraction/result.

M1 intro is separately played normally in the same harness; the subsequent fresh acceptance run skips that repeated intro. Distant objective approaches use setup teleports, relay defenses/containment completion/extraction use the existing timer/completion hooks, and invulnerability/quiet setup is used. E interactions, return/interior/exit walking and a short containment combat interval are real. This is **not** a full-duration, unassisted campaign playthrough. Saved-state continuity, all-three FOLLOW, perimeter/projectile checks and mission selection/Continue remain independently covered by the required suites.

East Hall remains closed; Containment north return remains 20 × 1.4 × 9 m; both M4 doors remain functional. Solids remain 306 and map segments remain 28. Captures at terminal, containment and final result were inspected.

## 7. Reproduction / review commands and artifacts

Use an installed Playwright package. In this environment:

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
node tests/runtime-stability.mjs --observe --baseline
node tests/runtime-stability.mjs --campaign
node tests/runtime-stability.mjs firefox --headed --campaign
node tests/traversal-performance.mjs
node tests/traversal-performance.mjs firefox --headed
node tests/traversal-performance.mjs firefox --headed --shadow-control
node tests/traversal-performance.mjs firefox --report
```

For a before-labelled performance recording use `--observe` **on the baseline checkout**; unlike runtime stability's `--baseline`, traversal's `--observe` only labels the output. Browser runs should be sequential to avoid comparison contention.

New uncommitted evidence is under `_playtest/m39/`:

- `runtime-edge-before.json`, `runtime-edge-after.json`, `runtime-firefox-after.json`: full media/movement/campaign evidence.
- `traversal-{edge,firefox}-{before,after}.json`: per-frame operation/event records; final `*-after-summary.json` files are compact human-readable summaries.
- `terminal-{edge,firefox}.png`, `containment-{edge,firefox}.png`, `campaign-result-{edge,firefox}.png`.

Runtime/performance runs overwrite their own labelled artifact; previous 3.8.1 files are not touched. Baseline runtime evidence is measured in Edge; Firefox received direct post-fix runtime, headed campaign and traversal validation. Earlier baseline Firefox regression/performance outcomes are recorded above.

### Deterministic manual capture

1. Open `chargefront.html?perfDiagnostics=1&movementDiagnostics=1` in normal desktop Firefox. Enable ALL SOUNDS. Let M1's covered preparation and normal intro finish; listen for the finite touchdown tail. Repeat with skip before and after touchdown.
2. After preparation, call `__cfPerf.reset(); __cfMovement.reset()`. Mark each leg with `__cfPerf.mark('leg name')`. Use normal walk/sprint/strafe/diagonal input and rapid mouse/direction reversals, then wall/prop contact and front-door entry/exit. Inspect the three FOLLOW members as they stop and turn.
3. Run Alpha→Beta→Gamma→front→terminal→M3→M4 normally. Record doors, re-formation after combat, close/long pursuit, obstacle steering and target switching. Download both `__cfPerf.download()` and `__cfMovement.download()` immediately after a noticeable hitch/jitter episode.
4. Repeat in Edge with the same resolution and route. Keep `perfGpuSync` off for feel/cadence comparisons. Remove diagnostic flags for a second subjective pass.
5. Play several Endless waves, including ranged/large enemy types, repeated effects, death and restart. A longer soak than this automated sample is still required before claiming time-independent hitch behavior.

## 8. Remaining limitations / acceptance decision

- **Proven fixed:** premature normal touchdown stop, full-volume engine replacement cut, false Infested stuck detection, and hard slow-target squad stop/go. Reusable intro elements and bounded skip/cleanup are additionally covered; no pre-existing duplicate-loop leak was claimed.
- **Regression gates passed:** accepted facility structure/progression, persistence, M2 front return, FOLLOW, pursuit across doors, combat, campaign transitions/result, normal intro, Endless spawning/combat and restart.
- **Still open:** perceived audio blend; visible player/camera/high-refresh stability; broad quick-turn/obstacle/target-switch visual acceptance; the user's normal Firefox profile/version; unexplained RAF gaps and a long-duration Endless soak.
- First-world shader compilation remains initial preparation work. Some first-use enemy/effect resources still allocate during combat; no broad pooling rewrite was justified.
- Diagnostic captures can impose overhead. A small automated sample and inspected still images cannot certify motion smoothness or replace listening.

**Review-ready does not mean all 3.9 acceptance gates are closed.** The implementation and reasonable automated checks are complete for the reproduced issues. Desktop feel and remaining Firefox stalls require the capture/review above before declaring Milestone 3.9 fully accepted. Work stops here; no Milestone 4.0, loadout system, or 4.1 prop pass was begun.
