# Charge Front — Milestone 4.2: Environment & Final Prop Pass

**Current checkpoint: CP2 — CF-07 Facility Exterior Enhancement, complete for
review.** STOP at CP2: no interior-room pass, CP3–CP5 work, commit, merge or push.
See the CP2 implementation/visual-validation record at the end of this document.
CP0–CP1 records below are retained as accepted historical baseline evidence.

## CP0 status and scope

**CP0 COMPLETE — initialization, implementation audit, inspected visual evidence,
and representative browser baseline. STOP HERE.** Date: 2026-10-11.

At the CP0 stop, CP1–CP5 below were proposals, not implemented checkpoints. No environmental
geometry, terrain, materials, lighting, collision, gameplay, or production test
code was changed. Session additions are this report and new CP0 evidence/observation
scripts under `_playtest/m42/cp0-20261011/`. Nothing is staged or committed.

Objective: improve environmental completeness, functional storytelling, prop
placement, terrain composition and cover/interactable readability while retaining
the accepted playable 4.1 game. Scope excludes mission redesign, facility
reconstruction, enemy expansion, combat rebalance and navigation/physics rewrites.

## 1. Verified Git starting point

| Item | Verified state before changes |
|---|---|
| Starting branch | `main`, tracking `origin/main` |
| HEAD | `5c8704fabd6b6bc732a8b74c6020ab2b2d31a689` (`5c8704f`) |
| Subject | `fix(m4.1): synchronize adaptive guidance and convert ARC to hitscan` |
| Accepted baseline refs | Local `main`, `origin/main`, `milestone-4.1` and `origin/milestone-4.1` point to that commit |
| New branch | `milestone-4.2`, created with `git switch -c milestone-4.2 5c8704fabd6b6bc732a8b74c6020ab2b2d31a689` |
| Existing tracked work | `Credits.txt`: recovered `- Purple spot terrain (Generated with GPT Image)` attribution |
| Existing stashes | None listed |
| Material baseline conflict | None; same-commit branch creation safely retained local changes |

Verification used status, branch listing, HEAD/ref resolution, recent history,
HEAD stat, milestone reports and the Credits diff. The remote-tracking ref is a
**local observation**; this session did not fetch or claim to verify the live
remote. No push, main update, reset, clean, stash operation, merge or commit.
No workspace `AGENTS.md` was found.

Preserved pre-existing untracked artifacts:

- `_playtest/m38-1/`, `m38-exterior/`, `m38-interior-before/`,
  `m38-interior-emergency/`, `m38-interior/`.
- `_playtest/m38-1-correction-screenshots.zip`,
  `m3_8-1-related-screenshots.zip`, `m3_8-related-enhancement-screenshots.zip`.
- `_playtest/m39/traversal-{edge,firefox}-{before,after}.json`.
- `_playtest/m40/regressions/traversal-{edge,firefox}-after.json`.

At CP0 completion HEAD and `main` still resolve to the baseline. Credits retains
exactly its original one-line local diff. The new report and `_playtest/m42/` are
untracked; existing dirty/untracked work remains present.

## 2. Documentation and actual source ownership

Read README, Credits, `FACILITY-ARCHITECTURE.md`, the 3.7 diagnosis/transition
reports, 3.8 exterior/interior reports, corrected 3.8.1 report, 3.9 runtime report,
relevant 4.0 combat architecture, 4.1 additional refinement and combat/VFX reports,
and the final `MILESTONE-4.1-ROUTE-HITSCAN-CORRECTION.md`.

Historical 3.8 reconstruction/experimental-side-door captures and older 4.1
three-second guidance/traveling-ARC descriptions are not the current baseline.
Current source confirms one-second adaptive guidance and immediate ARC hitscan.

| Concern | Current implementation inspected | Constraints/opportunity |
|---|---|---|
| Facility generation | `src/world/facility.js`: `create`, retained `buildSection`, `buildShell`, `buildHallEquipment`, `buildHallInterior`, `buildHallServiceYard`, `buildExpansion`, `buildExteriorDetail`, `buildInteriorIdentity`, `buildLaboratory` | Classic-script injection retains `file://`; six persistent sections: shell, hall, staging, laboratory, exterior, interior. HTML remains the coordinator. |
| World lifecycle | `chargefront.html`: `buildCampaignWorld` (~8563), snapshot/mission initialization and chapter transitions | World builds once; relays/facility/extraction/cover/state layers precede scatter. M1–M4 toggle retained state. |
| Campaign terrain | HTML: `terrainHeight`, `FLATS`, `TERRAIN_SHAPES`, `distToRoute`, `WORLD_PATHS` (~470–589), `buildTerrain` / `buildTerrainBoundary` (~1011–1145) | Noise, Beta ridge/Gamma depression, route valleys, LZ flattening; 800 m world, 320-segment terrain (2.5 m cells), shared textured outer rim. |
| Facility foundation | Facility `foundationHeight`, three footprint rectangles | Exact footprint grading, 18 m smooth blend. Keep floors/door approaches free of terrain intrusion. |
| Outdoor props | HTML: `buildDecor`, `makeWeirdRock`, `makeInfestedTree` (~2259–2515); `buildCombatSpaces`, `buildRelayArena`, `buildRelayIdentity` (~1889, 2632, 2726) | Authored clusters plus bounded random scatter. Trees/rocks individually built; pebbles/spores/plants instanced. Route/height/radius/center-solid exclusions exist, not complete footprint/slope validation. |
| Placement helpers | HTML: `envBoxGeometry`, `envMat`, `envBoxMesh`, `envBox`, `envPipe`, `envClearPoint`, `addRotatedSolid` (~2556–2628) | Reuse these; note `envBoxMesh` shares geometry but calls `mat` (a new material), while `envMat` explicitly caches static materials. Most bases sample only center height. |
| Endless world | HTML: `endlessTerrainHeight`, `buildEndlessDecor`, `buildEndlessWorld` (~3243, 3320, 3872); `src/progression.js`: `seedRandom` | Valley/crater/ridges; 250 m radius, clear central pad, seeded scenery retained through Continue/restart. Separate world; no facility sections. |
| Movement collision | HTML: `SOLIDS`, 32 m static buckets, `resolveCircle`, `isInsideSolid` (~1757–1828) | Ground movement uses XY rectangles regardless of height; door disabled flags toggle in place. Geometry is not automatically collision. |
| Projectiles/LOS | HTML: `solidBlocksSegment`, `hasLOS`, ordinary projectile update, ARC `arcSurfaceContact` / `predictArcEndpoint` / `resolveArcHitscan` (~6849, 6862, 7211–7450) | Height-aware footprint/segment tests; ARC has 3D slab/terrain/hostile nearest-hit authorization. Keep visible cover and authoritative bounds coherent. |
| Player/squad/Infested | HTML: `movePlayer`, Infested integration/stuck recovery, `SquadMember.moveToward`, `findSpawnPoint` (~5077, 5847, 6686, 6331) | `MAX_STEP=2.6`; player radius .5, squad/hostiles .4 during movement, spawn solid clearance .8. FOLLOW/separation/evasion and local steering need broad clear lanes; no general mesh navmesh. |
| Agent facility routing | Facility `navigationWaypoint`; HTML front-gateway wrapper (~511) | M2 west/east south bypass; Hall targets route around closed east wall to the front. Doors admit nearby living squad/hostiles only when unlocked. |
| Player guidance | `src/relay-routing.js`; HTML `relayGuideSegmentClear` / `updateIntelRouteProgress` (~3043); `src/presentation-ribbons.js`; facility `guidanceHeight` | Reward-gated A*, 4 m graph, .65 m solid clearance, terrain checks, 1 s replan, 10 Hz visible attachment, correct Hall floor elevation, <7 m arrival latch. Ordinary markers are direction/distance, not guaranteed walkable lines. |
| Interactables/state | HTML `buildCampaignObjectives`, `updateInteract`, locker/escort/lab/extraction systems (~8584, 9270–9520); `src/progression.js`, `src/combat.js` | Keep physical anchors, durations, LOS/ranges, rewards, inventory and save ownership. No new interaction mechanic is needed for storytelling. |
| Materials/lighting | Environment caches; facility `detailBatches` / `InteriorIdentityBatch`; HTML `ensureLocalLightSlots`, `addBudgetLight`, `updateBudgetLights`, prewarm helpers (~947, 7598, 6942) | Eight persistent budget slots; preserve other accepted direct lights and mode/source eligibility. Static instancing and emissive surface detail preferred over extra lights. Animated material references must stay independent. |
| Rendering cadence | HTML `initWorld`, facility `updateFx`, shader preparation and diagnostics | ACES exposure .78, 40–280 m fog, 2048 shadow map with explicit ~12 Hz refresh; facility FX 12 Hz / 190 m. No per-traversal construction. |
| Capture/testing | `capture-facility.mjs`, HTML capture views + `__cf`/`__cfPerf`/`__cfMovement`, browser harnesses below | Existing real file:// game, Playwright Firefox/Edge, native-key traversal, cutaways and profiler receipts. No Godot project/tooling is involved. |

### Anchors and protected space

- M1: LZ `(450,80)`, insertion touchdown `(436,90)`, road/staging/front route;
  battery `(321,603)`, local power `(344,630)`, command `(382,648)`.
- M1 optional: scan `(398,470)`, auxiliary cell `(288,620)`, sensor area near
  `(331,630)`, locker console `(376,626)`, supply pickups `(373,624)/(379,624)`.
- M2: Alpha `(205,575)`, Beta `(245,748)`, Gamma `(575,585)`;
  survey dock `(205,600)` and authored escort route; bypass `(285,585)/(450,570)`;
  canonical Gamma return through `(505,605) → (455,600) → (400,600) →
  (360,610) → (360,628) → (382,648)`.
- Interior: Hall `x330–390,y618–660`; Vault `x342–378,y660–684`;
  Decon `y690–704`; Research/Security `y704–735` with 13 m partition opening;
  Containment `x330–410,y735–795`; Power Wing `x410–450,y736–770`.
- M3: Security `(376,718)`, optional turret console `(342,711)`/turret `(342,744)`,
  sample `(360,774)` and its approximately 12 m diameter clear annulus.
- M4: interior service door `(410,752)`, exterior exit `(450,752)`, established
  outdoor escape route; beacon `(466,96)`, boarding `(450,80)`, cache `(438,96)`
  and four authored purge nodes around the transport.
- Endless: relay `(400,400)` (<8 m interaction), vial `(413,400)` (<4.5 m),
  spawn `(400,442)` and central movement/combat pad.

Protect the **full prop footprint and interaction approach**, not just each
anchor point. Door travel, formation width, low/standing shot lanes, hostiles'
pursuit, spawn lanes, ground pickups and guide visibility all count.

## 3. CP0 environmental audit

Classification: **A** visually unfinished; **B** incorrect placement/scale;
**C** weak environmental identity; **D** navigation/collision concern;
**E** rendering/performance concern; **F** acceptable — preserve.
Tags can coexist: an acceptable layout can have a specific presentation defect.
Visual findings below come from inspected fresh images; code-only risks are
explicitly identified. Empty combat floor alone is not an A finding.

### Exterior — individually reviewed

