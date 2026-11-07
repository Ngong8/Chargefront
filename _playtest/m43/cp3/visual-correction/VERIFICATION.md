# CP3-A — Endless visual correction

## Result

The three accepted arenas now sit in the existing purple-night ambience rather
than reading as neutral, self-lit ground. Terrain texture detail, banks, crater
shoulder and ridge silhouettes remain visible. The close matched views retain
the cyan vial, amber relay marker, red/orange hostile, blue shield silhouette,
small glowing supply drops, weapon and readable HUD/minimap.

- **Valley:** cool teal/moss bounce, violet soil and mineral shoulders.
- **Crater:** warmer magenta/mauve mineral palette.
- **Ridges:** cooler indigo/lavender scree.

Only Endless terrain material presentation changed: the ground/boundary shared
material has lower textured emissive intensity (0.45 → 0.25), the texture keeps
30% of the source colour with lower brightness (1.8 → 1.65), and the three
profile palettes/bounce colours have been tuned. Shared scene lighting,
exposure, sky, fog, scenery and Campaign presentation remain unchanged.

## Evidence

Open [INDEX.html](INDEX.html) for all full-resolution before/after pairs:

- [Three-arena overview comparison](overview-comparison.png)
- [Three-arena relay / combat / HUD comparison](readability-comparison.png)

Captures use the same arena seed, fixed cameras, 1280 × 720 viewport and Edge
renderer before and after. The close views contain diagnostic paused enemies
and four supply types loaded through the existing Continue fixture. They are
visual comparisons, not evidence of live-wave progression.

The fixed lower-ground overview crop has mean display-RGB luma:

| Arena | Before (0–255) | After (0–255) |
| --- | ---: | ---: |
| Valley | 52.11 | 20.04 |
| Crater | 59.71 | 17.70 |
| Ridges | 65.74 | 17.51 |

This records the darker ground, not an exposure change or a whole-screen/UI
brightness measurement. Visual inspection of the original-resolution close
views confirms readable terrain texture, contours, objective markers, pickups,
enemy colour separation and UI. Exact crop/method: [brightness.json](brightness.json).

## Focused checks — passed

1. `node tests/endless-terrain-state.mjs`: smooth accepted profiles, protected
   clearing, distinct palettes, module-script syntax and protected gameplay /
   Campaign modules.
2. `node tests/endless-terrain.mjs` (Edge, all three arenas): real-input movement
   and squad FOLLOW, rendered/collision alignment, low/high obstruction checks,
   enemy pursuit, actual persisted Continue and no-rebuild restart.
   Receipt: [smoke/edge/terrain.json](smoke/edge/terrain.json).
3. `capture.mjs before` / `capture.mjs after`: exact before/after terrain-position
   SHA-256, collision records, trees/transforms, selected arena, seed and height
   samples matched for every arena. No browser page errors.
4. `compare.mjs`: verified the height and zoning functions are byte-identical
   to the pre-correction snapshot; `chargefront.html` differs from that snapshot
   only in the two Endless-only material/texture changes and their comments.

The existing capture-only material assertion was updated to the new 0.25 fill.
No new gameplay tests or product debug helpers were introduced.

Stopped after the visual correction. No CP3-B work, commit, merge or push.
