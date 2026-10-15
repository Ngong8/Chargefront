# CP3-D handoff — D0 corrections / D1 lighting

**Implementation and automated checks complete; manual visual acceptance pending.**
Start with [the review index](INDEX.html), which links individual comparison sheets
without loading the entire archive. Full details are in the final CP3-D section of
[`MILESTONE-4.2-ENVIRONMENT.md`](../../../MILESTONE-4.2-ENVIRONMENT.md).

## D0 result

1. **Extractor:** reused hub on the correct axial pivot, four instanced blades,
   roof-bearing housing. Both fans keep +Z normal while rotating at speed 2.4.
2. **Vault pole:** existing emissive lab-state beacon/case moved to the header;
   no new light registration. The old floor-height obstruction is removed.
3. **Junction:** screenshot rays hit solid geometry, so the initial broad partition
   return was removed. Final correction seats the right Security/Containment jamb
   farther into both host faces. Collision/map remain exactly 329/30; projectiles,
   enclosure and six doors pass. **A narrow coloured highlight remains in the
   reference composition; its visual acceptability still requires review.**
4. **Sample Zero:** fixed pedestal/rings/cap and supported empty chamber frame remain
   after acquisition; DNA/scan/energized inner glass/light/field disappear as before.
   Exactly one payload. Defence, death, actual Continue, checkpoint restore and
   recollection prevention pass. Retained static installation is non-cover.

D0-only original→corrected pairs:
- [Extractor/header/junction](review-d0-final-reviewed/01-support-junction.png)
- [Sample before/immediate/during/completed](review-d0-final-reviewed/02-lifecycle.png)
- [Installed fan detail](d0-final-reviewed/10-installed-fan-detail.png)
- [Header detail](d0-final-reviewed/11-installed-header-detail.png)

Original and corrected composition match, but animation/lighting states are not
pixel-locked. The detail views aim at the new roof/header installations. The after
side uses the preserved final D0 sources, before D1, not an old intermediate return.

## D1 result

Supported housings/diffusers reuse Hall, Vault, sconce and seven lab sources. Lab
diffusers follow the real emergency colours/pulses. Hall sources move just beneath
their existing lenses; established room colours/intensities/ranges are retained.

Two new guarded pale-warm service lights at `(328.82,714,3.36)` and
`(391.48,657,3.36)`: intensity45 / range22 / decay1.85 / no shadows. Reusing existing
approach/yard sources would remove useful coverage. Campaign ledger **104→106**;
render budget still **eight slots**. No global brightness/fog/ambient/shadow change.

Full-height walls, overheads and live closed-door solids now exclude obstructed
source-to-camera paths. Both service lights are selected on their exterior sides
and excluded at tested interior poses. All six closed/open/overhead probes pass.
This is eligibility filtering, **not per-pixel shadow occlusion**; open-portal
corner spill remains possible with the accepted non-shadow slots.

Final D1→D0-baseline paired sheets, normal gameplay exposure .78 / fog40–280:

| Subject | Firefox | Edge |
|---|---|---|
| West/east service walls | [pair](review-lighting-verified/01-service-walls-firefox.png) | [pair](review-lighting-verified/01-service-walls-edge.png) |
| Utility cabinets / feeds | [pair](review-lighting-verified/02-cabinets-firefox.png) | [pair](review-lighting-verified/02-cabinets-edge.png) |
| Front and emergency entrances | [pair](review-lighting-verified/03-entries-firefox.png) | [pair](review-lighting-verified/03-entries-edge.png) |
| Hall / extractor / Vault / header | [pair](review-lighting-verified/04-hall-vault-firefox.png) | [pair](review-lighting-verified/04-hall-vault-edge.png) |
| Decon / Research / Security | [pair](review-lighting-verified/05-task-rooms-firefox.png) | [pair](review-lighting-verified/05-task-rooms-edge.png) |
| Containment / defence lifecycle | [pair](review-lighting-verified/06-containment-firefox.png) | [pair](review-lighting-verified/06-containment-edge.png) |
| Power normal/emergency / exact junction | [pair](review-lighting-verified/07-power-junction-firefox.png) | [pair](review-lighting-verified/07-power-junction-edge.png) |