| Location | Findings / classification | Minimal future action; F preservation |
|---|---|---|
| M1 landing area | **A/C:** broad open purple ground and generic distant blocks communicate little about the abandoned approach road. **F:** recognizable transport, valley silhouette, open apron and initial direction. | One coherent road-shoulder logistics/wear motif using current assets; retain landing camera/ship footprint, transport purge region and the open departure corridor. No extra cover field. |
| M2 Alpha | **B/D:** seeded eye-level view has a nearby random tree overlapping the relay silhouette/approach view. **A/C:** service shed/transformers often read as featureless dark blocks. **F:** lowland utility identity, dock, grouped hardware, existing low/tall cover. | Footprint-aware scatter exclusions around functional frontage; detail existing utility surfaces. Keep relay range, dock/escort clearance and defense/spawn lanes. |
| M2 Beta | **B:** long center-height floor marking floats on the downhill side and sinks uphill; quantified below. **A:** dark cover modules; dish is partly outside this close camera, not missing. **F:** elevated ridge, tall dish/masts and cyan communications identity. | Conform small visual marking segments to terrain; selective existing equipment readouts. Do not flatten the ridge, relocate mast/relay or replace retaining cover. |
| M2 Gamma | **C/B risk:** collapse/contamination is recognizable, but uncollidable growth and opaque debris share solid-cover silhouettes; broad flat pools/strips use one center height. **F:** green warning motif, damaged gantry/pylons, crater contrast and existing irregular low cover. | Clarify decorative debris/growth versus reliable cover; verify grounding before changing any item. Preserve the damage story, relay approaches and defense geometry. No additional infestation mechanic. |
| Facility front entrance | **A/C:** useful CF-07 sign/canopy exist, but facade and roof remain predominantly dark slabs; identity relies heavily on glowing stripes. **F:** readable near entrance landmark, clear center approach, intact automatic front door. | Improve relief/edge contrast and restrained functional labeling on existing facade/roof pieces. Preserve `(360,585–618)`, door sweep and arrival axis. No larger gate or new entrance. |
| Facility perimeter / service-side exterior | **B/D:** legacy zero-base containers are substantially buried; side-facing loading sign is a vertical banner. **A/C:** wide east/rear wall/roof masses obscure utility organization. **F:** continuous east Hall wall, repaired Containment return, open bypass/service yard and distinct power-wing outline. | Correct specific sign orientation and grounding; visually link existing loading/cable/vent groups. Preserve perimeter and service-side travel, especially M4. No service quest, fence enclosure or extra structure. |
| M4 escape approach | **B:** vertical exit sign appears to hang down from/above the roof in the outward-facing view. **A/C:** outdoor route uses isolated poles/growth rather than a coherent maintenance/evacuation story. **F:** service generators, orange aisle/red exit, functioning doors, emergency state and transport/beacon landmarks. | Correct sign basis; restrained shoulder wear/utility continuity and clearer existing equipment. Keep the two doors, entire escape route, cache, purge nodes and boarding apron. |
| Endless terrain / combat spaces | **A/C:** valley/crater center views are visually similar; repeated purple surface and luminous dots dominate broad empty midground. Crater has especially little scenery on its flattened center; ridges supply stronger terrain contrast. **B/D risk:** center-based exclusions and no slope/footprint gate on scatter. **F:** readable relay/vial, generous arena center, three accepted terrain choices, seeded solid scenery. | Improve non-solid shoulder composition/asset grouping outside protected center and sightlines. Preserve terrain formulas, arena limits, seeded solid layout and wave behavior; no new center cover or facility assets. |

### Interior — individually reviewed

| Room | Findings / classification | Minimal future action; F preservation |
|---|---|---|
| Main Hall | **A/C:** logistics equipment is recognizable but still generic; broad dark wall/ceiling areas and plain blocks reduce functional storytelling. **B:** east/west sensor/locker signs have rotated vertical text. **F:** amber/cyan functional split, central lane, ceiling beams, door/vault axis and wall-side cargo. | Correct signs and refine a few existing rack/console faces. Preserve floor height, current solids, guide surface query and formation lane. No filling the central floor. |
| Three-Relay Vault | **A/C:** three matching housings/cable feeds establish identity, but their function depends on simple light bars. **D visual concern:** broad overhead north screen crosses the doorway projection and can read as an obstacle; tested eye-height passage remains clear. **F:** compact lock space, overhead housings, warm panels and open center. | Small distinct relay/status labels or face detail; keep overhead detail safely recognizable as overhead. No new ground housings, alternate door or center cover. |
| Decontamination | **B:** a legacy randomly placed magenta patch appears inside the cool decon bay; seeded probe reproduces it. **C:** nozzle/frame/panel identity is present, but sterile process detail is sparse. **F:** cool threshold language, side machinery, wide clear crossing. | Keep random exterior growth outside the actual room footprints; optional repeated wall-level process/status detail. Preserve the full crossing and nozzles; no spray effects/lights needed. |
| Research Lab | **B/D:** existing blue bench instruments rise to 2.075 m but the solid top beneath is only 1.15 m, producing apparent cover that does not block shots at that height. Side research sign extends above the ceiling. **A/C:** analytic bays remain very box-like/dark. **F:** two bench groups, low-cover behavior, cool panels, central/diagonal routes and turret-console access. | Make visual instruments consistent with the accepted low-cover envelope rather than raising cover throughout the room; correct sign and add restrained instrument/readout specificity. Preserve sightline tests and floor area. |
| Security | **B:** side operations sign is vertical and extends above the ceiling. **A/C:** cabinet/monitor banks have weak detail hierarchy. **D code-review risk:** monitor visuals exceed desk solid height; distinguish these from full-cover server banks. **F:** amber console, actual tall banks, two workstations, 13 m partition opening and override access. | Correct sign; improve monitor/control-bank hierarchy within existing footprint. Keep the console unambiguous and all interaction/partition space clear. Verify local visual-versus-shot envelope before any adjustment. |
| Containment / Deep Lab | **A:** upper surfaces remain very dark, with a strong magenta center; some archive panels are simple rectangles. **F:** strongest room identity: sample chamber, rings, pods, cool perimeter panels, clear annulus, repaired wall, wall-side archive equipment and balanced emergency state. | Preserve focal chamber and annulus; only selective contrast/functional archive face detail if normal eye-level silhouette comparison demonstrates a benefit. No more central objects, red wash or larger chamber. |
| Service / Power Wing | **B:** `EMERGENCY EXIT` sign is 8 m vertical rather than 8 m horizontal, reaching z11.2 above the ~9 m room. **A:** generators retain simple black-box faces. **F:** four tall-cover generators, amber access/status/buses, clear center aisle, red threshold and both functional doors. | Correct exit sign and refine existing machine faces using shared static detail. Preserve generator footprints/heights, aisle, door sweep and emergency lighting hierarchy. |

### Quantified placement/readability findings

Retained in `details/details.json`, `firefox-audit-verified/audit.json` and compact
`baseline-summary.json`:

1. **Side-facing sign basis:** `makeFacilitySign` produces a width-oriented XY
   plane; using only `rotation.y = ±PI/2` makes that width vertical. Research
   `(331,710,6.4)`, width 9.5, spans **z1.65–11.15**; Security width 8.5 spans
   **z2.15–10.65**; exit `(449,752,7.2)`, width 8, spans **z3.2–11.2**; loading
   `(415.4,668,7)`, width 9, spans **z2.5–11.5**. Main Hall sensor/locker signs
   are also vertical. These are presentation defects, not failed door collision.
2. **Zero-base yard equipment:** containers at `(424,700)`, `(418,693)`,
   `(427,706)` sit on authored z0 while ground centers are **2.07 / 1.76 / 2.23 m**.
   The west container `(296,690)` is under **5.66 m** ground (above its entire
   2.6 m height). The wreck `(428,596)` also uses z0 under **1.57 m** ground.
   Sampled axis-aligned corner ground ranges are .24–.87 m for the containers;
   exact rotated-footprint measurement is still needed for a correction.
3. **Legacy facility patch scatter:** `buildHallServiceYard` chooses five points
   46–72 m around `(360,650)` without room/solid/route exclusions and places them
   at z.35. Seed `420042` puts one at **(388.15,699.75)** inside Decon. Other sampled
   patch bottoms are below local terrain by ~1.16–3.68 m. Intentional partial
   burial of a growth base is reasonable; whole misplaced/hidden patches are not.
   The raw capture probe also matched an unrelated mesh at `(0,0)`; the compact
   summary excludes it. It is not a sixth facility patch.
4. **Beta visual marking:** 42 m wide strip at `(245,748)` has base **17.414 m**;
   ground along its width is **20.246 → 13.684 m**. Approximately 2.83 m burial
   uphill and 3.73 m air gap downhill. This is a single-height visual strip, not
   a walkable platform; conform the marking instead of changing the ridge.
5. **Research visual-cover mismatch:** two blue instruments at `(348,714/722)`
   occupy z**1.325–2.075**, with only z**0–1.15** solid beneath. Existing room
   tests correctly prove firing over low benches but do not test every decorative
   instrument volume. Avoid interpreting that PASS as complete visual/shot parity.

### Cross-cutting D/E risks and F systems

- Scatter currently checks height/route distance and mostly **center** clearance.
  It does not validate scaled/rotated full footprints, corner support, terrain
  slope or every mission interaction zone. This is a code-proven gap; CP0 did not
  exhaustively test random seeds or certify every rock/tree contact.
- Rock/tree solids are simplified rectangles (tree trunk footprint, not canopy;
  lumpy rock approximation). Preserve the established collision model and use
  visible scale/placement that communicates it. Decorative frames/debris must not
  look like reliable cover. No triangle-mesh collision replacement is proposed.
- Large ground strips/pools placed at one height can float/intersect undulating
  ground. Check current assets before increasing count or changing terrain.
- `envClearPoint` is useful but is not a universal room/door/interaction exclusion
  system; some legacy facility builders bypass it entirely.
- Individually built rock/tree detail, independent `mat` calls, canvas sign
  textures, transparent specimen fields/pools and extra shadow casters all have
  costs. Cached primitives alone do not reduce draw calls. Batch matching static
  details at construction and retain animated/mission-referenced meshes separately.
- **F:** persistent facility, repaired boundaries, floor grading, accepted doors,
  low/tall cover distinction in sampled lanes, eight light slots, cached pools,
  seeded Endless/restart behavior, current HUD/marker/route semantics and mission
  continuity all remain the baseline to preserve. Do not redesign them for polish.

## 4. Screenshot evidence and visual review

Evidence root: [`_playtest/m42/cp0-20261011/`](_playtest/m42/cp0-20261011/).
**Fresh screenshots were generated and directly visually inspected** using the
image-reading tool; findings are not code-only visual validation.

| Evidence set | Files / mode | Review meaning |
|---|---|---|
| Existing facility tooling, seven rooms | `facility/facility_interior_{hall,vault,decon,research,security,deeplab,service}.png` | Edge, 1600×900 reference cameras with `--gameplay-lights`, normal eight-source-slot selection; HUD/viewmodel/squad hidden and doors forced open by existing capture mode. Room composition evidence, not a normal gameplay/collision proof. |
| Facility exterior/elevated | `facility/facility_front.png`, `facility_overview.png`, `facility_rear_right.png` | Same existing tooling and slot mode; front is elevated (z12), overview z82, rear/right z42. Broad roof/perimeter readability. |
| Cutaways | `facility/facility_cutaway_overview.png`, `facility_cutaway_topdown.png` | Roof hidden; explicit reference fill. Topdown also uses full authored-light capture mode; the final overview capture combines gameplay slots with reference fill. These are layout evidence, not gameplay brightness measurements. |
| Native-eye exterior | `firefox-audit-verified/m1-landing-transport.png`, `m2-{alpha,beta,gamma}.png`, `facility-{front,east-perimeter,service-yard}.png` | Firefox 155, 1600×900, actual player eye/renderer lighting, HUD/weapon and nearby squad. Quiet/invulnerable fixtures; setup teleports, stationary observations. |
| M4 | `firefox-audit-verified/m4-{service-exit,escape-approach,extraction-approach}.png` | Mission/phase receipts confirm `break_contact / M4_REACH_LZ`; emergency snapshot and normal camera. |
| Endless | `firefox-audit-verified/endless-{valley,crater,ridges}-{center,flank}.png` | All three accepted arenas, same scenery seed `420042`, isolated save/Continue fixtures; no wave running in these stills. Combat is measured separately below. |
| Detail confirmation | `details/m1-road-eye.png`, `decon-growth-eye.png`, `research-equipment-eye.png`, `service-exit-sign-eye.png` | Normal Firefox eye-height confirmation; seeded decon growth and sign/equipment bounds accompany the images. |

The verified capture manifest records camera pose, mission, phase, FOV, seed,
browser/renderer, scene totals and setup/preparation observations. Supplemental
detail receipts record exact bounds and terrain samples. The first landing-forward
fixture has a large foreground obstruction; use `details/m1-road-eye.png` for the
clear departure-road view rather than drawing conclusions from that obscured image.

