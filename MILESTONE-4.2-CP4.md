# Milestone 4.2 CP4 — terrain and environment

> **CP4 accepted by the user after manual visual playtesting.** Acceptance covers
> this implementation and both subsequent exterior refinements. The checkpoint
> statuses, pending-review language and unstaged handoff below are historical.
> Final canonical geometry is301 solids; see the final-refinement report and the
> [accepted evidence index](_playtest/m42/cp4-accepted/INDEX.html).
> One cohesive implementation commit and branch push are authorized; no main merge.

## Baseline and checkpoint ledger

- 2026-10-16: clean `main`, HEAD `3ad1938a90d3a432961373d3f5ea6757d1133522`.
  `git fetch origin` succeeded; `main == origin/main`; CP3-E is the tip.
  `git merge --ff-only origin/main` reported already up to date. Created
  `milestone-4.2-cp4` at that tip. No pre-existing tracked/untracked changes.
  `Credits.txt` is preserved. No AGENTS.md found. No staging/commit/push/tag.
- CP4-A: complete (read-only source inspection and live normal-lighting audit).
- CP4-B: targeted corrections implemented; geometry, doors and combat regression PASS.
- CP4-C: deterministic Campaign profile, ground wear and exact collision/grid sampling implemented; component/integration/native traversal PASS.
- CP4-D: independent Endless generation retained; nine seeded cases/browser, native terrain/wave/restart compatibility PASS.
- CP4-E: automated validation, evidence and documentation complete. **Manual visual
  acceptance remains for the user**; timing/resource costs and limitations below
  are not automatically declared acceptable.

## CP4-A — ownership and terrain audit (before implementation)

| System | Owner and findings | Boundary/decision |
|---|---|---|
| Campaign generation | `chargefront.html`: `buildCampaignWorld`, `terrainHeight`, `FLATS`, `TERRAIN_SHAPES`, canonical `WORLD_PATHS`. One retained world, four state layers. Noise + Beta ridge22m + Gamma depression + route valley walls; LZ Gaussian flatten; facility grading last. | Author controlled off-route shoulders, cuts and ground wear. Keep relays, bypasses, all route/mission anchors and footprint fixed. |
| Determinism | Campaign height is analytic; Campaign legacy scatter consumes ambient Math.random, including Three UUID draws. Endless `buildEndlessWorld` scopes `seedRandom(worldSeed)` and preserves seed across load/restart; arena choice valley/crater/ridges is saved independently. | Campaign construction needs an isolated constant stream. Endless RNG/order/formulas remain independent; no campaign anchor dependency. No new save fields. |
| Ground | `buildTerrain`: 320×320 cells, 2.5m grid, indexed PlaneGeometry; shared textured outer rim at10m grid. Ground collision/movement is analytic `terrainHeight`, not SOLIDS or a triangle collider. Terrain texture is mirrored artwork with deterministic fallback. | New shaping must be broad/smooth; test actual triangle interpolation error against analytic collision. Ground wear should use the terrain vertices, not coplanar overlay planes. |
| Placement | Existing CP1 `environment-placement.js`: full bounds, 5×5 support, slope/gap, occupied/solid, facility/doors/objective/spawn/route exclusions. Legacy rock/tree scatter mostly center checks; authored CP2/3 props have tested support. | Reuse validator for any new props. Avoid new collision props; protect existing authored and legacy geometry from height changes. |
| Navigation | Player MAX_STEP2.6, circle SOLIDS buckets; squad/enemy local steering, doorway/facility bypass helpers. Relay guidance A* uses4m grid, .65m clearance and height; ribbons use terrain/facility guidance floors. | Retain corridor widths, interaction distances and spawn locations; native W/FOLLOW testing required, not just point checks. |
| Mission state | M1 full transport cinematic/deployment; M2 Alpha/Beta/Gamma and west/east bypass; M3 sealed lab/sample/90s defence/3.5s transfer; M4 staged north seal, east doors, route to same LZ. | Geometry and colors stay identical across mission/save transitions. Lights/access/emergency state retain existing ownership. |
| Performance | Cached envBoxGeometry/envMat; instanced detail/pebbles/plants, pooled combat FX, eight light slots, permanent32 fixtures, covered prewarm, fixed shadow/FX cadence. | Construction-time work only, no extra lights/shadows or per-frame terrain regeneration; share ground material/rim. |
| Safe sharing | Pure support/placement math, primitive/material caches, existing renderer/prewarming. | Campaign authored shaping/material zoning must never enter Endless height/seed selection. Endless receives only a demonstrated compatible fix. |

