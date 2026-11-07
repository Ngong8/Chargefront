# Milestone 4.3 — CP3-C: Endless resource economy

**Implemented; focused verification passed; awaiting consolidated manual review.**
Branch `milestone-4.3`, committed baseline `0f1b230`. CP3-A/B implementation and
evidence, the existing stash and accepted Campaign tuning are preserved. No
CP3-D/E work or comprehensive regression matrix.

## Findings with the CP3-B Director

The reduced CP3-B rosters do **not** remove long-run excess. The paired ledger
model found a balanced-profile mean of about **5,696 scrap / 127 cells after 40
waves**, even after crafting, estimated collection losses and buying upgrades.
The main cause is DNA's unbounded `6 + 2 × milestone` material bonus. It is paid
once per bank that crosses a milestone, making small versus bulk deposits pay
very differently. Corrosive Rain + Cell Refinery further amplify cell income.
Carrier children also paid the same scrap as ordinary Skitters.

Starting supplies are already appropriate: **0 scrap, 0 cells, 8 universal reserve
cartridges**, two loaded player magazines, 3 medkits / 3 grenades and four spare
magazines per squadmate. Ordinary cell drops are only **2.56% per kill** after
their outer 32% gate; early collection can be sparse. Those values are retained.

Resource generation is not collection. Normal runtime produced six scrap, one
cell and two DNA that all remained on the ground immediately after combat;
native movement then collected them. Models explicitly separate both quantities.

## Targeted changes

| Income | Before | CP3-C |
|---|---|---|
| Main-roster drops, waves 1–11 | Original table | **Unchanged** |
| Ordinary Skitter, wave 12+ | 32% × 2–3 scrap | 26% × 1–2 scrap |
| Spitter / Drone, wave 12+ | 45% × 3–4 scrap | 38% × 2–3 scrap |
| Carrier-child Skitter | 32% × 2–3 scrap | 20% × 1 scrap |
| Other enemies, including Runner/Tunneler and heavy threats | Existing rewards | **Unchanged** |
| Ordinary power-cell chance | 32% × 8% = 2.56% | **Unchanged** |
| Corrosive Rain's inner drop bonus | +22 percentage points | +10 percentage points |
| Rain effective cell rate, no Refinery | 9.60% | 5.76% |
| Rain + existing Refinery | 12.16% | 8.32% |
| DNA scrap | One `6 + 2 × final milestone` bonus per crossing deposit; unbounded | Per newly crossed milestone: 8/10/12/14/16/18 for genes 1–6; 18 for 7–18; 12 thereafter |
| DNA cells | One cell bonus if a deposit ends on an even milestone | Cell at milestone 2, then every six milestones (8/14/20/…) |

DNA dividends use differences of cumulative totals. Bulk and split banking now
produce identical material rewards, including DNA Sync's existing 50% bonus and
rounding. Passive genes, milestone progression and already earned materials are
unchanged. The first six **per-step** rewards retain their old values; unlike the
old system, a bulk early deposit no longer loses intervening dividends. The larger
mid-run dividend protects building a loadout before late income settles down.

No changes to starting supplies, crafting costs, upgrade prices/effects, mutator
clear payouts or wave/intermission rewards. Supply Drop still makes three ordinary
2–4 scrap pickups per clear when owned; the usual clear has no unconditional cash
award. Ammo Forge / Auto-Craft retain their existing discounts, Field Kits and
Grenade Fab retain their refreshes, and Cell Refinery remains +8% inside the gate.

## Seeded measurements

**16 seeds × five profiles × 40 CP3-B waves, before and after: 6,400 modeled wave
ledgers.** Same Director and model hashes in both versions. Reward, banking,
upgrade, offer and crafting functions execute from the actual game sources.
Accuracy, collection/revisits, Carrier births and medical demand are estimates.

Balanced-profile per-wave means:

| Waves | Generated drop scrap | Estimated collected drop scrap | DNA scrap | Net scrap after modeled spending |
|---|---:|---:|---:|---:|
| 1–5 | 19.90 → 19.95 | 14.61 → 14.61 | 5.08 → 5.35 | 9.11 → 9.40 |
| 6–12 | 55.27 → 53.13 | 46.62 → 46.05 | 18.44 → 21.22 | 12.47 → 13.35 |
| 13–24 | 94.00 → 77.83 | 85.52 → 71.38 | 72.32 → 39.80 | 99.23 → 54.09 |
| 25–40 | 105.93 → 87.19 | 104.09 → 86.18 | 187.19 → 45.63 | 273.25 → 113.85 |

Over 40 waves, this profile's drop scrap changes **3,309 → 2,801 generated** /
**3,091 → 2,631 collected**; DNA scrap **4,017 → 1,383**. Ammo spending remains
relevant: **881 → 869 scrap**, plus medkits **12 → 14** and upgrades **593 → 593**.