Capture preparation mistakes were identified and retained honestly: initial
`firefox-audit/` used locked Mission Select requests without checking success,
so its M2/M4 labels are invalid. `firefox-audit-final/` stopped at an explicit M4
setup assertion. Neither directory is acceptance evidence. The corrected
`firefox-audit-verified/` uses actual chapter completion and checks mission identity;
all its final views and detail images were inspected. No game semantics were edited
to accommodate the fixtures; all earlier artifacts remain available.

## 5. Representative Campaign / Endless runtime baseline

All browser suites ran **sequentially** against unchanged accepted source using
external Playwright and fresh browser contexts. Timing tests: **1280×720 headless**,
`perfDiagnostics=1`, no `perfGpuSync`. No package install or project dependency change.

| Suite | Firefox 155 | Edge 155 |
|---|---|---|
| `tests/traversal-performance.mjs` | PASS | PASS |
| `tests/facility-regression.mjs` | PASS | PASS |
| `tests/facility-playthrough.mjs` | PASS | Not rerun in CP0 |
| `tests/route-hitscan-correction.mjs` | PASS | Not rerun in CP0 |
| `tests/m2-progression.mjs` | PASS | Not rerun in CP0 |
| `tests/transition-diagnose.mjs` | PASS | Not rerun in CP0 |

Four existing Node suites PASS: `combat-state`, `progression-state`,
`relay-routing-state`, `objective-hud-state`. The eight selected browser-suite
combinations passed with no page errors reported by their harnesses. Both CP0
observation scripts also completed with empty page-error arrays.

### Regional timings (p95 / worst RAF interval, milliseconds)

| Region | Firefox | Edge |
|---|---:|---:|
| M1 exterior, 6 s | 50 / 66.7 | 33.4 / 50.1 |
| M2 Alpha, 6 s | 50 / 83.3 | 16.9 / 17.8 |
| M2 Beta, 6 s | 50 / 83.3 | 17 / 17.4 |
| M2 Gamma, 6 s | 50 / 100 | 16.9 / 17.3 |
| M2 return/front, 6 s | 50 / 50 | 16.8 / 33.4 |
| Facility interior, 6 s | 50 / 50 | 16.9 / 33.4 |
| M4 service/exit, 6 s | 33.3 / 33.3 | 17 / 17.3 |
| Campaign combat, 10 s | 33.3 / 100 | 33.4 / 33.6 |
| Endless early combat, 15 s | 16.7 / 33.3 | 17 / 83.4 |
| Endless later combat, 15 s | 16.7 / 116.7 | 17 / 17.4 |

Regional quiet traversal: **zero shader links, world/facility/static-grid builds,
geometry/material creations or texture uploads** in both browsers. Combat samples
also report zero shader links, but initial enemy/loot resources allocate: early
Endless **32 geometries / 17 materials** Firefox, **29 / 17** Edge; later **0 / 0**
Firefox, **5 / 2** Edge. These are accepted dynamic content costs, not static
environment reconstruction. Both runs exercised waves 1 and 2, then deterministic
debug damage → real result-screen Space restart: wave0, three squadmates, zero
enemies, zero arena rebuilds. This is short controlled combat, not unassisted survival.

Firefox reported privacy-reduced AMD/ANGLE `Radeon R9 200 Series ... or similar`;
Edge reported AMD Radeon Graphics through ANGLE/D3D11. SwiftShader fallback is
allowed by Edge flags, not forced. These results are not a hardware-controlled
desktop FPS comparison and do not certify the user's normal Firefox profile.

### Spatial churn / facility structure

Same existing A–E forward/reverse stress path, 14 m/debug move per RAF, 271 samples:

| Metric | Firefox | Edge |
|---|---:|---:|
| p95 / p99 / worst, ms | 50 / 100 / 150 | 17 / 49.9 / 116.7 |
| Intervals >100 ms | 3 | 1 |
| Links / world / facility / static-grid builds | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| Geometry/material creation or disposal | 0 | 0 |
| Render calls / triangles at final pose | 1322 / 293408 | 1344 / 294515 |
| Unique scene geometries / materials / meshes | 2141 / 1689 / 2405 | 2143 / 1691 / 2407 |
| Solids / budget slots / warmed programs | 306 / 8 / 29 | 306 / 8 / 29 |

Totals include randomized scenery and frustum-dependent rendering; do not compare
them as exact facility-only budgets. Current warmed program count is **29**, not
the historical 3.8 count of 23. The stress route deliberately includes debug
crossings that are not legal walking routes; its PASS is a churn gate only.

Independent Firefox real-input tests confirm all room/door crossings, sprint,
FOLLOW, hall/service pursuit and M4 exit Continue. The complete Gamma→front→terminal
return was walked with W; all three FOLLOW members entered without embedding;
real E started M3. Repaired perimeter blocks low/eye/upper shots; 28 map segments
and the 20×1.4×9 m Containment return remain. Room clearance probes are clean.
Route/hitscan checks retain ~3.3–3.9 px rendered guidance, immediate 42 damage at
8/60 m and no primary damage beyond 72 m or through blockers.

The canonical M2-return receipt records **one texture creation/upload** with zero
shader links or geometry/material creation; quiet short-region samples show none.
Keep this isolated existing first-use/upload observation separate from future
environment regressions; its source was not attributed in CP0.

### Existing cold preparation and unresolved stalls — separate ledger

- Firefox transition diagnosis reproduces substantial initial construction/shader
  preparation: world build **705 ms** in that run, and covered intro-prewarm RAF
  intervals **3050.7 / 1400.3 / 3567.5 ms**, with **4 / 4 / 13 links**. These
  precede the visible intro. All five visible cuts have **zero links**, 16.7–33.3 ms
  intervals. M2→M3, M3→M4 and extraction/result remain link-free; encounter
  construction at transitions is separately recorded. This is an existing load
  cost, not a CP0 regression or a solved first-load performance problem.
- One Firefox later-Endless interval was **116.7 ms**, measured render **1 ms**,
  no allocation/link delta and no operation >5 ms in the retained hitch excerpt.
  Cause unresolved; do not label it a shader stall, GC or a new regression.
- A–E has occasional >100 ms gaps without links/churn. Historical 3.9 desktop
  feel/high-refresh concerns and 4.1 intermittent first-use shader investigation
  remain contextual limitations; CP0 does not overwrite their acceptance history.

Full logs/JSON remain under `baseline-firefox/`, `baseline-firefox-progression/`
and `baseline-edge/`; `baseline-summary.json` compacts regional/stress receipts,
suite outcomes and placement probes.

## 6. Environmental priorities and proposed CP1–CP5

This was the CP0 proposal. The subsequent user instruction defines **CP1 as
placement architecture**, superseding the exterior-identity CP1 label in this
historical table. No visual checkpoint in the table has been implemented.

Priority order: **specific placement/readability defects → existing functional
identity → composition**. Avoid increasing density where openness already works.
Use small fixed batches of existing box/cylinder/rack/console/vent/pipe assets,
shared static materials and retained state layers. Existing assets are sufficient;
there is no demonstrated need for an external model, texture atlas, build pipeline
or imported asset system.

| Checkpoint | Proposed minimal scope | Exit evidence / preservation gate |
|---|---|---|
| **CP1 — exterior identity** | Correct exterior side-sign basis; refine existing CF-07 facade/roof/service equipment with restrained repeated panel relief, functional labels and neutral edge contrast. Keep changes on existing structure or safe high-mounted surfaces. | Matched front/side/rear player-eye + roof views; intact closed east Hall/repaired return; door/front/bypass clearance; no extra light-count variants or world rebuilds. |
| **CP2 — interior identity** | Correct side-facing Hall/Research/Security/exit signs; make Research instrument silhouettes compatible with existing low-cover behavior; distinguish logistics, lock, sterile decon, analysis, security, archive and power using a few coherent existing faces/details. Preserve rooms already sufficient. | Seven matched normal/emergency room captures with hostile silhouettes; low/standing shot checks and all room/console/door approaches. Preserve specimen focal hierarchy and open floor. |
| **CP3 — safe final prop placement** | Add bounded construction-time footprint/corner-height/slope/exclusion checks where needed; repair specific zero-base yard equipment, legacy patch scatter and terrain markers. Prefer reducing/repositioning decoration over new cover. Keep mesh and solid vertical bounds synchronized for any genuine grounding correction. | Explicit per-prop before/after bounds; multi-seed full-footprint exclusions; real W/Shift/FOLLOW/pursuit and low/eye/tall projectile tests. Existing protected routes/cover function remain; no per-frame placement work. |
| **CP4 — terrain / battlefield composition** | Arrange sparse non-solid shoulder flora/debris around existing landmarks and vary cluster rhythm. Conform visual markings to actual elevation using existing small cached pieces. Start with composition only; retain Campaign height formula and all three Endless arena formulas. | Matched M1/Alpha/Beta/Gamma/M4 and three-arena views; terrain/route/interaction clearance and spawn success; no central Endless obstruction or seeded solid relocation. Do not flatten Beta or remake the world to fix a prop. |
| **CP5 — final readability / optimization / regression pass** | Review cover vs decoration vs interactables, batch compatible static repeats at build time, verify cache reuse/transparent overdraw/shadow budgets. Apply only measured corrections to presentation costs. Consolidate evidence/documentation. | Repeat baseline suites in Firefox then Edge, matched-seed/pose totals, no warmed traversal links/churn, preserved cold-load cover and comparable regional performance; representative normal-profile manual Campaign/Endless review. |

CP3 placement constraints apply from the first later edit, not only after CP1/CP2:
no new floor clutter before its footprint is proven safe. A simple named placement
record with bounds/type/protected zones is sufficient; avoid extracting the entire
HTML world or inventing another authoritative navigation/collision system.

For Endless, **do not change random consumption/order for existing solid scenery**
or its seeded placement rules merely to add decoration: old saved positions depend
on that layout. New non-solid detail can use a derived independent stream, without
changing the existing saved seed/schema or regeneration of collision scenery.

Future performance target: negligible net draw-call/material increase at matched
seed/pose; retain fixed light budget and no warmed traversal construction/linking.
If added detail measurably regresses cost, batch/reduce that detail before acceptance.
Timing noise requires an equivalent follow-up sample; avoid claiming improvement
from one frame or randomized triangle counts.

## 7. Existing tests/tools and reproduction

Inspected: `capture-facility.mjs`, `tests/m40-regressions.mjs`,
`facility-regression.mjs`, `facility-playthrough.mjs`, `m2-progression.mjs`,
`traversal-performance.mjs`, `runtime-stability.mjs`, `transition-diagnose.mjs`,
`browser-startup-diagnose.mjs`, relevant `endless-hud.mjs` terrain/capture checks,
and route/hitscan test capture usage. Existing Node state suites cover combat,
persistence, routing and objective-HUD behavior.

The sequential runner supports additional accepted 4.1 combat/squad, checkpoint/
Endless, reload/ability, Runner/Screecher, HUD/compass and audio tests through
`--final-refinement --suites=...`. Those broader suites remain CP5 gates; CP0 did
not rerun all 46 historical browser combinations.

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'

# Choose NEW artifact directories on subsequent runs; preserve this baseline.
$env:CF_ARTIFACT_DIR='_playtest/m42/cp0-20261011/baseline-firefox'
node tests/m40-regressions.mjs --final-refinement firefox --suites=traversal-performance,facility-regression,facility-playthrough,route-hitscan-correction
$env:CF_ARTIFACT_DIR='_playtest/m42/cp0-20261011/baseline-firefox-progression'
node tests/m40-regressions.mjs firefox --suites=m2-progression,transition-diagnose
$env:CF_ARTIFACT_DIR='_playtest/m42/cp0-20261011/baseline-edge'
node tests/m40-regressions.mjs edge --suites=traversal-performance,facility-regression

node tests/combat-state.mjs
node tests/progression-state.mjs
node tests/relay-routing-state.mjs
node tests/objective-hud-state.mjs