### Facility Z-fighting audit

Audit source: CP3-B/C corrections/refinement/installation, CP3-D structural and
lighting finalizers and CP3-E turret/door implementation in `src/world/facility.js`.
Live snapshot expands individual instances into world bounds and compares same-
normal coplanar faces. It is a **candidate detector**, not an automatic removal
rule: buried bottoms, same-material engineering joints, hidden wall/roof contacts,
transparent specimen glass and emissive lighting are not independently defects.
Before evidence: `_playtest/m42/cp4/before/edge/` (normal .78 exposure, fog40–280,
player-eye, HUD retained; setup relocations, no reference fill/cutaway).

| ID / location | Confirmed ownership/cause | Severity / intended smallest correction |
|---|---|---|
| Z1 Research bench readouts (345.6,714/722) | CP3-B shrinks ResearchInstrument/Readout to the identical top z1.27; partial footprint overlap .013m², different materials. | Medium visual: seat readout on instrument top with real thin thickness; keep existing cover envelope. |
| Z2 Security desktop/network divisions | CP3-C crossing mask bars have duplicate coplanar faces at intersections; vertical bank division crosses horizontal division. | Low visual: trim bars to butt joints; preserve screens and cached materials. |
| Z3 Containment threshold y735–736 | Research floor spans y684–736, Containment floor starts735; two differently colored tops z.35 overlap60m² across portal. | Medium visual: trim Research floor north bound to735, retain floor height and full coverage. |
| Z4 Closed sliding doors (all six) | Existing panel widths overlap .2–.4m at centre; both full faces coplanar. Two centre edge seams also duplicate/overlap. This affects `lab_security` accepted staged seal presentation. | Medium visual: trim each panel's centre edge to meet at midpoint; mount narrow edge strips on each leaf. Keep offC/offO, solids, update state and timing. |
| Z5 Vault housing trim/feed joints | CP3-C vertical face seams overlap horizontal seams; rear feeds cross ceiling saddles. | Low visual: trim seams/feed lengths to real contacts, retain housings/hangers. |
| Z6 Power north feeder | CP3-C vertical drops overlap top feeder (same front/back plane). | Low visual: shorten drops to feeder underside. |
| Z7 Hall utility saddles | CP3-C-R saddle uprights overlap lower crosspiece coplanarly. | Low visual: terminate uprights on crosspiece. |
| Z8 Hall screen divider | CP3-C divider endpoints overlap bezel on same face. | Low visual: fit divider between bezel edges. |
| Inspected/preserve | Research/Security wall cases, sign backings, Decon cabinet skins, Vault layers, specimen glass, roof coping/intake joints, exterior attachments. Most are deliberate seated geometry or buried contact faces; roof-wall common faces are matching structural material at tiny seams, not evidence for moving architecture. | No universal offsets/depth changes. Broad Research panel itself showed no defect in close/oblique stills. Transparent/emissive effects remain. |

### Existing regression/capture workflow

External Playwright is installed in the approved temp tool directory; Firefox and
native Edge available. Reuse `tests/m40-regressions.mjs` for supported batches;
direct suites for CP3-E, enclosure, containment, placement and persistent lighting.
`facility-e2` supplies live90s defence, actual W/E room and east-exit traversal,
first/warm metrics; `facility-e-integration` covers save/resources/commands/final
extraction; `intro-smoke`, `m2-progression`, `facility-playthrough`,
`traversal-performance`, `transition-diagnose` and pure state suites cover the rest.
`capture-facility.mjs` reference/cutaway cameras are diagnostic, not gameplay proof.
CP4's audit helper uses the same real file:// game and __cf hooks. Captures made
before terrain changes preserve exact angles for after comparisons.

## CP4-B — implemented geometry corrections

Z1–Z8 above are corrected in their existing owners, with no material depth flags
added or global model shifts. Specifically:

