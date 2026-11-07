# Milestone 4.3 — CP3-A natural Endless terrain

**GEOMETRY REQUIREMENT CORRECTION IMPLEMENTED / FOCUSED CHECKS PASS.**
CP3-A is now fully implemented for the requested geometry scope, awaiting manual
visual acceptance. The earlier surface-only pass below did **not** fulfill that
scope. No CP3-B work has started.

## Final requirement check — authoritative

1. **Three distinct, non-flat geometry profiles: now yes.** Lumen Valley has a
   winding lowland and rounded banks; Impact Crater has a rolling basin and raised
   impact shoulder; Shattered Ridges has crossing rounded ridges and positive
   troughs. Their accepted names/IDs and natural surface improvements are retained.
2. **Fresh-run random selection: yes.** The existing equal three-way arena roll
   selects the height profile as well as its material. Both browsers exercised
   all three random intervals through the actual fresh-run initializer.
3. **Geometry persists through Continue: yes.** Existing v1 `arena` and
   `run.worldSeed` fields reconstruct the same vertex positions, colors, scenery
   and collision fingerprints. Actual wave-start save/reload/Continue was tested
   for each arena; the saved seven cartridges remained seven.
4. **Occasionally flat arena: defect confirmed and fixed.** The old crater
   subtracted an 18 m depression from a much smaller noise floor, then clamped to
   zero. All 3,625 audited interior samples were zero. The old ridge profile also
   clipped many troughs to zero. New profiles are graded above zero and smoothly
   blended into a deliberate 24 m relay/vial clearing; no flat-map profile remains.

### Before/after numerical evidence

Actual browser heights, 5 m lattice inside radius 170 m, **3,625 samples per arena**.
This excludes the tall containing rim, so its height cannot conceal a flat floor.
Edge and Firefox agree on the corrected distributions.

| Arena | Old interior height range | Corrected range | Corrected standard deviation | Maximum sampled grade |
|---|---:|---:|---:|---:|
| Lumen Valley | 2.66 m | **13.52 m** | 3.36 m | .331 rise/run |
| Impact Crater | **0.00 m** | **12.64 m** | 3.55 m | .207 rise/run |
| Shattered Ridges | 13.37 m, 41.46% clipped flat | **15.13 m** | 3.78 m | .505 rise/run |

Corrected zero-height samples are **1.90%**, all within the intentional relay
clearing. A denser 2.5 m pure-profile sweep out to 180 m additionally verifies
positive heights outside that pad, distinct pairwise height distributions,
determinism and smooth interior grades below .507. Numerical assertions reject a
return to a flat/crater-clipped floor.

### Small implementation change

- Extend `src/world/endless-terrain.js` with three simple coordinate-based height
  formulas: smooth waves, one winding channel and a rounded impact shoulder. No
  new random stream, generated terrain graph or procedural framework.
- The existing 320×320 ground mesh, boundary builder, arena limits and outer-rim
  treatment remain. Terrain is built at the existing world-creation boundary;
  restart reuses the same geometry object.
- Grounding now samples the **actual Float32 ground triangles**, using the
  existing generic grid sampler. The cache is cleared before world/map generation
  and populated before scenery placement. Independent indexed-triangle checks at
  64 off-grid points per arena agree within **3.3e-14 m**. All 24 tree anchors and
  matching collider bottoms align exactly in each focused case.
- Existing saves need no new schema or invalidation. Pre-correction saves keep
  their arena/seed/inventories but adopt the corrected terrain on loading. Scenery
  positions can differ from the old build because existing height-based placement
  filters see new ground; corrected-build Continue reproduces the same layout.

### Focused checks and final evidence

**6/6 focused browser cases PASS** (three arenas × Edge/Firefox): random selection,
height distributions, mesh/ground/scenery alignment, native walking/sprinting to
the relay/vial and outer shoulder, squad FOLLOW, low/over-relay projectile rays,
normal-speed enemy advancement, wave-boundary Continue, and no-rebuild restart.
Terrain/scenery/collision fingerprints remain stable across play and reload.