node capture-facility.mjs _playtest/m42/cp0-20261011/facility interior --gameplay-lights
node capture-facility.mjs _playtest/m42/cp0-20261011/facility cutaway
node capture-facility.mjs _playtest/m42/cp0-20261011/facility overview --gameplay-lights
node capture-facility.mjs _playtest/m42/cp0-20261011/facility front --gameplay-lights
node capture-facility.mjs _playtest/m42/cp0-20261011/facility rear_right --gameplay-lights
```

`overview` selects both roofed and cutaway overview entries in the existing tool;
its final cutaway overwrites only this session's earlier CP0 overview, not any
pre-existing milestone artifact. For new comparisons use a fresh destination.

CP0 supplemental observation source is retained as `audit-capture.mjs` and
`audit-details.mjs` in the evidence root. They use existing `__cf`/renderer hooks,
isolated browser storage and seed `420042`; the detail script produces the compact
summary from the saved suite receipts. They refuse to overwrite their destination
directories. Edit their output paths to new destinations before reproducing.
No production test, control handler or game API was changed.

For normal desktop Firefox review, use `?perfDiagnostics=1&movementDiagnostics=1`,
let preparation finish, reset both recorders, mark/reverse the same regional paths,
download immediately after a hitch, then repeat without diagnostic flags. Inspect
real combat silhouettes, rapid turns, actor contacts and several Endless waves.

## 8. Explicit preservation rules and outstanding concerns

1. Preserve accepted 4.1 runtime, combat tuning, ARC 72 m hitscan/chain mechanics,
   four-weapon catalog/two owned slots, PX-4 capacity, continuous reloads, abilities,
   roster, squad identities/orders, input, HUD/menu flow and resource economy.
2. Preserve all four mission definitions/objectives, optional discovery/rewards,
   interaction coordinates/ranges/durations, checkpoint/Continue/Select behavior,
   save schemas/migration and mode isolation.
3. Preserve the single persistent Campaign world, all room footprints/floors/roofs,
   foundation blending, repaired east Hall/Containment perimeter, 28 map segments,
   canonical M2 front-return flow and both M4 doors/escape/extraction logic.
4. Preserve clear door sweeps, formation/hostile corridors, sample annulus, relay
   approaches, escort/spawn lanes, pickup/console zones and Endless center.
   Existing 306 solids are the CP0 count, not a reason to hide a mismatch; any
   later narrowly necessary prop-bound correction must be enumerated and tested.
5. Preserve current terrain/elevation identity and existing Endless seeded solid
   layout/restart semantics. Do not introduce new collision cover as decoration.
6. Preserve eight persistent budget-light slots, accepted direct lights, shader
   preparation/covered intro, shadow/FX cadence, caches, instancing and pool
   ownership. Do not mutate shared static material instances for one prop's FX.
7. Preserve `file://` playability, local classic-script loading, current embedded
   terrain artwork/credits and existing asset pipeline.
8. Preserve recovered Credits and all user work/evidence; no automatic commit,
   merge, push, clean, reset or main modification.

Outstanding limits: no full multi-seed placement audit, exhaustive decorative
ray/mesh parity, all-arena combat soak, full-duration unassisted campaign, normal
Firefox-profile/high-refresh acceptance or subjective audio review. Captures are
stills with controlled setup; facility reference cameras force doors open and
cutaways use reference fill. Darkness/flat terrain are not independently treated
as defects where they serve combat readability. Cold compilation and unexplained
RAF gaps remain existing baseline costs to compare separately.

**Stop condition met: CP0 only. Await the next checkpoint instruction before any
environment implementation. No commit, merge or push performed.**

---

## CP1 — Environmental Placement Architecture

### Status and Git verification

**COMPLETE FOR REVIEW — STOP AT CP1.** Continued the accepted CP0 working tree on
`milestone-4.2` at `5c8704fabd6b6bc732a8b74c6020ab2b2d31a689`. Re-read this report
and verified status, branch/ref, HEAD, Credits diff and stashes before edits.
No intervening baseline conflict, staged work or stash was present. Recovered
Credits, the CP0 report/evidence and older untracked artifacts are preserved.
`main` still points to `5c8704f`; no commit, push or merge.

This checkpoint adds a **construction-time admission rule**, not a prop renderer,
alternate collision system or world-population pass. Existing scenery builders
retain their previous calls, placement, quantities and random draws. CP0's buried
props, sign presentation and decon growth are not visually corrected here.

### Minimal implementation and ownership

| File | Change |
|---|---|
| `src/world/environment-placement.js` (new) | Classic-script, engine-independent `create()` validator and bounded `find()`; injected existing terrain, solid query, world bounds and exclusion metadata. No scene/mesh/light/collision ownership. |
| `chargefront.html` | Load that local script; opt-in final `placement` argument on existing `envBox` / `envClearPoint`; derive protected zones from canonical source data; share existing rotated-solid rectangle calculation between validation and `addRotatedSolid`. Add read-only placement diagnostics and a detached-parent gateway test hook. |
| `src/world/facility.js` | Read-only export of the existing foundation footprints; `doorPlacementZones()` derives full panel sweep and approach extents from actual doors. No building/door geometry or behavior changes. |
| `tests/environment-placement-state.mjs` (new) | Pure purpose, support, footprint, transform, budget, failure/fallback and seeded-height-field cases. |
| `tests/environment-placement.mjs` (new) | Actual Firefox/Edge terrain/exclusion/seed tests, accepted-HEAD layout parity, detached creation/cover tests and temporary SVG evidence captures. |
| `MILESTONE-4.2-ENVIRONMENT.md` | This implementation, evidence, performance and stop record. |

Six production/test/document files are the intended CP1 edit set. New generated
receipts, captures and a compact-summary script are under
`_playtest/m42/cp1-20261011/`. `Credits.txt` is an unrelated preserved local change,
not a CP1 edit. Existing regression suites themselves were not modified.

The collision owner remains `SOLIDS`, `solidQueryBounds`, `addSolid` and
`addRotatedSolid`. New admission reads those same buckets, including live disabled
flags. The small `rotatedSolidRects` factoring preserves the existing calculation,
rectangle order and vertical bounds; the same rectangles supply conservative
physical clearance and later collision registration. No navmesh, prop actor,
parallel spatial index or persistent placement schema was introduced.

Six unchanged mission attachment coordinates and four unchanged garrison spots
now have shared immutable source records consumed by their existing builders and
exclusions. They were not moved. Facility/mission/weapon/squad/enemy behavior and
the terrain formulas are retained.

### Purpose rules

| Purpose key | Admission semantics |
|---|---|
| `decoration` | Non-blocking; no solid registered. Upright grounded bounds, free world-Z yaw and scale .8–1.2. Default sampled slope limit .30 rise/run and maximum support gap .12 m. |
| `cover` | Physical ground cover through existing solids. Fixed scale 1, at most .15 rad yaw deviation from authored `facing`; slope .15 and support gap .08 m. |
| `landmark` | Solid grounded post/structural landmark; fixed scale 1, at most .05 rad deviation from authored `facing`; slope .10 and support gap .06 m. Existing buildings/roof/wall attachments remain with their authored facility builders. |
| `interactable` | Mission-critical/authored only. Automatic validation/scatter/fallback returns `authored-anchor`; it cannot relocate a console, objective or mission object to make scenery fit. Their real positions instead protect surrounding space. |

Purpose values are explicit and cannot be weakened by a search proposal. The
opt-in `envBox` gate checks that purpose's physical/non-physical classification
matches the existing `solid` argument before allocating anything. Admitted meshes
carry `userData.environmentPurpose`; geometry/material creation and shadow choices
still belong to the existing environment helpers.

These are rules for **new grounded bounds**, not permission to recolor an opaque
box as non-blocking cover. Asset choice must communicate its purpose. Existing
wall/bench/roof-mounted detail stays in the authored facility implementation and
does not gain a broad exemption/bypass in the new ground validator.

### Exclusions

The fully built Campaign exposes **95 protected records**, irrespective of current
mission lock/visibility; Endless exposes three. Rectangles, circles and conservative
corridor capsules are read-only metadata, not rendered objects or physics solids.

- Existing three graded facility footprints, including the Power Wing, expanded
  by 2 m. Vault/front/lab travel is additionally protected by routes and doors.
- All six doorways: closed/open panel extrema + .5 m end shoulder and 5 m approach
  on either side. Disabled/locked/open doors retain their eventual sweep reserve.
- Actual battery, local power/sensors, command, locker, scan, auxiliary cell,
  security/turret, survey dock, supply pickups and extraction-cache positions.
  Outdoor attachment exclusions are available even before their meshes are built.
- All three relay interaction areas (13 m), sample annulus, service exit, extraction
  beacon/boarding/apron and four purge nodes.
- Canonical M1–M4 deployment positions, insertion touchdown, staging/transport
  deployment space; current four garrison positions and relay core spawn lanes.
- M1 approach, Alpha/Beta/Gamma, canonical front return, lab access, M4 escape and
  survey escort paths. Route shoulder radii are 7.5 m, lab 6 m and escort 5 m.
- Endless 42 m central pad, 8 m vial and 8 m deployment circles; full bounds must
  remain inside the accepted `(ENDLESS_RADIUS - 6)` movement circle.

The candidate's **whole visible/physical footprint + .35 m clearance** is checked,
not only its center. The read-only current collision query then rejects existing
solids. For intentionally non-blocking objects, a caller-owned `occupied` list of
build-batch bounds prevents overlap/stacking without creating another physics
registry. The `envBox` admission path requires that list and appends only after a
successful placement; malformed/full lists fail safely. Later authors must include
participating non-solid decoration bounds in that list: this validator does not
scan all legacy uncollidable meshes or infer their role from appearance.

Zone lists are cached only once Campaign construction is complete (and refreshed
if door count changes), preventing an early build-time query from caching incomplete
attachment data. No update loop performs zone construction, validation or search.

### Elevation, support and natural transforms

1. Reject nonfinite/negative/zero/tiny dimensions, invalid purpose/scale/rotation
   and out-of-world/full-arena footprints before terrain or resource allocation.
2. Compute world-Z yaw/scaled visible bounds and union them with the **existing
   rotated-solid approximation** for cover/landmarks.
3. Query protected zones, occupied bounds and current solids conservatively.
4. Sample a bounded **5×5 support grid** over the conservative footprint. Maximum
   admitted span is 12 m and height 20 m; larger structures/surfaces require their
   existing authored builders or deliberate subdivision.
5. Check maximum adjacent sampled rise/run and footprint height range. Place the
   bottom at the highest support sample, so the prop is not based on center height
   alone. Explicit bases below/above support are rejected as buried/floating
   (5 mm numerical tolerance); permitted support gaps stay within the purpose cap.
6. Ground boxes stay upright: nonzero pitch/roll are rejected. Decoration may vary
   yaw/scale; physical cover/landmarks retain authored facing and scale. The opt-in
   mesh path maps yaw correctly from Y-up box geometry into the Z-up world, instead
   of twisting the local vertical-box Euler Z axis and tilting it.

Collision bottom/top use the same admitted base/scaled height as the mesh. This is
sampled conservative support and the accepted rectangle physics, **not** exhaustive
triangle-mesh support or oriented-box collision. Sharp terrain features between
samples and arbitrary organic mesh bounds still need asset-specific review.

### Determinism, bounded rejection and use

`validate(candidate, occupied)` does not draw random values. `find()` accepts an
injected random stream (normally existing randomness; tests use the existing
`ChargefrontProgression.seedRandom`). It never replaces global `Math.random`, changes
the stored world seed or modifies accepted scenery-generation draw order.

- Default **16 attempts**, hard cap **32**, plus at most **one fully validated
  explicit fallback**. No valid candidate/fallback means skip with `exhausted` and
  a diagnostic last reason/zone; no forced unsafe placement.
- Maximum **256 zones** and **256 occupied bounds**, **25 terrain samples** per
  validation and one existing solid-bucket query. Bad budgets/records fail closed.
- Candidate proposals must be bounded lightweight callbacks; the helper bounds
  its own loop, not arbitrary work supplied by a caller.
- No mesh/material/light/solid creation on rejected `envBox` requests. Purpose,
  boundary, exclusion and collision failures can return before sampling terrain.

Example for a later authored batch (not called by world generation in CP1):