- Research readout is a .01m-thick cap seated at z1.27–1.28, rather than a .05m
  slab sharing the instrument's top face. Bench collision stays1.15m.
- Desktop masks and bank cross-divisions butt together rather than overlap.
- Research floor now spans y684–735; Containment retains y735–795 and z.35 top.
  This removes the60m² duplicate top without opening the portal floor.
- Six original door pairs retain their offC/offO, height8.2, colliders, slide
  rate, lock/open/recovery and mission state. Only their overlapping centre
  edges are trimmed; two .10m edge inlays meet without duplicate face area.
  Exclusions account for the leaf's new local offset, preserving outer travel.
- Vault face/feed lengths, Power feeder drops, Hall saddle uprights and Hall
  divider endpoints terminate on their actual adjoining components.

`finalizeSurfaceCorrections()` runs once after legacy population, under an
isolated construction stream. The original material/cache ownership stays intact.
CP4-B-only snapshots compare **every solid bound exactly** to CP3-E. Full CP4
still has327 canonical solid records,28 map segments,6 doors and7 portal frames.
No assertion was loosened to hide a new wall, missing collider or extra door.

Actual instance-bound checks find zero same-normal overlap in the corrected
Security, Vault, pipe-saddle and Power batches (previous counts32/30/36/6).
ResearchInstrument/Readout top overlap falls2→0. Final tests separately verify
all six leaf pairs have no area overlap, floor north edge735 and readout height.
The audit's total candidate count is intentionally **not** a universal zero target:
buried bottoms and matching structural joints remain legitimate candidates.

Safe Staged Seal, legacy northern-actor recovery, rally wait, death/Continue,
turret activation/LOS/obstruction/tracking/feedback and cooldown persistence PASS
both browsers. Raw damage22, attack interval.72s and engagement range42m remain
unchanged. Live90s drone defence,3.5s transfer, retained glass, east doors and
M3→M4 continuation also PASS.

## CP4-C — Campaign terrain architecture and geographic design

New pure classic-script module: `src/world/campaign-terrain.js`. It does not own
missions, saves, rendering or navigation. Existing terrain/noise, Beta22m ridge,
Gamma bowl, LZ flattening and facility grading remain the base geography.

1. **Seventeen compact authored features:** low shoulders/spoil mounds and shallow
   drainage/subsidence cuts. Elliptical compact support has no infinite tails;
   smooth cubic edges avoid steps. Sampled isolated change is at most2.197m;
   sampled additional slope is below.233 rise/run. No new mountains/cliffs.
2. **Critical grading exclusions:** new changes are zero within14m of all canonical
   mission paths,72m of the LZ,48m of relays and22m of actual foundation footprints;
   smooth transitions outside those reserves. No relays/objectives/doors, WEST/EAST
   bypasses, transport/purge nodes, equipment or facility footprint were relocated.
3. **Worked-ground zoning:** use the existing credited texture as neutral aggregate
   (construction-time canvas grayscale/brightness), with restrained vertex colors
   for access-road wear/paired tracks, industrial Beta soil and damaged Gamma soil.
   No second coplanar ground surface, decal draw pass, extra ground lights/shadows,
   or terrain rebuild during mission changes. This does change Campaign's broad
   purple saturation; full normal-lighting screenshots are supplied for review.
4. **Deterministic Campaign construction:** constant seed420042 scopes the one world
   build, restoring Math.random in finally. Both ambient-seed fixtures1/999999,
   M1→M2→M3 transitions and cold Continue produce byte-identical full terrain/color,
   physical-bound and scenery fingerprints. Campaign no longer inherits ambient
   UUID/random history on each fresh deployment. This intentionally changes legacy
   random Campaign scatter; it does not reseed combat or Endless.
5. **Exact visual/physical ground:** original analytical ground and2.5m rendered
   triangle interpolation disagreed by up to.160457m at critical-route centroids.
   Campaign now retains a reference to the actual Float32 position array and
   samples the exact PlaneGeometry triangle diagonal in O(1). All movement/prop/
   navigation/LOS terrain queries use that surface. No duplicate height array or
   new collider/navigation system. 12,542 route-adjacent triangle centroids agree
   to ~2.84e-14m. Vertex checks agree to ~1.14e-13m. The existing32m SOLIDS buckets
   continue owning obstacle collision.
