# Charge Front — Milestone 4.2: Environment & Final Prop Pass

**Current checkpoint: CP3-D-R2 — phases A/B/C/D implemented and verified;
24 final Firefox/Edge suite runs PASS; manual visual acceptance pending.**
CP3-D was not manually accepted; its remaining obstructions, containment lifecycle
and proximity-dependent facade coverage are revised in the separate R2 record below.
Comparative headless timing remains inconclusive, especially Firefox. STOP at R2:
no CP3-E, staging, commit, merge or push. CP3-C-R is the accepted starting source;
HEAD is `9267ceb` (`feat: refine facility interiors and correct prop installations`).
See the separate CP3-D and CP3-D-R2 records below and the
[indexed R2 handoff](_playtest/m42/cp3dr2-20261014/INDEX.html) and
[recovery ledger](CP3-D-R2-PROGRESS.md).
Earlier checkpoint records are retained as historical baseline evidence.

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

---

## CP3-A acceptance and approved environmental direction

The user accepted the current-source CP3-A inspection and indexed screenshots
under `_playtest/m42/cp3a-20261011/`. Approved direction: **restrained abandoned
operations**, residual task lighting and believable equipment, with intentional
empty combat spaces retained. Containment keeps its magenta Sample Zero focus,
cyan peripheral light and dark composition; no substantial redesign.

For **later CP3-D only**, compact guarded exterior service fixtures and two
functional side-wall source positions are approved. Existing-source reuse is
preferred; up to two added authored registrations are conditionally permitted if
reuse compromises their original areas, through the same eight rendered slots.
Selection, spill, transitions and performance require subsequent validation.
No such exterior fixture or lighting treatment is implemented in CP3-B.

## CP3-B — Interior equipment, signage and support corrections

### Baseline, scope and status

**Engineering PASS; corrected normal-lighting screenshots inspected; manual
acceptance pending. STOP after CP3-B.** Starting/current branch `milestone-4.2`,
HEAD `45c05f43c7570b4e677f661581e13cdc7a13920d`. Starting tracked diff was only the
pre-existing one-line `Credits.txt` addition. No reset/clean, existing evidence
replacement, staging, commit, merge or push occurred.

Scope is the approved correction of existing Research/Security equipment, four
interior signs, relay/nozzle supports and the Decon exterior-growth intrusion.
Reception dressing, surveillance props, full room refinement and lighting remain
later checkpoints. The architectural shell, doors, collision and gameplay are
unchanged. `chargefront.html` and the placement module were not edited.

### Implemented corrections

| Target | Actual implementation | Preservation |
|---|---|---|
| Research analysis benches | Replace the two bulky 2.075 m silhouettes with shallow seated assemblies ending at **1.27 m**. Lower the existing small instrument/readout batches to the same envelope; cap bottoms meet the 1.15 m bench tops and device bottoms meet the caps. | Same 1.15 m solids, bench bodies/footprints and lanes. No extra collision or taller cover. |
| Research side workstation equipment | Slim/reseat both overhanging instruments wholly on their existing top surfaces. Corrected assembly ends at **1.52 m**; top plates meet the unchanged 1.4 m tables. | Same supporting table bodies/solids. Standing-shot clearance preserved. |
| Buried Research readout | Move the existing animated screen from inside the table to its east equipment face at x336.30, z1.02; its top is **1.33 m**, below the 1.35 m table cover. | Same material/FX reference; no new console, interaction or source light. |
| Security desk monitors | Reuse both animated displays as thin, seated desktop screens on 5 cm bases touching the desks at z1.4. Display tops end at **1.475 m**, replacing the .275 m unsupported gap and 2.725 m bulk. | Same 1.4 m desk solids, workstations, actual tall server banks, mission console and partition opening. |
| Interior signage | Reorient/reseat Sensors, Supply, Research and Security signs upright and inward-facing. Reuse their existing textures, scale Hall signs to .75 and lab signs to .65, and fit shallow backings/two stand-offs each. Hall centers are z5.95, lab centers z6.5; all tops remain below 8 m. Sensors moves to y633 between unchanged hanging cables, after normal-view review found cable occlusion at y630. | Existing text/style, Hall composition and ceiling/structure unchanged. No new signs or textures. |
| Vault relay installation | Two narrow ceiling straps and fitted ceiling plates per unchanged housing. Straps meet housing tops near z7.7 and plates contact the roof underside at z9.0. | Housings and state-bearing materials/signals do not move or change; no repaired screen, portal, wall or door alteration. |
| Decon nozzle installation | One restrained manifold meets the unchanged nozzle tops at z8.25. Three hangers/mount plates connect it to the actual ceiling underside, z8.975. | Original nozzle poses, process cabinets, crossing and architecture retained. No sterilization mechanic or new light. |
| Decon growth | Test each of the five legacy exterior-growth spheres' **full radius** against x330–390/y690–704 and detach only intrusions after original construction. Detach the corresponding source too, so existing `budgetSourceEnabled()` rejects it. | Original random draws, registrations and all non-intruding patches/source definitions retained. No retry/scatter relocation, broad procedural rewrite or selector change. |

### Construction, resource and lighting ownership

`src/world/facility.js` records the original equipment during the unchanged legacy
construction stream. `finalizeInteriorCorrections()` runs once at the end of the
existing guarded post-population finalizer on scoped seed `0xcf070044`, after the
accepted structural and exterior passes. The caller's random function is restored
by the existing `finally`. Original constructor/cache effects therefore still
precede seeded scenery. No corrections run on movement or mission transitions.

Thirty-three small support/backing pieces are represented by **14 static batches**,
sharing the existing unit-box geometry and cached steel material. No new shadow
caster, emissive material, sign texture, custom shader, direct light or collision
solid is added. Existing animated display/state materials remain independent and
retain their existing FX references. The shallow corrected raw equipment no
longer casts tall equipment shadows.

The removed growth's light registration stays in the source ledger but is
detached from the scene, hence ineligible for selection; this preserves the legacy
registration/construction behavior without leaving magenta illumination in Decon.
It is the **only approved light-source exclusion**. All other normal source
positions/colors/intensities/ranges/decay/shadow flags, eight slots, exposure .78,
fog 40–280, lighting selection/animation and prewarming remain unchanged.

### Targeted before/after verification

New permanent `tests/facility-interior-corrections.mjs` reuses Playwright, real
file:// gameplay and the existing `__cf` capture/collision hooks. It records the
actual accepted source before edits and compares final CP3-B to that immutable
receipt. Five matching seeds in **each browser**: 0, 1, 420042, 2147483647,
4294967295. Results:

- Exact equality of all 329 solid bounds/vertical intervals/overhead flags,
  30 map lines, six door dimensions/travel records, section summaries, selected
  structural/portal/coping/support meshes, exterior geometry, unaffected lab
  geometry and original relay/nozzle poses.
- Device support contacts, containment inside top-plate footprints, slim-height
  envelopes, visible Research readout, ceiling contacts and all four horizontal
  inward sign normals pass. No corrected support/equipment volume intersects any
  door's complete swept panel volume.
- **32 height-aware projectile samples per seed** match accepted results exactly:
  low bench/desk shots blocked; analysis z1.3 and standing z1.62/1.7 clear;
  Security/side-workstation z1.55 and standing shots clear. The small .12 m visual
  analysis cap/device lip does not become gameplay cover.
- No tested growth sphere footprint touches Decon afterward. Seeds 1 and 420042
  each exclude one intrusion; the other three seeds exclude none. Every remaining
  sphere position/radius and source definition matches its accepted counterpart.
  The whole-scene sphere inventory also contains an unrelated origin mesh; it is
  retained and is not described as a sixth facility patch.
- No capture-page errors in either final browser run.

Two initial comparison-fixture issues were corrected without changing product
semantics: JSON normalizes negative zero in saved transforms, and the unchanged
specimen source uses the existing 3.7 ± .7 time pulse. Snapshot comparison now
normalizes serialization and bounds that one known pulse while strictly comparing
the remaining source definitions. Initial attempts remain under `after/` and
`checked/`; `verified/` precedes the final Sensors position correction. The
authoritative final-source snapshots/captures are **`final/{firefox,edge}/`**.

### Screenshots and direct visual review

Evidence root: [`_playtest/m42/cp3b-20261012/`](_playtest/m42/cp3b-20261012/).
[Full paired index](_playtest/m42/cp3b-20261012/SCREENSHOT-INDEX.md) links both
browsers' individual before/after PNGs and comparison sheets. **13 matching poses
per browser/stage: 11 normal gameplay + two diagnostic mounting views** (52
selected full-size PNGs), same seed420042/camera/FOV75/exposure .78/fog 40–280.
All final before/after comparison sheets in both browsers were visually inspected.

| Review target | Normal-lighting comparison sheet (Firefox; Edge counterpart in index) |
|---|---|
| Analysis and side workstation equipment | [01](_playtest/m42/cp3b-20261012/review/01-research-equipment-firefox.png) |
| Restored readout / seated Security screens | [02](_playtest/m42/cp3b-20261012/review/02-readout-security-desk-firefox.png) |
| Research / Security signage | [03](_playtest/m42/cp3b-20261012/review/03-lab-signs-firefox.png) |
| Hall Sensors / Supply signs | [04](_playtest/m42/cp3b-20261012/review/04-hall-signs-firefox.png) |
| Vault supports / Decon nozzle mounting | [05](_playtest/m42/cp3b-20261012/review/05-mounts-normal-firefox.png) |
| Removed growth and magenta illumination | [06](_playtest/m42/cp3b-20261012/review/06-growth-exclusion-firefox.png) |