```js
const occupied = []; // participating non-solid bounds for this build batch
const request = { purpose: 'decoration', width: 1, depth: 0.6, height: 0.5 };
const found = environmentPlacement.find({
    candidate: request,
    random: Math.random, // or a separate seedRandom stream for a repeatable test
    maxAttempts: 16,
    propose: rng => ({ x: 430 + rng() * 20, y: 350 + rng() * 20, yaw: (rng() - .5) * Math.PI * 2 }),
    occupied,
});
if (found.ok) envBox(root, found.x, found.y,
    request.width, request.depth, request.height, ENV_COLORS.utility, {}, false,
    { ...request, yaw: found.yaw, scale: found.scale, occupied });
// A null/failed result is skipped; do not bypass validation to fill a quota.
```

The old helper signatures/calls remain supported. Explicitly adopting these rules
for future props is required; CP1 does not retroactively relocate/delete legacy
scenery or reorder the seeded Endless solid builder. All CP0 preservation rules
continue to apply.

### Validation and evidence

**New placement tests PASS in Firefox 155 and Edge 155.** Five Node suites
PASS (new placement state plus combat, progression, relay-routing and objective-HUD).
Eight selected existing browser-regression combinations also PASS:

| Existing suite | Firefox | Edge |
|---|---|---|
| `runtime-stability --campaign` | PASS | PASS |
| `facility-regression` | PASS | PASS |
| `traversal-performance` | PASS | PASS |
| `facility-playthrough` | PASS | Not repeated in CP1 |
| `route-hitscan-correction` | PASS | Not repeated in CP1 |

Runtime Campaign runs use genuine E interactions, the entire W-key Gamma/front
return, indoor/service walking and extraction interaction/result. Long distant
approaches use setup teleports; relay/containment/purge timers use existing hooks.
Both reach `DONE`. Normal/early/late-skip intro audio, formation arrival, open
pursuit and player/camera/collision scenarios also pass. These are accelerated
controlled acceptance runs, not full-duration unassisted survival.

Facility tests retain 306 solids, six sections, eight light slots, 28 map segments,
repaired wall, all room/door crossings, low/over-cover shots, hostile pursuit and
Continue. ARC/route tests preserve same-call damage, blocking and rendered widths.
Endless starts correctly in every tested arena/seed and still spawns/fights/restarts
without rebuilding its arena in the existing runtime test.

New test coverage:

- Purpose errors, nonfinite/tiny/oversize inputs, world/arena edge corners, centers
  outside a protected zone whose **scaled/rotated footprint** crosses it, diagonal
  corridors, collapsed/zero-length corridors and tangent/boundary cases.
- All exclusion categories, room/annex/console/objective/deployment/garrison/relay
  ingress points; front shoulder and **outer M4 door open-panel travel** outside
  the facility footprint independently reject as the expected door zone.
- Pits, unsuitable slope, unsupported wide bases, explicit float/burial, invalid
  terrain, natural yaw/scale bounds, fixed physical-cover scale and no arbitrary tilt.
- Existing physical obstruction, caller-owned decorative occupancy/stacking,
  malformed/saturated budgets, failed search and valid/invalid explicit fallback.
- Five seeded synthetic height fields: **0, 1, 420042, 2147483647, 4294967295**;
  32 successful non-overlapping positions per field, repeated with identical results.
- Real Campaign scenery/proposal tests at the same five seeds; all three accepted
  Endless terrain variants at seeds **0, 420042, 4294967295**. That is **14 cases
  per browser / 28 total**, with 100 representative proposals per case repeated
  identically. Ridged support rejects substantially more candidates, as intended.
- **Eight original-HEAD parity comparisons** (Campaign + three Endless arenas,
  seed420042 in each browser) exactly match solid coordinates/heights, section
  summaries, sampled terrain heights and Endless tree transforms. Validation itself
  also leaves those fingerprints unchanged.
- Detached-parent creation tests: decoration adds zero solids; upright .9-scale/.7
  yaw bounds rest on the accepted base; invalid/stacked proposals add no mesh;
  physical cover registers two existing-style slabs with matching bottom/top and
  correct blocked-low/clear-over shot behavior. Nothing is attached to the gameplay
  scene; this disposable fixture closes after testing.

**Terrain seed clarification:** the current Campaign height function has no exposed
terrain-seed setting. CP1 did not invent one or randomize its noise. Seeded synthetic
height fields exercise validator terrain variation, while browser tests exercise
the actual fixed Campaign formula and valley/crater/ridges formulas with multiple
accepted scenery seeds. Do not call these five newly seeded Campaign terrain maps.

Evidence root: `_playtest/m42/cp1-20261011/`.
`cp1-summary.json` is the compact placement/parity/performance/regression receipt.
The full placement JSONs include candidate bounds, terrain ranges/slopes, reasons,
zones and capture poses. Final evidence source is `tests/environment-placement.mjs`.

| Targeted screenshot | Final Firefox evidence |
|---|---|
| Facility reserve + front door sweep + accepted shoulder footprint | `placement-final-firefox/front-exclusions-firefox.png` |
| Power annex + emergency door full travel zone | `placement-final-firefox/annex-exit-exclusions-firefox.png` |
| Battery interaction approach | `placement-final-firefox/battery-interaction-exclusion-firefox.png` |
| Central reserve / accepted valley candidates | `placement-final-firefox/endless-valley-placements-firefox.png` |
| Central reserve / accepted crater candidates | `placement-final-firefox/endless-crater-placements-firefox.png` |
| Central reserve / accepted ridge candidates | `placement-final-firefox/endless-ridges-placements-firefox.png` |

All six final Firefox images were directly inspected. Equivalent Edge captures
are under `placement-edge/`. Red is temporary protected-zone annotation; green
marks validated ground footprints, **not newly populated props**. SVG overlays do
not obey world occlusion, and tiny candidate footprints/clustered labels are not
an asset-quality/scale validation. Detached mesh bounds and physical probes supply
that separate verification. No capture overlay or preview geometry is saved in
the product. Earlier first-pass images remain under `placement-firefox/`.

A pure test initially chose a point outside its circular exclusion fixture; the
fixture was corrected. The first Edge placement launch failed due to a Windows
path escape in the new harness; that path was fixed and the full Edge suite passed.
Neither was a product/world defect or a weakened acceptance assertion.

### Performance impact assessment

The new admission path is **not called by existing world population or movement**;
the browser test asserts zero placement validations after each normal world build.
There are no added scene meshes, draw calls, lights, shader variants or persistent
collision solids in normal play. Script/policy initialization and a few extra
temporary plain rectangle records in the factored construction-only helper are
the small CP1 costs. Protected-zone records are built lazily for explicit validation.

| 1,000 warmed validations | Firefox | Edge |
|---|---:|---:|
| Campaign, 95 zones | 46–53 ms (~.046–.053 ms/candidate) | 49.8–57.4 ms (~.050–.057 ms/candidate) |
| Endless, three zones | 12–19 ms (~.012–.019 ms/candidate) | 9.8–17.9 ms (~.010–.018 ms/candidate) |

These are batch CPU timings with instrumentation, not worst-case per-call promises.
They support small bounded build-time searches, not thousands of validations in
one render frame. Whole-world/batch scheduling remains the caller's build-time
responsibility; never invoke scatter search from update/render.

Same existing 271-frame A–E debug stress sweep:

| Metric | CP0 Firefox → CP1 Firefox | CP0 Edge → CP1 Edge |
|---|---:|---:|
| p95 / worst ms | 50 / 150 → **50 / 200** | 17 / 116.7 → **17.1 / 99.9** |
| Frames >100 ms | 3 → **5** | 1 → **0** |
| Links / world / facility / static-grid builds | **0 / 0 / 0 / 0** both | **0 / 0 / 0 / 0** both |
| Geometry/material creation or disposal | **0** both | **0** both |
| Solids / budget slots / warmed programs | **306 / 8 / 29** both | **306 / 8 / 29** both |
| Final-pose calls / triangles | 1322 / 293408 → 1339 / 294577 | 1344 / 294515 → 1355 / 295145 |

Random scenery/frustum and scheduling vary between these regression recordings;
the draw/triangle totals are not exact matched-asset deltas. Exact seeded solid/tree
parity is established separately. Firefox's stress tail remains an outstanding
cadence concern; neither timing row proves improvement or an added placement stall.

Quiet regional traversal retained zero links/builds/grid churn/material/geometry
creation and zero texture uploads in both browsers. Firefox regional p95 is
50 ms at M1 and 33.3 ms at Alpha/Beta/Gamma/front/interior/M4; Edge is 33.3 ms at
M1 and 17–17.2 ms elsewhere. No regional recording exceeded 100 ms. Early/later
Endless p95 is 16.7 ms Firefox / 17.1 ms Edge; worst is 66.7/33.3 ms Firefox and
33.4/17.7 ms Edge. Firefox remained in wave1 in this short sample, Edge reached
wave2; both restarted to wave0 with three squadmates and no arena rebuild.
Existing first-use actor/loot allocations still occur during combat (not scenery
reconstruction); the CP0 cold shader/loading ledger remains applicable.

### Reproduction and stop boundary

Use fresh artifact directories; the commands below show the actual destinations
used in this checkpoint. Browser runs must be sequential to avoid contention.

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
node tests/environment-placement-state.mjs
$env:CF_ARTIFACT_DIR='_playtest/m42/cp1-20261011/placement-final-firefox'
node tests/environment-placement.mjs firefox
$env:CF_ARTIFACT_DIR='_playtest/m42/cp1-20261011/placement-edge'
node tests/environment-placement.mjs edge
$env:CF_ARTIFACT_DIR='_playtest/m42/cp1-20261011/regression-firefox-campaign'
node tests/m40-regressions.mjs firefox --suites=runtime-stability,facility-regression
$env:CF_ARTIFACT_DIR='_playtest/m42/cp1-20261011/regression-firefox-traversal'
node tests/m40-regressions.mjs --final-refinement firefox --suites=traversal-performance,facility-playthrough,route-hitscan-correction
$env:CF_ARTIFACT_DIR='_playtest/m42/cp1-20261011/regression-edge'
node tests/m40-regressions.mjs edge --suites=runtime-stability,facility-regression,traversal-performance
node tests/combat-state.mjs
node tests/progression-state.mjs
node tests/relay-routing-state.mjs
node tests/objective-hud-state.mjs
node _playtest/m42/cp1-20261011/summarize.mjs
git diff --check
```

Limits retained: no retroactive migration of old scenery, exhaustive organic-mesh
intersection/support proof, long Endless soak or normal-profile desktop Firefox
feel certification. Legacy non-solid occupancy must be supplied deliberately when
future batches adopt this gate. Purpose/slope/clearance defaults are conservative
for new ground props and need asset-specific visual review at later checkpoints.

**CP1 stop condition met. Placement architecture and validation only; no visual
population, CP2–CP5 implementation, commit, push or merge.**

---

## CP2 — CF-07 Facility Exterior Enhancement

### Result, baseline and scope

**COMPLETE FOR REVIEW — STOP AT CP2.** Continued accepted CP0–CP1 on
`milestone-4.2`; HEAD and local `main` remain
`5c8704fabd6b6bc732a8b74c6020ab2b2d31a689`. Verified branch/status/refs, staged
state, stashes and existing CP1 diff before implementation. CP1 was accepted
working-tree work, not a new commit; nothing was reset or replaced. Recovered
Credits and all previous evidence remain intact. No staging, commit, merge or push.

Read the milestone report, current facility shell/exterior/service-yard/door code,
the architecture report and existing capture tooling. Inspected CP0 roof/front/rear
and eye-level side/yard/exit screenshots before changes, then captured fresh,
seed-matched CP1 reference views in both browsers.

Intent: retain the stylized military/industrial shell while making its existing
engineering/scientific functions readable. The main nameplate, roof equipment,
loading side, archive return and Power/E-04 exit form a small naming/material
hierarchy. Selective service faces and corrosion supply detail; no new room,
building extension, ground-cover field or dynamic-light system.

### Modified areas and intentional preservation

| Area | Modification | Preservation decision |
|---|---|---|
| Main entrance / southern approach | Physical backing and two mounting brackets for the existing CF-07 sign; two restrained wall-contact service faces with inset louvers/scuffs. | Sign text, 12 m width, position and legibility retained. Gate, canopy, jambs, automatic door, apron, shoulders and center lane unchanged. The first backing caused z-fighting; its surface was separated from the lettering in the corrective review. |
| Existing roof silhouettes | Neutral blue-grey skins/caps on five existing housings and five existing HVAC banks; fitted support plinths, lid gaskets and duct feet connect the already-raised equipment to actual roof tops. One `AIR SYSTEMS // AH-01` face label. | No new HVAC bank, mast forest, parapet system or larger roof profile. Original housing/cap/bank/duct/antenna coordinates, dimensions and rotations retained; roof-edge trims and buttresses untouched. Roof detail follows cutaway state. |
| Left/right Hall exterior | Two service-face bays per side and a single wall-mounted maintenance cabinet/raceway per side. Four small corrosion accents across the exterior rather than random debris. | Continuous east Hall wall, original ribs/edges/conduits and ground clearance retained. All additions contact the outer faces, at least 3.3 m above world zero; no new floor obstacles. |
| Service / Power Wing | Warm utility-facing panels, one maintenance cabinet/raceway, supported existing roof housing and corrected north-facing `POWER // EGRESS E-04` lettering. | Accepted wing footprint, four interior generators, room styling, antennas, roof edges, both service doors and escape corridor unchanged. Warm surfaces are static materials, not additional lights. |
| Utility infrastructure / maintenance yard | Existing loading label corrected from a floating vertical banner to a horizontal east-wall-mounted plaque. Existing crane mast seated at sampled terrain support so its unchanged terrain-relative arm is connected. | Label uses the existing sign factory, texture/style/width. Mast retains its XY position, 8 m geometry and orientation; arm stays in place. No new solid or cover. Other yard containers/platform/crates/wreck are retained for the later prop-grounding checkpoint. |
| Rear perimeter | Two restrained wall-contact archive service faces and one backed `CF-07 // CONTAINMENT` identifier below the existing conduit. | Full repaired perimeter, Containment north return, rear roof trim and original utilities remain. No terrain scatter or new perimeter enclosure. |
| Emergency exit presentation | Reuse the existing shared outer-door `EMERGENCY EXIT` marker: correct its vertical basis and seat it horizontally on a backed exterior roof-edge mount. Remove the draft's redundant second exit label. | Door coordinates, geometry, animations, thresholds, prompts and red emergency state unchanged. This is the one shared boundary-sign correction; no interior-room dressing, lighting or architecture pass. Other Hall/Research/Security sign defects remain deferred. |