6. **Cost control:** reuse each build-time route-distance query for height and color;
   hot grid queries allocate no closure. Added color buffer is1,236,492bytes
   (~1.18MiB). No added terrain triangles, lights or ground draw calls. Existing
   instancing/material caches, eight slots and shadow/FX cadence are retained.

### Mission-specific changes

| Mission | Implemented environment | Native/continuity evidence |
|---|---|---|
| M1 — Cold Approach | Grounded neutral worked landing apron; west/east low shoulders beyond protected touchdown/deployment region; long approach drain, spoil shoulder and cut; worn canonical road. | Full five-shot cinematic/gear/fade smoke both browsers; real deployment departure and entire approach; real battery/grid/command E interactions. |
| M2 Alpha | Open utility road wear, restrained lowland berm/drain outside relay clearance; original utility/combat infrastructure retained. | Real W/Shift to relay and E activation; interaction approaches and FOLLOW; relay remains(205,575). |
| M2 Beta | Retained elevated ridge/dish, industrial soil zoning, outer/north shoulders and shallow service cut; existing narrow composition retained. | Actual Alpha→Beta route and objective interaction; relay remains(245,748). |
| M2 Gamma | Retained damaged crater/gantry identity, compact collapse/subsidence cuts and spoil shoulder; rougher desaturated ground. | Actual Beta→WEST→EAST→Gamma, E interaction, full canonical return/front door/terminal; relay remains(575,585). |
| M3 — Sample Zero | Worked perimeter ground with west drain/east swale outside foundation reserves; original18m grading blend and footprint retained. Triangle-consistent collision/prop bases improve transitions. | Normal exterior and near/far facade captures; native Hall/Vault/Decon/Research/Security/Containment, security/sample E, full live operation. |
| M4 — Break Contact | East swale/shoulder and evacuation landmark berm alongside preserved service ground; worn shared return/evacuation road connects to original beacon/LZ. | Real Containment→Power→east exit and full exterior W/Shift route to beacon; E call, native boarding approach/E and actual departure/DONE. |

No new decoration/cover asset family or particle system was added. Existing
low-poly industrial assets carry the silhouettes. The existing random scenery
is now repeatable; no separate incompatible terrain is built for each chapter.

## CP4-D — Endless boundary and results

No Endless height formula, arena selection, seed choice, saved layout/loadout or
restart source was changed. `valley`, `crater` and `ridges` retain their existing
flat/elevated behavior. Ground texturing remains the original colored tile;
Campaign grayscale/vertex zoning, authored anchors and grid sampler are gated out.

Extended the existing placement suite with `--endless-only`, retaining all its
original footprint/support/exclusion/seeded archive assertions for Endless.
Both browsers PASS all9 cases: each arena with seeds0/420042/4294967295; repeated
proposal determinism, spawn/center/vial/deployment exclusions, geometry/collision
read-only integrity and exact accepted archived scenery/height parity. The suite's
older archive is5c8704f, against which accepted CP3 had also verified these unchanged
Endless builders. CP4 adds a separate full3ad1938 baseline comparison for Campaign.

Both browsers also walk central-exit/flank routes on valley0, crater4294967295
and ridges420042. Real wave1 spawn budgets exhaust, intermission completes,
wave2 spawns and restart retains exact scenery at wave0. Test-only clearing of
hostiles after the first wave's spawn budget is explicit: this is progression/
spawn validation, not an unassisted survival claim. Loadout/Continue/restart HUD
and real combat/restart suites PASS independently.

No speculative shared Endless rewrite was justified by these passing tests.
Existing support/cache helpers remain shared; Campaign profile stays independent.

## CP4-E — validation matrix

`_playtest/m42/cp4/validation-summary.json` selects **42 successful browser-suite
executions (21 variants × Firefox/Edge)** and records9 earlier failed executions
separately. It includes exact source hashes/receipt paths. No outstanding latest
suite failure remains. Six pure Node state suites also PASS.

