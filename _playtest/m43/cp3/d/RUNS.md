# CP3-D — representative differences

Same CP3-B counts, live/threat caps, pacing, role unlocks and boss cadence.
Family order and weighted role counts differ; geometry/materials do not change.

## Seeded planner comparison — waves 3–9

| Seed | Previous sequence | CP3-D sequence |
|---|---|---|
| 430012 | rush → tactical → airborne → pressure → tactical → assault → pressure | pressure → assault → airborne → pressure → assault → tactical → rush |
| 430013 | tactical → rush → airborne → pressure → rush → assault → pressure | assault → pressure → airborne → assault → pressure → tactical → rush |
| 430014 | assault → tactical → airborne → pressure → tactical → rush → pressure | pressure → rush → airborne → pressure → tactical → assault → rush |

Across 64 adjacent test seeds, distinct wave-3–22 orders increased
from **6 to 63**. All 8,192 seeded wave plans passed the constraints;
every version-1 queue/delay/cap matches its saved-build implementation exactly.
After the introductory two-family selection, each five-wave block uses all five
existing families once. Boundary repair prevents A/A and A/B/A repeats.

## Early / middle / late weighted rosters

| Seed | Wave | Family | Planned roles | Total / live cap / threat cap |
|---|---:|---|---|---|
| 430012 | 3 | pressure | 3 brute, 6 skitter, 9 spitter | 18 / 10 / 24 |
| 430012 | 8 | tactical | 1 boss, 3 brute, 1 carrier, 3 drone, 1 runner, 1 screecher, 7 shielded, 6 skitter, 4 spitter, 2 support | 29 / 14 / 34 |
| 430012 | 12 | tactical | 2 artillery, 4 brute, 2 carrier, 3 drone, 1 runner, 2 screecher, 8 shielded, 8 skitter, 2 spitter, 2 support, 2 tunneler | 36 / 17 / 41 |
| 430012 | 24 | pressure | 2 artillery, 1 boss, 2 brute, 2 carrier, 11 drone, 3 runner, 1 screecher, 7 shielded, 7 skitter, 17 spitter, 2 support | 55 / 24 / 58 |
| 430013 | 3 | assault | 3 brute, 3 runner, 7 skitter, 5 spitter | 18 / 10 / 24 |
| 430013 | 8 | tactical | 1 boss, 5 brute, 1 carrier, 4 drone, 2 screecher, 6 shielded, 4 skitter, 3 spitter, 2 support, 1 tunneler | 29 / 14 / 34 |
| 430013 | 12 | airborne | 2 artillery, 1 brute, 2 carrier, 12 drone, 2 runner, 5 screecher, 7 skitter, 3 spitter, 2 support | 36 / 17 / 41 |
| 430013 | 24 | pressure | 2 artillery, 1 boss, 3 brute, 2 carrier, 12 drone, 3 runner, 9 screecher, 1 shielded, 5 skitter, 15 spitter, 2 support | 55 / 24 / 58 |
| 430014 | 3 | pressure | 3 brute, 4 runner, 6 skitter, 5 spitter | 18 / 10 / 24 |
| 430014 | 8 | assault | 1 boss, 1 brute, 1 carrier, 2 drone, 5 runner, 2 screecher, 2 shielded, 7 skitter, 4 spitter, 2 support, 2 tunneler | 29 / 14 / 34 |
| 430014 | 12 | pressure | 2 artillery, 1 brute, 2 carrier, 10 drone, 3 screecher, 1 shielded, 3 skitter, 12 spitter, 2 support | 36 / 17 / 41 |
| 430014 | 24 | pressure | 2 artillery, 1 boss, 1 brute, 2 carrier, 9 drone, 2 runner, 7 screecher, 1 shielded, 9 skitter, 19 spitter, 2 support | 55 / 24 / 58 |

## Mutators — same seeded default-deployment/terminal history

| Seed | Waves 6–14 |
|---|---|
| 430012 | none → armored → corrosive → storm → armored → storm → armored → storm → armored |
| 430013 | none → armored → none → blackout → corrosive → storm → corrosive → storm → armored |
| 430014 | storm → none → none → storm → corrosive → none → armored → storm → blackout |

The history here refreshes the terminal once per clear. Other purchase/menu
histories can consume more decision draws; Continue restores that exact state.
Cosmetic and material draws cannot advance the decision stream. A commander
without a rifle excludes future Storm rolls; saved active Storm remains intact.

## Native runtime samples — all wave 12

| Arena / seed | Selected family | Planned roles | Observed peak live / cost |
|---|---|---|
| valley / 430012 | tactical | 2 artillery, 4 brute, 2 carrier, 3 drone, 1 runner, 2 screecher, 8 shielded, 8 skitter, 2 spitter, 2 support, 2 tunneler | 12 / 29 (limits 17 / 41) |
| crater / 430013 | airborne | 2 artillery, 1 brute, 2 carrier, 12 drone, 2 runner, 5 screecher, 7 skitter, 3 spitter, 2 support | 12 / 29 (limits 17 / 41) |
| ridges / 430014 | pressure | 2 artillery, 1 brute, 2 carrier, 10 drone, 3 screecher, 1 shielded, 3 skitter, 12 spitter, 2 support | 9 / 17 (limits 17 / 41) |

These native samples use explicit saved-boundary fixtures with high uint32 RNG
states to test restoration; their mutators are not the planner-history examples
above. Each watches eight normal-speed seconds of native advancement. Operators
are parked on a distant valid arena edge, without changing enemy stats/navigation.
The same terrain vertex/colour, scenery/collider hashes and geometry UUID remain
unchanged within each wave. Planned rosters are not simultaneous live counts.

[One labelled arena/arrival sheet](runtime/run-comparison.png).

## Persistence and economy

- Native fresh run: version 2; encounter seed initially equals world seed.
- Replay: same arena/world geometry/configuration, fresh counters/supplies, new
  deterministic encounter seed from replay ordinal. It does not rebuild terrain.
- Continue: native first spawn positions/focus, death-drop quantities/positions,
  next terminal offers and both uint32 RNG states matched after 5,000 unrelated
  global random draws. Existing 5,000 scrap / 75 cells survived; the normal Rain
  clear paid one cell exactly once in both branches.
- Legacy version-1 active Storm/roster/wallet retained. Pre-B/no-version boundary
  migration remains the accepted version-1 replan; no save-envelope version bump.
- Average raw roster scrap potential, waves 13–42 / 64 seeds: **0.086%**
  relative to CP3-B/C, using the unchanged CP3-C table and an estimated 1.5 allowed
  brood births per Carrier. This is not measured collection or a new economy model.
- CP3-C parameters/genes/costs/rewards remain byte-identical. AOE efficiency and
  poor-collection budget risks remain manual-feedback items, not silently fixed.

Receipts: [seeded checks](seeded.json), [focused native runtime](runtime/replayability.json).
