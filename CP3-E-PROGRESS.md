# CP3-E — final facility integration and acceptance ledger

## Recovery and scope

On interruption/resume inspect Git status, this ledger, source and existing receipts.
Resume the last verified checkpoint; started/partially edited does not mean complete.
Use fresh evidence destinations under `_playtest/m42/cp3e-20261015/`. Preserve all
older evidence and unrelated work. No staging, commit, merge, push or Milestone4.3.

Baseline verified: branch `milestone-4.2`, HEAD
`b9e446c3f90bd9b53d267ac1e4dcd0096eade710`; empty index. The only tracked local
modification at entry is unrelated `Credits.txt`; preserve it byte-for-byte.
No AGENTS.md or prior CP3-E progress file found.

## Reference inspected before product edits

The supplied screenshot looks south from Containment: red surrounds a large
internal portal, with the activated turret to its right. It explicitly displays
VISUAL DEBUG LIGHTING: ON. Preliminary source candidate is `lab_security` at
`(360,735)`, not the front `(360,618)`; actual-game identification is required.
Turret is `(342,744)`. No hostile is visibly established by the reference alone.
Final acceptance captures will use normal exposure .78/fog40–280, debug fill OFF.

## Phase checkpoints

| Phase | Status | Gate |
|---|---|---|
| E0 — doorway and turret investigation/corrections | VERIFIED COMPLETE |Controlled E0 + full90s turret-enabled live operation PASS Firefox/Edge |
| E1 — facility/mission/state/Endless integration | VERIFIED COMPLETE |Final integration, M2, combat/persistence, placement and permanent suites PASS both browsers |
| E2 — Firefox/Edge performance and visual acceptance | VERIFIED COMPLETE |Player-eye/live profile, lighting eligibility/persistence, transitions and traversal PASS both browsers |
| E3 — indexed evidence/milestone/release-candidate handoff | VERIFIED COMPLETE |Index/summary/docs/visual inspection, syntax/122 links/hash/Git PASS |

## Historical E0 source investigation/candidate notes (superseded by verified checkpoint)

- `setFinalMissionWorldState()` explicitly sets `lab.securityDoor.forceOpen` in M4;
  six-door sliding state is applied by `ChargefrontFacility.updateDoors()`.
- Closing that internal portal does not block the Containment→east Power→emergency
  route for actors already in Containment. However accepted R2 allows defence
  actors to remain in northern rooms: safety/progression conflict must be considered
  before changing portal behaviour. No door-state edits made yet.
- Existing turret uses direct22-damage hitscan at .72s cadence /42m horizontal range,
  guarded by active AND emergency, with generic ground-eye LOS. It emits impact/
  sound, rotates only the head box (not its separate barrel) and has no muzzle-to-hit
  tracer. Activation/state persistence must be tested before classifying the issue.

Changed files so far: this ledger and a new read-only gameplay investigation helper.
Baseline probe PASS both browsers (`e0-before/*`): red opening is `lab_security`,
panels present but forceOpen=true in M4; front locked. Turret inactive before emergency
even when restored; during defence target1000→888.9HP (existing marked-target boost
explains damage beyond raw22), while barrel stays fixed. Normal baseline PNG inspected.

User selected **Safe staged seal**: new runs gather clear before M4; older saves with
northern actors get one-time ingress until all cross, then persistent seal. Exception
must be documented. No teleport/migration reset. East route remains accessible.

E0 implementation now IN PROGRESS (unverified): staged portal seal/recovery flags,
pre-handoff safety gate, turret common yaw/pitch/muzzle, actual3D ray obstruction,
active-without-emergency engagement, pooled straight hitscan beam/muzzle/hit effects,
cooldown persistence/diagnostic events. Raw22/.72s/42m retained; no new light/solid.
Changed product: HTML and facility module. New E0 gates/edge cases still required;
do not claim fixed until targeted tests pass. E1/E2/E3 not started.

## E0 verified checkpoint

