# CP3-D-R2 — final manual-review handoff

**Phases A/B/C/D implemented and verified. Manual visual acceptance pending.**
Start with [INDEX.html](INDEX.html); individual sheets are linked rather than loading
the entire image archive. See the [phase/recovery ledger](../../../CP3-D-R2-PROGRESS.md)
and the separate R2 record in [the milestone](../../../MILESTONE-4.2-ENVIRONMENT.md).

## Changes

### A — geometry and traversal
- Removed the two obsolete `DeepLaboratory` full-height partitions at `(367,708,4.5)`
  and `(367,729.65,4.5)`, their collision records and x367 minimap lines.
- Retired attached cyan trims; moved two command rails onto the east wall.
- Remounted the `(360,688)` shared powered/crisis passage beacon on the Vault north
  west shoulder. Remounted six other interior beacon locations discovered in the
  wider audit. The earlier header beacon and axial extractor correction remain.
- **327 solids /28 map segments /six doors.** Exactly −2/−2 from the reference,
  with every other physical bound/height/portal flag preserved. Useful cover retained.

### B — Sample Zero
`pre-acquisition → locking →90 active seconds of drone defence →3.5 active seconds
of visible transfer → M4 emergency-route release`.

DNA stays visible during defence. Acquisition flags prevent repeats without marking
DNA secured early. Both entrances lock; a rally/threshold check prevents sealing
squad outside or closing through actors. No teleport. Timer waits for physical
closure, pauses with gameplay/death, and has no proximity pause.

Central spawning policy rejects non-drone/other-source requests even when essential
or scripted. Transfer stops wave generation. The payload eases down and shrinks into
the pedestal; **inner glass, outer enclosure, pedestal and supports all remain**.
After transfer, mark synchronization/secure DNA, restore normal M4 spawning and
release the east emergency route; front stays sealed. The existing chamber collider
remains enabled in M3/M4. Chapter statistics/rewards/resources and checkpoint state
carry forward. Actual Continue and old34-second-save migration are verified.

### C — exterior lighting
**32** matching guarded warm luminaires cover front/header, Hall sides, recessed
Vault/lab facades, long lab walls, Containment return/east/rear, Power and exit.
Constant emissive lenses plus soft static wall/terrain washes provide meaningful
surrounding illumination. Four shared draws/two generated gradient maps; no player
proximity activation. Pools are feathered and clipped to opaque runs/lintels; terrain
mesh conforms to the sampled surface.

Two old proximity-budgeted service PointLights are superseded. Scene Campaign
proxy ledger **106→104**; **eight rendered budget slots** remain. No new shadow
source, exposure/ambient/fog lift or custom shader. Moving actors still use normal
dynamic lighting; static pools are intentionally not full light transport/shadows.

## Evidence

Use **final-review-verified** and the final-source receipt directories below.

| Subject | Firefox | Edge |
|---|---|---|
| Reference panels/pole before→final | [sheet](final-review-verified/A-reference-corrections-firefox.png) | [sheet](final-review-verified/A-reference-corrections-edge.png) |
| Wider facility audit | [sheet](final-review-verified/A-wide-audit-firefox.png) | [sheet](final-review-verified/A-wide-audit-edge.png) |
| Live30/60/89/90, transfer and completion | [sheet](final-review-verified/B-live-lifecycle-firefox.png) | [sheet](final-review-verified/B-live-lifecycle-edge.png) |
| Both locked entrance states | [sheet](final-review-verified/B-locked-entrances-firefox.png) | [sheet](final-review-verified/B-locked-entrances-edge.png) |
| West /Power-exit near-far-inside | [sheet](final-review-verified/C-west-power-exit-firefox.png) | [sheet](final-review-verified/C-west-power-exit-edge.png) |
| Front /Vault recess near-far-inside | [sheet](final-review-verified/C-front-vault-recess-firefox.png) | [sheet](final-review-verified/C-front-vault-recess-edge.png) |
| Lab east /rear corner near-far-inside | [sheet](final-review-verified/C-lab-east-rear-corner-firefox.png) | [sheet](final-review-verified/C-lab-east-rear-corner-edge.png) |

Before/activation full-resolution captures:
[Firefox before](phase-d-final/firefox/sample-firefox/01-before.png) /
[activated](phase-d-final/firefox/sample-firefox/02-activated.png);
[Edge before](phase-d-final/edge/sample-edge/01-before.png) /
[activated](phase-d-final/edge/sample-edge/02-activated.png).