Captures use actual gameplay eight-slot lighting and quiet/invulnerable setup
teleports with HUD/viewmodel/squad hidden. They are composition evidence, not
unassisted walking proof. Diagnostic views only add temporary non-shadow fill;
their pixels are not normal-lighting acceptance evidence. Existing normal/emergency
lighting is not globally lifted. No CP3-C/D preview objects are shown.

### Final-code regression results

| Suite | Firefox 155 | Edge 155 |
|---|---|---|
| New interior corrections: five seeds, exact preservation, height samples, captures | PASS | PASS |
| Existing M2 progression | PASS | PASS |
| Facility regression: cover, M3 override/sample, M4 extraction/result/Continue/lifecycle | PASS | PASS |
| Facility real-input playthrough: walking/sprint/FOLLOW/combat/hostile pursuit | PASS | PASS |
| Traversal performance | PASS | PASS |
| Visible intro and mission-transition diagnosis | PASS | PASS |
| Permanent enclosure, four breach walks and all six door cycles | PASS | PASS |
| Environmental placement / archived accepted scenery and Endless parity | PASS | PASS |

Placement-state and product/test JavaScript syntax checks PASS. Placement browser
coverage is 14 Campaign/Endless cases per browser, including all three arenas and
original archived `5c8704f` scenery parity. The new five-seed correction receipts
add exact current accepted-CP2-R solid/structure/growth comparison. The existing
placement harness and authoritative regression suites were not weakened or edited.

Native input tests cross all sections and both M4 doors, exercise standing shots,
FOLLOW and hostile pursuit, and restore the exit checkpoint. These are bounded
automated scenarios with existing test hooks, not full-duration unassisted play.

### Rendering and performance results

| Quiet A–E sweep (271 frames) | Firefox | Edge |
|---|---:|---:|
| p95 / p99 / worst, ms | 50 / 100 / 200 | 17.3 / 50 / 133.3 |
| Shader links / world / facility / grid rebuilds | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| Geometry/material allocation or disposal | 0 | 0 |
| Solids / slots / warmed programs | 329 / 8 / 29 | 329 / 8 / 29 |

Matched normal capture tours retain **41 programs before and after** in both
browsers. Most target views add 2–4 calls; the upward Vault mount view adds 11
(393→404) and nozzle view adds 5 (79→84). Maximum matched triangle increase is
336. These are small static draw costs, not a claim of zero overhead. Independent
randomized sweep totals are not paired asset deltas or evidence of higher FPS.

Quiet regional p95/worst: Facility interior **50/66.7 ms Firefox**, **16.8/33.4 ms
Edge**; M4 service/exit **33.3/50 ms Firefox**, **17/17.3 ms Edge**. Quiet region
counters record shadow refresh only. The mixed live playthrough permits existing
encounter/effect allocation (Edge reports 10 geometries/10 materials; both report
two material disposals), while retaining zero links/rebuilds; do not misreport
that mixed test as allocation-free. The quiet sweep is the static-environment
churn gate.

All five visible intro cuts and M2/M3/M4/result transitions remain link-free;
covered cold preparation still has multi-second compilation costs. Timing tails
remain in headless WebGL and are not a new desktop-performance certification.
Compact measured receipts: [validation summary](_playtest/m42/cp3b-20261012/validation-summary.json).

### Outstanding observations, files and stop boundary

No unresolved **CP3-B** structural, collision, placement, sign-orientation or
regression blocker remains. Manual art review is pending. Shallow desk/bench
devices are deliberately simpler; scientific/surveillance specificity belongs to
CP3-C. Relay straps remain subdued under current normal lighting; no brightness
adjustment was used to expose them. Existing wall-panel repetition, ceiling light
hotspots and exterior darkness remain for the approved later phases.

The multi-seed inventory also confirms an existing Research-area legacy growth
placement at seed0 (approximately 346.65,715.24). It remains unchanged: this
checkpoint's approved exclusion is specifically Decon, not a broad facility
scatter cleanup. Flag it for separate design approval rather than silently changing
more seeded decoration. Containment, exit plaque, staging board, rooftop housings
and yard grounding are unchanged.

Actual intended changes:

- `src/world/facility.js` — scoped corrective finalizer and legacy target references.
- `tests/facility-interior-corrections.mjs` — new targeted preservation/placement/
  projectile/capture test using existing hooks.
- `MILESTONE-4.2-ENVIRONMENT.md` — current checkpoint and this implementation record.
- New `_playtest/m42/cp3b-20261012/` evidence: accepted before source/receipts, final
  snapshots/PNGs, retained initial attempts, regression/enclosure/placement outputs,
  comparison sheets, index, summary and `prepare-review.mjs`.

Credits remains the original unrelated local change; existing CP3-A and older
evidence remain untouched. Nothing is staged or committed.

**Final CP3-B verdict: ENGINEERING PASS — READY FOR MANUAL REVIEW. STOP HERE.
No CP3-C/D/E implementation, exterior lighting, commit, merge or push.**

---

## CP3-C — Functional interior environmental refinement

### Baseline, scope and verdict

**ENGINEERING PASS — READY FOR MANUAL REVIEW. STOP AT CP3-C.** Date 2026-10-12.
Accepted source/HEAD: `c0bb414492d5359b2d98367bf31ca7511f65f9ba`, branch
`milestone-4.2`. The user accepted CP3-A and CP3-B; CP3-B's manual verdict was
**PASS WITH MINOR VISUAL ISSUES**. Its earlier pending-review text above is retained
as a historical engineering record, superseded by this acceptance statement.

Direction: **RESTRICTED ABANDONED OPERATIONS**. This pass refines existing intake,
research, surveillance, archive and utility equipment surfaces. Small service
seams, controls, sample trays, filter faces and printed maintenance plates have
specific functions. Empty fighting/formation spaces remain intentional. No new
floor machinery, collision, interaction, camera prop or authored luminaire is added.

The only approved scenery/light eligibility correction is the confirmed seed0
**exterior** growth intrusion into Research. No CP3-D lighting is implemented.

### Actual room changes

| Area | Functional refinement | Preservation / visual outcome |
|---|---|---|
| Main Hall | Wipe-clean tops on two existing command-side stations, a compact ID-reader recess, document slot, divided existing screen and printed intake/visitor-record plates. | All new pieces stay east of x379. Sensors/Supply signs and entrance–Vault axis unchanged; no new central-lane floor object. Intake details remain subordinate to existing live screens. |
| Three-Relay Vault | Fitted rear service backplanes, two short feeds per unchanged suspended housing, restrained face seams and R1/R2/R3 isolation-service markings. | CP3-B hangers, housing dimensions, state-bearing LED/material references, pads/interactions and floor unchanged. No cover or additional relay machinery. |
| Decontamination | Intake/filter and purge/exhaust labels, seated washable grille faces and service handles on the four existing process cabinets. | Existing nozzles/manifold/hangers inspected in normal upward views; no genuine remaining mounting defect found, so all remain unchanged. CP3-B exclusion retained. |
| Research | Thin dark analyzer control beds, small pale controls, shallow sample-handling trays and optical-calibration plates on existing corrected bays. | Original CP3-B meshes/dimensions unchanged. Added analysis details end below 1.28 m and side controls below 1.53 m; no bulky false cover. Existing animated readout retained. |
| Security | Seated desktop bezels, divided surveillance/network faces, equipment hinge lines, wall-monitor borders and local-recorder plates. | Existing animated screens, tall rack cover, mission console and partition opening unchanged. Research's sample/control vocabulary remains distinct from Security's surveillance divisions. No decorative camera needed. |
| Containment / Deep Lab | Restrained archive cassette divisions and sealed-archive labels on existing peripheral bays. | Pod geometry left alone rather than applying rectangular seams to tapered skins. No new bright accent. All additions stay outside the 12 m sample annulus; dark breathing space and Sample Zero composition retained. |
| Service / Power | Aisle-facing generator service louvers, small gauge plates and hinge details; distribution isolation faces; one coherent upper north-wall feeder with three wall-contacting clamps and two fitted drops. | Four generators, existing tall-cover bounds and complete M4 route unchanged. Feeder at z7.75, drops meet existing bays at z5.59; emergency signage unchanged. |

### Research-growth investigation and narrow correction

Both accepted-source browsers reproduce the exterior-family sphere at
**(346.6523554, 715.2358730, .35), radius .9509626952** for seed0. Its full footprint
lies in Research and visibly casts an unintended magenta pool alongside the analysis
bench (indexed R0 before/after). This is not the intentional Containment/emergency
growth family.

The existing post-population exclusion now also tests circle/rectangle contact with
Research's actual inner faces **x330.7–366.5, y704.7–734.3**. Only the legacy
exterior-family patch and its associated source are detached/disposed on intrusion.
Construction/random draws and the source registration ledger are retained.
`budgetSourceEnabled()` already rejects detached sources, so no orphan magenta spill
or selector change is required. No relocation, reseeding, broad scatter cleanup or
Security exclusion occurs.

