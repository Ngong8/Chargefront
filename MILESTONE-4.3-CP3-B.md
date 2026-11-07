# Milestone 4.3 — CP3-B: Endless Encounter Director

**Implemented and verified; stop for manual review.** Branch `milestone-4.3`,
committed baseline `0f1b230`. All work remains unstaged/uncommitted. CP3-A terrain,
visual corrections, setup/Continue/restart implementation and existing evidence
are preserved exactly. No CP3-C/D/E implementation or comprehensive browser matrix.

## Audit / problems found

The [pre-implementation audit](_playtest/m43/cp3/b/AUDIT.md) records the old flow.
Composition was independent rolls with overlapping thresholds (up to 76% Brutes
in wave 2), no Shielded selection, and every fifth wave entirely Drones. Total
attempts grew forever (`6 + 5w`), most batches arrived at the same minimum delay,
and Endless bypassed the shared active/cost/source gates. Failed spawns consumed
budget, Carrier broods ignored their source cap, the boss had an unchecked
fallback, and an emptied wave could clear before its delayed boss arrived.
Remaining-enemy text omitted pending enemies; there was no stalled-wave safeguard.

## Implemented

- Pure local-seeded plans keyed by arena world seed + wave. Two introductory
  waves lead into weighted mixed assault, rush, ranged pressure and tactical
  families. A seeded rotating bag avoids adjacent family repeats; every fifth
  wave is an airborne **mix**, not a single-archetype roster. Role anchors plus
  bounded weighted fills retain seed-to-seed composition differences.
- Shielded enemies participate from wave 4. Carriers, Support and Artillery keep
  staged introductions at waves 6/8/10; per-roster and live-role limits contain
  stacked special threats. Existing Harvester cadence remains every eighth wave.
- Wave budget is a confirmed-spawn queue. Location failures and cap waits retain
  the exact next enemy. Bosses use the same queue, pressure gates and valid spawn
  search; cannot appear before 6 s or be bypassed by a premature completion.
- Shared Endless admission now enforces current living-actor and threat cost
  limits, including Carrier children. Death animations do not consume live slots.
  At most four live Runners/Tunnelers combined; Carrier/Support/Artillery each
  have a two-live limit; the existing six-live Carrier-child source cap works.
- Bounded batches with seed-varied delays, periodic breathers, slower one-actor
  reinforcement when the commander is below 35% HP or two squadmates are down.
  No catch-up bursts following a slow frame. Existing enemy stats, spawn visual
  scale progression, Runner/Tunneler tuning, navigation, LOS and attacks unchanged.
- Endless-only spawn search checks every candidate for body clearance, finite
  terrain, slope, enemy separation and operator distance/pop-in. No relaxed unsafe
  fallback. Live operators are valid focus choices; CP2-R still owns advancement.
- Two-second straggler audit retires invalid/out-of-world actors or unseen,
  motionless outliers after 90 s and repeated failed advancement replans. Fighting,
  remembered, emerging, armed and legitimate relay-arrival contacts are protected.
  Retirement grants no kill/drop, and never teleports an actor through geometry.
- Short minimum recovery after clears; next-wave starts remain hold-E and
  player-controlled, with unlimited additional rest/upgrading. HUD separates
  **active / incoming** and shows recovery instead of falsely advertising readiness.
- Existing v1 boundary saves carry only two extra scalar fields: Director version
  and recovery time. New active Continue reconstructs the exact seeded wave-start
  roster; legacy active v1 boundaries are replanned once without reapplying refresh,
  upgrades or rewards. Mid-wave saves remain disabled.

## Budgets / pacing

| Setting | Previous | CP3-B |
|---|---|---|
| Planned regular enemies | `6 + 5w`, unbounded | wave 1: 8; wave 2: 10; then `min(54, 12 + 2w)` |
| Boss | extra independent spawn | one queued extra every eighth wave; maximum total 55 |
| Simultaneous pressure | array-length guard 80; displayed cap not enforced | 5 / 7 introductory; then `min(24, 8 + floor(.8w))` |
| Threat cost | not enforced in Endless | `ceil(2.4 × active cap)`, maximum 58; existing role costs |
| Batch | 1–2 | 1 introductory, 2 through wave 11, then up to 3 |
| Initial / base delay | .8 s / .8–2.6 s | initial 2 s introductory, otherwise 1.5 s; base 2.2 s introductory, then `max(.95, 1.9 − .045w)`, ±15% |
| Breathers | none | +4 s at six-entry queue boundaries; pressure/failed-location retries at 1 s |
| Clear recovery | no minimum; manual restart | 6 s introductory, 8 s normal, 12 s boss; manual restart thereafter |
| Spawn radius about relay | 38–210 m | 65–125 m introductory; 58–160 m later; candidate extent ≤180 m |

These are ceilings, not mandatory simultaneous populations. Composition, timing
and combinations escalate; CP3-B adds no enemy HP/damage/speed multipliers.

## Representative before / after

Seed `430012`; totals include the periodic boss, exclude Carrier death broods.