HTML SHA256 `4ed81746f846744f4f70b8706df0794fac3117a465eeba1c5d993aab5b531be3`;
facility `7cbf00aa9691aa2a0c361f58a7f112ab6c3f84b08a6f14338b953662f234996b`.
`e0-verified-both-facility-e0-sample-lockdown-live.json`: all4 entries exit0,
Firefox53.818s controlled /123.018s live; Edge38.503s /112.475s. Zero page errors.

- Door proven `lab_security` `(360,735)`, actual panels formerly force-opened in M4.
  New normal sequence completes3.5s transfer, gathers any northern/threshold actors,
  closes the original door and only then enters M4. Timers/stats never reset; optional
  rally/closure waiting is an interlock after the animation, not a longer animation.
  North portal stays locked; east service/emergency route releases as before.
- Approved legacy exception tested: old M4 northern actors restore in place with
  one-time open recovery passage; real W/FOLLOW ingress crosses it, all actors clear,
  then the portal closes/locks and the recovery flag persists as finished. No teleport.
  New sealed save/actual death+menu Continue does not reopen it. Closing safety and
  saved rally-wait boundaries tested. Six doors /327 solids /28 segments unchanged.
- Turret original damage worked during emergency; activation/emergency restriction
  and static barrel made readiness/feedback misleading. Screenshot alone also permits
  a valid no-target idle interpretation. Activated turret now engages eligible targets
  without requiring emergency, with common yaw/pitch and real3D solid/terrain LOS.
  Preserve raw22/.72s/42m and original marked-target multiplier (later HP hits29.7).
- Actual E-key activation/optional completion, disabled/no-target/friendly idle,
  wall-blocked/out-of-range targets, tracking/pitch, cooldown restoration, damage,
  cadence and confirmed-shot beam all PASS. No friendly target/damage. No decorative
  or independent damaging projectile: beam/muzzle/impact follows actual hitscan.
- Full unaccelerated90s drone-only defence with activated turret PASS both browsers,
  normal squad shooting, permanent glass,3.5s transfer and east-exit W evacuation.
  Turret shot events during M3 contain only drones; activation carries into M4.
- Normal-lighting firing/closed-portal PNGs inspected. Beam clearly connects aimed
  barrel to damaged hostile. Debug fill OFF/exposure.78, eight slots,32 fixtures.
- Changed: HTML, facility module, new `tests/facility-e0.mjs`, optional turret-enabled
  instrumentation in existing live test, this ledger, new E evidence/helpers only.
  No light/solid/map/fixture additions. Baseline snapshots/older work preserved.

E0 has passed. E1 integration may begin. E1/E2/E3 still pending; no staging/commit.

## Historical E1 probe failures and corrections

`e1-core` existing enclosure, real playthrough/FOLLOW/pursuit, facility regression
and deterministic Sample Zero lifecycle all PASS both browsers. New integration
probe confirms M1/M2 chapter-stat carry but sees328 global SOLIDS after explicitly
restoring M1's ship snapshot, versus327 on the normal route. No source expectation
changed: investigate whether this is a pre-existing retired ship-hull record rather
than facility geometry before changing code/tests. New probe otherwise incomplete;
E1 not passed. Product hashes remain exactly the verified E0 checkpoint.
Read-only accepted/current probe confirms identical327 canonical records and328
after explicit M1 snapshot restoration (duplicate existing ship-hull history, no
new coordinates). Integration now verifies327 on cold M3 Continue while retaining
all carried chapter data. No product/architecture change for this fixture detail.
Second integration attempt passes all commands, preservation, M4 squad evacuation
and campaign completion; final direct-API Endless switch retained the result-screen
pause. Explicitly unpause that test path (normal menu does this); retry pending.
Further E1 probe confirms direct debug mode switch retains Campaign section metadata;
normal menu uses fresh deployment. Endless smoke now follows that fresh-world path,
rather than requiring unsupported in-place debug scene clearing. No product edits.
Edge M2/combat suites and both five-seed/nine-arena placement+pure persistence suites
PASS. Firefox had a bootstrap timeout, a missed rapid-select completion, and a
fixed10.5s-wall-time checkpoint sample before10 active seconds elapsed. Replace only
that fixed wait with an actual persisted terminal checkpoint predicate; all original
position/migration/traversal assertions remain. Fresh focused retries pending.