Each manifest records camera, actual sources/selected slots, draw calls/triangles,
exposure/fog, programs and product hashes. **20 views per browser**, same seed420042,
1600×900. Existing test hooks hide HUD/viewmodel; normal actor and room-state updates
continue until at least 35 selector calls settle. No debug fill or capture-only light.
The early-after-acquisition images include that settling interval; the exact
t=0 acquisition state is verified separately by the D0 lifecycle gate.

## Verification

- [Joined compact receipt](validation-summary.json)
- [Final facility suite batch](results-d1-final-both-facility-d0-facility-regression-facility-enclosure-facility-playthrough.json)
- [Final progression/transition/traversal/placement batch](results-d1-final-both-m2-progression-transition-diagnose-traversal-performance-environment-placement-environment-placement-state.json)
- [Matched warm measurements](paired-lighting-performance.json)
- [Final source/syntax/73-link/Credits checks](final-checks.json)
- [Final D0-only gate, Firefox](d0-gate-final/d0-firefox.json) / [Edge](d0-gate-final/d0-edge.json)
- [D0 revalidated on D1, Firefox](regression-d1-final-firefox/d0-firefox.json) / [Edge](regression-d1-final-edge/d0-edge.json)

18 final suite runs have exit status0, plus the lighting gate in each browser.
The placement-state test is pure Node and was run once by each browser batch.
Native-input playthrough verifies FOLLOW, hostile pursuit and evacuation. All
five seeds preserve accepted collision/map geometry; source count is the approved +2.

Matched warm D0/current measurements: six primed poses, two repetitions, 64 frames
per pose, 1280×720, one browser/version at a time. All four runs have **47 programs**,
eight slots and **zero shader links, geometry/material churn or world/nav rebuilds**.
Fixtures add +1–11 draws / +252–768 triangles in these poses. Current frame-p95
ranges: Firefox31.7–32.2ms, Edge18.2–18.8ms; paired p95 differences −.2 to +.5ms and
−.4 to +.4ms respectively. Firefox tail spikes63.3/47.7ms; Edge render-p95 deltas
reach +3.9ms. These are bounded observations, not general FPS equivalence or a
speedup claim. Prior cross-checkpoint timing remains inconclusive.

## Provenance and retained attempts

Use `lighting-verified`, `lighting-baseline-verified`, `d0-final-reviewed`,
`review-lighting-verified`, `review-d0-final-reviewed` and `regression-d1-final-*`
as authoritative final evidence.

- `before-*`: accepted pre-D0 source snapshots.
- `d0-final-*`: immutable corrected D0 source, direct D1 baseline.
- `d0-gate-final`, `regression-d0-final-*`: corrected D0-only gate before D1.
- `d0-after`, `d0-review`, `d0-gate-confirmed`, earlier `regression-d0-*`:
  superseded broad return version. Retained, not current evidence.
- Early D0 receipts include test-fixture binding/array-order/button failures;
  `junction-picks.json` documents the revised seam diagnosis.
- `lighting-before` and `lighting-candidate`: superseded by settled-selector captures.
- `lighting-final/firefox`: failed test-only API exposure through unsupported file://
  interception. Corrected via initialization wrapper around the real frozen API.
- Private `d0-baseline-game.html` files add a file:// base URL and inline the preserved
  D0 facility source. They are evidence documents, not alternate product versions.
- Original receipts and screenshots are retained; no evidence destination overwritten.

Final source hashes: HTML
`51eed4946585ba953735dfe427324a7df638cac3a6f619ca91cb05eba8bce608`;
facility `432b92c4568158bfb5ee01221203fd891ba0d95f4b2807db66bd87872f47a064`.

Branch `milestone-4.2`, HEAD `9267ceb`. Credits and unrelated work preserved;
index empty. **Stop after CP3-D: manual acceptance required before CP3-E.**
