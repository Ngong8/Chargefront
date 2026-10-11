# CP2-R checkpoint — prepared for approval, not committed

Architecture and exterior refinement were accepted. The final side-wall material
correction has passed engineering checks and is ready for manual visual review.
Full details are in `MILESTONE-4.2-ENVIRONMENT.md`; `validation.json` contains the
compact actual-test, visibility, geometry-preservation and performance receipts.

## Selected normal gameplay comparison

All four pairs use the actual player standing eye height, unchanged gameplay
lights, exposure and fog. No diagnostic lights are used in these captures.

| Pose | Before | Final |
|---|---|---|
| West side | [Before](../cp2r2-visibility-20261011/before/firefox/west-eye.png) | [After](../cp2r2-visibility-20261011/final-verified/firefox/west-eye.png) |
| East side | [Before](../cp2r2-visibility-20261011/before/firefox/east-eye.png) | [After](../cp2r2-visibility-20261011/final-verified/firefox/east-eye.png) |
| West service cabinet | [Before](../cp2r2-visibility-20261011/before/firefox/west-service-eye.png) | [After](../cp2r2-visibility-20261011/final-verified/firefox/west-service-eye.png) |
| East service cabinet | [Before](../cp2r2-visibility-20261011/before/firefox/east-service-eye.png) | [After](../cp2r2-visibility-20261011/final-verified/firefox/east-service-eye.png) |

Equivalent Edge comparisons and the complete raw scene manifests remain local;
the compact summary records both browsers. Only selected images are staged.

## Selected accepted architecture/refinement evidence

- [West recess closure](../cp2r-20261011/r1-resume-verified/firefox/D2-west-notch-close-fill.png)
- [East recess closure](../cp2r-20261011/r1-resume-verified/firefox/D3-east-notch-close-fill.png)
- [Refined entrance](../cp2r2-20261011/verified/firefox/entrance-normal.png)
- [Functional intake feeds](../cp2r2-20261011/verified/firefox/roof-detail-diagnostic.png)
- [Actual exit ID](../cp2r2-20261011/verified/firefox/exit-outside-normal.png)
- [Relocated interior exit plaque](../cp2r2-20261011/verified/firefox/exit-sign-detail-normal.png)

These accepted R1/R2 images document earlier completed work. The four normal-light
side-wall pairs above are the final visibility-correction evidence.

## Outcome and limits

Both browsers pass enclosure, six door cycles, M2 progression, real traversal,
facility lifecycle, runtime stability, performance/transition checks, seeded
placement parity and normal-lighting material preservation. There are still
software-renderer timing tails; the summary includes paired before/after render
timings rather than claiming a universal FPS improvement. No new lights/fog/
exposure settings or shader variants are introduced. Interior wall finishes,
accepted signage/supports and all 329 solids/30 minimap lines remain unchanged.

Deferred: small interior plaque; simple rooftop housing geometry; staging board
support and buried yard props for CP4 consideration. Credits and unrelated files
are left unstaged. Source dependencies and minimal saved baseline receipts are
included so the selected capture tests can still compare accepted structures.

**STOP before commit. Manual approval is required; no CP3, merge or push.**

## Proposed staged-file inventory

**37 files:** 10 implementation/test files, 4 documentation files, 7 JSON receipts/
fixtures and 16 selected PNGs. The numeric baseline fixtures account for most of
the textual diff; they are the saved structural comparisons required by the
capture harnesses, not an indiscriminate screenshot/trace archive.

Implementation/tests:
- `chargefront.html`
- `src/world/facility.js`
- `src/world/environment-placement.js` (existing required HTML dependency)
- `tests/environment-placement-state.mjs`
- `tests/environment-placement.mjs`
- `tests/facility-regression.mjs`
- `tests/facility-enclosure.mjs`
- `tests/facility-exterior.mjs`
- `tests/facility-refinement.mjs`
- `tests/facility-visibility.mjs`

Documentation:
- `FACILITY-ARCHITECTURE.md`
- `MILESTONE-4.2-ENVIRONMENT.md`
- `_playtest/m42/cp2r2-20261011/REPORT.md`
- this `README.md`

JSON:
- this directory's `validation.json`
- `_playtest/m42/cp2-20261011/before/{edge,firefox}/manifest.json`
- `_playtest/m42/cp2r2-20261011/before/{edge,firefox}/manifest.json`
- `_playtest/m42/cp2r2-visibility-20261011/baselines/before-{edge,firefox}.json`

Selected PNGs: the eight side-wall images and six accepted architecture/refinement
images linked above, plus the pre-R2 `entrance-normal.png` and
`exit-outside-normal.png` under `cp2r2-20261011/before/firefox/`.

`Credits.txt`, unrelated earlier playtest artifacts, preparation helpers, raw
timing traces, raw full-scene visibility dumps and the remaining image archive
are **not staged**. No commit has been created.