## Interruption recovery — E1 final legacy-combat check

Recovered branch/HEAD still `milestone-4.2` /`b9e446c`; index empty. Source diff matches
the verified E0 implementation and accepted Safe Staged Seal; no product changes
since E0. Credits modification intact. No surviving test runner was found.
Reconciled actual receipts: `e1-integration-final` PASS both browsers (including
native ASSIST/FOLLOW/SPREAD/HOLD, chapter/actor resources, full campaign completion,
and fresh-world Endless smoke); Firefox final M2 retry PASS. Edge combat PASS before
the test-only key-hold robustness edit. The interrupted `e1-combat-final` has only
three screenshots, no terminal JSON/log: it is **incomplete, not PASS**. Modified
combat helper holds actual selection keys until a simulation frame processes them,
preserving every assertion/controller rule. One fresh bounded retry will validate
it; any persistent environmental failure will be reported, not retried indefinitely.
E1 core results remain valid; E2/E3 not begun. Next: finish this check, record E1 gate,
then performance/normal-lighting coverage and final indexed handoff.

## E1 verified checkpoint after recovery

Source remains exactly E0 hashes; accepted commit/architecture untouched. Fresh
bounded `e1-combat-resumed` PASS Firefox170.804s /Edge100.046s with modified native
key-hold helper. No further retry needed. Interrupted partial captures preserved.
Final `e1-integration-final` PASS133.967s /55.548s: carried HP/ammo/resources and
chapter stats, actual ASSIST/FOLLOW/SPREAD/HOLD inputs, cleared old partition paths,
native east evacuation with squad, turret state, campaign completion and fresh-world
Endless wave. Fixture uses accelerated chapter/containment boundary helpers; full
unaccelerated defence is independently verified by E0 live suite.

Permanent enclosure/all6 door mechanisms, native playthrough/sprint/shooting/pursuit,
facility/cover regression and exact containment/death/Continue suite PASS both
browsers in `e1-core` (exclude its obsolete new-integration failure rows).
M2 PASS Firefox247.083s (`e1-firefox-final`), Edge230.732s (`e1-verified`); all original
position/route/migration assertions retained. Seeded placement/archive parity PASS
Firefox379.500s /Edge129.042s; pure progression-state PASS both. No product-side fix
was needed for the documented test setup/bootstrap issues.

Count qualification: canonical route/cold resume has327 records; deliberate M1
in-memory restore retains one extra disabled duplicate ship-hull history record,
identical in accepted b9e446c and current source (every physical bound compared in
`restore-solids-probe.json`). No extra facility geometry or hidden partition collider.
This pre-existing bookkeeping observation is not silently relabelled as a new solid.

E1 PASSED. Next E2: first/warm scene measurements, live defence/transfer profiling,
normal-lighting player-eye captures including near/far facade and turret engagement,
permanent lighting/transition/traversal checks. E3 remains pending. No staging/commit.

E2 helper implemented in `tests/facility-e2.mjs`: first20/warm64-frame quiet regional
samples; native W/E room traversal; true near/far player-eye facade captures; real
turret beam/drone event; full unaccelerated defence/transfer and native east exit.
No debug fill/cover camera in this helper. No new product edits. Validation pending.
First E2 candidate recorded nine quiet regions/browser with zero warm links or
geometry/material creation, then missed acquisition: native walk's .85m arrival
tolerance could stop just outside the4.2m interaction radius at the chosen4m target.
Moved only the test's destination to3.3m inside that radius; no product interaction
range/physics change. Candidate measurements/captures retained, full retry pending.

## E2 verified checkpoint

Product still matches E0 hashes. `e2-gameplay-verified`: PASS Firefox220.175s /
Edge212.923s,22 normal player-eye captures and16 measured regions/browser. Actual
W/E legs cover approach/entry/Hall/Vault/Decon/Research/Security/Containment,
live turret shot, full unaccelerated90s defence,3.5s transfer, M4 north seal and
native east Power/emergency evacuation. Regional setup relocations and quiet
prewarm windows are explicitly separated from native/live sections.