Seeds **0, 1, 420042, 2147483647, 4294967295**, in each browser, exclude exactly
one additional Research patch at seed0 and none at the other four. All remaining
sphere positions/radii and all remaining source definitions match accepted CP3-B
exactly. CP3-B's Decon exclusions remain in effect. The unrelated origin sphere
remains; it is not counted as exterior facility growth.

### Construction, batching and lighting ownership

`finalizeInteriorRefinement()` executes once after accepted CP3-B corrections,
on independent scoped seed **0xcf070045**, inside the existing guarded finalizer.
The caller's random function is restored by the existing `finally`. The legacy
stream and CP2-R/CP3-B construction streams remain intact. No work is added to
movement, lighting selection, mission-transition or animation update paths.

**196 small surface-detail components in 15 instanced batches** share the existing
unit-box geometry and three cached non-emissive steel/dark/pale materials. They are
subcomponents of existing equipment, not 196 new independent floor props.
Thirty printed plates share **one 512×4096 canvas atlas and one ordinary mapped
standard material**, merged into seven room meshes. The mapped material is owned
explicitly because `envMat` does not key on texture maps. It is shared across all
plates rather than contaminating the cache. No custom shader or asset pipeline.

All new details are non-shadow-casting, non-emissive and non-colliding. Original
animated materials/FX references remain independent. No authored light position,
color, intensity, range, decay or shadow setting changes. Eight rendered slots,
selection/animation, exposure **.78**, fog **40–280** and prewarming remain intact.
The approved detached Research-growth source is the sole new eligibility exception.

### Targeted preservation and seating verification

New permanent `tests/facility-interior-refinement.mjs` runs real file:// gameplay
against immutable accepted-CP3-B receipts captured **before any product edit**.
Both browsers pass all five seeds:

- Exact original mesh/instance geometry and transforms for the laboratory (apart
  from the existing animated field/turret-head pose), direct facility meshes,
  InteriorIdentity and FacilityExterior. Includes all CP3-B signs, equipment,
  supports and all four generators; no original material-color or shadow-flag change.
- Exact 329 solid bounds/vertical/overhead flags, 30 minimap segments, six door
  dimensions/travel records, section inventories and eight slots.
- All **32 height-aware projectile samples per seed** unchanged: low analysis/desk
  shots blocked; accepted standing/over-cover shots clear.
- Added detail bounds clear every door's complete swept volume; no Hall detail in
  the formation lane or Containment detail in the sample annulus.
- Intake tops contact the original 1.1/1.3 m station tops; analyzer/workstation
  control beds contact the 1.27/1.52 m device tops; desktop bezels contact 1.475 m;
  three feeder clamps contact the actual y769.3 wall and both drops connect to
  distribution/upper-run elevations.
- Remaining light definitions exact, with only the known specimen 3.7 ± .7 time
  pulse bounded rather than falsely compared at different times. No page errors.

An initial test-fixture assertion mistook a whole merged label mesh's union bounds
for one desktop object. It now checks each six-vertex plate separately and scopes
desktop checks to the actual workstation. Product cover/collision semantics were
not changed to pass the test. `draft/`, `checked/` and `final/` retain earlier
receipts. Final seating review lifted the visitor plate above its intake top and
the reception plate clear of the existing warning panel/rack border. Both contacts
now have explicit assertions. **`final-verified/{firefox,edge}/` is authoritative**.

The CP3-B checkpoint-specific fixture remains unchanged. Its historical exact
CP2-R lab/growth expectations predate these approved additions/exclusion; the new
CP3-C preservation fixture compares directly to accepted CP3-B instead. Existing
authoritative gameplay, enclosure and placement tests are unchanged.

### Indexed normal-lighting evidence

Evidence root: [`_playtest/m42/cp3c-20261012/`](_playtest/m42/cp3c-20261012/).
[Final paired index](_playtest/m42/cp3c-20261012/SCREENSHOT-INDEX-final-verified.md) links
every before/after PNG and eight compact comparison sheets per browser.
**14 matching normal-lighting poses × two stages × two browsers = 56 full-size
PNGs**, plus 16 paired sheets. All final sheets in both browsers were directly
inspected. No entire archive was attached to the session.

| Area / purpose | Firefox comparison (Edge counterpart in index) |
|---|---|
| Intake details / clear Hall axis | [01](_playtest/m42/cp3c-20261012/review-final-verified/01-hall-firefox.png) |
| Suspended relay faces and supports | [02](_playtest/m42/cp3c-20261012/review-final-verified/02-vault-firefox.png) |
| Process cabinets / unchanged nozzle mount | [03](_playtest/m42/cp3c-20261012/review-final-verified/03-decon-firefox.png) |
| Analysis controls / optical workstation | [04](_playtest/m42/cp3c-20261012/review-final-verified/04-research-firefox.png) |
| Surveillance / seated desktops | [05](_playtest/m42/cp3c-20261012/review-final-verified/05-security-firefox.png) |
| Sample composition / archive bay | [06](_playtest/m42/cp3c-20261012/review-final-verified/06-containment-firefox.png) |
| Generators / connected distribution feeder | [07](_playtest/m42/cp3c-20261012/review-final-verified/07-power-firefox.png) |
| Seed0 Research intrusion and spill removed | [08](_playtest/m42/cp3c-20261012/review-final-verified/08-research-growth-firefox.png) |

All views use normal gameplay lighting, FOV75, exposure .78 and fog40–280, seed420042
except the R0 growth comparison (seed0). HUD/viewmodel/squad are hidden; setup
teleports are quiet/invulnerable composition fixtures, not unassisted walking proof.
No diagnostic light, lifted exposure, cutaway or CP3-D preview was needed.

### Final-source regressions and honest first-attempt results

Final facility source SHA256:
`62f23aed1589ae2508c4f96a6274f6407a599d8980ab850c5a720075999aeb86`.
All authoritative final-verified captures, paired-performance-verified and
regression-*-verified receipts identify this source. Earlier draft receipts retain
their original source hashes rather than being silently updated.

| Suite | Firefox155 | Edge155 |
|---|---|---|
| Five-seed CP3-C preservation/seating/cover/exclusion | PASS | PASS |
| Facility regression: cover, sample, M4/result/Continue/lifecycle | PASS | PASS |
| Facility real-input playthrough, sprint, FOLLOW, combat and pursuit | PASS | PASS |
| Canonical M2 progression / relay return / save | PASS | PASS |
| Visible intro cuts and mission/result transitions | PASS | PASS |
| Traversal performance | PASS | PASS |
| Permanent enclosure, four breach walks and six door cycles | PASS | PASS |
| Environmental placement / archived scenery / Endless parity | PASS | PASS |

Environment placement-state and changed JavaScript syntax checks also PASS.
Placement covers 14 cases/browser including all three Endless arenas and archived
`5c8704f` parity. Native-input tests traverse all interior sections and M4 doors,
exercise standing shots, squad combat, FOLLOW, hostile pursuit and restored exit save.

Two earlier Firefox runs failed and are preserved, not relabeled as passes:

1. Fixed-time playthrough reached y617.63 rather than crossing the Hall threshold
   within 3 s. Unchanged isolated rerun crosses at y627.69 and completes all checks.
2. M2 test timed out at its initial 90 s renderer-ready gate. Unchanged isolated
   rerun completes progression and save checks. No test timeout, assertion, movement
   or product semantics were loosened.

After the final intake-plate correction, all seven suites were rerun in both
browsers and PASS directly on the final source. The batch command reached its
20-minute orchestration budget after eleven completed suites; no worker remained
running. Only the three remaining Edge suites were resumed in a bounded command,
and their separate successful receipts are joined in the final summary.

### Rendering / generation results

Matched final normal capture tours retain the exact accepted program counts in
both browsers: **40–41** for seed420042 views and **42** for the seed0 setup.
Added calls range **+3 to +22**, with +22 at Hall-axis (621→643) and +18 at the
upward relay view (220→238). Maximum matched triangle delta **2412**. No new shader
variant appeared in these matched views. This pass has small static draw cost;
it is not claimed to be free.

The authoritative 271-frame randomized A–E sweep records:

| Metric | Firefox | Edge |
|---|---:|---:|
| p95 / p99 / worst, ms | 66.7 / 116.7 / 150 | 33.3 / 50 / 100 |
| Shader links / world / facility / nav rebuilds | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| Geometry/material creation or disposal | 0 | 0 |
| Solids / slots / warmed programs | 329 / 8 / 29 | 329 / 8 / 29 |

Earlier A–E timings (183.4/300.1/366.7 ms Firefox, 50.2/83.4/199.9 ms Edge) are
retained in the earlier receipts. Neither sweep is presented as an FPS improvement
or a paired performance delta. Final quiet regional p95/worst: Facility interior
**50/66.7 ms Firefox**, **16.8/33.4 ms Edge**;
M4 service/exit **33.3/50 ms Firefox**, **17/17.5 ms Edge**. Regional counters show
shadow refresh, no static-environment churn. The live playthrough retains its
existing two material disposals and is not called allocation/disposal-free.