Six quick Node suites PASS: `endless-terrain-state`, `cp2r-state`,
`enemy-tactics-state`, `progression-state`, `results-state`, `campaign-terrain-state`.
The existing policy/economy/result/save/Campaign modules remain unchanged.
HTML/new-script syntax and whitespace checks PASS. No full regression matrix.

The first `geometry-01/edge/` attempt passed Valley/Crater, then a strict boolean
collision assertion flagged a squadmate tangent to scenery in Ridges. The final
test measures actual circle/AABB penetration with a 1e-5 m tolerance; the observed
maximum was **2.28e-14 m** (round-off), not meaningful overlap. No controller or
collision semantics changed. That intermediate receipt is retained, not counted
as a complete passing run.

Final captures, same `[520,510,25 → 400,400,3]` overview and accepted lighting:
[Valley](_playtest/m43/cp3/geometry-final/edge/valley.png) ·
[Crater](_playtest/m43/cp3/geometry-final/edge/crater.png) ·
[Ridges](_playtest/m43/cp3/geometry-final/edge/ridges.png).
Receipts: `_playtest/m43/cp3/geometry-final/{edge,firefox}/terrain.json`.
Before audit: `_playtest/m43/cp3/geometry-before/edge/terrain.json` (height-only
inspection, no baseline traversal claim).

```powershell
node tests/endless-terrain-state.mjs --receipts _playtest/m43/cp3
# Fresh browser evidence root required; preserve the retained runs:
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
$env:CF_ARTIFACT_DIR='_playtest/m43/cp3/geometry-review-01'
node tests/endless-terrain.mjs
node tests/endless-terrain.mjs firefox
```

**Stop at CP3-A for manual review.** The focused evidence supports completion of
the geometry requirement, not all-seed/late-wave difficulty or comprehensive CP3-E
acceptance. HEAD remains `0f1b230`, index empty, stash and older evidence preserved.
No CP3-B, commit, merge or push.

---

## Earlier surface-only pass — historical, incomplete for geometry

Baseline: branch `milestone-4.3`, HEAD
`0f1b2301e0c6c5adc6b24f4e8bc7d9ba1f6f2184`. Tracked worktree/index were clean at
entry. Existing evidence and GitHub Desktop stash are preserved. No staging,
commit, reset, merge or push was performed.

## Scope and implementation

Three natural **surface variants on the existing three arena topographies**:

| Arena (unchanged ID/name) | Natural ground |
|---|---|
| `valley` — Lumen Valley | Moss/olive vegetation, brown soil clearings, weathered shoulder stone |
| `crater` — Impact Crater | Ochre mineral soil, ash-like basin deposit, lighter outer mineral exposure |
| `ridges` — Shattered Ridges | Grey scree, weathered stone and shallow soil variation |

`src/world/endless-terrain.js` supplies deterministic construction-time vertex
colors, selected by the existing arena ID. It consumes no random numbers. The
credited terrain tile is neutralized with the existing canvas technique and
retains its aggregate detail, UV scale, mirrored seams and procedural fallback.
The existing ground and boundary meshes share the arena material. No additional
props, overlay planes, terrain geometry, collision surfaces or light sources.

Initial normal-light screenshots exposed poor ground readability. The final
Endless material includes a modest `.45` textured emissive fill in the arena's
earth/mineral color, sharing the existing map texture. This is a shipped
ground-material setting, not a screenshot-only light/exposure override. Campaign
material/fill behavior, global lighting, violet sky/fog, flora and exposure remain
as accepted. The original inspection captures remain under `a-01/edge/`; use the
final captures linked below for review.

Color attributes add approximately **1.29 MiB** of typed vertex data per Endless
world (103,041 ground vertices + 9,409 boundary vertices). Zoning runs only during
the existing world construction. Emissive fill uses the existing standard-material
shader/texture, with an additional textured-emission sample; no FPS improvement
or full performance acceptance is claimed.

## Selection, navigation, collision and saves

- The original random selection, names/IDs, arena bounds, height formulas,
  seeded decoration/collision builders, movement, waves and economy are unchanged.
