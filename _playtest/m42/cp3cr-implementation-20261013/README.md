# CP3-C-R corrective implementation — manual-review handoff

**Functional/preservation PASS; prewarming/static-churn PASS;
comparative frame-time timing INCONCLUSIVE. Manual visual acceptance pending.**

Approved: F01, H01–H08, D01, R01, S01, C01–C02, P02–P04 and E01.

- [Complete implementation and actual results](../../../MILESTONE-4.2-ENVIRONMENT.md#cp3-c-r--approved-interior-prop-placement-corrections)
- [Targeted before/after screenshot index](SCREENSHOT-INDEX.md)
- [Joined validation summary](validation-summary.json)
- [Forward render comparison](paired-performance.json)
- [Reverse-order Edge comparison](paired-performance-reverse.json)
- [Original approved inspection report](../cp3cr-20261012/REPORT.md)

## Evidence contract

Before is the actual inspected **uncommitted CP3-C** source (62f23aed), preserved in
`before-facility.js`; after is final corrected source (2720064c). The older source
in git HEAD is not incorrectly used as the direct corrective baseline.

22 matching poses per browser/stage use normal M3 gameplay lighting, with E2/E3 in
the existing M4 emergency state. FOV75, exposure .78, fog40–280, eight slots. Quiet
camera setup teleports, hidden HUD/viewmodel/squad. Elevated views are installation
evidence; native-input suites independently check movement. Nineteen matching
Firefox inspection before images are reused, with fresh source/camera receipts.
No extra light, diagnostic fill, cutaway or CP3-D preview.

Detailed pairs: `review/01-intake-*` through `review/10-power-*`.
Compact `review/contact-*` pages keep model image context bounded; full-size
individual PNGs are indexed for manual review. Before LEFT, after RIGHT.

## Authoritative receipts

- `before/{firefox,edge}/manifest.json`: immutable five-seed pre-edit states.
- `priority0-checked/`: cover gate, completed before installation work.
- `regression-priority0-*`: unchanged real-input playthrough passes at that gate.
- `final/{firefox,edge}/manifest.json`: five-seed exact preservation and contacts,
  all source definitions, mission components, eight slots, projectiles and M4 lanes.
- `regression-final-*`: six direct final-suite passes plus interrupted initial
  placement attempts. `regression-placement-retry-*` contains full placement passes.
- `results-*.json`: original statuses, durations and source hashes, no silent
  replacement of interruptions. `validation-summary.json` joins all attempts.

Initial fixture attempts in `priority0/` and `installation-check/` remain for
traceability. Do not use them in place of final passes. Canvas text readback hashes
were unsuitable as a Firefox glyph invariant; the test now records actual native
text arguments and forwards the drawing operation unchanged.

## Rendering caveat

All warmed measurements retain zero shader links/static allocations/disposals and
world/nav rebuilds. Matched calls range −15 to +2; complete capture tours retain 43
programs and paired warmed tours retain 49 before/after. The forward/reverse timings
are volatile; some Edge render deltas are positive. Stable timing equivalence is
**not certified** and no FPS improvement is claimed. Read both paired receipts.

No corrected prop changes a solid, mission anchor, head/barrel position, authored
light, light selector, global exposure/fog, room identity or facility footprint.
No new machinery/decoration; the only necessary added mount is six pipe saddles,
18 cached unit-box components in one static batch. No asset pipeline or shader.

**Stop at CP3-C-R. Nothing staged/committed/merged/pushed. Await manual review.**