A fresh accepted-CP3-B site was extracted using `git archive c0bb414` to temporary
storage, then compared with the actual current site in each browser. Identical
seed420042, seven room poses, 1280×720, 64 measured RAF frames/pose, quiet gameplay
and a common priming tour. No product files were swapped or rewritten.

- Edge paired p95 stays approximately **17 ms** before/after in every room.
- Firefox paired p95 is **16.7 ms** after in five rooms; Hall is **50 ms** versus
  33.3 before and Research is **33.3 ms** versus 16.7 before. Their measured render
  p95 changes are 12→14 ms in both cases, with unchanged 9 ms median render time.
- Firefox median render deltas range **−1 to +1 ms**, render p95 deltas **0 to +2 ms**.
  Edge render p95 deltas range **−.2 to +2.5 ms** (Security 7.1→9.6 ms).
- Both paired tours retain **47 programs before/after**, with zero measured shader
  links, allocation/disposal, world or nav rebuilds in every warmed room sample.
- Initial probe caught two cold-view links on the accepted baseline itself; both
  sites were given the same normal-view priming tour before steady measurements.

No significant new generation/rendering churn or program growth was found. The
small draw delta and noisy frame-time tails are explicitly retained for review;
these headless ANGLE browser measurements are not a desktop-performance certification.
See [joined final receipts](_playtest/m42/cp3c-20261012/validation-summary-verified.json) and
[paired final measurements](_playtest/m42/cp3c-20261012/paired-performance-verified.json).

### Manual-review observations, files and hard stop

Functional details intentionally stay subdued under existing lighting. Printed
plates are small; final intake placement is clear of its existing warning/rack
border, with the visitor plate visibly seated. Scientific controls are shallow and
the Vault rear feeds remain hard to read from straight-on floor views. The archive
detail is deliberately peripheral. These are manual art-review observations, not
claims that additional lighting or floor clutter was required.

Changed/new files:

- `src/world/facility.js` — independent static refinement finalizer and approved
  Research footprint/source exclusion.
- `tests/facility-interior-refinement.mjs` — immutable five-seed preservation,
  seating/bounds/cover and matched normal-capture harness.
- `MILESTONE-4.2-ENVIRONMENT.md` — current status, CP3-B acceptance, this record.
- `_playtest/m42/cp3c-20261012/` — accepted before source/receipts, final normal PNGs,
  index/sheets, summary, untouched suite outputs/retries and small evidence tools.

`Credits.txt` remains the original unrelated local modification. Older evidence
and untracked files remain intact. No staging, commit, merge or push occurred.
**STOP: CP3-C READY FOR MANUAL REVIEW. No CP3-D lighting or CP3-E work begun.**

---

## CP3-C-R — Approved interior prop placement corrections

### Approval, baseline and verdict

The user reviewed the [placement report](_playtest/m42/cp3cr-20261012/REPORT.md)
and [inspection index](_playtest/m42/cp3cr-20261012/SCREENSHOT-INDEX.md), accepted
the seven room identities, and approved **F01, H01–H08, D01, R01, S01, C01–C02,
P02–P04 and E01**. CP3-C had engineering validation, not final visual acceptance.
This is the approved corrective refinement, not another decoration expansion.

**Verdict: functional/preservation PASS; prewarming/static-churn PASS;
comparative frame-time timing INCONCLUSIVE. Ready for manual visual review.**
No unresolved approved collision, door, progression, mounting-contact or seeded
placement blocker remains. The timing limitation below is explicit; it is not
silently relabeled as a clean performance certification.

Starting/current HEAD `c0bb414492d5359b2d98367bf31ca7511f65f9ba`, branch
`milestone-4.2`. Starting facility was the inspected, uncommitted CP3-C source
SHA256 `62f23aed1589ae2508c4f96a6274f6407a599d8980ab850c5a720075999aeb86`,
not the older CP3-B file in HEAD. An immutable actual before copy and five-seed
receipts were saved before editing. Existing CP3-C source/documentation/test work,
Credits.txt and all older evidence were preserved.

Final facility SHA256:
`2720064cfcfc09480976262a42ce2b31b78a4d7e9d8683d9f9e8dc5df740eb2b`.
Every final capture/suite/paired-performance receipt identifies this source.

### Priority 0 gate — completed before installation work

H02/H08/E01 were corrected first. H01's dependent intake-host correction was
included with H02 so the oversized face did not lose its apparent host and remain
unsupported. Source at this gate was `a33e254d...`.

- Retired the three non-colliding .9×2×1.1 m Hall shells at x386.4/y640,646,652.
  The real solid stations remain. Four duplicate y646 CP3-C surface components
  were consolidated into the existing y650 reader/document installation; the
  visitor plate was rehomed onto its actual top.
- Reused the 4.6 m face as a **1.55×.18 m** status ribbon seated on the solid
  station's front. No added desk, station or floor solid.
- Refit the fallen casing with proper Z-up floor-plane yaw. It rests at **z.25**,
  ends at **z1.39**, and stays inside the existing 3×3 m / 1.4 m solid envelope.
  Its old local-Z tilt had raised meaningful visible bulk to approximately 1.91 m.
- Kept exactly three M4 fragments, now **4.6×.65×.12 m**, bottom **z.35**, top
  **z.47**. The service fragment moved to **(415.5,759.4)**, off the y752 evacuation
  axis. Wreckage remains state-dependent and non-cover; no obstacles or solids added.

Five-seed checks and the existing native-input facility playthrough **PASS in
Firefox and Edge before Priority 1 began**. Projectile results, M4 lane queries,
329 solid records, six door sweeps, FOLLOW, sprint, hostile pursuit and saved exit
checkpoint behavior were retained. Gate receipts remain in `priority0-checked/`
and `regression-priority0-{firefox,edge}/`.

### Actual installation corrections

| Approved group | Implemented correction | Preserved |
|---|---|---|
| F01 | Fill the existing cases' unsupported rear depth to contact their actual wall while retaining established front faces: Hall racks, Decon panels/status, Research faces/returns, Security overview/status, Containment panels/ribs/archive bays and Power distribution/housings. | Legitimate spacing supported by the now-seated Containment ribs/conduit remains; no blanket wall-plane flattening. Vault local jumpers and accepted supports unchanged. |
| H03 | Shorten the y650 information divider to z1.30–1.74, clear of the printed ID-check plate ending at z1.27. | Existing screen, label, reader/document functions and materials retained. |
| H04 | Seat the two warning plaques against actual wall faces in clear bays: west (331.06,635,4.1), east (388.94,650.9,4.1). Fit their 2×.85 m faces and thin correctly oriented stripes. | Warning style and accepted Sensors/Supply signs/supports unchanged; no reception-board overlap or new signage. |
| H05 | Reorient the existing gauge rim/face vertically on the utility unit at z1.55; casing/rim/face contacts are y623.60/.66/.69. | Same casing solid and existing gauge materials; no new control or authored source. |
| H06 | Reuse the isolated pipe as a thin service riser at (335,621.1), contacting the existing utility top z2 and Hall roof underside z9. Clear of the unit's original status cube. | No independent floor pole, machinery or collision addition. |
| H07 | Extend the three existing runs to the Hall's x331/x389 wall faces. Six necessary saddles attach them to the existing longitudinal beam grid. | Original routes/materials/lights; six saddles use 18 small unit-box parts in **one** cached-material instanced batch, not another cable network. |
| D01 | Move the two .35 m crossbars onto the unchanged z7.8 post tops; bar range z7.8–8.15. | Existing posts, floor guidance, nozzles and CP3-B manifold/hangers/ceiling mounts exact. |
| R01 | Retire the two independent intersecting smaller Research slabs; the existing larger faces become seated analyzer cases with coherent readouts. | Corrected shallow benches/instruments/readout, all collision and turret-console interaction exact; no taller cover or more screens. |
| S01 | Retire exactly three glass skins and six duplicate buried rails after original construction. | No collision/FX/exported mission references belonged to them. The genuine opaque perimeter, x367 partition/opening, four tall banks, desks, overview screens and override console remain. |
| C01 | Retire two conflicting lower archive slabs and seat the surviving coherent archive cases/upper bays. Surface-seat the existing sealed-archive plates. | No Sample Zero, pod, annulus, upper cassette identity or source-light change. |
| C02 | Refit only the existing turret base to span z.35–.94 and meet the head underside. | Head, barrel, lamp, console, aim/firing components, positions and mission references exact; no new turret or cover. |
| P02 | Seat the existing distribution cases on the y769.3 wall and fit their status strips. | Entire CP3-C feeder/clamps/drops exact, including their terminal contacts. |
| P03 | Retire only six old competing aisle-side vent masks on the two rear generators. | All four generator bodies/solids, retained far-side vents and coherent CP3-C service/gauge/louver faces remain. |
| P04 | Refit the existing high patches as narrow fixed status/terminal faces. Relabel the two existing plates **BUS / REMOTE STATUS** in their original shared atlas. | No high manual-handle implication, added buttons, interactables, textures or assets; manual service remains with existing floor equipment. |

No new environmental machinery, floor props, geometry pipeline, shaders or light
sources were introduced. The only added installation geometry is H07's necessary
six saddles, batched once. Resource reuse, lower redundant-object count and no new
shadow-caster family are retained.

### Construction and preservation

