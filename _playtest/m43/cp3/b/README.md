# CP3-B — Encounter Director review

**Implemented, focused checks passed; awaiting manual review.**

- [Implementation / test report](../../../../MILESTONE-4.3-CP3-B.md)
- [Pre-implementation audit](AUDIT.md)
- [Representative before/after compositions and CP3-C observations](compositions.md)
- [72 seeded cases](composition.json)
- [Focused Edge runtime receipt](runtime-01/runtime.json)
- [Final lifecycle-only follow-up](runtime-02-final-lifecycle/runtime.json)
- [Native early-wave gameplay screenshot](runtime-01/early-wave.png)
- [Survival Debrief lifecycle-fixture screenshot](runtime-01/survival-debrief.png)

The early wave uses normal speed and stats, native hold-E/fire/reload inputs and
ordinary squad AI, without invulnerability. Later lifecycle/count/cap scenarios
use explicit bounded fixtures; debrief wave 9 / cleared 8 is a state-contract
check, not eight normally played waves. All-arena native wave arrivals and the
24-actor AI load check run at normal speed with distant, protected operators.

`audit.mjs --verify` checks the saved pre-CP3-B hashes in `preserved.json`, including
the existing CP3-A evidence. `baseline.html` is that working baseline for exact
source comparisons, not a replacement product file or an earlier committed build.

No terrain/presentation rebuilding, economy rebalancing or CP3-C/D/E work. No
comprehensive Campaign/cross-browser matrix, stage, commit, merge, tag or push.
