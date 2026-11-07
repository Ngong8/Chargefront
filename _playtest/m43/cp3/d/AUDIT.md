# CP3-D — replayability audit before implementation

Working branch `milestone-4.3`, HEAD `0f1b230`. Accepted CP3-A/B/C remain
uncommitted. Existing files/evidence and stash are retained.

- **Arenas already provide real variation.** Three distinct smooth profiles,
  accepted night palette and seeded scenery/collision. Equal fresh-run random
  arena selection is already present. No terrain feature or regeneration needed.
- **Director already provides role variation and fair limits.** CP3-B's weighted
  assault/rush/pressure/tactical/airborne mixes, role unlocks, total/live/threat
  budgets, boss cadence and recovery windows are retained. CP3-D must not duplicate
  these or add bodies/damage to manufacture variation.
- **Sequence limitation:** only one shuffled four-family bag per run, rotated
  mechanically, with airborne fixed at every fifth wave. At most 24 family-order
  permutations; the established pattern eventually repeats on an 80-wave cycle.
- **Persistence gap:** only terrain and roster planning are seeded. Mutators,
  offers, safe spawn candidates/focus and material rolls use ambient Math.random.
  v1 boundary saves do not record those streams. Continue restores its current
  mutator/offers/materials but subsequent choices can diverge after a reload or
  unrelated cosmetic random draws.
- **Replay gap:** selected deployment, arena and geometry are correctly retained,
  and counters/supplies reset. Retaining the same world seed also repeats the
  fixed family plan. Encounter variation needs an independent replay ordinal/seed,
  without rebuilding the retained terrain or changing the selected configuration.
- **Confirmed compatibility mismatch:** Power Storm zeroes shields for the whole
  deployment; fireWeapon's bonus is only for the commander's BUL-117. A commander
  with no rifle gets the penalty and no weapon benefit, even if an ally has a
  rifle. Filter only future incompatible selections; keep saved active mutators.
- **Other balance observations:** C's efficient Arc/Plasma model spends less ammo
  than rifle-heavy deployments; poor collection remains a budget risk. These are
  documented balance concerns, not evidence for changing accepted weapons or C
  prices/drop/dividend parameters in this checkpoint. Armour/Rain/Blackout retain
  their identity and existing rewards. No new mutator or progression mechanism.

Implementation direction: balanced re-shuffled family blocks with cross-block
anti-repeat; reuse the existing Director version and v1 save envelope; add only
optional scalar encounter-seed/replay/RNG state, restore uint32 values correctly;
separate gameplay decisions/material draws from cosmetic global randomness. Old
v1 roster boundaries retain their existing plan version, current mutator/offers
and inventories. Native simulation is still a wave-start replay, not mid-frame
physics restoration or a claim of bit-identical full combat.