1280x720 current-source results (`e2-metrics-summary.json`): quiet warm regional
p95 Firefox16.7–50ms /Edge16.8–33.4ms; live/transfer/evacuation p95 Firefox33.3ms /
Edge16.8–16.9ms. Warm/live worst66.7ms /33.5ms (Edge live worst17.3ms). First20-frame
far-facade window includes150ms Firefox /66.7ms Edge; no links or generation counters
there. All16 regions retain34 resident programs for this path, zero shader links
in quiet or live samples, and zero world/facility/nav rebuilds. Quiet creation/
disposal counters zero; live enemy/death/pickup/M4 contact allocations/disposals
are measured and not labelled allocation-free. No FPS-equivalence claim, no new
comparative certification from noisy headless data; no proven new regression.

Permanent transition/prewarming, real-W traversal/Campaign-Endless combat/restart,
and persistent-facade suites all PASS both browsers (`e2-regression`);32 fixtures,
eight slots, exposure.78 and fog40–280 retained. Added live slot-eligibility check
PASS20.415s Firefox /8.704s Edge: Research source remains powered but is excluded
behind sealed north door and west wall; selected inside Research; Containment
sources selected south of seal. This is source eligibility, not per-pixel shadows.

Actual player-eye firing/closed-portal/retained-glass/near-far facade/east-evacuation
PNGs were visually inspected; no debug fill or performance overlay in final shots.
No obvious new wall/door spill observed in these views; accepted unshadowed-light
limitations remain. E2 passed. E3 indexing/documentation/final checks remain.

## E3 verified handoff

Created `INDEX.html`, `README.md`,14 comparison/timeline sheets under `review`,
`validation-summary.json` (32 explicitly selected successful executions,16 suite
types in both browser batches) and `e2-metrics-summary.json`. All selected product
hashes match the verified E0/frozen source. Distinct CP3-E milestone section records
root causes/corrections, actual HP/cadence data, approved recovery/rally exceptions,
preserved counts, measurements, interrupted/failed attempt provenance and manual
acceptance criteria. Updated current header to accepted b9e446c baseline /CP3-E RC.

Changed scope: HTML/facility; native-input/checkpoint-wait/live-test instrumentation
in combat-squad/m2-progression/sample-lockdown-live; four new E tests; milestone,
this ledger and fresh CP3-E evidence/helpers only. Credits/older work preserved.
No new functional implementation since E0. Final check PASS (`final-checks.json`):
HTML module,16 JS/test/helper files,122 linked targets,32 selected successful suite
executions matching product hashes, original Credits bytes, no conflict markers,
clean `git diff --check`, branch/HEAD unchanged and empty index.

No known new functional blocker or incomplete implementation remains. E0/E1/E2/E3
complete. Qualify approved legacy ingress, safety wait after animation, accepted
ship-hull history and current-only/noisy timing as documented. Earlier failure/
interruption notes remain historical; they do not override verified checkpoint receipts.

## CP3-E acceptance and commit (2026-10-16)

User accepted CP3-E from the completed E0–E3 validation report and the user's own
review, **with one known visual qualification**: some facility interior models show
visible Z-fighting after the CP3 interior overhaul. It is accepted as a non-blocking
visual defect, is **not** fixed in CP3-E, and is deferred to CP4-A/CP4-B. CP3-E is
not described as visually defect-free and no unreported user testing is claimed.
Safe Staged Seal/legacy recovery and turret corrections retained; existing E0–E3
evidence preserved; no further CP3-E implementation changes requested.

Deferred work recorded in the milestone: **CP4-A** inspect facility interior for
visible Z-fighting (affected models/geometry/overlapping surfaces); **CP4-B** apply
targeted geometry corrections without redesigning accepted interiors, affecting
functional collision, or globally changing material depth settings. CP4 not started.

Authorized scope: one local commit `feat: finalize milestone 4.2 CP3-E facility
integration` of reviewed CP3-E product/tests/docs/evidence. No push/merge/rebase/
branch/CP4. `Credits.txt` and unrelated untracked work remain preserved and unstaged.
