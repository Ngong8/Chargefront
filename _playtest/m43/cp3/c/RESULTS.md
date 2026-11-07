# CP3-C — measured economy comparison

Before means the **accepted CP3-B Director**, not the old pre-CP3-B horde.
16 seeds × 5 scenarios × 40 waves per version (6,400 modeled wave ledgers).
Both versions use the same model hash and exact unchanged Director.

## Balanced profile — per-wave means

| Waves | Generated drop scrap | Estimated collected drop scrap | DNA scrap | Ammo / med / upgrade spending | Net scrap after spending | Cell income generated / collected |
|---|---:|---:|---:|---|---:|---|
| 1–5 | 19.90 → 19.95 | 14.61 → 14.61 | 5.08 → 5.35 | 0.05 → 0.05 / 0.75 → 0.75 / 9.78 → 9.76 | 9.11 → 9.40 | 0.55 → 0.53 / 0.49 → 0.47 |
| 6–12 | 55.27 → 53.13 | 46.62 → 46.05 | 18.44 → 21.22 | 31.09 → 30.36 / 0.91 → 1.07 / 22.73 → 24.64 | 12.47 → 13.35 | 2.31 → 1.84 / 2.02 → 1.55 |
| 13–24 | 94.00 → 77.83 | 85.52 → 71.38 | 72.32 → 39.80 | 29.44 → 28.45 / 0.14 → 0.25 / 30.96 → 30.31 | 99.23 → 54.09 | 3.86 → 3.47 / 3.56 → 3.15 |
| 25–40 | 105.93 → 87.19 | 104.09 → 86.18 | 187.19 → 45.63 | 19.39 → 19.66 / 0.00 → 0.00 / 0.84 → 0.50 | 273.25 → 113.85 | 4.99 → 4.16 / 4.88 → 4.11 |

Drop scrap includes the existing Supply Drop pickups; DNA and direct clear
rewards are separate ledger lines. Cells include drops, DNA and direct rewards.
Net scrap subtracts all actual modeled crafting/upgrades and unfunded-ammo debt.

## Full-run comparison — mean modeled inventory after wave 40

| Profile | Scrap before → after | Cells before → after | Unfunded reloads before → after | After ammo shortfall debt | After net scrap with that debt deducted |
|---|---:|---:|---:|---:|---:|
| balanced | 5695.69 → 2611.94 | 126.75 → 106.06 | 0.00 → 0.25 | 0.81 | 2611.13 |
| rifle-squad | 5452.19 → 2382.56 | 124.31 → 101.31 | 0.63 → 0.31 | 0.94 | 2381.63 |
| efficient-scavenger | 7129.94 → 3455.06 | 145.44 → 120.31 | 0.00 → 0.00 | 0.00 | 3455.06 |
| corrosive-refinery | 13643.19 → 3067.94 | 304.31 → 182.81 | 0.00 → 0.00 | 0.00 | 3067.94 |
| low-collection | 1795.31 → 231.19 | 68.06 → 50.94 | 27.94 → 115.69 | 420.38 | -189.19 |

An unfunded reload is a **budget failure in the model**, not free ammunition
in the product. The model records the missing scrap and continues counterfactually
so late trajectories can be compared. Such runs are not claimed to be sustainable.
Low-collection/inefficient-fire stress remains materially worse after the removed
DNA subsidy; it requires manual review. Efficient complete scavenging still
leaves a surplus after finite upgrades are exhausted. No wallet hard cap was added.

## Generated versus estimated collected — balanced full-run totals

- Drop scrap generated: 3309.25 → 2800.63.
- Drop scrap collected: 3091.13 → 2630.75.
- DNA dividend scrap: 4017.38 → 1383.00.
- Drop cells generated / collected: 107.13 → 97.25 / 99.50 → 90.13.
- DNA cells / direct clear cells: 29.81 → 18.44 / 8.13 → 8.13.
- Ammo / medkit / upgrade scrap spent: 881.31 → 868.63 / 11.75 → 14.25 / 593.00 → 593.00.

## Model assumptions / limits

- Real game code supplies drops, DNA genes/material dividends, upgrade catalog
  and offers, crafting, wave refresh and clear rewards. Actual enemy HP/shields
  and weapon catalog are read from the shipped code. Player/squad share cartridge
  consumption; starting magazines/reserves and item caps are retained.
- Accuracy is assumed: 60–85%; target damage assigned 40% player / 20% each ally.
  Scatter averages 4.4 connected pellets before accuracy; Arc/Plasma use 1.3/1.2
  target-equivalent multipliers. Shooting estimates omit grenade damage, actual
  LOS, crowd geometry, time-to-kill, deaths and the combat AI. They are not FPS
  or guaranteed survival results.
- Fresh loot collection estimates range 40–90%; one intermission revisit uses
  8–30% chance on old missed drops per wave. Many old drops are recovered later,
  so lifetime collection is higher than the fresh-drop percentage. The existing
  160-pickup cap is modeled. Generic Supply Drop quantities resolve early only
  inside the model for bookkeeping; product save/pickup semantics are untouched.
- Carrier children use 0.5–2.5 estimated successful births per Carrier, never
  more than the existing three. Native runtime verifies three allowed children
  and their actual rewards; the model does not simulate kill-time live pressure.
- Real seeded offers are bought only while preserving at least 12 scrap or 1.5
  waves of the most recent ammo bill, whichever is larger. Medical demand is
  .25 / .5 / 1 kit per wave in early / mid / late bands. Existing free wave
  refreshes, heals and grenade drops reduce spending. One grenade is consumed
  every second wave. The Corrosive profile deliberately forces repeated Rain
  after wave 6 as an income stress ceiling, not a legal mutator sequence.
- No runtime inventory is modified to satisfy this model; its predictions are
  separate from the normal-speed runtime receipt.

## Actual runtime — single normal-speed wave

- 25.36 seconds; eight normal enemies; no invulnerability.
- Generated 6 scrap / 1 cell / 2 DNA; collected 6 / 1 / 2 by native movement,
  leaving no drops behind. Immediately after combat, none had yet been collected.
- Continuous-fire driver used 195 player shots / 3 cartridge reloads; this is
  an observed automated-input cost, not a calibrated human accuracy sample.
- Crafting spent 4 scrap for one cartridge: scrap 6 → 2, reserves 5 → 6.
- Continue retained 5,000 scrap / 75 cells / 11 cartridges and pickup quantities
  11 / 0 / 1 exactly. Banking the next gene added 12 scrap without reducing any
  prior quantities. Native Replay reset to the accepted fresh supplies.

Receipts: [before](before-verified.json), [after](after-verified.json),
[normal-speed/runtime fixtures](runtime/economy.json), [state checks](state.json).