New detail consists of **73 small cached structural/surface pieces in 28 static
InstancedMesh batches**, two new canvas plaques and the reused outer-exit marker.
Most pieces are fitted equipment supports, louvers or mounting hardware; this is
not 73 separate floor props. No terrain prop was added inside any facility footprint
or annex. There are no new collision solids, light sources or shadow casters.

The four legacy yard containers, loading pad/crates and wreck retain their accepted
ground/collision layout rather than being lifted into new cover in an exterior
identity pass. Their CP0 grounding limitations remain documented. The existing
random magenta patch that can appear in Decon is also not altered by this checkpoint.

### Construction and resource ownership

Runtime modifications are in `src/world/facility.js`, with one coordinator call
in `chargefront.html`:

- `buildExteriorDetail()` retains original asset construction/section ownership
  and collects references to the existing roof equipment.
- `finalizeExteriorIdentity()` runs once, after legacy scenery, objectives and
  initial garrison construction, under the persistent Campaign world coordinator.
- `buildExteriorIdentity()` attaches cached wall/roof/mount detail under the existing
  `FacilityExterior`, replaces only the selected equipment's static material
  references and registers roof-only batches/signs with existing cutaway metadata.
- `envBoxGeometry`, `envMat`, `makeFacilitySign` and the existing palettes are reused.
  Animated materials, doors, source lights, FX, interior detail and mission resources
  retain their current ownership. No common static material is mutated for an FX.

**Determinism correction:** Three.js UUID construction consumes `Math.random`, and
new geometry/material cache entries can change later constructor draw counts. The
first draft therefore shifted downstream Campaign scatter despite having no
explicit `rand` call. Original construction/cache behavior was restored; new detail
now finalizes **after** all legacy population using a scoped independent stream
(`seedRandom(0xcf070042)`), restoring the caller's exact random function in `finally`.
This does not change procedural gameplay randomness or stored scenery seeds.
Exact seed-matched collision and tree parity tests pass again.

The finalizer is construction-only and guarded against duplicate execution. It is
not invoked by snapshot changes, movement, rendering, Continue or M1–M4 transitions.
No asset import/build pipeline, external models, texture atlases or new dependencies.

### Actual rendered verification and corrective review

Evidence root: [`_playtest/m42/cp2-20261011/`](_playtest/m42/cp2-20261011/).

- `before/{firefox,edge}/`: **22 fresh CP1 screenshots**, 11 per browser, captured
  before geometry edits; manifests and the immutable `cp1-facility-baseline.js`
  preserve source/structural evidence.
- `verified/{firefox,edge}/`: **22 final before/after counterparts**, same seed
  **420042**, 1600×900, FOV75, normal exposure **.78**, original **40–280 m fog**,
  existing lighting. These recaptures also run explicit mounted-volume guards.
- `accepted/{firefox,edge}/`: same final production-source screenshots, all 11
  Firefox angles directly inspected. The directory is a capture-stage name; CP2
  remains review-ready, not an automatic commit/merge decision.
- `cutaway/`: two existing-tool captures, directly inspected, confirm roof-mounted
  detail disappears with the roof. They use reference fill and are layout/cutaway
  evidence, not ordinary gameplay brightness measurements.
- `cp2-summary.json`: compact matched-view/resource deltas, mount/seed constraints,
  regional performance and regression receipts. Earlier `draft`, `review`, `after`
  and `final` captures remain as development evidence, not the final comparison.

Before/after pairing (the same filename exists under `before/firefox/` and
`verified/firefox/`; Edge has equivalent pairs):

| Filename | Angle / visual review |
|---|---|
| `lz-facing.png` | Actual distant southern LZ road view. The facility is beyond the accepted fog/readability range here; no artificial fog removal or zoom was used to claim visibility. |
| `road-facing.png` | Landing-zone-facing front approach at roughly 60 m: CF-07 entry axis, service faces and existing skyline retained. |
| `main-entrance.png` | Player-eye entrance: readable nameplate, supported backing, louvers and preserved doorway; sign z-fighting corrected. |
| `west-side.png`, `east-side.png` | Normal eye-level side views: wall-mounted service faces/cabinets; corrected readable loading plaque and unchanged perimeter. |
| `service-yard.png` | Eye-level yard: unchanged cover layout, readable loading identity and crane arm now visibly connected to its grounded mast. |
| `service-wing.png`, `emergency-exit.png` | Normal M4 exterior: single backed horizontal exit marker, identifiable roof equipment and unblocked open exit. |
| `rear-perimeter.png` | Elevated rear/right overview: archive/Power labels and roof equipment visible. Camera is outside the movement boundary for framing; not claimed as native rear walking. |
| `overview.png` | Elevated normal-lighting overview: existing housings/banks/wing are readable while the dark shell and original roof edges remain. |
| `entrance-traversal.png` | Genuine W-key eye-level doorway crossing; before/after walking endpoints vary slightly with browser timing. No floor/room changes. |

Direct visual review covered the fresh before set and every final-production
Firefox angle, plus representative Edge/cutaway checks. Review drove focused
corrections: remove primary-sign z-fighting, strengthen existing cap contrast,
give side bays three purposeful maintenance cabinets, remove duplicate exit
signage and fix the disconnected legacy crane. No global lighting/fog/exposure
change was used to make the screenshots look better.

A harness comparison initially retained `undefined` fields in a live snapshot but
lost them in saved JSON; serialization normalization fixed that diagnostic mismatch.
The earlier seeded-scatter failure was a genuine construction-stream issue and
was fixed in implementation, not hidden by weakening the collision comparison.

### Validation

**PASS — no page errors in final capture/constraint runs or selected regression
harnesses.** Five Node suites also pass; syntax and `git diff --check` are clean.

| Browser suite | Firefox 155 | Edge 155 |
|---|---|---|
| New `facility-exterior` before/final constraint capture | PASS | PASS |
| Existing `facility-regression` | PASS | PASS |
| Existing `facility-playthrough` | PASS | PASS |
| Existing `transition-diagnose` | PASS | PASS |
| Existing `traversal-performance` | PASS | PASS |
| Existing `m2-progression` | PASS | Not repeated in CP2 |
| CP1 `environment-placement` | PASS — all 14 cases | Not repeated in CP2 |

Node: environment-placement-state, combat-state, progression-state,
relay-routing-state and objective-hud-state PASS.

Specific preservation checks:

- Exact full `SOLIDS` coordinates/heights, terrain samples and section summaries
  match the fresh CP1 reference. **306 solids, six sections, 28 map segments** remain.
- Original core roof/wall geometry/poses and exterior buttress/roof-edge/HVAC/duct
  transforms match. The two intended utility-sign changes and crane grounding are
  enumerated exceptions; material changes are deliberate.
- Deep Lab/interior geometry is unchanged except the single audited outer-exit
  marker now mounted outside. No room content, generator, floor or light is added.
- **76 mounted volumes** (including signs) inspected: lowest new detail **z3.3 m**,
  zero overlap with all **six actual thin-panel swept volumes**, zero new lights or
  shadow casters. New wall projections sit within the wall's actor stand-off.
- Crane base matches highest sampled support **2.674658 m**; support range is only
  **.035362 m**, retaining natural grounding without a terrain/foundation rewrite.
- Native walking/sprinting, FOLLOW, combat and hostile pursuit through Hall/service
  doors pass. Canonical Gamma→front→terminal return and real E→M3 pass; repaired
  perimeter, sample/extraction, Mission Select, Continue and Endless remain intact.
- CP1 five Campaign scenery seeds and three seeds per Endless arena still pass
  repeatability, exclusions and original-HEAD solid/tree parity. Neither scenery
  randomness nor the three terrain formulas were changed to accommodate detail.
- Intro/transition tests retain five visible link-free cinematic cuts and link-free
  M2→M3, M3→M4 and result transitions. First-load preparation remains separate.

### Performance assessment

Matched normal-lighting, seed420042 views in Firefox (render calls; small actor pose
differences can add/remove an incidental call):

| View | CP1 before → CP2 final | Change |
|---|---:|---:|
| Southern road approach | 841 → 873 | +32 / 3.8% |
| Entrance | 713 → 745 | +32 / 4.5% |
| West side | 915 → 940 | +25 / 2.7% |
| East side | 703 → 724 | +21 / 3.0% |
| Service yard | 892 → 910 | +18 / 2.0% |
| Rear overview | 1455 → 1487 | +32 / 2.2% |
| Elevated overview | 832 → 864 | +32 / 3.8% |
| Power Wing | 1416 → 1448 | +32 / 2.3% |
| Emergency exit | 968 → 1001 | +33 / 3.4% |

Typical net triangle change is roughly **650–890**, under **.35%** of these scene
totals. Net scene-unique resources in both browsers: **+25 geometries, +4 materials,
+2 mapped textures**; these are scene totals, not every constructor/cache allocation.
Two new plaques use the existing canvas-sign mechanism; all repeated detail uses
shared cached dimensions/materials and static instance batches. No added light
source, fixed slot, shadow caster or dynamic animation budget.

Existing A–E 271-frame spatial stress sweep (not walking-speed FPS):

| Metric | Firefox CP1 → CP2 | Edge CP1 → CP2 |
|---|---:|---:|
| p95 / worst ms | 50 / 200 → **50 / 200** | 17.1 / 99.9 → **17.1 / 116.7** |
| Intervals >100 ms | 5 → **3** | 0 → **1** |
| Traversal links / world / facility / static-grid builds | **0 / 0 / 0 / 0** | **0 / 0 / 0 / 0** |
| Traversal geometry/material creation or disposal | **0** | **0** |
| Solids / light slots / warmed programs | **306 / 8 / 29** | **306 / 8 / 29** |