| Test/gate | Firefox | Edge | Main evidence batch |
|---|---|---|---|
| CP4 terrain, mesh/collision, critical exclusions, ambient seed independence, cold version3 Continue, corrected surfaces | PASS | PASS | `final-terrain` |
| CP4 native M1/M2 including real objectives/bypasses/front return | PASS | PASS | `native-complete` |
| CP4 full native M4 exterior/beacon/boarding/departure | PASS | PASS | `final-native` / `evacuation` |
| CP4 native three Endless variants/waves/restart | PASS | PASS | `final-native` / `final-endless` |
| Existing placement9-seed-arena cases + exact archived parity | PASS | PASS | `endless-parity` |
| Safe Staged Seal/turret (`facility-e0`) | PASS | PASS | `core` |
| Enclosure/all doors/full-height and floor/cover shots | PASS | PASS | `final-native` / `core` |
| Native facility playthrough/FOLLOW/pursuit | PASS | PASS | `core` |
| Sample lifecycle/save/Continue (`sample-containment-r2`) | PASS | PASS | `core` |
| Full unaccelerated live lockdown (`sample-lockdown-live`) | PASS | PASS | `cp3-compatibility` |
| E2 live turret/90s defence/transfer/M4 seal and east interior, metrics and22 gameplay captures/browser | PASS | PASS | `live-performance` |
| Carried mission resources/commands/save/final extraction | PASS | PASS | `integration` |
| Facility regression/A–E zero-churn stress | PASS | PASS | `final-stability` |
| Permanent lighting / dynamic source eligibility | PASS | PASS | `stability-corrected` / `integration` |
| Full M1 cinematic without diagnostics / transition preparation | PASS | PASS | `loading` |
| M2 checkpoints/migration/front return/pursuit | PASS | PASS | `navigation-save` |
| Endless loadout/HUD/Continue | PASS | PASS | `navigation-save` |
| Existing combat/squad/resource persistence | PASS | PASS | `cp3-compatibility` |
| Warm native traversal, Campaign/Endless combat and real death/Space restart | PASS | PASS | `final-stability` |

Pure Node suites: `campaign-terrain-state`, `environment-placement-state`,
`combat-state`, `progression-state`, `relay-routing-state`, `objective-hud-state`.
Historic CP2/CP3 authoring snapshots that compare to obsolete geometry are not
relabelled as CP4 geometry truth; current targeted surface/door/cover tests and
the accepted CP3-E integration gates above guard the intentional corrections.

### Save/mission preservation

No persistence implementation was edited. Accepted HEAD already writes profile/
checkpoint version4 and accepts older versions, including3; CP4 does not create
a new schema version or terrain-seed field. The final terrain test explicitly
loads valid version3 profile/checkpoint fixtures. E0 legacy M4 ingress/seal and
ordinary checkpoint/death/Continue suites preserve original actor/resource state.
M1–M4 objectives, encounters, dialogue/cinematic implementation and transitions,
turret values, weapons, enemies and squad abilities are unchanged.

### Performance comparison and observed costs

Same machine, serial headless1280×720, real Firefox/Edge, same seed420042 and five
poses, complete accepted3ad1938 site extracted temporarily (HTML+modules+assets).
`comparison-final/metrics.json` contains100-frame warmed windows and source/resource
inventories. These are measurements, **not desktop/high-refresh FPS certification**.

| Region p95 ms | Firefox CP3→CP4 | Edge CP3→CP4 |
|---|---:|---:|
| M1 | 50→50 | 33.5→33.5 |
| Alpha | 50→50 | 16.8→16.8 |
| Beta | 33.3→33.3 | 17→17 |
| Gamma | 50→50 | 16.8→17 |
| Front/facility | 50→50 | 16.8→33.3 |

- Synchronous construction observed **970→1126ms Firefox, 656.1→878.4ms Edge**.
  Additional terrain/material preprocessing stays under the existing loading
  cover. Earlier unoptimized observation was1223/991.3ms; distance reuse reduced
  that overhead. This remains a real cold-build cost, not a performance win.
- The final Edge facade window has higher p95, worst33.6 vs33.4ms. An earlier
  same-pose comparison had16.8ms CP4, and final native interior p95 is16.8ms;
  report the variation rather than declare improvement or explain it as GC/shaders.