Legacy builders keep every original constructor/cache/random draw and only record
references. Existing CP2-R/CP3-B/CP3-C finalizers remain in their original streams.
`finalizeInteriorCoverCorrections()` and `finalizeInteriorInstallationCorrections()`
run once afterward on scoped seeds **0xcf070046 / 0xcf070047**; the existing
`finally` restores the caller's random function. No correction runs during movement,
mission transitions or lighting updates.

Retired cached geometry/materials are not disposed out from under retained users.
Only removed unshared slab/glass/rail materials are disposed during construction,
before warming; this is not steady-gameplay churn. The label atlas/material is
reused for P04, with only its two approved rows redrawn. Static batches are compacted
in place and their bounds refreshed.

Permanent `tests/facility-prop-placement.mjs` compares actual inspected CP3-C with
final code for **0,1,420042,2147483647,4294967295 in each browser**:

- Exact **329** solid bounds/vertical/overhead/portal records, **30** map segments,
  six door dimensions/travel records and section inventories.
- Exact unaffected original mesh/instance data; explicit exceptions are the
  approved correcting/retired families. CP3-B equipment/sign/mount data, Research
  compact devices, mission anchors, turret head/barrel/lamp components and the
  complete CP3-C Power feeder data remain exact.
- All **36 normal-state projectile samples per seed** match, covering fallen-case
  heights, low bench/desk cover, standing clearance and the genuine Security wall.
  An additional **16 M4 samples** match at old/new debris points; all 57 sampled
  evacuation-lane cells match. These are bounded geometry checks, supplemented by
  actual native-input traversal below.
- Added/corrected bounds clear every door's complete swept volume. Casing fits
  its real cover footprint; exactly three debris pieces end below .5 m.
- Actual wall contacts, crossbar/post contacts, gauge rim/face contacts, unit/roof
  riser contacts, pipe endpoints, turret support and intake label seating pass.
- Exact source definitions/count ledger, eight slots, exposure .78 and fog40–280.
  Existing specimen and emergency-source animation definitions are normalized to
  their authored values; no lighting-selection or source modification is hidden.
- Existing CP3-C growth exclusions/remaining sphere geometry and M4 legitimate
  growth anchors/structure remain unchanged. Four generator bodies and four tall
  Security banks remain. Decorative S01 reference checks were captured before removal.
- Actual native canvas text calls retain all first 28 atlas rows; only the last
  two have the approved new status text. No capture-page errors.

Initial fixture attempts are preserved. Pixel readback hashes varied on unchanged
Firefox canvas text, so glyph preservation uses native `fillText` arguments, with
the drawing call forwarded unchanged. Three connected companion families
(SecurityStatus, PowerBusStatus, archive plates) were explicitly included in the
approved mounting scope; the immutable before receipt was not rewritten. No
authoritative gameplay/placement assertions, inputs or controller semantics were
weakened to obtain passes.

### Targeted before/after evidence

Root: [`_playtest/m42/cp3cr-implementation-20261013/`](_playtest/m42/cp3cr-implementation-20261013/).
[Complete targeted index](_playtest/m42/cp3cr-implementation-20261013/SCREENSHOT-INDEX.md)
links **22 paired poses/browser**, player-height and useful side/elevated views.
The 19 matching Firefox inspection images were reused for before evidence; fresh
before receipts independently sampled their actual source/camera poses. Edge
before and both final tours were captured directly. No entire screenshot archive
was loaded into a model request. Compact contact pages were inspected in both browsers;
full-size pairs remain available for manual review.

| Corrected finding group | Firefox paired sheet (Edge counterpart in index) |
|---|---|
| H01–H04 intake/consolidation/divider/mounting | [01](_playtest/m42/cp3cr-implementation-20261013/review/01-intake-firefox.png) |
| H08 real cover / E01 evacuation wreckage | [02](_playtest/m42/cp3cr-implementation-20261013/review/02-real-cover-firefox.png) |
| H05–H06 gauge / pipe removal / connected riser | [03](_playtest/m42/cp3cr-implementation-20261013/review/03-utility-firefox.png) |
| H07 overhead attachment | [04](_playtest/m42/cp3cr-implementation-20261013/review/04-overhead-firefox.png) |
| D01 frame / retained CP3-B nozzle installation | [05](_playtest/m42/cp3cr-implementation-20261013/review/05-decon-firefox.png) |
| F01/R01 seated analyzer cases | [06](_playtest/m42/cp3cr-implementation-20261013/review/06-research-firefox.png) |
| F01/S01 genuine Security equipment retained | [07](_playtest/m42/cp3cr-implementation-20261013/review/07-security-firefox.png) |
| F01/C01 archive consolidation | [08](_playtest/m42/cp3cr-implementation-20261013/review/08-archive-firefox.png) |
| C02 turret / retained Sample Zero focus | [09](_playtest/m42/cp3cr-implementation-20261013/review/09-turret-focus-firefox.png) |
| F01/P02–P04 distribution / retained feeder / four generators | [10](_playtest/m42/cp3cr-implementation-20261013/review/10-power-firefox.png) |

All use **normal gameplay lighting**, seed420042, FOV75, exposure .78, fog40–280,
eight slots, quiet setup teleports and hidden HUD/viewmodel/squad. E2/E3 use the
existing M4 emergency gameplay state, not a lighting preview. No diagnostic fill,
cutaway, lifted exposure or proposed CP3-D objects were used. Screenshot composition
is not represented as unassisted walking proof.

### Final-source regression results

| Suite | Firefox155 | Edge155 |
|---|---|---|
| New five-seed preservation/projectiles/contacts/captures | PASS | PASS |
| Existing facility regression, M3 sample/override, M4/result/Continue/lifecycle | PASS | PASS |
| Existing real-input playthrough, sprint, FOLLOW, combat/hostile pursuit/exit save | PASS | PASS |
| Canonical M2 progression and checkpoint/relay return | PASS | PASS |
| Permanent enclosure, four breach walks and six door cycles | PASS | PASS |
| Five-seed Campaign / three-arena Endless / archived scenery placement parity | PASS on unchanged retry | PASS on unchanged retry |
| Traversal performance and visible intro/mission/result prewarming | PASS | PASS |

Placement retries complete **14 cases/browser**, including the five Campaign seeds
and nine Endless cases, plus the existing archived `5c8704f` parity check. Placement
state tests also PASS. Existing suites and their internal timeouts/assertions are
unchanged. Full native input covers the evacuation doors, actual shooting over
Research cover, Squad FOLLOW/combat, Infested pursuit and restored exit checkpoint.

The first placement attempts were terminated by external operation timeouts,
after 13 cases in Firefox and 10 in Edge, without a logged assertion failure.
The Edge receipt includes 21148 s of wall-clock elapsed time across interruption;
it is not used as a startup/performance measurement. Fresh isolated retries used
a 720 s external process budget and PASS in **254.856 s Firefox / 114.652 s Edge**.
Their original incomplete receipts/logs remain alongside the final passes.

### Rendering, generation and timing caveat

Matched normal tour draw-call deltas range **−15 to +2**, maximum triangle increase
**248**. Security views drop 12 calls, the rear-generator view drops 3, and inspected
M4 views drop 10–12. The Hall utility views add 2. These are pose-matched measured
costs; randomized scene totals are not asserted to be paired asset deltas.
Complete tours retain **43** programs in both browsers; the early Firefox H1 sample
has fewer warmed programs after, not program growth.

| 271-frame A–E sweep | Firefox | Edge |
|---|---:|---:|
| p95 / p99 / worst, ms | 63.2 / 155.3 / 232.2 | 53.1 / 108.1 / 177.5 |
| Shader links / world / facility / nav rebuilds | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| Geometry/material creation or disposal | 0 | 0 |
| Solids / slots / warmed programs | 329 / 8 / 29 | 329 / 8 / 29 |

Quiet regional p95/worst: Facility interior **50/83.4 ms Firefox**, **33.4/50.1 ms
Edge**; M4 service/exit **50/83.4 ms Firefox**, **16.9/49.7 ms Edge**. Region counters
record shadow refresh without static-environment churn. Live combat/playthrough
retains legitimate encounter/effect lifetime behavior and is not described as
allocation/disposal-free.

A fresh private site was built from unchanged HEAD game files plus the saved
actual inspected CP3-C facility source. It was compared with the current workspace
without swapping product files: seven identical room poses, seed420042, 1280×720,
64 measured RAF frames/pose after a shared priming tour, one browser at a time.
Both before/after tours retain **49 programs**, zero warm links, geometry/material
allocation/disposal, world/nav rebuilds and equal/lower region calls.

- Firefox forward pair: median render deltas **−2 to +1 ms**; render p95 deltas
  **−4 to +1 ms**. Hall frame p95 is 33.3→50 ms despite unchanged 9 ms median render.
- Edge forward pair: median render deltas **+1 to +3.8 ms**, render p95 deltas
  **+.9 to +5.3 ms**; Hall frame p95 17→33.2 ms, other rooms approximately 17 ms.
- Because Edge slowed broadly, a single reverse-order comparison was added. Both
  baseline and corrected runs then have highly variable **100–250 ms** frame p95
  tails; corrected-minus-baseline median render deltas **−1.8 to +3.3 ms**, render
  p95 **0 to +4.3 ms**. Zero churn/program growth again.

