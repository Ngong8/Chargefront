# Milestone 4.3 — CP3-D: Endless replayability

**Implemented and focused verification passed; stop for consolidated manual
review.** Branch `milestone-4.3`, committed HEAD `0f1b230`. CP3-A/B/C implementation,
existing evidence/user files and stash remain in place. No CP3-E work or repository
publication operations.

## Audit — what was actually missing

The [pre-implementation audit](_playtest/m43/cp3/d/AUDIT.md) covers the combined
arena/Director/loadout/mutator/economy/persistence behaviour. Terrain identities,
weighted enemy roles, live-pressure control, loadout selection and recovery were
already delivered; those did not need replacement.

1. One fixed four-family permutation per run and airborne every fifth wave made
   ordering predictable. Among 64 adjacent test seeds, the old selector produced
   only six distinct wave-3–22 sequences; its general pattern repeats after 80 waves.
2. Mutators, offers, spawn/focus and material draws used global randomness that was
   not persisted. Terrain/rosters restored, but future choices could diverge after
   Continue or unrelated cosmetic draws.
3. Replay correctly retained terrain/deployment, but also repeated the seed-fixed
   encounter plan. It needed fresh encounters without recreating the arena.
4. Power Storm removes deployment shields but buffs only the commander's rifle.
   A rifle-less commander received the penalty with no matching weapon benefit.

## Changes

- **Version-2 family sequencing:** independently shuffled five-wave blocks use
  each established family once. Repair at block boundaries prevents adjacent
  repeats and A/B/A repetition. Introductory waves 1–2 retain their familiar
  rosters; waves 3–4 select different existing ground families. Airborne mixes
  remain roughly one wave in five but are no longer tied to a universal ordinal.
- **Same Director balance:** existing weights, unlocks, actor totals, live/threat
  caps, role limits, burst sizes/delays, spawn bounds, boss-every-eight cadence and
  recovery windows remain. Version-1 plans still reproduce their complete previous
  queues/delays/caps exactly for continued accepted runs.
- **Serializable run randomness:** reuse the existing LCG algorithm with two
  explicit uint32 states. `decisionRng` owns mutators/terminal offers; `eventRng`
  owns spawn candidates/focus, material rolls/offsets and generic supply bundles.
  Cosmetic/AI global draws do not consume these streams. Restore accepts the full
  uint32 range rather than truncating large states to the generic one-million cap.
- **Fresh Replay encounters:** a deterministic replay ordinal derives an
  `encounterSeed` from the retained world seed. World geometry/scenery/collision,
  selected weapons/abilities/posture remain; normal counters/supplies reset.
- **Small compatibility fix:** exclude future Storm rolls when neither commander
  slot is a rifle. An ally's rifle does not qualify because it does not receive
  the commander-only buff. Saved active Storm still restores unchanged. No weapon,
  enemy, mutator effect, reward or CP3-C economic parameter was altered.
- Existing airborne/Harvester music cues now follow the selected family/boss
  rather than assuming every fifth wave is airborne.

The outer save envelope stays **version 1**. Only optional numeric encounter seed,
replay ordinal and RNG fields are added inside the existing `run` object; the
existing Director-version scalar distinguishes plans. No inventory migration or
save invalidation. Legacy saves cannot reconstruct global RNG state that was
never recorded: they retain their v1 roster/current mutator/offers/resources and
adopt deterministic future streams. Replay or a new run uses v2 sequencing.

Continue remains the accepted **wave-start replay**, not a mid-frame quicksave.
This restores the named gameplay streams; it is not a promise of bit-identical
physics, shot spread, AI animation or combat across different input timing.
Terminal purchase/menu history can consume decision draws and is itself saved.

## Representative differences

Full seed-by-seed sequences, early/mid/late rosters and modifiers:
[`RUNS.md`](_playtest/m43/cp3/d/RUNS.md).

Native wave-12 samples, all with **36 planned enemies / 17 live cap / 41 threat cap**:

| Arena / encounter seed | Family | Example planned role mix |
|---|---|---|
| Lumen Valley / 430012 | Tactical | 8 Shielded, 4 Brutes, 2 Support, mixed other roles |
| Impact Crater / 430013 | Airborne | 12 Drones, 5 Screechers, melee/support companions |
| Shattered Ridges / 430014 | Pressure | 12 Spitters, 10 Drones, 2 Artillery, other roles |

These are intentional seed differences, not arena-specific difficulty modifiers.
Identical encounter seeds produce the same plan on each arena; the accepted
terrain and safe-location filter shape the actual approach paths. Terrain was not
regenerated between waves. [One labelled arrival sheet](_playtest/m43/cp3/d/runtime/run-comparison.png).

## Focused verification — passed

- **8,192 seeded plans:** 64 seeds × waves 1–128; same seeds repeat exactly. Every
  legacy-v1 plan matches its old implementation. All counts/caps/delays/boss/rest
  settings remain CP3-B's; role limits and unlocks pass. Distinct tested orders
  increased **6 → 63**, with balanced blocks and no A/A or A/B/A seams.
