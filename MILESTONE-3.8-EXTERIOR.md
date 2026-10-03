# Milestone 3.8 — facility presentation audit and exterior checkpoint

This is the historical exterior checkpoint. The [corrected 3.8.1 report](MILESTONE-3.8.1-REFINEMENT.md) supersedes its doorway/perimeter state: M2 returns through the front entrance, the east Hall door is removed, and the Containment north return is structurally repaired. Baseline tables below intentionally retain the measurements taken at this checkpoint.

## Pre-edit audit (merged 3.7)

Read `FACILITY-ARCHITECTURE.md`, the 3.7 diagnosis/transition notes, facility/playthrough regression harnesses and `src/world/facility.js`; inspected saved `facility-captures` exterior, cutaway and room views and `_playtest/16_facility_overview.png`. The cutaway reference establishes the *layout*, not a mandate to fill every floor. Interior reference captures are especially dark and sometimes show background terrain beyond a wall; gameplay needs to remain legible under the eight-slot light budget.

| Area | Identity and landmarks | Readability / lighting / density | Combat clearance and inexpensive opportunity |
|---|---|---|---|
| Main Hall | Cyan center lane, orange service and blue command signs, wall screens and equipment | Good arrival axis, but roof and dark wall mass obscure the exterior identity; screens are stronger than ambient surfaces | Preserve the central formation/door lane; later group existing service equipment into a visible functional bay rather than filling the lane |
| 3-Relay Vault | Three relay indicators, corner guards, warm source light | Compact and distinct but blue screen accents compete with the warm lock motif | Keep central relay interaction and doorway clear; later use a small consistent lock/relay color language |
| Decontamination | Parallel cyan frames, nozzles, pair of side machines | Bright threshold lines but otherwise reads as a short pass-through | Keep the full 12–16 m crossing; later add repeated, shared wall-level decon labels / splash guards |
| Research Lab | Analysis benches, cyan floor guide, sample screens | Large floor feels sparse in captures and most surfaces recede into black despite authored light | Preserve long sightline and low-cover shots; later emphasize bench clusters and reflected/emissive wall panels without more PointLights |
| Security | Amber console, paired workstations, bank of cabinets | Functional anchors exist, yet banks can read as isolated dark boxes | Retain 13 m partition opening and console access; later link bank/workstation readouts visually |
| Containment / Deep Lab | Tube, rings, pods, magenta emergency accents | Strongest identity, but red/pink dominance and dark perimeter reduce combat silhouettes | Preserve vial annulus, service exit and cover heights; later balance with cyan/neutral guide illumination rather than more red lights |
| Service / Power | Four generators, orange floor guide, emergency-exit label | Equipment is coherent but the passage can disappear against the darker end wall | Keep both service doors and the exit lane unobstructed; later add repeated power-circuit labels to existing wall faces |
| Exterior/front approach | Gate, high BIO-RESEARCH sign, staging board, lane dashes and edge cargo | Gate landmark is dwarfed by blank low roofline and large dark boxes; no readable overhead industrial silhouette | Keep `(360,585–618)` and squad access clear; add upper facade/canopy, roof profile and wall-side markings only |
| Exterior sides/backyard | Conduits, isolated vents, mast, loading platform, service door | Broad dark side/back roof masses; service wing is hard to distinguish at distance; sparse edge utility detail | Keep west/east Beta→Gamma bypass and yard generous; concentrate repeated roof units, wall conduits and wayfinding above head height |

**Pre-edit browser baseline:** `PLAYWRIGHT_PACKAGE=C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs node tests/facility-regression.mjs` (Edge/SwiftShader, 1280×720, mission-select M2, 272 sampled A–E frames): 1,300 render calls, 293,892 triangles, 2,071 unique scene geometries, 1,641 materials, 307 solids, 8 light slots, 23 programs; 0 traversal shader links / world builds / collision-grid rebuilds / geometry or material creations. p95 33.4 ms, worst 150 ms in software WebGL (not desktop FPS). Sampled M2 route already has intentional relay/prop hits; bypass anchors and center approach are clear.