Normal gameplay renderer, exposure .78 and fog40–280, no diagnostic fill. Live
lifecycle sheets come from unaccelerated game-loop runs. Fixed exterior framing
isolates actor proximity at near `(324,710)`, far `(255,620)` and inside `(360,724)`;
native entrance/traversal is separately tested. Fog/occlusion remains normal.

## Verification

[Joined results](validation-summary.json) contains **24 passing final suite runs**
(12 types ×Firefox/Edge, with placement-state a pure Node test in each batch):
geometry/deltas, deterministic lifecycle, live90s operation, enclosure/six doors,
native playthrough/FOLLOW/pursuit, facility/cover regression, M2 progression,
transitions/prewarming, traversal/combat/restart, seeded placement/parity,
placement-state and persistent exterior lighting. Every selected final receipt
matches current product hashes. Individual logs are linked in the index.

Live operation wall elapsed95.953s Firefox /97.977s Edge includes capture pauses and
3.5s transfer; defence itself is exactly90 active gameplay seconds. Boundary tests
cover duplicate interaction, pause, death/actual Continue, defence/transfer restore,
legacy8s migration, pre/post exit interaction, normal M4 spawning and carried stats.

[Matched renderer pair](renderer-pair-final.json): six primed poses, two repetitions
of64 frames, 1280×720, seed420042, serial pre-R2/current runs. **768 frames per browser
per version**. Zero warm links, geometry/material creation/disposal or world/nav
rebuilds; eight slots. One new warmed variant (Firefox47→48; Edge49→50). Matched
draw delta−2 to +4; triangle delta+3436 to +3904. Firefox p95 deltas0 to +16.6ms;
Edge−.1 to +.1ms. Earlier retained pair has larger Firefox tails. **Headless timing
remains inconclusive; no general FPS-equivalence or improvement claim.**

## Provenance / limitations

- Original pre-R2 source and first audit are `before-*` /`phase-a-before`.
- A/B/C phase checkpoints are preserved in the ledger. Earlier failed fixtures,
  bootstrap timeout and first rectangular-pool candidate remain historical.
- `phase-d-final` batch contains two obsolete pursuit-test failures; use the
  passing replacement playthrough rows in `phase-d-final-playthrough`. The joined
  receipt selects all24 actual final passes explicitly, without erasing failures.
- Pre-final post-transfer images which hide the outer enclosure are superseded.
- `pre-r2-renderer-baseline*.html` are private evidence documents containing the
  captured original facility source and a file:// base URL; no product-file swap.
- Evidence retention: the compact indexed acceptance evidence linked from this
  handoff (review sheets, joined receipts and per-phase logs) is committed with the
  CP3-D-R2 checkpoint. Full-resolution per-phase capture sets, superseded/intermediate
  attempts, duplicated screenshots, ZIP archives and the private baseline HTML
  documents remain **local (untracked)** and are reproducible from the committed
  suites. Every committed link resolves to a committed file; no committed link
  points at a local-only file.
- Older checkpoint-specific D0/C-R tests and their exact329/30/34s/hide-on-activation
  expectations describe historical specifications. Current permanent suites and
  R2-specific exact-delta/lifecycle gates are the authoritative checks; assertions
  were not globally disabled or geometry counts arbitrarily weakened.
- Review pool strength/spacing, both-glass visibility and transfer readability
  manually. Static illumination has no dynamic shadows; actor lighting stays
  budgeted. No known functional blocker remains after the final gates.

## Files / Git

R2 changes: HTML/facility; four new R2 test suites; existing environment-placement,
enclosure, playthrough and facility-regression tests; milestone and recovery ledger;
this fresh evidence directory/helpers. Prior CP3-D work/evidence retained.

Final HTML SHA256 `3742111e7dcb55d4b491b40750803d2577418cead62dbb82859a044c15a35f4c`;
facility SHA256 `3c5a4b3ada8d19dfa3070a42d6587b27e9a17d7c891ecfaa0c03deafda2f4e15`.
Branch `milestone-4.2`, HEAD `9267ceb`; Credits/unrelated work preserved, index empty.
**Stop for manual acceptance. No CP3-E, staging, commit, merge or push.**
