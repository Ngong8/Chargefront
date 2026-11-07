# Representative seeded composition comparison

Seed `430012`. Old roll stream is deterministically seeded with `seed XOR wave`;
new plans are generated from the arena world seed and wave. This compares
distributions/counts, not identical random-number consumption. Counts exclude
Carrier death broods, which are now pressure-limited. Every-eighth-wave bosses
are included in both totals. Full matrix: [composition.json](composition.json).

| Wave / new pattern | Before | Revised | Total before → revised | Live cap / threat cap |
|---|---|---|---:|---:|
| 1 / arrival | 11 skitter | 8 skitter | 11 → 8 | 5 / 12 |
| 2 / contact | 11 brute, 5 skitter | 2 runner, 6 skitter, 2 spitter | 16 → 10 | 7 / 17 |
| 4 / tactical | 3 brute, 4 runner, 4 skitter, 7 spitter, 8 tunneler | 4 brute, 1 runner, 5 shielded, 4 skitter, 4 spitter, 2 tunneler | 26 → 20 | 11 / 27 |
| 5 / airborne | 31 drone | 11 drone, 5 skitter, 6 spitter | 31 → 22 | 12 / 29 |
| 8 / assault | 1 boss, 7 brute, 4 carrier, 7 runner, 1 screecher, 5 skitter, 9 spitter, 6 support, 7 tunneler | 1 boss, 2 brute, 1 carrier, 2 runner, 2 shielded, 9 skitter, 7 spitter, 2 support, 3 tunneler | 47 → 29 | 14 / 34 |
| 12 / pressure | 8 artillery, 6 brute, 7 carrier, 9 runner, 10 screecher, 12 skitter, 4 spitter, 2 support, 8 tunneler | 2 artillery, 1 brute, 2 carrier, 8 drone, 1 runner, 3 screecher, 3 shielded, 9 skitter, 5 spitter, 2 support | 66 → 36 | 17 / 41 |
| 20 / airborne | 106 drone | 2 artillery, 2 brute, 2 carrier, 22 drone, 6 screecher, 2 shielded, 11 skitter, 3 spitter, 2 support | 106 → 52 | 24 / 58 |
| 32 / rush | 11 artillery, 1 boss, 19 brute, 15 carrier, 31 runner, 15 screecher, 25 skitter, 15 spitter, 14 support, 21 tunneler | 1 artillery, 1 boss, 2 brute, 2 carrier, 2 drone, 3 runner, 2 screecher, 3 shielded, 25 skitter, 7 spitter, 2 support, 5 tunneler | 167 → 55 | 24 / 58 |

## CP3-C observations — unchanged economy tables

Expected base scrap per fully killed planned roster (chance × mean bundle × count).
This is not a payout change or measured collection rate; excludes broods,
mutators, DNA banking, upgrades and retirements.

| Wave | Before | Revised |
|---|---:|---:|
| 1 | 8.80 | 6.40 |
| 2 | 39.75 | 9.55 |
| 4 | 48.77 | 38.70 |
| 5 | 48.83 | 30.77 |
| 8 | 109.25 | 59.23 |
| 12 | 137.85 | 61.60 |
| 20 | 166.95 | 87.28 |
| 32 | 350.65 | 93.63 |

Ordinary power-cell probability remains 0.32 × 0.08 = 0.0256 per kill before
existing mutator/upgrades; DNA probability remains 0.14. Fewer late-wave bodies
and bounded Carrier broods reduce resource opportunities. CP3-C should evaluate
actual kills, pickup collection, crafting and recovery per minute under these
rosters before changing any economy numbers.