Quiet regional movement also retains zero links, builds, static-grid churn,
geometry/material creation and texture uploads. CP2 regional p95: Firefox
**33.3–50 ms**, Edge **16.8–33.4 ms**. One Firefox M1 interval **133.4 ms** included
**112 ms `drawHUD` / `gameRenderPost`**, **16 ms render**, zero link/allocation
delta. Record this isolated HUD-side tail separately from environment shader churn;
CP2 does not change HUD code or claim to resolve its cause.

Campaign combat and early/later Endless samples remain link-free; both browsers
reach waves1/2 and restart to wave0 with three squadmates and no arena rebuild.
Existing first-use actor/loot allocations still occur. Firefox intro preparation
records about **3.33 / 1.33 / 3.58 s** covered prewarm intervals, followed by link-free
16.7–33.3 ms visible cuts. Those cold costs remain initial loading, not a new
movement-time optimization claim.

These are sequential automated WebGL runs on the existing AMD/ANGLE environment,
not a controlled desktop FPS/normal-profile certification. Added static draw cost
is explicit; no general frame-rate improvement or elimination of historical tails
is claimed. Full desktop feel and long-duration soak remain manual limits.

### Changed files, reproduction and stop

CP2 edits: `src/world/facility.js`, one line in `chargefront.html`, new
`tests/facility-exterior.mjs`, this report and the short architecture addendum.
Existing CP1 implementation/tests and recovered Credits are preserved.

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
$env:CF_ARTIFACT_DIR='_playtest/m42/cp2-20261011'
# Before was captured on accepted CP1 before editing. Keep its stored source/receipts.
node tests/facility-exterior.mjs firefox --stage=before
node tests/facility-exterior.mjs edge --stage=before
# Use a NEW stage name to preserve existing final evidence on a later rerun.
node tests/facility-exterior.mjs firefox --stage=verified
node tests/facility-exterior.mjs edge --stage=verified
$env:CF_ARTIFACT_DIR='_playtest/m42/cp2-20261011/regression-firefox'
node tests/m40-regressions.mjs firefox --suites=facility-regression,facility-playthrough,transition-diagnose,traversal-performance
$env:CF_ARTIFACT_DIR='_playtest/m42/cp2-20261011/regression-edge'
node tests/m40-regressions.mjs edge --suites=facility-regression,facility-playthrough,transition-diagnose,traversal-performance
$env:CF_ARTIFACT_DIR='_playtest/m42/cp2-20261011/progression-firefox'
node tests/m40-regressions.mjs firefox --suites=m2-progression
$env:CF_ARTIFACT_DIR='_playtest/m42/cp2-20261011/placement-firefox'
node tests/environment-placement.mjs firefox
node capture-facility.mjs _playtest/m42/cp2-20261011/cutaway cutaway --gameplay-lights
node _playtest/m42/cp2-20261011/summarize.mjs
git diff --check
```

The capture harness refuses to overwrite a stage. A future reproduction must use
fresh directories/stage labels and the correct CP1 reference source, not label the
current enhanced build as a new “before.” Older draft/review files remain intact.

**STOP condition met: CP2 exterior only. No interior-room pass, later checkpoint
implementation, commit, push or merge.**

## CP2-R1 — Architectural and collision repair

### Status, approval and resumed checkpoint

**Engineering validation PASS; ready for manual R1 review.** The user approved
AC-1 through AC-4 and the Sealed Bio-Containment Plant direction, with a separate
R1 review before the approved R2 visual refinement. R2 and CP3 have not begun.
Branch remains `milestone-4.2`, HEAD `5c8704f`. Changes are unstaged. The existing
Credits entry and unrelated working-tree changes and evidence were preserved.

On resumption, five implementation tasks were already complete. The final-code
Firefox enclosure receipt and four completed Firefox runner results existed under
`_playtest/m42/cp2r-20261011/r1v/`: M2 progression, runtime stability, traversal
performance and facility regression. The interrupted runner had not recorded
facility playthrough or transition diagnosis. Those completed receipts were kept;
the remaining Firefox checks and the complete post-parity Edge run were saved to
fresh `r1-resume/` directories. No product-code correction was needed on resumption.

### Implemented architecture

| Correction | Implementation and result |
|---|---|
| **AC-1** | `LabSouthReturnWallWest/East` close the lab face at y684 on either side of the narrower Vault. Each visible wall is 12.7 × 2 × 9 m, with matching collision, overlapping the adjoining wall thicknesses. The former sideways entry into the Vault/Decon vestibule is sealed. Two minimap lines close x330–342 and x378–390; lab side-wall lines start at y684. |
| **AC-2** | Seven fitted portals: the six existing doors plus the door-less Vault north opening. Casing posts sit outside the opening edges on both wall faces; sliding panels remain within the wall pocket. Two solid posts and one overhead lintel per portal. Panel widths, horizontal travel, lock/proximity/force-open mechanisms and mission interactions are retained. |
| **AC-3** | Both x450 and x410 receive headers. Inspection confirmed x410 had the same full-height structural opening and undersized frame problem. Clear height is **8.2 m**, rather than the initial 6.5 m candidate, to preserve flying-actor clearance. Clear widths remain **12 m** at x450, **14 m** at x410 and **16 m** at the other doors. Panels and their vertical collision bounds end at 8.2 m. |
| **AC-4** | Hall/Vault roofs extend to the outer wall faces and abut without coincident top faces. Lab ceilings extend to wall faces and meet cleanly. Exterior corner notches close through existing wall extent adjustments. The former 10 m Decon ridge is lowered to the 9 m wall height; its orphaned yellow roof trims are retired. Continuous coping sits on the actual 10 m Hall/Vault and 9.625 m lab/Power roof tops. |

Necessary doorway-adjacent corrections: the Security partition stops at y734.3
instead of entering the door plane; east Containment panels/ribs/conduit clear
the x410 opening; the Vault north status screen flanks its opening instead of
crossing it; the Vault sign's top edge clears the new lintel. These are narrow
connection repairs, not an interior-room decoration pass.

Collision count changes from **306 to 329**: two AC-1 wall solids, fourteen post
solids and seven overhead lintels. Minimap segments change from **28 to 30**.
The six persistent sections, mission anchors, floor footprints, eight rendered
light slots and **29 warmed programs** remain. `overhead` solids are ignored by
ground movement/inside checks and guide-segment clearance, while retaining
height-aware projectile/LOS collision. Open doors therefore permit passage and
low shots, but their fixed lintels still block upper shots.

### Construction-stream preservation and test correction

An earlier R1 draft shifted seeded Campaign scenery because Three.js UUIDs and
geometry/material cache misses consume `Math.random`. This was corrected before
the interrupted final verification: retired pieces replay their legacy
construction into an unattached scratch group; new closure walls, portal batches,
coping and screen twins finalize after legacy scenery/objectives/drones, on a
scoped `seedRandom(0xcf070043)` stream. CP2 exterior identity retains its own
`0xcf070042` stream; the caller's random function is restored in `finally`.
No new structure is built during traversal or mission transitions.

The construction ledger now matches the CP1 baseline at every recorded world-build
step (`rng-ledger.json`). `r1-solid-delta.json` shows only the approved fifteen
modified facility solids and twenty-three additions. `r1-postpass-overlap.json`
reports zero non-wall solid overlaps or initial actor overlaps from the post-pass.

The old placement parity harness substituted only HTML with `page.route`: Firefox
ignored that for `file://`, and Edge still loaded the working-tree facility module.
The permanent test now extracts the complete accepted HEAD runtime with
`git archive` into a temporary site, exposes only the baseline inspection hook,
loads that real `file://` site and cleans it up. It strictly compares scenery
outside the approved facility envelope, terrain, section structure (allowing
exactly the two retired Hall trims), and Endless arena fingerprints. Facility
geometry is covered separately by the enclosure/structure tests. The CP2 exterior
harness similarly retains scenery/terrain/section parity rather than insisting on
the deliberately replaced pre-R1 roof and wall meshes.

### Final validation receipts

All paths in this subsection are relative to `_playtest/m42/cp2r-20261011/`.

| Check | Firefox final-code receipt | Edge final-code receipt |
|---|---|---|
| Permanent enclosure test | `r1v/enclosure/facility-enclosure-firefox.json` | `r1-resume/enclosure/facility-enclosure-edge.json` |
| M2 progression, runtime stability, traversal performance, facility regression | `r1v/regression-firefox/results-firefox.json` — four status-0 results retained from the interrupted run | `r1-resume/edge/results-edge.json` — status 0 |
| Facility playthrough, transition diagnosis, combat/squad integration | `r1-resume/firefox/results-firefox.json` — all status 0 | `r1-resume/edge/results-edge.json` — all status 0 |
| Corrected actual-HEAD placement parity | `r1-parity-placement-firefox-4/environment-placement-firefox.json` | `r1-resume/placement-edge/environment-placement-edge.json` |

The permanent `tests/facility-enclosure.mjs` checks the actual game collision on a
0.5 m outside-in grid at 0.4 m actor radius, closed and live mission door states,
both real W-key breach routes in both directions, six door opening/closing cycles,
low/high passage and lintel shots, post collision, panel/post separation and
minimap samples. Results in both browsers:

- **M1/M2/M3:** zero outside-reachable sampled interior cells in the settled live
  closed-door state. The M2 fixture has no `labAccess`; the Vault cannot be bypassed.
- **M4:** 29,474 reachable interior samples through the deliberately open emergency
  exit; closing x450 alone restores zero outside reachability. Forcing all doors
  closed yields zero reachability in all four mission states.
- **Breach walks:** outside west/east stop at x340.5/x379.5 without entering the
  Vault or vestibule; reverse walks stop within the enclosed vestibule. All pass.
- **Doors:** all six open above 0.95 and disable their door solids, then close below
  0.05 and restore blocking; no sampled open panel/post intersection. All portal
  centers and shoulder samples are traversable when open; posts remain solid and
  shots at 8.6 m are blocked by lintels. All thirty map lines lie on structure.
- **Intended routes:** native walking and sprinting pass the Hall, Vault, Decon,
  Research/Security, Containment, service wing and exit. Three FOLLOW squadmates
  traverse the Hall; live Infested pursue through the front entrance in both
  directions and across x410/x450. M2 terminal progression and checkpoint reload,
  M3 security/sample interactions and M4 extraction/result remain functional.
- **Rendering/lifecycle:** facility stress traversal reports no new world/facility
  builds, geometry/material allocations/disposals or shader links; eight light
  slots and 29 warmed programs. Timing tails still occur on software WebGL; this
  is not a desktop FPS or long-duration manual-play certification.

Earlier draft issues and setup timeouts remain in the historical evidence. All
completed authoritative post-parity receipts above pass; no unresolved R1 test
failure remained after resumption. A compact receipt index with validated source
blob hashes is `r1-resume/validation-report.json`.

### Screenshot review and manual acceptance

Existing `r1-accepted/{firefox,edge}/` views were reviewed on resumption for both
recesses, roofline, portals and normal gameplay light. A new **29-view final-source
Firefox** set is saved to `r1-resume-verified/firefox/`, using the same audit camera
positions and after-state labels. The original `audit/firefox/` images remain the
before counterparts. The old P0 plan is a **pre-repair diagnosis**, not an after map.

| Review target | Final-source screenshot filenames |
|---|---|
| West and east exterior recess closure | `D2-west-notch-close-fill.png`, `D3-east-notch-close-fill.png` |
| Vault/Decon connections, roofs removed | `D6-junction-cutaway-oblique-fill.png`, `D4-vault-looking-north-fill.png`, `G2-decon-to-strip-fill.png` |
| Continuous roof coping and roof/wall seating | `A4-roof-oblique-fill.png`, `F2-rear-power-fill.png` |
| x410 connection and x450 lintel | `E5-containment-to-emergency-door-fill.png`, `E3-exit-eye-fill.png` |
| Normal gameplay lighting | `B1-entrance-eye-normal.png`, `D7-vault-north-normal.png`, `E2-exit-eye-normal.png`, `H2-security-portal-normal.png`, `H3-exit-interior-normal.png` |

Direct review of the fresh recess/cutaway, roofline, x410 and normal exit views
confirms continuous closures and properly seated frames/coping. Diagnostic views
use temporary non-shadow fill lights and exposure 1.25 only within the capture
page; normal views restore the game's original lighting/exposure. The very dark
shell is retained. A3 remains fog-obscured and F1 is outside the world boundary;
neither is used as walking or acceptance proof.

