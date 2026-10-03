# Milestone 3.8.1 — corrective revision for gameplay review

**The experimental relay-service detour was removed after gameplay review.** This document supersedes the earlier 3.8.1 report and its service-door captures. No commit, push or tag has been made. Session 3 movement/audio work remains paused.

## Canonical Mission 2

**Alpha → Beta → Gamma → front entrance → existing command terminal → Mission 3.**

Phase sequence: `MOVE_R1 → DEFEND_R1 → MOVE_R2 → DEFEND_R2 → MOVE_R3 → DEFEND_R3 → M2_CONFIRM → M3_ENTER_LAB`.

- Beta resumes the existing exterior Gamma/bypass route immediately.
- Gamma does **not** finish M2. It enters `M2_CONFIRM` and checkpoints the three completed relays.
- Objective: `RELAY GAMMA ONLINE — return through the front entrance to the facility command terminal`.
- Prompt at the unchanged command terminal `(382,648)`: `HOLD [E] — REACTIVATE FACILITY TERMINAL`.
- Return path: Gamma → `(505,605)` → `(455,600)` → `(400,600)` → front approach `(360,610)` → Hall lane `(360,628)` → terminal `(382,648)`.
- HUD markers and minimap follow that route; inside the Hall the primary marker becomes the terminal.
- Outside M2 FOLLOW/pursuit agents targeting the Hall use a front gateway, then the center of the doorway before indoor steering. No general navigation-system replacement.

## Removed systems and east-wall replacement

Deleted the live service phase, both service flags/defaults, breaker/bus anchors and interactions, special route constants, service marker/prompt/denial branches, state setter, relay-service capture flags/views and `tests/relay-service-access.mjs`. Gamma's direct-completion branch is gone. There is no remaining service quest or usable east Hall entry.

The side-door panels/solid at `(390,644)` and its frame, jambs, canopy, sign, breaker/feed, status panels, bus and threshold are removed. `HallEastPerimeterWall` is a continuous **2 m thick × 9 m high** wall from `y618` to `660`. Minimap wall segments and yard guidance no longer imply an entrance. The valid generic `axis === 'y'` seam correction remains for the M4 doors.

## Deep Lab missing-wall root cause and repair

The actual missing perimeter was **`x390–410,y735`**, at Containment's north return. The authored Research/Containment transition wall ended at Research's width (`x390`), while Containment continues to `x410`. The uncovered 20 m section allowed exterior sky/terrain visibility and actor/projectile passage. Archive decoration was not a structural repair.

`ContainmentNorthReturnWall` is now a **20 m long × 1.4 m thick × 9 m high** structural wall, using the same builder, material and height-aware collision as adjacent lab walls. Its base meets the existing floor and its top meets the ceiling underside. It joins the Research east wall and Containment east perimeter. The legitimate doors `(410,752)` and `(450,752)`, specimen anchor/annulus, low-cover behavior and M4 escape lane are preserved.

Retained: `ArchiveMonitorBay`, `ArchiveMonitor`, `ArchiveStatus`, `ContainmentWallRib`, `ContainmentWallConduit`, `ArchiveCeilingFeed`, `ArchiveCeilingSupport`, and the Research/Power readability additions. No extra rendered lights or global brightness changes.

**Static solids: 307 → 306.** Two old Hall east segments merge into one (-1); deleting the side sliding-door solid removes one (-1); adding the physical Containment wall adds one (+1). This is a legitimate structural count change, not a retained numerical target.

## Checkpoint compatibility

Normal pre-experiment saves retain their canonical M2 phases/relay completion data. At checkpoint restoration only:

1. Retired numeric phase **30** with Gamma unfinished maps to **`MOVE_R3` (6), main index 2**.
2. Phase 30 with saved Gamma powered (or `relaysOnline=true`) maps to **`M2_CONFIRM` (18), main index 4**.
3. `relayServiceUnlocked` and `relayFeedRerouted` are stripped from restored/checkpoint world-state; there are no live consumers.
4. A normalized phase-30 checkpoint is saved immediately so the obsolete phase is not re-saved.
5. Saved actors embedded in either repaired wall are moved just outside that wall before normal collision resolution. HP/ammo/optional/squad data and the existing enemy-restoration policy are unchanged.

## Validation

All required suites passed on Edge/SwiftShader, with zero page errors in the regression/playthrough/progression harnesses:

- **`tests/m2-progression.mjs` (new):** real E at Alpha/Beta/Gamma; existing timer-completion hook skips the sixty-second defenses. Beta directly enters Gamma travel. No breaker/bus interaction/mesh remains. Real W movement cannot cross the east wall (`x391.5` stop). Continue works before Gamma, after Gamma and at the terminal. The *entire* return from Gamma to command is walked with W, not teleported. All three squadmates follow through the front doorway without embedding. Real E at command starts M3. Both retired phase-30 migrations persist correctly; Mission Select starts fresh Alpha. An east-side runner goes around the closed wall and enters via the front doorway.
- **`tests/facility-regression.mjs`:** perimeter collision/projectile probes in both directions at `z0.5,1.8,8.8`, M1–M4 continuity, M3 specimen, M4 purge/boarding/result, room/cover checks, Mission Select, Continue and Endless. Repaired-wall geometry is exactly 20 × 1.4 × 9 m; sampled leaks: zero.
- **`tests/facility-playthrough.mjs`:** the repaired north wall blocks W walking at `y736.2`; normal walking/sprinting through all facility sections, FOLLOW, squad combat, Hall pursuit in both directions and both M4 service thresholds still pass.
- **`tests/transition-diagnose.mjs`:** five visible M1 intro cuts and M2→M3→M4/result remain shader-link-free. Covered initial prewarm still occurs as initial-load work.

## Performance before / after

Same established A–E spatial stress sweep, 272 frames at 14 m/RAF, 1280×720. `setNoSpawn(true)` isolates facility/world churn. The stress sweep intentionally retains its old coordinates for comparison (including a debug-movement crossing of the now-closed east wall); the separate real-input M2 test proves the playable front route. Measurements are software WebGL, not desktop FPS; randomized world/frustum content affects aggregate counts.

| Metric | M3.7 merged baseline | Experimental 3.8.1 | Corrected 3.8.1 |
|---|---:|---:|---:|
| Render calls | 1,300 | 1,429 | **1,368** |
| Triangles | 293,892 | 298,412 | **295,727** |
| Unique scene geometries | 2,071 | 2,149 | **2,136** |
| Unique scene materials | 1,641 | 1,698 | **1,684** |
| Scene meshes | 2,321 | 2,416 | **2,400** |
| Solids | 307 | 307 | **306** |
| Persistent light slots / programs | 8 / 23 | 8 / 23 | **8 / 23** |
| Traversal shader links | 0 | 0 | **0** |
| World / facility builds / grid rebuilds | 0 | 0 | **0 / 0 / 0** |
| Geometry / material creations | 0 / 0 | 0 / 0 | **0 / 0** |
| Geometry / material disposals | — | — | **0 / 0** |
| p95 / p99 / worst interval | 33.4 / — / 150 ms | 50.2 / — / 133.4 ms | **33.3 / 66.5 / 150.1 ms** |

The real W-key Gamma-to-terminal return independently reports zero links, world/facility builds, grid rebuilds, geometry/material creations and disposals. Only shadow refresh and an existing scene-object removal were observed. Static walls are constructed once through the existing builders; archive repetition stays instanced/cached.

## Fresh visual evidence

Command: `node capture-facility.mjs _playtest/m38-1-correction correction --gameplay-lights`.

M2 views automatically use a post-Gamma `M2_CONFIRM` snapshot and show the HUD; other gameplay-height views use eight-slot lighting. The cutaway views retain the explicit reference fill. All images were inspected; the repaired boundary is solid from both sides, the east door is gone, and the M2 front-entry objective and terminal prompt are visible. Exterior visibility through the **intentional open M4 exit** is expected in the transition capture.

| Evidence | File under `_playtest/m38-1-correction/` |
|---|---|
| Repaired missing perimeter, interior FPS height | `facility_containment_gap_interior.png` |
| Same repaired perimeter facing inward from outside | `facility_containment_gap_exterior.png` |
| Deep Lab specimen view / archive rear wall | `facility_interior_deeplab.png`, `facility_containment_wall.png` |
| Legitimate Containment → Service transition | `facility_containment_transition.png` |
| Exterior rear/right | `facility_rear_right.png` |
| Cutaway overview / top-down | `facility_cutaway_overview.png`, `facility_cutaway_topdown.png` |
| Former east door, continuous wall | `facility_east_wall.png` |
| Facility front | `facility_front.png` |
| M2 after Gamma, return objective/minimap | `facility_m2_return.png` |
| M2 front-door approach | `facility_m2_front.png` |
| Final M2 terminal interaction prompt | `facility_m2_terminal.png` |

Old `_playtest/m38-1/` images are historical experimental evidence, not the current build.

## Changed files and stop point

`src/world/facility.js`, `chargefront.html`, `capture-facility.mjs`, `tests/facility-regression.mjs`, `tests/facility-playthrough.mjs`, new `tests/m2-progression.mjs`; obsolete `tests/relay-service-access.mjs` deleted. Updated `FACILITY-ARCHITECTURE.md`, this report and historical-checkpoint notes in `MILESTONE-3.8-EXTERIOR.md` / `MILESTONE-3.8-INTERIOR.md`. New captures are in the directory above.

The repaired wall remains intentionally dark but no longer exposes the exterior. Some old environmental signs/readouts still have simple low-poly styling; broader presentation/brightness work and the landing-audio/jitter review are outside this correction. The build is **ready for user review**, not automatically approved for commit or Session 3. No commit, push, tag, architecture redesign or movement/audio polish was performed.
