# CP3-A manual review

Implementation: [Milestone 4.3 CP3-A](../../../MILESTONE-4.3-CP3-A.md).
**Current: geometry requirement correction complete, awaiting manual review.**
The original surface-only pass was incomplete. Three smooth geometry profiles now
retain the accepted arena identities and surface improvements.

## Final geometry review

Same 1280×720 overview `[520,510,25 → 400,400,3]`, normal `.78` exposure,
accepted lighting/fog and shipped materials; no diagnostic overlays or viewmodel.

| Arena geometry | Representative screenshot |
|---|---|
| Lumen Valley — winding lowland / rounded banks | [Open](geometry-final/edge/valley.png) |
| Impact Crater — rolling basin / impact shoulder | [Open](geometry-final/edge/crater.png) |
| Shattered Ridges — crossing rounded ridges / positive troughs | [Open](geometry-final/edge/ridges.png) |

- [Before numerical audit](geometry-before/edge/terrain.json): the old crater's
  entire sampled interior was zero-height; 41.46% of old ridge samples were flat.
- Final focused geometry, selection, native movement/FOLLOW, alignment, collision,
  enemy advancement and save/restart checks: [Edge](geometry-final/edge/terrain.json),
  [Firefox](geometry-final/firefox/terrain.json). **All six arena cases PASS.**
- `geometry-01/edge/` retains the intermediate exact-tangency assertion failure;
  see the implementation report for the measured floating-point penetration.

Only the intentional 24 m relay/vial clearing remains flat. Corrected height
ranges within the audited 170 m interior are 13.52 / 12.64 / 15.13 m respectively.
Continue reconstructs identical geometry and collision. CP3-B has not started.

---

## Earlier surface-only evidence — historical

## Final representative captures

Same 1280×720 overview pose `[520,510,36 → 400,400,3]`, normal `.78` exposure,
accepted lighting/fog, no diagnostic overlays or viewmodel. No screenshot-only
lighting changes. The modest textured ground fill is part of the product material.

| Arena | Screenshot |
|---|---|
| Lumen Valley — mossy earth | [Open](a-final-material/edge/valley.png) |
| Impact Crater — mineral ash | [Open](a-final-material/edge/crater.png) |
| Shattered Ridges — weathered scree | [Open](a-final-material/edge/ridges.png) |

## Receipts

- Focused selection, native movement/FOLLOW, collision, pursuit, Continue and
  no-rebuild restart: [Edge](a-01/edge/terrain.json),
  [Firefox](a-01/firefox/terrain.json). Three arena cases each, all PASS.
- Final material-only rendering: [Edge](a-final-material/edge/terrain.json),
  [Firefox](a-final-material/firefox/terrain.json). All PASS. Fingerprints match
  the focused runs; these are not labelled as repeated navigation/save tests.
- `a-01/edge/*.png` are the original too-dark material inspection, retained as
  provenance; they are superseded by the three final screenshots above.

Stop for manual review. No later CP3 checkpoints or full CP3-E matrix performed.