**Timing conclusion: inconclusive.** There is no new generation churn, source/slot
growth, shader growth or significant draw-call multiplication. Stable comparative
frame-time performance cannot be certified from these volatile headless host runs,
and the positive Edge render-time deltas are not discarded. No FPS improvement or
clean timing-regression verdict is claimed. This remains an explicit review caveat,
not an excuse to implement CP3-D lighting or unrelated performance changes.

Receipts: [joined summary](_playtest/m42/cp3cr-implementation-20261013/validation-summary.json),
[forward pair](_playtest/m42/cp3cr-implementation-20261013/paired-performance.json),
[reverse pair](_playtest/m42/cp3cr-implementation-20261013/paired-performance-reverse.json).

### Actual files, remaining observations and hard stop

Changed/new for this corrective pass:

- `src/world/facility.js` — recorded legacy refs, Priority 0 and installation
  finalizers, in-place batch/plate helpers, necessary cached/batched pipe saddles.
- `tests/facility-prop-placement.mjs` — immutable before comparison and meaningful
  preservation, cover, source, seating, text, M4 navigation and capture assertions.
- `MILESTONE-4.2-ENVIRONMENT.md` — current checkpoint and this actual-results record.
- `_playtest/m42/cp3cr-implementation-20261013/` — before source/receipts, targeted
  PNGs/index/pairs, gates, final suites/retries, paired measurements and small
  evidence/report helpers. Existing CP3-C and inspection files were not overwritten.

Existing `tests/facility-interior-refinement.mjs` and authoritative suites remain
unchanged. Their earlier CP3-C-specific exact geometry/printed-text expectations
are historical; the new fixture compares to inspected CP3-C with only the approved
exceptions. No broader verification was weakened.

Remaining observations: printed plates and the reused gauge face are deliberately
simple/subdued; the Decon bars retain their existing cyan material while occupying
the corrected upper frame. No extra detail or brightness was used to mask placement.
Manual visual acceptance is still required, and comparative timing is inconclusive
as documented. No approved functional/cover/contact/enclosure blocker remains.

Credits.txt and unrelated tracked/untracked work are preserved. The staging index
is empty and HEAD remains `c0bb414`. **STOP AFTER CP3-C-R. No CP3-D, CP3-E, stage,
commit, merge or push. Ready for manual review with the stated timing caveat.**

## CP3-D — D0 corrections and D1 coordinated lighting (2026-10-14)

**Implementation and automated gates complete. Manual visual acceptance pending;
stop after CP3-D.** The following is the current result. Earlier CP3-C-R stop/HEAD
statements above are historical, superseded by the user's authorization for this pass.

### Starting point, source separation and evidence

- Branch `milestone-4.2`, HEAD `9267ceb32bf886fd4663c54bc5f18e023ba12d05`.
- Accepted facility SHA256
  `2720064cfcfc09480976262a42ce2b31b78a4d7e9d8683d9f9e8dc5df740eb2b`.
- Original checkpoint source preserved as `before-chargefront.html` and
  `before-facility.js`. Corrected D0 source preserved separately as
  `d0-final-chargefront.html` and `d0-final-facility.js` before D1 implementation.
- [Review index](_playtest/m42/cp3d-20261013/INDEX.html),
  [handoff/provenance](_playtest/m42/cp3d-20261013/README.md),
  [joined validation](_playtest/m42/cp3d-20261013/validation-summary.json).
- All current D1 receipts match HTML SHA256
  `51eed4946585ba953735dfe427324a7df638cac3a6f619ca91cb05eba8bce608`
  and facility SHA256
  `432b92c4568158bfb5ee01221203fd891ba0d95f4b2807db66bd87872f47a064`.

### D0 — targeted investigation, corrections and actual outcome

The five supplied gameplay references identified the extractor, the pole under
the Vault sign, the Research/Security–Containment doorway junction, and Sample
Zero before/after defence activation. Source, transforms, animation and mission
state were inspected before D1. D0 final gates passed in both browsers first.

| Item | Investigation and final correction | Verification / review status |
|---|---|---|
| D0-01 ceiling extractor | Original disc had a changing tilted normal because its animated axis was wrong. Reuse it as the hub on a local-Y axial pivot, add four instanced blades and a roof-bearing frame at z8.82–9.0. Existing power visibility and spin speed 2.4 retained. | Both extractors rotate with +Z normal across all five seeds. Gameplay detail and before/after captured. Remains deliberately dark, without a fill-light workaround. |
| D0-02 Vault pole | Existing lab-active emissive status beacon, not a registered PointLight. Reuse the beacon/case as a compact header-mounted fitting at z8.45. Keep original animated materials/FX ownership. | Tall obstruction removed; case contacts header; no added source registration. Header and old composition captured. |
| D0-03 junction | Initial diagnosis confused an internal partition notch with the reference seam. Pixel-ray checks hit existing wall/jamb, not a view through an opening. Final correction seats only the right `lab_security` jamb .02 m farther into each host face while preserving exposed faces and passage. | Existing collision/map geometry remains exactly 329 solids / 30 segments; bidirectional shots blocked; six door mechanisms and enclosure PASS. **A narrow coloured highlight is still visible in the reference composition. Geometry/contact is verified; visual elimination is not claimed and requires manual review.** |
| D0-04 Sample Zero | Acquisition already deliberately hides the payload/scan/light/inner energized glass and lab field; no portable displayed vial or apparatus-retraction story existed. Separate the installed plinth/rings/cap into `SampleZeroInstallation`, retain them after acquisition, and support the empty frame with four instanced struts. | Exactly one DNA payload; secured payload/field stay hidden while installed frame remains in M3/M4. Actual Continue, death, checkpoint restore, recollection prevention and 34-second defence completion PASS. Static empty frame remains non-cover, preserving existing post-pickup collision. |

D0 is a one-time finalizer after accepted seeded construction. It uses independent
seed `0xcf070048` and restores the caller RNG. Spinner update reads the explicit
axis; the existing fallback remains available. Sample installation visibility is
applied on fresh M3/M4 construction as well as normal world-state restoration.

Final D0-only comparisons:
[supports/header/junction](_playtest/m42/cp3d-20261013/review-d0-final-reviewed/01-support-junction.png),
[sample lifecycle](_playtest/m42/cp3d-20261013/review-d0-final-reviewed/02-lifecycle.png).
The new after-side was recaptured from the preserved D0 source through a private
file:// evidence document; current product files were never swapped. Original
reference captures are historical camera matches, not pixel-locked animation or
light-state comparisons. Additional installed-detail views are indexed separately.

The earlier added partition return/solid/map segment was removed before final
D0 validation and D1. `d0-after`, `d0-review`, `d0-gate-confirmed` and
`regression-d0-*` without `final` describe that superseded attempt. They are retained
for provenance and must not be presented as current evidence. Final D0-only gate
is `d0-gate-final`; current D1 revalidates D0 in `regression-d1-final-*`.

### D1 — functional fixtures, room hierarchy and eight-slot coordination

- Existing Hall lenses now have roof cases/support drops; Hall proxies move from
  z8.2 to z8.46, immediately below the lenses. Warm task lighting and cool functional
  wall accents retain their existing colours, intensity, range and decay.
- Existing sconces receive fitted host-wall backing. Existing Vault and seven lab
  sources receive suspended cases/diffusers with supports reaching their roofs.
  These reuse sources rather than register replacement interior lights.
- Lab diffuser materials remain independently owned and follow the actual source
  colour and emergency pulse. Decon/Research stay cool/task-led; Security stays
  warm/operational; Containment keeps its restrained peripheral/focal hierarchy;
  Power remains amber utility-led with emergency red. No room-wide exposure lift.
- Two new guarded exterior service lights: West `(328.82,714,3.36)` and East
  `(391.48,657,3.36)`, pale warm `0xffe0b5`, intensity 45, range 22, decay 1.85.
  Each has a wall-seated case/lens/guard and short feed to the existing utility area.
  Reusing approach/yard sources would remove useful coverage there, so the two
  conditionally approved registrations were used. Campaign ledger **104→106**;
  rendered slots remain **eight**, with no added shadow source.
- Source eligibility now skips zero-falloff candidates and rejects paths through
  existing full-height opaque walls, portal overheads and live closed-door solids.
  The blocker list is cached; door disabled flags are read from the real records.
  Scalar clipping avoids per-candidate Vector/closure construction. Low cover is
  intentionally excluded so a workbench does not eliminate a useful room source.
- Both exterior lights are selected outside their respective walls and excluded
  at the tested interior positions. All six doors block the probe with closed
  solids and admit it with open solids; overheads block above the door opening.
  Native door operation is independently covered by the enclosure/playthrough suites.

This is **source-to-camera eligibility**, not per-pixel shadow occlusion. The
existing non-shadow slots can still illuminate visible surfaces beyond a corner
when a source is selected through an open portal. No shader/shadow expansion was
used to claim complete light-leak elimination.

Exposure **.78**, fog **40–280**, global ambient/environment lighting and existing
shadow cadence are preserved. Cases/supports share cached unit-box/steel resources
and two static instance batches; no per-traversal fixture construction. D1 uses
independent seed `0xcf070049` and restores the caller RNG.