Mean modeled stock after wave 40:

| Profile | Scrap before → after | Cells before → after |
|---|---:|---:|
| Balanced | 5,696 → 2,612 | 127 → 106 |
| Rifle-focused squad | 5,452 → 2,383 | 124 → 101 |
| Efficient Arc/Plasma scavenger | 7,130 → 3,455 | 145 → 120 |
| Repeated Rain / Refinery / split-bank stress ceiling | 13,643 → 3,068 | 304 → 183 |

**Budget caveat:** these are ledger projections, not successful AI playthroughs.
The model records unfunded reloads and continues counterfactually. Balanced and
rifle profiles average only **0.25 / 0.31 unfunded reloads** across 40 waves (under
one scrap shortfall on average); efficient/Rain profiles have none. Poor fresh
collection (40%), limited revisits and inefficient fire are a **failed budget
stress case**: 115.69 unfunded reloads versus 27.94 before, and −189 net scrap after
missing-ammo debt. This is not reported as sustainable survival.

Full costs, cells, debt, assumptions and generated-versus-collected results:
[`RESULTS.md`](_playtest/m43/cp3/c/RESULTS.md), with paired JSON receipts.
The repeated-Rain case deliberately exceeds legal mutator frequency to expose an
income ceiling; the mixed profiles use the actual no-repeat mutator selector.

## Runtime / compatibility verification

- One normal-speed Valley wave, unmodified enemy stats, no invulnerability: eight
  enemies cleared in **25.36 s**. Generated and actually collected **6 scrap /
  1 cell / 2 DNA**, no remaining drops. Continuous-fire automation used 195 shots
  / three cartridge reloads; this is observed input cost, not human aim calibration.
- Crafting one cartridge spent **4 scrap**, leaving **2 scrap / 6 reserve
  cartridges**. No inventory additions were used to fund this runtime check.
- Native Carrier-death fixture released three allowed children; Carrier retained
  its five-scrap minimum, children produced one-scrap bundles on successful rolls.
- Old v1 wallet fixture retained **5,000 scrap / 75 cells / 11 cartridges** and
  pickup quantities **11 / 0 / 1** through Continue, including the unresolved
  generic bundle. Its next gene paid 12 new scrap. Save/reload did not repay it.
- Native Play Again restored accepted fresh supplies and zero counters, keeping
  arena/seed and terrain geometry UUID. No save version change or inventory cap
  migration; existing quantities are never reduced, converted or rerolled.
- State tests: 120,000 Campaign reward rolls match the old table/RNG exactly;
  24,000 introductory/main-roster rolls and 9,000 dangerous-role late rolls match;
  staged/brood rates, 800 bank-splitting cases, actual bank function outcomes,
  prior balances, module syntax and exact HTML scope passed.
- Preservation audit: **73 existing files** plus protected source sections match.
  HTML differs only in the three income substitutions: drop context, Rain bonus,
  DNA material dividend. CP3-B composition/budgets/pressure/Carrier tracking,
  intermissions, saves, navigation and all CP3-A presentation remain unchanged.
- Existing progression and CP2-R checks, syntax checks and `git diff --check`
  passed. CP2-R's old bank hash is normalized only for the authorized dividend
  substitution; its transfer, gene and control-flow protections remain active.

## Manual-review concerns

The runaway milestone multiplier and split-bank advantage are removed, but skilled
long survivors can still accumulate money after finite upgrades are exhausted;
there is deliberately no wallet hard cap or forced new sink. The low-collection
stress warning deserves particular attention during waves 12–24 and boss recovery.
Observe pickup routes, shotgun/Arc/Plasma efficiency, shared ammo and upgrade timing
before further tuning. The model omits actual grenade kills, LOS and combat deaths;
it does not certify every loadout or forty-wave sustainability.

## Files / reproduction

Product: `src/progression.js`, three targeted substitutions in `chargefront.html`.
Tests: new `tests/endless-economy-state.mjs`, `tests/endless-economy.mjs`,
`tests/helpers/endless-economy-model.mjs`; updated `tests/cp2r-state.mjs`.
Documentation: this report; essential evidence only in `_playtest/m43/cp3/c/`.

```powershell
node tests/endless-economy-state.mjs
node tests/progression-state.mjs
node tests/cp2r-state.mjs
node _playtest/m43/cp3/c/preserve.mjs --verify
# Use a fresh evidence destination for a further runtime check.
$env:CF_ARTIFACT_DIR='_playtest/m43/cp3/c/manual-recheck'
node tests/endless-economy.mjs
git diff --check
```

**Stop at CP3-C review. No stage, commit, merge, tag or push.**