| Wave | Previous | Revised |
|---|---|---|
| 1 | 11 Skitters | 8 Skitters |
| 2 | 11 Brutes + 5 Skitters | 6 Skitters + 2 Runners + 2 Spitters |
| 5 | 31 Drones | 11 Drones + 6 Spitters + 5 Skitters |
| 8 | 47 total, including 4 Carriers / 6 Support | 29 total; 1 Carrier / 2 Support / 2 Shielded and mixed melee/ranged, plus boss |
| 20 | 106 Drones | 52 mixed airborne/tactical enemies, including 22 Drones |

[Full representative rosters and economy implications](_playtest/m43/cp3/b/compositions.md).
[72-case old/new matrix](_playtest/m43/cp3/b/composition.json): six seeds across
waves 1/2/3/4/5/6/8/10/12/16/20/32; same-seed reproducibility, role unlocks,
canonicalized count variation and no adjacent pattern repeats verified.

## Focused verification — passed

- **Normal-speed early gameplay:** native hold-E start, real mouse fire/reload,
  ordinary squad AI and unmodified enemy stats, no invulnerability. Wave 1 cleared
  in 24.8 s; eight kills, maximum three live contacts, commander survived at 100 HP.
- **Transitions / recovery / persistence:** minimum rest blocks early starts;
  intermission and active boundary Continue, legacy migration, no mid-wave save
  and no refresh repayment. Exact failed-location retry/queued boss emission and
  completion, Carrier offspring/live counts/caps, and reward-once transitions.
- **All three CP3-A arenas:** native wave-12 initial arrivals moved at least 53 m
  toward the relay over eight real seconds (or reached its approach ring), with
  zero solid penetration and zero unseen attacks. Sampled spawn homes valid;
  cap stress retained 19 pending enemies rather than exceeding 17 live / 41 cost.
- **Wave lock / results:** artificial unseen immobility fixture retired without
  kills/drops; deterministic checks also protect visible/moving/relay contacts.
  Native Game Over from a wave-9 lifecycle fixture reported final wave 9 / cleared
  8 and invalidated resume. Play Again reset counters/supplies and began valid
  wave 1 without changing the arena/seed or terrain geometry UUID.
- **Basic performance:** 24 mixed native actors, normal-speed simulation, four
  measured seconds / 224 frames: mean frame 17.8 ms, p95 18.3 ms, worst 36.3 ms;
  actor update mean **0.0166 ms**, approximately 0.40 ms per 24-actor simulation
  step. No world/terrain/facility/nav rebuild or shader-link counter increments.
  This is a headless Edge/software-renderer AI-load smoke, without active combat
  projectiles; not GPU/FPS certification or a late-run balance acceptance test.
- Node checks: new seeded/lifecycle suite; existing terrain state, CP2-R economy/
  attack protections, enemy tactics and result semantics. CP2-R's obsolete whole-
  wave hashes are superseded by CP3-B tests; payout/refresh/pricing source remains
  byte-identical. Module-script / new-file syntax and `git diff --check` passed.
- Preservation manifest: **58 existing files**, all CP3 evidence and targeted
  exact terrain/presentation, setup/restart, full actor and protected module
  sections matched their pre-CP3-B fingerprints. Existing stash retained.

[Runtime receipt](_playtest/m43/cp3/b/runtime-01/runtime.json).
Only the final cache/bounds hardening required a small follow-up:
[lifecycle-only receipt](_playtest/m43/cp3/b/runtime-02-final-lifecycle/runtime.json).
Two essential screenshots are linked from the [review index](_playtest/m43/cp3/b/README.md).
Accelerated lifecycle/pressure fixtures are distinguished from real-time gameplay
and advancement; they do not claim eight manually cleared waves.

## CP3-C handoff — observations only

All drop probabilities, starting supplies, crafting costs, upgrade prices,
mutator payouts and reward quantities/tables are unchanged. Fewer bodies, fewer
early Brutes and pressure-limited Carrier broods **indirectly reduce** resource
opportunities. For seed `430012`, expected base roster scrap changes from 39.75
to 9.55 at wave 2 and 166.95 to 87.28 at wave 20 (excluding broods, banking,
mutators/upgrades and collection losses). CP3-C should measure kills, actual
collections, crafts and recovery per minute with these encounter plans before
rebalancing. No CP3-C economy work has been performed here.

## Files / reproduction

- `chargefront.html`: Endless-only queue integration, pressure gate, safe spawn
  delegation, recovery/status and invalid/stalled-contact handling.
- New `src/endless-director.js`: pure seeded composition and pressure policy.
- New `tests/endless-director-state.mjs`, `tests/endless-director.mjs`.
- `tests/cp2r-state.mjs`: retire two obsolete wave-body hash checks; preserve the
  remaining protections and exact payout-source comparison.
- This CP3-B report and new evidence only under `_playtest/m43/cp3/b/`.

```powershell
node tests/endless-director-state.mjs
node tests/endless-terrain-state.mjs
node tests/cp2r-state.mjs
node tests/enemy-tactics-state.mjs
node tests/results-state.mjs
node _playtest/m43/cp3/b/audit.mjs --verify
# Fresh destination; retained runs are never overwritten.
$env:CF_ARTIFACT_DIR='_playtest/m43/cp3/b/manual-recheck'
node tests/endless-director.mjs
git diff --check
```

**STOP at CP3-B manual review. No stage, commit, merge, tag or push.**