- v1 saves already persist `arena` and `worldSeed`: those select the same surface
  after Continue. Existing saves need no migration or new field; their collision
  layout and inventories remain owned by the accepted save system. Older saves
  receive the updated ground appearance for their existing arena.
- Restart retains the arena/seed, reuses the **same ground geometry object**, and
  resets supplies/waves through the accepted reset path.
- Campaign/result/unlock/tactical modules remain unchanged. No CP3-B/C/D/E
  implementation or comprehensive browser regression matrix was undertaken.

## Focused verification

| Check | Outcome |
|---|---|
| New `endless-terrain-state` | PASS: finite/bounded/deterministic distinct palettes, exact baseline protection of height/selection/scenery/collision/movement/wave/save/restart source and accepted modules; HTML syntax |
| Existing `cp2r-state`, `enemy-tactics-state` | PASS: economy/RNG and accepted tactical policy protection |
| Existing `progression-state`, `results-state`, `campaign-terrain-state` | PASS: completion authority/persistence, debrief aggregation and Campaign terrain protection |
| `endless-terrain.mjs` Edge + Firefox, three arenas each | **6 focused cases PASS**: real random selection, native W/Shift travel, grounded player, squad FOLLOW, low/over-relay collision rays, normal-speed hostile advancement, actual saved-wave Continue and restart |
| Final material-only follow-up, both browsers/all arenas | **6 smoke cases PASS**, no page errors; three final representative Edge screenshots |
| Receipt correlation | PASS: final positions/colors, scenery, solids/counts, heights, arena/seed match the focused navigation runs in both browsers |

The native movement legs cover the central exit and nearby shoulder, not every
seed/maze. Enemy navigation uses one ordinary Shielded actor per arena, with
operators relocated out of view, invulnerability/no additional spawns and normal
simulation speed. It advances from 90 m toward the relay without solid penetration
or attacking unseen operators. These controlled fixtures do not claim manual
combat/difficulty acceptance. The material-only change did not rerun the full
navigation/save suite because its terrain/collision/scenery fingerprints remained
identical; the follow-up separately validates final rendering in both browsers.

## Evidence and reproduction

Review index: [`_playtest/m43/cp3/README.md`](_playtest/m43/cp3/README.md).

- [Lumen Valley](_playtest/m43/cp3/a-final-material/edge/valley.png)
- [Impact Crater](_playtest/m43/cp3/a-final-material/edge/crater.png)
- [Shattered Ridges](_playtest/m43/cp3/a-final-material/edge/ridges.png)
- Focused receipts: `a-01/{edge,firefox}/terrain.json` under that evidence root.
- Final material receipts: `a-final-material/{edge,firefox}/terrain.json`.

```powershell
node tests/endless-terrain-state.mjs --receipts _playtest/m43/cp3
node tests/cp2r-state.mjs
node tests/enemy-tactics-state.mjs
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
# Fresh output root: never overwrite a retained run.
$env:CF_ARTIFACT_DIR='_playtest/m43/cp3/review-01'
node tests/endless-terrain.mjs
node tests/endless-terrain.mjs firefox
# Optional cheaper material/capture-only follow-up in a separate fresh root:
$env:CF_ARTIFACT_DIR='_playtest/m43/cp3/review-material-01'
node tests/endless-terrain.mjs --capture-only
```

## Files / handoff

- `chargefront.html`: load the profile; ground/boundary vertex colors, neutral
  aggregate and Endless-only ground fill; retain Campaign-only grid caching.
- New `src/world/endless-terrain.js`: pure surface profiles.
- New `tests/endless-terrain-state.mjs`, `tests/endless-terrain.mjs`: focused checks.
- `README.md`, this report and `_playtest/m43/cp3/`: review handoff/evidence.

Manual review should assess the three ground identities and readability in the
normal browser. CP0–CP2-R manual qualifications remain as previously documented.
**STOP at CP3-A. CP3-B, CP3-C, CP3-D and CP3-E have not begun.**