- **Economy boundary:** CP3-C's complete module/catalog/costs/dividends remain
  byte-identical. Estimated late-roster scrap potential over waves 13–42 / 64 seeds
  changes only **+0.086%**, including estimated bounded Carrier broods. This is raw
  income potential, not collected income or a rerun of C's full budget model.
- **Loadouts/modifiers:** four representative deployments span all four weapons,
  commander abilities and three postures. Seeded offers respect weapon ownership;
  non-null modifiers do not repeat; early waves remain unmodified. Rifle-less
  configurations exclude new Storm rolls. Arc/Plasma efficiency is left intact.
- **RNG/persistence:** cloned streams match future draws, including zero and high
  uint32 states. Material draws match despite unrelated global randomness; Campaign
  death drops/positions/global-RNG consumption match the prior implementation.
  Older no-version boundary migration still replans to the accepted v1 queue.
- **Native early wave:** selected Arc/Plasma + Medic Pulse / escort deployment
  cleared eight normal enemies in **26.50 s**, no invulnerability; supplies and
  configuration are accepted existing values. Normal completion/recovery triggered.
- **Native Continue:** high uint32 boundary states restored exactly. Next spawn
  positions/focus, actual death-drop positions/quantities, next offers, balances
  and both stream states matched after **5,000 unrelated random draws**. The
  5,000-scrap / 75-cell fixture remained intact; Rain's clear paid one cell once.
- **Native Replay / results:** Game Over from the labelled wave-13 fixture showed
  final 13 / cleared 12 and correct event kills. UI Play Again retained deployment,
  world seed/arena and geometry UUID, reset counters/supplies, and selected a new
  encounter sequence. Legacy v1 restored its old queue and saved active Storm even
  for the rifle-less deployment. Fixtures do not claim thirteen naturally played waves.
- **All three arenas:** first native wave-12 arrivals advanced substantially during
  eight real seconds with no solid penetration or unseen attacks. Sampled live/cost
  counts stayed within 17/41; vertex/colour/scenery/collider fingerprints and ground
  geometry UUID were unchanged within each wave.
- **Representative CPU:** 24 mixed native actors, four measured seconds / 224
  frames; mean frame **17.8 ms**, p95 **18.5 ms**, mean actor update **0.0096 ms**.
  No world/terrain/facility/navigation rebuild or shader-link counter increments.
  Manually assembled late-cap load, headless Edge/software renderer; not GPU/FPS
  certification or a long-run combat regression.
- **Protection/syntax:** 87 pre-existing files/evidence and targeted source sections
  match the recorded baseline. Campaign progression, enemy tactics and debrief
  suites pass; Campaign storage remains unchanged in runtime. Module/new-script
  syntax and `git diff --check` pass. One focused Edge run; no full browser matrix.

Receipts: [seeded](_playtest/m43/cp3/d/seeded.json),
[native runtime](_playtest/m43/cp3/d/runtime/replayability.json).
The final music-selector alignment was checked with the seeded/source suite;
the gameplay/RNG runtime receipt predates only those two cue-selection expressions.

## CP3-E / manual-feedback handoff

- Run consolidated manual play across all arenas and broader weapon/squad/ability
  combinations. C's poor-collection/shared-ammo recovery concern remains, especially
  waves 12–24; efficient AOE loadouts can still accumulate surplus. No C retuning here.
- Removing incompatible Storm changes the relative frequency of other eligible
  modifiers in rifle-less runs. Observe Rain/resource opportunities and Armoured
  pressure during long manual runs; preserve the confirmed compatibility correction.
- Compare perceived family variety and difficulty at five-wave seams and boss/
  airborne coincidences, not only composition counts. Recovery/caps are unchanged.
- Broaden persistence/input-timing and performance coverage in CP3-E. Scoped RNG
  reproducibility does not certify complete deterministic combat or every old save.
- Consolidated fixtures should distinguish world/encounter seeds and planner
  versions; checkpoint-specific whole-source hashes must account for these intended
  D integrations. Historical checkpoint evidence remains untouched.

## Files / reproduction

- `src/endless-director.js`: versioned family order, replay seed, eligible modifier
  filter; unchanged budget/pressure policy and legacy planning path.
- `chargefront.html`: run/RNG fields, boundary initialization/restore, existing
  random-choice call sites, Replay encounter seed and family-aligned music.
- New `tests/endless-replayability-state.mjs`, `tests/endless-replayability.mjs`.
- `tests/cp2r-state.mjs`: normalize only the authorized generic-bundle RNG selector
  around its otherwise exact historical pickup/banking protections.
- This report and essential evidence under `_playtest/m43/cp3/d/`.

```powershell
node tests/endless-replayability-state.mjs
node tests/progression-state.mjs
node tests/cp2r-state.mjs
node tests/enemy-tactics-state.mjs
node tests/results-state.mjs
node _playtest/m43/cp3/d/preserve.mjs --verify
# Use a fresh destination; do not overwrite retained evidence.
$env:CF_ARTIFACT_DIR='_playtest/m43/cp3/d/manual-recheck'
node tests/endless-replayability.mjs
git diff --check
```

**STOP after CP3-D verification. No CP3-E implementation; no stage, commit,
merge, tag or push.**