## Exterior checkpoint

`buildExteriorDetail()` now uses cached `envBoxGeometry`/`envMat` for perimeter parapet segments, repeated five-bank roof ventilators, raised ducts with cyan non-light-emitting guides, and two small antenna crossbars above the service wing. Existing cutaway toggles include all new roof pieces. A shallow entry canopy, repeated high wall-side utility guides and four ground-painted entrance shoulder marks define the front; the existing staging sign moves to the side so it no longer hides the facility name. One orange service-egress sign identifies the wing from its backyard side. No roof or high facade piece creates a collision solid, real PointLight, shadow caster or new navigation route. The existing foundation, doors, yards, Beta→Gamma bypass and room content are unchanged.

Existing steel/comms/service palette, shared cached box primitives and `makeFacilitySign()` are reused; only the new sign needs a canvas texture/material. Repeated rails/slats use the same box dimensions and cached materials. The pre/post traversal scene UUID counts below include randomized world/encounter assets, so they are *scene totals*, not an exact enumeration of unique facility resources.

| Edge/SwiftShader A–E (same 272-frame 14 m/RAF harness) | Before | After | Difference |
|---|---:|---:|---:|
| Render calls | 1,300 | 1,321 | +21 |
| Triangles | 293,892 | 293,000 | -892 (random world/frustum variation) |
| Unique scene geometries | 2,071 | 2,099 | +28 |
| Unique scene materials | 1,641 | 1,649 | +8 |
| Scene meshes | 2,321 | 2,381 | +60 |
| Solids / rendered light slots / shader programs | 307 / 8 / 23 | 307 / 8 / 23 | unchanged |
| Traversal links / world builds / nav-grid rebuilds / geometry and material creations | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 | unchanged |
| p95 / worst interval (software WebGL, not desktop FPS) | 33.4 / 150 ms | 33.5 / 166.5 ms | incidental scheduling variance |

**Validation:** `node tests/facility-regression.mjs` and `node tests/facility-playthrough.mjs` passed with the documented external `PLAYWRIGHT_PACKAGE`. Regression checks M1–M4 continuity, 8 slots, static solids, low-cover/over-cover projectile LOS, open research partition, sample and extraction, M2 west/east waypoints, sampled south-bypass/entrance shoulder clearance and an unobstructed bypass projectile line. The A–E fast forward/reverse traverse has zero shader links or movement allocations/rebuilds. Real W-input crosses every door and service exit, follows with squad, fights in the hall and pursues hostiles through hall and both service thresholds; no links, builds or nav rebuilds in that traversal. `node tests/transition-diagnose.mjs` passed five visible M1 intro cuts and M2→M3→M4/result with zero transition shader links. Its covered first-use prewarm remains an initial loading cost.

Saved evidence: `_playtest/m38-exterior/facility_front.png`, `facility_front_right.png`, `facility_rear_right.png`, `facility_overview.png`, `facility_cutaway_overview.png`. The capture script's per-view process allowance was raised from 45 to 90 s to accommodate elevated software-WebGL views. These are reference/capture-mode images, not measured gameplay brightness.

**Recommended interior follow-up (not implemented at this stop point):** Work from gameplay-height screenshots first. Distinguish Research's cyan analytical benches from Security's amber control banks with a few *shared* emissive wall/readout shapes; use cool/neutral guides and selective high-contrast surfaces to balance the red Containment emergency state. Preserve the decon lane, vault relay pads, security partition, specimen annulus and two service doors. Inspect low-cover silhouette and room-to-room enemy/player jitter under real movement before changing AI. Separately check intro landing-loop fade timing against `playIntroSfx()`/`stopIntroSfx()`; the reported abrupt ending is an audio follow-up, not a reason to modify the exterior checkpoint.