### Remaining items and changed files

**No open R1 gameplay/structure blocker identified by these tests and reviewed
views. Manual visual acceptance is pending.** Existing CP2 signs, panels, elevated
cabinets and brown scuffs remain visible because their approved correction is R2.
The older hanging relay housing/interior sign mounting and other previously
catalogued room-dressing issues remain for later review; R1 does not claim to
resolve them. The `r1-accepted` directory name is a capture label, not user approval.

R1 changes: `src/world/facility.js`, the overhead-solid exemptions/inspection hooks
in `chargefront.html`, new `tests/facility-enclosure.mjs`, minimap count in
`tests/facility-regression.mjs`, corrected baseline handling in
`tests/environment-placement.mjs` and `tests/facility-exterior.mjs`, this milestone
record and the architecture addendum. Evidence/probes remain under `_playtest/`.
The resumed session added only validation evidence and documentation; product and
test source were retained. The Credits diff is the same pre-existing terrain credit.

For a future rerun, select a fresh artifact directory and screenshot stage:

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
$env:CF_ARTIFACT_DIR='_playtest/m42/cp2r-20261011/manual-rerun'
node tests/facility-enclosure.mjs firefox
node tests/facility-enclosure.mjs edge
node tests/m40-regressions.mjs firefox --corrective --suites=m2-progression,runtime-stability,traversal-performance,facility-regression,facility-playthrough,transition-diagnose,combat-squad
node tests/m40-regressions.mjs edge --corrective --suites=m2-progression,runtime-stability,traversal-performance,facility-regression,facility-playthrough,transition-diagnose,combat-squad
node tests/environment-placement.mjs firefox
node tests/environment-placement.mjs edge
node _playtest/m42/cp2r-20261011/audit-capture.mjs firefox --stage=manual-rerun --after
git diff --check
```

**STOP at CP2-R1. Await the user's manual review; no R2, CP3, commit, merge or push.**

## CP2-R2 — Approved exterior decoration refinement

The user manually confirmed the repaired exterior walls and authorized R2. R1's
accepted architecture is unchanged. **R2 engineering checks PASS; manual visual
acceptance is pending.** Full before/after index, decisions, validation receipts
and remaining visual questions: [`CP2-R2 report`](_playtest/m42/cp2r2-20261011/REPORT.md).

### Implemented direction

- S1 nameplate/backing and existing staging board retained exactly.
- S2 air-system billboard, S3 loading sign, S4 misplaced Power/egress label, S5 rear
  containment sign and their unnecessary backings removed from runtime.
- S6 emergency plaque moved horizontally inside the x450 lintel; an unobtrusive
  E-04 identifier is on the actual exit's outer header face. Their faces stand
  clear of the existing luminous strip after visual review caught an overlap.
- M1 broad blank front panels replaced with two compact louvered intakes linked by
  risers/roof feeds to the existing Hall handlers. M2 has one small side ventilation
  bank per face; brown scuffs removed. M3 rear panels removed. M4 retains only the
  purposeful yard-facing Power ventilation bank, not north-face CP2 panels/vents.
- M5 three cabinets lowered to z0.4–2.0 m, with attached conduits and shallow status
  trim. Body projection is at most .30 m and the whole service assembly at most
  .35 m, within the .40 m actor stand-off. No extra ground collision is needed.
- M6 crane grounding and all approved equipment supports preserved. Equipment
  recolouring is slightly darker/less emissive. No lighting/fog/exposure changes.

Only the existing scoped post-build `buildExteriorIdentity()` product code changed.
Legacy S3/S4 signs are removed/disposed there after population, preserving the
builder's UUID/cache/random consumption; finalizer-only deleted signs/panels are
not constructed. Seeded scenery and all Endless layout fingerprints still match
the actual archived HEAD in both browsers.

### Preservation, tests and fresh visual evidence

`tests/facility-refinement.mjs` (new) captures a fresh accepted-R1 source baseline
and checks exact equality of all 329 solids, 30 map segments, door shapes/travel,
R1 wall/roof/portal/coping meshes, laboratory meshes excluding the moved sign,
nameplate, staging board, crane and support transforms. It checks **object
existence**, not visibility, for removed signage/decorations, plus all door sweeps
and service-height clearance. `verified/` and `final-check/` stages PASS on both
Firefox and Edge. The legacy `facility-exterior` mount guard is updated for the
removed signs, approved lower cabinets/status trim and accepted 8.2 m door panels.

Also PASS in both browsers: permanent enclosure (both breach directions, all six
door cycles), facility regression, real-input playthrough/squad/hostile pursuit,
traversal performance, transition diagnosis and environmental placement/HEAD
parity. Placement state tests and syntax/whitespace checks PASS. The stress sweep
retains 29 warmed programs/eight light slots with no traversal allocation,
rebuilding or shader links. Timing tails remain in software WebGL; no desktop FPS
improvement claim is made. Matched Firefox image draw-call deltas are -10 to +2.

Evidence root: `_playtest/m42/cp2r2-20261011/`. `before/{firefox,edge}/` and
`verified/{firefox,edge}/` each contain 22 screenshots per browser: eleven matching
poses, each in normal gameplay and temporary diagnostic fill lighting, using the
actual current source. `accepted-r1-facility.js` preserves the before source.
Entrance, both sides, service yard, Power-yard/north, exit inside/outside, closer
exit plaque, roof feeds and elevated overview are covered. Principal poses match
the CP2-R audit; the closer views supplement them. The report links each before/
after pair. Draft `after/` and `review/` evidence is retained, not presented as final.

The new sparse side utilities are subdued in gameplay light; the interior plaque
is small at long range; legacy bright wall strips/simple housing forms and the
unsupported staging board still warrant manual art review. There is no unresolved
engineering regression. Global lighting and unrelated gameplay remain untouched.
`chargefront.html` and `Credits.txt` blob hashes match R2 start exactly.

R2 changed files: `src/world/facility.js`, new `tests/facility-refinement.mjs`,
`tests/facility-exterior.mjs`, this milestone record, architecture addendum and new
evidence/report files. Branch/HEAD unchanged, unstaged; no commit, push or merge.

**STOP after CP2-R2. Await manual acceptance; do not begin CP3.**

## CP2-R2 final correction — normal-lighting side-wall visibility

The user accepted the architecture/refinement and requested one final, narrowly
scoped visibility adjustment after manual playtests. West/east Hall exterior
surfaces now use a slightly lighter, less metallic weathered blue-grey palette
(`0x75828e`, metalness .12, roughness .82), with a restrained shadow-floor tint
(`0x293844`, intensity .08). Only each wall's **outward face** changes; the original
material remains on its interior and other faces. The existing 36 box indices are
reordered into two contiguous material groups, avoiding six separate face draws.
There are no new wall meshes, triangles, collision shapes, dynamic lights or custom
shaders. Two side-wall references are retained during the original builder; all
material/resource work happens once in the existing scoped finalizer.

Side ventilation frames and the two side cabinets use slightly lighter service
metal (`0x8796a5`, metalness .15, roughness .82). Their gentle existing emissive
fill rises from .32 to .40; Power-yard cabinet/vent finishes are unchanged. The
cabinet batch splits once so the accepted Power cabinet retains its material.
No signage, poses, roof supports, R1 architecture or deferred items are redesigned.
Lights, the eight-slot system, exposure and fog are unchanged.

### Normal gameplay evidence and validation

Fresh **player-eye** before/after screenshots are in
`_playtest/m42/cp2r2-visibility-20261011/`: `before/{firefox,edge}/` and
`final-verified/{firefox,edge}/`, four identical poses per browser. They use the
actual standing eye height, original gameplay lighting/exposure/fog and **no
diagnostic fill**. Wide side views and closer service-cabinet views were inspected.
The wall planes and cabinets read more clearly without making the shell look lit
by a new floodlight. Sampled 8-bit luminance on unobstructed wall patches increased
from roughly **6 to 20** (west wide view), **9 to 27** (east wide), **15 to 39**
(west close) and **19 to 48** (east close). These samples are local rendered-image
evidence, not a claim that every wall pixel must reach a fixed brightness.

`tests/facility-visibility.mjs` (new) checks the fixed facility shape/pose digest,
all solids/map lines, light inventory, exposure/fog and program inventory against
the preserved pre-correction receipt. Compact before receipts under `baselines/`
carry the same fixed-geometry digest instead of archiving full animated scene
dumps. The accepted pre-correction source and local raw evidence remain available.
The R2 refinement test still passes exact accepted geometry/door/support/sign
preservation, runtime removal and cabinet/door clearance checks in both browsers.

Final Firefox and Edge checks PASS: normal-lighting visibility, enclosure/both
breach walks/six door cycles, M2 progression, runtime stability, traversal
performance, facility regression, native playthrough and transition diagnosis;
environmental placement/actual HEAD scenery and Endless parity also PASS. Pure
placement-state tests PASS. Firefox had initial file-navigation timeouts in the
facility and placement harnesses; affected tests passed on retry and those first
attempts remain in the local evidence. No product change was made for the timeouts.

The authoritative facility sweep retains **29 warmed programs**, eight light
slots and zero traversal shader links, geometry/material allocation/disposal or
world/facility/nav rebuilds. The normal capture tour exposes 45 total renderer
variants in both the accepted-before and after runs; a warmed repeated tour stays
at 45 (no newly compiled variant). The cold initial pose has fewer variants in
both versions, so it is not used as the traversal comparison baseline.

Matched eye views add **2–3 calls** (under .5% of these views' draw totals), with
unchanged shape/triangle counts. A balanced ABBA render-only material comparison
in each browser, using GPU-completion barriers and 96 samples per state, measured
median **53 → 58 ms** in Firefox (+9.4%) and **18.9 → 16.1 ms** in Edge (-14.8%).
These noisy software/WebGL timings show a small pass cost, not zero overhead or
a desktop FPS guarantee. The unpaired facility sweeps measured p95/p99/worst
**50/133.3/183.3 ms** in Firefox and **33.3/33.5/133.4 ms** in Edge. No shader-linked
stall or consistent material-attributable significant regression was found; Edge's
unpaired p95 was higher than the earlier R2 run, which is why the paired render
comparison and explicit draw/compilation counters are reported rather than hidden.

### Selected checkpoint evidence and staging boundary

[`CP2-R checkpoint summary`](_playtest/m42/cp2r-checkpoint/README.md) links the
selected normal-lighting comparisons, repaired-wall and exit-sign evidence and
compact validation receipts. Its `validation.json` indexes actual test outcomes,
retry notes, source hashes, sampled visibility and performance measurements.
Full screenshots, traces and historical audit stages remain local and are not
staged indiscriminately. Relevant implementation/tests/docs and the minimal
baseline manifests needed by the capture harnesses are prepared for review.
The previously untracked placement module and its tests are included as required
dependencies of the already-modified HTML/facility integration.

`Credits.txt` remains unchanged and unstaged; unrelated working-tree changes are
preserved. The interior emergency plaque size and rooftop housing geometry remain
deferred observations. Staging-board support and partially buried yard equipment
remain deferred for CP4 consideration.

**STOP before committing. No CP3, commit, merge or push; await approval of the
final normal-lighting correction and proposed staging inventory.**

## Accepted and deferred after CP2-R

Final verdict: **PASS WITH MINOR VISUAL ISSUES.** The user accepted the CP2-R1
architectural repairs, the CP2-R2 exterior refinement and the final side-wall
visibility correction, and authorized the CP2-R checkpoint commit.

Deferred to CP3 (do not begin yet):

- Add purposeful, restrained exterior wall fixtures along the dark west/east
  facility sides.
- Coordinate exterior lighting with the upcoming interior lighting pass.
- Preserve the existing eight-light-slot architecture and rendering optimizations.
- Prefer inexpensive emissive fixtures and reuse existing lighting resources.
- Do not indiscriminately introduce additional dynamic lights.

Also retained: the interior emergency exit plaque size, the simplified rooftop
housing geometry, and the staging-board support / partially buried yard equipment
(consider during CP4).