- Draw calls at those seeded poses increased: M1~1499→1515, Alpha722→800,
  Beta~103→118, Gamma532→599, front729→822. Legacy deterministic scenery
  visibility differs, not extra terrain passes. Snapshot total meshes2458→2462,
  casters249→249; textures21→21; resident geometry count~1510→1499 at front.
  The4 extra meshes and2 registered sources correspond to4 rather than2 existing
  procedural spore vents. Source count104→106 (registered109 including detached
  history vs107), permanent fixtures32 and render slots8 unchanged. Exact source
  inventories substantiate the intentionally updated persistent-light test.
- Final quiet native traversal and A–E stress have **zero shader links, static
  geometry/material creation/disposal, world/facility/nav rebuilds**. Combat
  allocations are reported separately, not called allocation-free. Regional
  native p95 Firefox33.3–50ms, Edge16.8–33.4ms. Final native worst83.4/50ms.
- Live E2 defence/transfer/evacuation p95 Firefox33.3–50ms, Edge16.8–17ms;
  worst66.7/33.4ms. CP3-E historical live p95 was33.3 /16.8–16.9ms, so no
  blanket comparative FPS PASS is asserted. No runtime/page errors in successful
  selected suites; no static object growth in repeated traversal.
- Changing ground to vertex colors removed an implicit warmup of the lab atlas's
  ordinary mapped shader. Stress correctly caught one late link (466.8ms Firefox
  worst in that failed run). Explicitly prewarming the existing lab label mesh
  fixes it; final stress and native traversal repeat on the final hashes and PASS.

Full live E2 receipts preceded the explicit atlas warmup fix. Later changes were
that warmup, build-time distance reuse and allocation-free sampling only. Final
terrain/color/solid/scenery fingerprints compare exactly to the earlier measured
world. Final combat/live lockdown, terrain, stress and native performance tests
run again on the final product; individual receipt hashes retain provenance.

### Failures investigated (preserved, not acceptance evidence)

- Initial `terrain/` threshold found the.160457m analytic/mesh discrepancy. Product
  now samples the actual triangles; the threshold was tightened to.00001, not relaxed.
- Four native-test failures: M1 fixture stopped at staging instead of the real
  perimeter trigger, or the test path planner attempted a still-closed automatic
  door from too far away. Corrected native inputs approach and wait for the actual
  doors; final runs also perform real M1 battery/grid/command interactions.
- One Firefox enclosure default30s page-load timeout: test now uses existing
  DOM-ready/120s bootstrap convention; all geometry assertions retained; retry PASS.
- Two stress failures found the real missing atlas prewarm; fixed as above.
- Two permanent-light tests asserted obsolete104 sources. Full accepted/current
  inventories identify the two additional legacy vents; updated exact106 count,
  retained32 fixtures/eight slots/unchanged permanent geometry and state assertions.

## Visual evidence and manual review boundary

Start with the [curated acceptance index](_playtest/m42/cp4-accepted/INDEX.html).
The original full local gallery remains at `_playtest/m42/cp4/INDEX.html`.
All CP4 normal gameplay evidence uses .78 exposure, fog40–280, no debug fill,
cutaway, reference light, exposure boost or replacement scene.

| Evidence path under `_playtest/m42/cp4/` | Meaning |
|---|---|
| `before/edge/` | CP3-E read-only baseline, fixed camera poses. |
| `final-gameplay/{edge,firefox}/` | Actual renderer/player-eye M1 approach/LZ, M2 Alpha/Beta/Gamma, actual M3 exterior/transition, close/medium/oblique facility, normal/emergency, M4 exit/route. Each manifest records mission, phase, camera, exposure/fog. |
| `native-complete/{browser}/campaign-{browser}/` | Real M1/M2 walks and E objectives; captures from the native path. |
| `live-performance/{browser}/gameplay-{browser}/` |22 player-eye images/browser: near/far exterior, room traversal, live turret beam, full90s defence/transfer, closed M4 portal/east interior. |
| `evacuation/edge/evacuation-edge/`, `final-native/firefox/evacuation-firefox/` | Full native M4 exterior route, extraction approach and boarding. |
| `final-endless/edge/endless-edge/`, `final-native/firefox/endless-firefox/` | Valley/crater/ridges normal gameplay center/flank; real movement/waves/restart receipts. |
| `review/{campaign-comparison,facility-comparison,evacuation-and-endless}.png` | Side-by-side review sheets composed from original images. |
| `endless-parity/{browser}/` | **Diagnostic** protected-area SVG overlays/placement probes; not gameplay visual acceptance. |

