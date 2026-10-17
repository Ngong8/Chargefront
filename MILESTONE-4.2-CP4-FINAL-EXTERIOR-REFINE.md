# CP4 final exterior refinement

> **User manual visual playtest PASS; CP4 accepted for finalization.** The user
> authorized one cohesive commit and push of all three CP4 stages on
> `milestone-4.2-cp4`, without merging main. Pending-review/unstaged statements below
> are the preserved pre-acceptance record. See the
> [accepted evidence index](_playtest/m42/cp4-accepted/INDEX.html) and verification ledger.

**Complete for manual review.** Branch `milestone-4.2-cp4`; starting/current HEAD
`3ad1938a90d3a432961373d3f5ea6757d1133522`. Continued the existing uncommitted
CP4 follow-up. Credits, both prior evidence folders and the two user ZIPs remain
preserved. No staging, commit, push, merge, tag or branch operation.

## Screenshot identification and removals

The staging reference is the freestanding billboard at(316,576.8), surrounding
M1 approach barriers/broken beams, and M2 dummy staging props. The front panel is
the three-piece M1 decorative shutter at y606.5, not the real door at y618. The
Beta reference matches its detached short retaining slabs. The third supplied
image has debug lighting enabled; this pass's review images use normal lighting.

**38 additional exterior meshes removed:**

| Location / category | Meshes | Physical records removed |
|---|---:|---:|
| Staging billboard, two22m barriers, six stripes, three detached beams |12|20|
| M2 fake staging blocks/faces, board and three loose crates |8|0|
| Dummy shutter/drum/seam below the retained CF-07 sign |3|0|
| Four detached Beta retaining slabs at x235/261, y732/764 |4|4|
| Nine free-standing bypass dash fragments |9|0|
| Gamma approach bar(420,585) and FOLLOW-blocking box(555,588) |2|2|
| **Total** |**38**|**26**|

These are explicit object references in their existing builders, retired after
legacy construction. No coordinate-based sweep through facility decoration.
Original constructors preserve random consumption; real collider removal also
prunes section/state/relay ownership arrays so mission transitions cannot revive
invisible blockers. Actual doors, CF-07 architectural sign, facade/roof detail,
relay objectives, masts and retained cover remain intact.

Canonical collision count is intentionally **327→301**, not a relaxed assertion.
The new test enumerates every missing record and verifies all301 retained records
have exactly the same bounds/heights as the starting snapshot. The accepted
restored M1 ship-history record remains+1 (302 on that specific in-memory path).
Four current count-based regression fixtures were updated with this exact rationale.

## Alpha and Gamma approaches

- **Alpha:** removed M2's non-colliding staging block/facade composition crossing
  the apparent departure lane. Direct W traversal from(360,580) through
  (333,575), (300,575), (250,575) to(211,575), FOLLOW and real E activation PASS.
- **Gamma:** removed the Beta departure slab clipping(251,741)→(285,690), the
  misleading staging composition/bypass fragments and physical bar cutting the
  direct terrain approach at(420,585). Canonical centreline scans now have no
  unintended hits on the audited segments.
- Direct Gamma W traversal through(395,585)→(420,585)→(450,585)→(510,585)→(569,585)
  initially exposed a genuine second issue: the box at(555,588) trapped VEX at
  (551.85,587.8) while the player could pass. Removed that box instead of changing
  squad AI or weakening the FOLLOW check. All three members now arrive clear;
  real E activation and completion reach M2_CONFIRM.
- Full existing native M1/M2 test also passes: battery/grid/command interactions,
  Alpha/Beta/Gamma, WEST/EAST bypasses, front return and M3 transition. Timed
  defence completion hooks are explicit; actual movement/interaction is native.

## Backyard and minimap smoothing

- Replaced the flat-topped rear boundary with an end-eased elliptical cap centred
  at x375, tapered to the old map at x265/485. Centre north limit is now y888;
  the raised rear terrain still finishes at y900 and continues into the existing
  outer rim. This refines the existing addition, not the original world layout.
- A dense quarter-metre check across the whole map proves the new bounds contain
  **every previous rear bound**: minimum gain0, never negative. Existing saved
  rear positions are not clamped inward. The original expanded apron remains
  useful, with modest outward rounding instead of cutting off its corners.
- Shoulder onset varies smoothly across X, and the far ridge has gentle height
  variation around55m (bounded nominal50.5–59.5m before side rise). This removes
  the straight rear silhouette while retaining the enclosing embankment.
- The minimap now shows the curved playable edge plus10m of cliff shoulder,
  instead of exposing the rectangular render backing. Gameplay/world bounds,
  physical terrain and minimap use the same profile. No objective/ribbon redesign.
- Original0–800m terrain position/color hashes remain identical. The rear mesh
  shares the accepted material; terrain/collision error is below2.5e-13m, height
  seam exactly0. Existing exterior ground-light wash automatically conforms to
  the new rear ground; no light source, exposure, material or interior change.

## Protected functionality and diagnostics