### Current captures and actual regression results

`lighting-verified/{firefox,edge}` and `lighting-baseline-verified/{firefox,edge}`
contain **20 paired poses per browser** under normal gameplay lighting:
west/east walls and cabinets, front/emergency entrances, Hall/extractor/Vault/header,
Decon, Research, Security, Containment before/immediate/during/post-defence,
Power normal/emergency, and the exact junction. Seven grouped sheets per browser
are linked in the review index. Same cameras, seed420042, 1600×900 viewport,
exposure/fog; HUD/viewmodel hidden through existing test hooks. The actual player
remains at the view location; cameras do not use diagnostic fill/cutaway lighting.

The harness now waits for the correct camera and at least 35 real selector updates
before recording. Early `lighting-before`/`lighting-candidate` captures are retained
but superseded because a few slot snapshots had not caught up with the pose.
Early-after-acquisition images include this settling interval; the D0 lifecycle
gate separately checks the exact t=0 acquisition boundary.
`lighting-final/firefox` is a failed **test-setup** attempt: file:// route interception
did not expose the frozen facility API. The corrected fixture captures the real
exported constructor through an initialization setter; no product debug hook or
controller/scene semantics change was made. The final gates pass without page errors.

| Final suite | Firefox elapsed | Edge elapsed | Result |
|---|---:|---:|---|
| D0 five-seed preservation/lifecycle | 81.522 s | 40.282 s | PASS / PASS |
| Facility regression / cover / M1→M4 / Continue | 67.607 s | 33.063 s | PASS / PASS |
| Enclosure / breach walks / all six door cycles | 126.205 s | 124.374 s | PASS / PASS |
| Real-input facility playthrough / FOLLOW / pursuit / evacuation | 81.926 s | 66.275 s | PASS / PASS |
| Canonical M2 progression / relay return | 171.096 s | 118.951 s | PASS / PASS |
| Intro/transition/result prewarming | 42.353 s | 35.758 s | PASS / PASS |
| Traversal/performance / Campaign and Endless combat/restart | 156.180 s | 150.391 s | PASS / PASS |
| Campaign/Endless seeded scenery placement/parity | 259.985 s | 128.768 s | PASS / PASS |
| Pure placement-state unit checks | 0.196 s | 0.109 s | PASS, run by each batch |

These are **suite wall-clock elapsed times**, not loading or frame-time benchmarks.
Both fresh batch receipts and logs are indexed; all 18 entries have status 0 and
match current product hashes. Existing gameplay assertions/timeouts are retained;
the two existing test changes are comments explaining the unchanged 30 segments.

### Rendering and bounded paired timing

[Matched warm receipt](_playtest/m42/cp3d-20261013/paired-lighting-performance.json):
serial browsers; D0 then D1; six identical poses, seed420042, 1280×720, common
priming tour, two 64-RAF-frame repetitions/pose. **768 measured frames per browser
per source version**. All four runs retain 47 warmed programs and eight slots.

| Current D1 warm result | Firefox | Edge |
|---|---:|---:|
| Regional frame p95 range | 31.7–32.2 ms | 18.2–18.8 ms |
| Current-minus-D0 frame p95 range | −.2 to +.5 ms | −.4 to +.4 ms |
| Worst measured frame | 63.3 ms | 19.6 ms |
| Maximum observed selector call | 1 ms | .300 ms |
| Median-render delta range | 0 ms at Firefox timer resolution | −.2 to +1 ms |
| Render-p95 delta range | −1 to +1 ms | −1 to +3.9 ms |
| Warm links / geometry-material creation-disposal / world-nav rebuilds | 0 / 0 / 0 | 0 / 0 / 0 |

Fixture costs in the six matched poses: **+1 to +11 draw calls**, **+252 to +768
triangles**; no warmed-program growth. Firefox includes 63.3 ms east and 47.7 ms
Power tail spikes. Edge's positive render deltas are recorded rather than discarded.
Ordinary W-key regional traversal and live combat/restart are separately exercised
by the permanent suite; legitimate combat/effect churn is not called allocation-free.

This bounded pair shows small frame-p95 differences, stable shader count and no
static-environment churn. It does **not** certify desktop FPS equivalence, prove a
general speedup or erase the prior cross-checkpoint timing caveat. Headless browser
timer resolution and ANGLE/software scheduling limit interpretation.

### Changed files, review caveats and stop

Changed/new: `chargefront.html`, `src/world/facility.js`, `tests/facility-d0.mjs`,
`tests/facility-lighting.mjs`, comments in `tests/facility-enclosure.mjs` and
`tests/facility-regression.mjs`, this milestone document, and the fresh CP3-D evidence
directory (receipts, original/D0 source snapshots, paired PNGs, index and helpers).

Manual review should focus on the dark installed extractor, Vault header fitting,
the retained empty non-cover chamber frame, useful exterior pools, room hierarchy,
emergency colours, and **the unresolved visual acceptability of the narrow junction
highlight**. Geometry/gameplay checks pass; that subjective seam result is not marked
visually accepted. Source-selection occlusion limitations and measured timing costs
are explicit above.

Credits.txt retains its unrelated attribution addition; prior artifacts are
preserved. Final HTML module/import-map and JavaScript syntax checks, 73 indexed
links, source-hash matching and original Credits hash all PASS; `git diff --check`
is clean. [Check receipt](_playtest/m42/cp3d-20261013/final-checks.json).
HEAD remains `9267ceb`; index empty. **STOP AFTER CP3-D. No CP3-E,
staging, commit, merge or push. Ready for manual review with the stated caveats.**

## CP3-D-R2 — facility clearance, containment lockdown and persistent lighting

**A/B/C/D implemented sequentially with recorded gates. Automated verification
complete; stop for manual acceptance.** Finalized 2026-10-15. Previously accepted
CP3-A/B/C-R work remains the foundation; CP3-D above is an unaccepted historical
implementation. This R2 section is the current authoritative correction record.

[Review index](_playtest/m42/cp3dr2-20261014/INDEX.html) ·
[Detailed handoff](_playtest/m42/cp3dr2-20261014/README.md) ·
[Joined final results](_playtest/m42/cp3dr2-20261014/validation-summary.json) ·
[Phase/recovery ledger](CP3-D-R2-PROGRESS.md).

### A — actual obstruction origins and wider traversal audit

All five numbered manual references and the additional exterior image were inspected
before product edits. Fresh actual-game views reproduced both geometry references.

- **Screenshot 1:** two unnamed full-height `BoxGeometry` children of
  `DeepLaboratory`, generated by `buildLaboratory`'s `wall`/`placed` helpers.
  Centres `(367,708,4.5)` and `(367,729.65,4.5)`; world dimensions **1×8×9 m** and
  **1×9.3×9 m**; rotation X=π/2. They are obsolete Research/Security partitions,
  not perimeter walls or useful low cover. Removed both live meshes, their two
  exact collision records and two x367 minimap segments. Associated cyan trims
  retired; two command rails remounted on the real east wall.
- **Screenshot 2:** shared dead/powered state beacon at `(360,688)`, generated by
  `buildEnvironmentStateLayers`, .26×.26×3.2 m floor pole with .22 m cap. It is a
  non-colliding emissive state indicator, turning red in M4—not the previously
  corrected `(360,658)` header beacon. Remounted as a compact case/cap on the Vault
  north west shoulder `(351.65,685.12,6.1)`.
- Wider audit remounts six other interior beacon locations `(360,686)`, `(348,660)`,
  `(342,700)`, `(378,700)`, `(360,744)`, `(360,780)` to walls/portal shoulders.
  No beacon had collision/nav/minimap records. Existing state animation ownership
  and previous extractor/header corrections retained.
- Hall/front, Vault/passages, Decon thresholds, Research/Security, Containment
  entry/chamber, Power/service and emergency route inspected through ten views.
  All six doors are tested. **327 solids / 28 segments**, an intentional −2/−2
  difference from CP3-D. Every remaining physical bound/height/portal flag matches
  the pre-R2 capture; no blanket count-preservation or weakened envelope test.
- Legacy constructors replay only in detached scratch for seeded scenery parity.
  Archived non-facility scenery and terrain still compare exactly. Navigation and
  raycasting use the removed real collision records; useful tactical cover retained.

### B — authoritative Sample Zero operation

1. **Acquisition:** `sampleOperationStarted` blocks duplicate interaction. DNA stays
   inside its inner glass; pedestal, supports and outer enclosure stay visible.
   `dnaSecured` remains false. If squad is outside or in an entrance threshold,
   activation is refused with a rally/clearance message; no actor teleport.
2. **Lockdown:** front entrance and emergency exit lock through real door records,
   rendered panels, collision and existing navigation/denial logic. A short internal
   `locking` state waits for open panels to close before counting defence time.
3. **Defence:** **exactly 90 active gameplay seconds**, without the old distance-based
   pause. Pause/death stop progression. HUD shows remaining seconds/progress; both
   entrances remain locked. Only `m3_stabilization` drone requests are admitted.
   Essential/authored/director/carrier requests are also gated; pre-existing
   biological/exterior leftovers retire without rewards. Valid in-facility points
   and normal squad combat are used. Suppression is scoped to this operation.