Agent visually inspected the before/after sheets plus full-size bench, closed
seal oblique, normal/emergency archive, Decon, near Security, LZ/perimeter and
M4/Endless gameplay views. No obvious new gaps/floating modified detail were
seen in these selected views. Still-image inspection does not certify every
moving-camera pixel or constitute the user's subjective visual acceptance.

Capture qualification: early `before`/`terrain-after` files named `m3-exterior`
and `m3-front-transition` were actually captured in M2; their manifests expose
that fact. They are not claimed as M3 mission-state comparisons. Final capture
ordering is corrected and verifies actual Sample Zero; final native/E2 M3 shots
provide the proper state. Historical/partial captures remain preserved.

## Outstanding limitations / severity

- **Critical/high:** no known new functional blocker after the listed tests.
- **Medium — performance review:** additional cold-build time, changed seeded draw
  visibility and variable Edge facade p95 require normal desktop review. Stable
  warmed resource/link gates PASS; that is not permission to claim identical FPS.
- **Low — visual acceptance:** user acceptance of the restrained desaturated ground,
  route contrast/soil identities and corrected details remains pending. Existing
  dark low-poly lighting and sparse alien flora remain visible; no wholesale
  environment/facility redesign is implied.
- **Low — coverage:** headless controlled/invulnerable fixtures, wave-boundary enemy
  clearing and explicit regional setups are disclosed. Native movement is real,
  but this is not a full unassisted Campaign or long survival/desktop soak.
  Legacy scatter still uses its accepted simplified trunk/rock collision and
  center-based support in places; no exhaustive triangle-mesh prop audit claimed.
- Approved CP3-E legacy ingress/rally safety exception and disabled M1 restored
  ship-hull bookkeeping record remain as documented in CP3-E; no migration/reset.

## Files and reproduction

Product modified: `chargefront.html`, `src/world/facility.js`.
Product added: `src/world/campaign-terrain.js`.

Tests added: `tests/campaign-terrain-state.mjs`, `tests/cp4-terrain.mjs`,
`tests/cp4-traversal.mjs`.
Tests modified: `tests/environment-placement.mjs` (Endless-only option),
`tests/facility-enclosure.mjs` (bootstrap wait),
`tests/facility-persistent-lighting.mjs` (documented exact source count).

Documentation added: this file. Evidence/tooling added only under
`_playtest/m42/cp4/`: `audit.mjs`, `compare-baseline.mjs`, `run-suites.mjs`,
`review.mjs`, `summarize.mjs`, `final-checks.mjs`, generated index/sheets,
receipts/logs/captures. No dependency/package or user credit change.

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
# Always use a fresh tag/destination; existing receipts are intentionally immutable.
node _playtest/m42/cp4/run-suites.mjs review-rerun cp4-terrain facility-e0 facility-regression
node _playtest/m42/cp4/run-suites.mjs native-rerun cp4-traversal cp4-traversal:evacuation cp4-traversal:endless
node tests/campaign-terrain-state.mjs
```

## Final Git handoff

Branch `milestone-4.2-cp4`, HEAD remains3ad1938. Five tracked files modified;
five new source/test/document files plus the CP4 evidence directory are untracked.
`Credits.txt` is unmodified; index empty. `git diff --check` PASS.
Tracked diff is recorded with final documentary checks; new files
are intentionally not included in Git's unstaged tracked-only stat. Exact final
stat/status, source syntax, evidence links, pure suite receipts and preserved
Credits check are recorded in `_playtest/m42/cp4/final-checks.json`.

**Implementation/validation/documentation stopped for manual review. No staging,
commit, push, merge or tag was performed.** The only main reconciliation was the
requested safe `git merge --ff-only origin/main` (already up to date), before the
dedicated branch was created.
