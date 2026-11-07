# CP3-D — replayability review

- [Implementation / audit / test report](../../../../MILESTONE-4.3-CP3-D.md)
- [Pre-implementation limitations](AUDIT.md)
- [Representative run comparisons](RUNS.md)
- [8,192 seeded plan checks](seeded.json)
- [Focused native runtime receipt](runtime/replayability.json)
- [One three-arena arrival sheet](runtime/run-comparison.png)

The runtime includes one normal-speed early wave using a selected Arc/Plasma
deployment; other persistence, result counters and arena-start states are explicit
fixtures. Three native arena arrivals run at normal speed. Planned rosters in the
comparison tables are not simultaneous live counts or claims of complete runs.

`baseline.html` and `baseline-director.js` retain the pre-D working implementation.
`preserve.mjs --verify` checks the existing 87 files and protected source sections.
CP3-C's economy module and all old CP3-A/B/C evidence remain unchanged.

The outer save format remains v1. New runs use planner version 2 with optional
seed/replay/RNG scalars; accepted v1 roster boundaries keep their existing plans.
Continue restores wave-start state and the scoped decision/material streams,
not mid-frame simulation or all global cosmetic randomness.

Stopped for manual review. No CP3-E work, comprehensive Campaign/cross-browser
matrix or repository publication operations.