4. **Transfer:** at t90 stop wave generation and begin **3.5 active seconds** of eased
   retraction/shrinkage into the pedestal. The payload does not vanish in one frame.
   Both glass/enclosure visuals, pedestal and permanent installation remain. The
   original chamber collider stays enabled in M3/M4; no resized/new solid record.
5. **Release:** only after transfer, set `dnaSecured` and `containmentSynchronized`,
   restore normal M4 spawning and advance through the existing M3→M4 transition.
   Emergency/service route releases; front stays sealed for the intended east-route
   evacuation. Rewards/resources persist; completed chapter statistics are carried
   in both checkpoint forms while existing per-chapter HUD counters reset.

Encounter substate/timers, locking panel progress, hostiles/source tags and transfer
progress restore. Old 34-second in-progress saves migrate with elapsed seconds
retained, visible payload and the new 90-second requirement. A genuine cold-M3
Continue initialization error found during testing was fixed and retested.

Exact pre/activation/30/60/89/90/transfer-mid/3.49/completed boundaries, duplicate
prevention, pause, death, actual menu Continue, defence/transfer saves, legacy8s
migration, before/after exit interaction and M3→M4 all PASS. Unaccelerated live runs
reach exactly90s before transfer, with drone-only sampled hostiles, normal squad
shooting and W-key blocked/released exit tests. Their wall elapsed95.953s Firefox /
97.977s Edge includes capture pauses and transfer; it is not the defence timer.

### C — persistent distributed exterior lighting

- **32 repeated guarded industrial luminaires** across front/header, Hall west/east,
  recessed Vault/lab shoulders, long lab facades, Containment return/east/rear,
  Power facades and emergency-exit flanks/header. Exact placements are in the
  joined receipt. Small warm diffusers preserve the restricted-operations hierarchy.
- Constant emissive lenses plus soft static wall washes and terrain-conforming
  ground pools: four shared draws, two shared generated gradient maps, no per-frame
  fixture construction or player/squad activation condition. Alpha feathers to zero
  on every boundary; pools are clipped to real opaque runs/lintels rather than
  spanning open doorways. Ground mesh1120 vertices follows sampled terrain+.07m.
- Two CP3-D proximity-budgeted service PointLights superseded: scene Campaign proxy
  ledger **106→104**, eight rendered budget slots retained. No additional shadow
  source, custom shader, exposure/ambient increase or fog removal. Existing dynamic
  illumination remains available for important nearby surfaces and moving actors.
- Six comparable exterior framings, each with actor near/far/inside, plus emergency
  state: **19 captures/browser**. Fixture visibility, materials and transforms remain
  identical, including a real W-key entrance transition and M1→M4 states. Fixed
  camera framing isolates actor proximity; it is not a player-eye-distance benchmark.
  Normal fog/occlusion still affects what is visible from a distance.

### D — final-source results and visual inspection

All rows below PASS on final source. **24 successful final suite runs**, including
the pure placement-state suite run by each browser batch. All selected receipts
match final HTML SHA256
`3742111e7dcb55d4b491b40750803d2577418cead62dbb82859a044c15a35f4c`
and facility SHA256
`3c5a4b3ada8d19dfa3070a42d6587b27e9a17d7c891ecfaa0c03deafda2f4e15`.

| Final suite | Firefox wall elapsed | Edge wall elapsed |
|---|---:|---:|
| R2 geometry / exact deltas / W crossing / audit captures |33.251s|23.711s|
| Exact Sample Zero boundaries / source policy / death / Continue / restoration |40.185s|24.710s|
| Unaccelerated90s defence / transfer / squad combat / locks / W evacuation |125.960s|113.146s|
| Permanent enclosure / all six door cycles |125.587s|115.585s|
| Native traversal / sprint / FOLLOW / pursuit / shooting / exit checkpoint |93.029s|65.647s|
| Facility / cover / chapter progression regression |63.813s|31.463s|
| Canonical M2 progression / relay return |167.634s|117.576s|
| Intro/transition/result prewarming |40.569s|32.783s|
| Regional traversal / Campaign and Endless combat/restart |157.320s|149.046s|
| Five Campaign seeds / nine Endless cases / archived scenery parity |238.124s|128.603s|
| Pure placement-state checks |.116s|.082s|
| Persistent exterior lighting / native entrance transition |46.730s|37.082s|

These are suite durations, not loading/FPS benchmarks. Final comparison sheets,
normal live defence/transfer and wide facility views were visually inspected.
The two reference obstructions are gone; payload stays visible at30/60/89 and
retracts during transfer; both enclosures remain after completion; exterior pools
stay present in all three actor conditions. Automated PASS does not grant manual
visual acceptance. Index links the representative sheets and full-resolution PNGs.

### Renderer measurements and limitations

[Final paired measurement](_playtest/m42/cp3dr2-20261014/renderer-pair-final.json):
actual pre-R2 source versus final R2 through separate file:// evidence documents,
without swapping product files. Serial browsers/versions, seed420042, 1280×720,
six primed poses, two64-frame repetitions: **768 frames/browser/version**.

| Warm final R2 observation | Firefox | Edge |
|---|---:|---:|
| Regional frame-p95 range |16.7–33.3ms|16.9–17.0ms|
| Current-minus-baseline p95 range |0 to +16.6ms|−.1 to +.1ms|
| Worst final measured frame |50ms|17.2ms|
| Median-render delta range |−1 to +1ms|−.6 to +.2ms|
| Render-p95 delta range |−1 to +1ms|−1 to +.6ms|
| Warmed resident programs |47→48|49→50|
| Warm links / static geometry-material churn / world-nav rebuilds |0 /0 /0|0 /0 /0|

Matched draw delta **−2 to +4**, triangle delta **+3436 to +3904**. One additional
warmed shader variant supports the static textured pools; there is no per-luminaire
shader growth or linking during the warm samples. The earlier retained renderer
pair has larger Firefox timing tails. **Comparative headless timing remains
inconclusive; no desktop FPS equivalence or improvement claim.** Real W traversal
and combat are tested separately; normal combat/effect allocation remains legitimate.

Static surface pools do not provide dynamic shadows or full moving-object light
transport. Dynamic actor lighting retains its existing budget. Manual review should
assess subdued pool strength/spacing, both-glass readability, the short transfer
animation and all corrected passages. No additional known functional blocker remains.

### Provenance, changed files and hard stop

Retained failed/intermediate attempts are explicitly documented in the recovery
ledger: cold-Continue initialization, transient bootstrap timeout, old M4 front-entry
test assumption, pursuit observed after combat death, section-metadata parity and
hard-edge lighting candidate. Test corrections preserve the physical assertions and
exact intentional deltas; native no-rebuild counters use separate warmed windows
around explicit mission-setup changes. Old CP3-D and R2 evidence is not overwritten.

Current authoritative evidence: `phase-d-final-geometry`, selected passing rows in
`phase-d-final`, `phase-d-final-playthrough`, `phase-d-final-extended`,
`renderer-pair-final.json` and `final-review-verified`. Earlier post-transfer images
that hide the outer enclosure are historical, not the final result.

R2 changed/new files: `chargefront.html`, `src/world/facility.js`, four new R2 test
suites, `tests/environment-placement.mjs`, `tests/facility-enclosure.mjs`,
`tests/facility-playthrough.mjs`, `tests/facility-regression.mjs`, this milestone,
`CP3-D-R2-PROGRESS.md`, and `_playtest/m42/cp3dr2-20261014/` evidence/helpers.

Remain on `milestone-4.2`, HEAD `9267ceb`. Credits.txt retains its original unrelated
attribution; other working-tree files preserved. Final syntax,76 handoff links,
product/Credits hashes and `git diff --check` PASS. Index empty. **STOP FOR MANUAL
ACCEPTANCE. No CP3-E, staging, commit, merge or push.**

### Pending Manual Follow-ups

Recorded from the latest manual acceptance review. These are observations to
investigate in a future refinement. They are **not** confirmed defects and are
outside the accepted CP3-D-R2 scope; they are not implementation requirements for
the CP3-D-R2 commit and must not be treated as verified bugs before investigation.

- **Observation A — Mission 4 entrance state.** The main entrance highlighted in the
  review appears to remain open, or to reopen, when Mission 4 begins. Investigate
  whether this entrance should stay physically closed and locked throughout Mission 4,
  with the emergency exit serving as the intended evacuation route.
- **Observation B — Laboratory Security Turret.** The activated turret highlighted in
  the review does not appear to perform a visible offensive action. Investigate whether
  it correctly detects enemies, acquires targets, fires projectiles or hitscan attacks,
  produces appropriate firing effects and applies damage.

### Evidence retention (committed vs local)

The compact, indexed acceptance evidence referenced by this document is committed
with the CP3-D-R2 checkpoint: the R2 review index/handoff, joined validation and
renderer receipts, the referenced review sheets and per-phase logs, the R2 final
checks, and the earlier accepted CP3 checkpoint summaries/sheets referenced above.
Every committed link resolves to a committed file.

Full-resolution per-phase capture sets, superseded/intermediate attempts, duplicated
screenshots, ZIP archives and the private baseline HTML documents under
`_playtest/m42/` are **retained locally (untracked)** and remain reproducible from the
committed test suites. They are intentionally not committed to avoid repository
bloat; no committed document links to a local-only file.
