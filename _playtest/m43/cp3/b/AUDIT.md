# CP3-B — pre-implementation audit

Branch `milestone-4.3`, HEAD `0f1b2301e0c6c5adc6b24f4e8bc7d9ba1f6f2184`.
CP3-A geometry, visual corrections and evidence are uncommitted. Existing stash
is retained. `preserved.json` records the existing CP3 evidence, protected modules
and exact HTML terrain/presentation, actor and setup/restart sections.

## Existing behaviour / limitations

- `startEndlessWave`: increments the wave, allocates **6 + 5 × wave** actor
  attempts, starts after 0.8 s. No ceiling on total wave size.
- `endlessWaveType`: independent random roll per actor, not role composition.
  Every fifth wave is 100% drones. Sequential overlapping thresholds distort
  role shares: wave 2 can be 76% Brutes, and late waves have only a small Skitter
  tail. Shielded enemies are never selected. No anti-repeat mechanism.
- Difficulty: inherited per-wave HP/damage/speed growth in `Infested`, plus
  visual spawn-scale growth. CP3-B must not increase those stats, change accepted
  Runner/Tunneler attacks or rebalance resources. Every eighth wave adds a boss.
- Spawn batches: 1–2 every `clamp(14 / remaining, .8, 2.6)` seconds. This mostly
  front-loads large waves. Positions are random radius **38–210 m** about relay.
  `findSpawnPoint` first tries 60 valid terrain/spacing candidates, then 40 relaxed
  candidates that omit height/spacing checks. Boss has an unchecked fallback.
- Budget is deducted even if actor-cap/location checks fail. Boss flag is set
  before a confirmed spawn. Completion checks all non-dead/non-dying enemies,
  but can clear an eighth wave before its delayed boss if pending budget/live
  count reaches zero early. Remaining-enemy text excludes pending spawns.
- Shared `requestEncounter` accepts every Endless request without checking
  pressure, source cap or cost. The displayed 14–30 active cap is telemetry only;
  the actual wave spawner only stops at array length 80 (including death FX).
- Carrier death releases up to 3 Skitters through the same unconditional gate;
  `sourceCap:6` has no effect in Endless. Broods count in the global live scan,
  but cannot be reserved against pressure until the gate is enforced.
- Intermissions: begin at zero pending budget and zero live enemies, pay existing
  rewards once, save safe boundary; next wave is hold-E at relay, with unlimited
  rest but no minimum recovery period.
- Persistence: v1 snapshots only at fresh run / wave start / clear boundaries.
  Active Continue replays the wave-start boundary, never a mid-wave actor list.
  Replay resets stats/supplies and preserves arena/seed without rebuilding it.
- Debrief derives waves cleared as `wave - (waveActive ? 1 : 0)`; lifecycle must
  preserve that distinction, including during recovery and resumed waves.
- CP2-R: `Infested.perceive` / relay objective and bounded navigation already
  drive unseen actors toward valid operators or a free relay approach ring.
  Wave actors and Carrier broods must use those unchanged behaviours. No
  Director-owned retirement exists for invalid/unreachable wave stragglers.

## Implementation boundary

Use a small engine-independent seeded wave planner plus the current actor,
spawn, encounter gate and boundary-save lifecycle. Bound total actors, live
slots/cost and dangerous-role overlap; retain late tactical combinations and
existing boss cadence. Only debit confirmed spawns; retries retain their queue.
Add paced breathers and short minimum, player-controlled intermissions. Audit
stalled unseen outliers at low frequency, without rewarding retirement or
teleporting active threats. Preserve all economy tables and CP3-A implementation.