Same-browser starting-site snapshots compare425 protected facility mesh records
(laboratory, interior identity, architectural exterior, roofs and lighting).
Geometry/transforms/instances remain unchanged except the terrain-conforming
ground wash positions, which retain their existing+.07m contact. Instance values
are compared at1e-6 precision to avoid treating cross-engine signed-zero/trig
rounding as modelling edits. No interior functions/layout were edited.

Rear smoothing initially admitted one new out-of-map tree candidate in legacy
route scatter, replacing a later tree. Added an original-map exclusion to that
Campaign-only scatter so this profile refinement does not reshuffle scenery.
The full retained-collider comparison passes after that correction.

Removing the billboard also removed an implicit sign-shader warmup. The existing
stress suite caught one late CF-07 sign link. Explicitly prewarming the retained
sign in the established traversal-prewarm list fixes it; final Firefox/Edge
stress has zero late links and zero static construction/rebuild churn.

## Validation

**14 selected browser-suite executions PASS**, with source hashes in the receipts:

| Gate | Firefox | Edge |
|---|---|---|
| New direct Alpha/Gamma + FOLLOW/E, exact removals/protection, rear movement/v3 Continue | PASS | PASS |
| Terrain determinism, collision, objective access and v3 loads | PASS | PASS |
| Safe Staged Seal, legacy recovery, turret targeting/obstruction/cadence | PASS | PASS |
| Facility/cover/minimap/zero-link stress | PASS | PASS |
| Guidance/ribbons/hitscan regression | PASS | PASS |
| Carried mission resources, squad commands, Continue and completion | — | PASS |
| Full native M1/M2 and full M4 exterior evacuation/boarding/departure | — | PASS |
| Endless9 seed/arena cases and archived exact layout/height parity | — | PASS |

Six pure state suites also PASS. All successful selected browser suites report
no page errors. The `facility-e2` change is count-fixture maintenance only; its
unaccelerated90s run was not repeated in this small refinement. Historical
authoring-snapshot tests remain tied to their original checkpoints.

Tests use controlled/invulnerable regional setups where documented. Regional
relocations are distinguished from direct W/E legs; no controller, mission or
combat semantics were changed to help a probe. No new desktop FPS certification.
Turret22/.72s/42m, save implementation/schema and Endless formulas/layout are intact.

## Evidence and inspection coverage

Open the [curated acceptance index](_playtest/m42/cp4-accepted/INDEX.html).
The original full local gallery remains at `_playtest/m42/cp4-final-exterior-refine/INDEX.html`.

- `before-gameplay/edge/` and `after/{edge,firefox}/`:19 matched normal-light
  coverage views plus fixed overhead reference and actual minimap crops.
- `review/`: removed props, Alpha/Gamma, backyard and enlarged minimap comparisons.
- `verified/{browser}/validation-{browser}/manifest.json`: direct movement/FOLLOW,
  collider accounting, protected geometry, rear seam and Continue records.
- `native/edge/`: complete native mission/extraction and Endless safety evidence.
- `baseline-canonical/`: same-browser snapshots of the exact starting uncommitted
  site, reconstructed in disposable scratch from saved source plus unchanged assets.
- `before/`, `before-protected/`, `after-candidate/`, `validation-edge/`,
  `verified-direct/`, `follow-probe/` and the initial `targeted/` failures are retained
  for provenance. Their failures are not visual or functional acceptance receipts.

Visited coverage includes staging/front(330,562)/(340,552)/(364,602)/(360,596),
Alpha(350,577)/(295,568)/(226,575), Gamma departure/bypass/arrival
(285,625)/(365,577)/(409,579)/(465,579)/(548,582), Beta walls
(229,747)/(228,752)/(272,754), and rear(370,835)/(430,822)/(315,822)/(370,798).
The fixed overhead view is reference framing under normal lights, not traversal
proof. Before/after sheets and gameplay views were directly visually inspected.

**Manual visual acceptance remains pending.** No known new functional blocker
remains. Low-priority visual qualifications: established dark lighting, low-poly
facets and thin-marking distance aliasing. No new decorative pass was performed.

## Exact files changed in this refinement

Product modified:
- `chargefront.html`
- `src/world/facility.js` — explicitly queued approach removals only; no interior edit
- `src/world/campaign-exterior.js`
- `src/world/campaign-terrain.js`

Count-fixture updates:
- `tests/cp4-terrain.mjs`
- `tests/facility-e0.mjs`
- `tests/facility-e-integration.mjs`
- `tests/facility-e2.mjs`

Added:
- `tests/final-exterior-refine.mjs`
- `MILESTONE-4.2-CP4-FINAL-EXTERIOR-REFINE.md`
- `_playtest/m42/cp4-final-exterior-refine/{inspect,baseline,run,review,final-checks}.mjs`
  and generated screenshots/index/receipts/source snapshots.

Final branch/HEAD, diff counts, syntax, evidence links, Credits preservation and
empty index are recorded in `final-checks.json`. `git diff --check`: **PASS**.
Tracked diff versus HEAD, including all carried CP4 work:8 files,283 insertions /
114 deletions. This refinement's four existing product files account for66
insertions /30 deletions relative to the starting uncommitted source; new tests,
report and evidence are separate. **Stopped with all changes unstaged and
uncommitted for manual review.**
