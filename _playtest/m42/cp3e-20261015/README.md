# CP3-E — Milestone4.2 release-candidate handoff

**E0/E1/E2 verified; release candidate ready for manual acceptance.**
Start with [INDEX.html](INDEX.html). Also see [the32-pass joined receipt](validation-summary.json),
[scene measurements](e2-metrics-summary.json), [milestone record](../../../MILESTONE-4.2-ENVIRONMENT.md)
and [recovery ledger](../../../CP3-E-PROGRESS.md). No staging/commit/push authorized.

## Doorway result

Actual opening is **lab_security `(360,735)`**, Research/Security→Containment, not
front `(360,618)`. Baseline panels existed but M4 explicitly force-opened them.
Now the original panels close/lock before normal M4 starts and remain sealed;
east Containment→Power→emergency remains the evacuation route. No wall/seventh door.

**User-approved Safe Staged Seal:** complete90-second defence and3.5-second transfer,
then wait only if the party/threshold is not clear or panels still closing. The
animation timer does not reset/extend. HUD explains any rally/closure interlock.
**Legacy exception:** older M4 northern actors restore in place with one-time
recovery passage; real ingress clears the party, then it permanently reseals.
No teleport or resource/stat reset. This temporary legacy opening is intentional.

## Turret result

Original hitscan damage worked during emergency; activation before emergency did
not fire even with a valid clear target. Only the box head rotated, not the barrel;
there was impact/sound but no muzzle-to-hit trace. No hostile was established by the
manual screenshot alone, so valid idle is also part of its explanation.

Activated turret now uses common yaw/pitch/barrel aim and real3D obstruction checks,
without emergency-only gating. Raw22/.72s/42m horizontal range and existing marked-
target boost retained. Confirmed-shot straight pooled beam/muzzle/hit effects produce
no independent projectile damage. Controlled real E activation shows
**1000→978→948.3→918.6HP**, approximately.733s fixed-tick intervals; later29.7HP damage
is the pre-existing mark multiplier. Friends, walls, range, no-target idle, cooldown
restoration and M3/M4/Continue all tested. Real drone-defence shot is pictured too.

## Acceptance evidence

| Subject | Firefox | Edge |
|---|---|---|
| Matched portal before/closed | [sheet](review/01-portal-firefox.png) | [sheet](review/01-portal-edge.png) |
| Controlled HP proof +actual live turret shot | [sheet](review/02-turret-firefox.png) | [sheet](review/02-turret-edge.png) |
| Hall/Vault/Decon/Research-Security | [sheet](review/03-rooms-firefox.png) | [sheet](review/03-rooms-edge.png) |
| Complete containment lifecycle | [sheet](review/04-containment-firefox.png) | [sheet](review/04-containment-edge.png) |
| North seal /Power /east exit | [sheet](review/05-evacuation-firefox.png) | [sheet](review/05-evacuation-edge.png) |
| True player-eye near/far/approach | [sheet](review/06-exterior-player-eye-firefox.png) | [sheet](review/06-exterior-player-eye-edge.png) |
| Fixed frame /actor near-far-inside | [sheet](review/07-exterior-fixed-frame-firefox.png) | [sheet](review/07-exterior-fixed-frame-edge.png) |

Index lists every full-resolution player-eye PNG. **22 photos/16 measured regions
per browser**; E2 uses normal actual camera, exposure.78/fog40–280, no debug fill or
performance overlay. Setup relocations are explicit; native W/E room/entry/evacuation
legs and full unaccelerated defence/transfer are distinct from controlled E0 fixtures
and accelerated integration checkpoint boundaries. Sheets are image compositions
only, not gameplay overlays or mock-ups. Selected final evidence was visually inspected.

## Integration /performance results

**32 selected suite executions PASS** (16 types in both browser batches; pure
progression-state is Node). E0, full live turret-enabled operation, all6 door cycles,
walking/sprint/FOLLOW/pursuit, ASSIST/SPREAD/HOLD, M1→M2/M2 route/M3→M4/completion,
HP/ammo/resources/chapter-stat carry, death/actual Continue/legacy migration,
placement/archive parity, combat/persistence, Endless smoke/restart, shader prewarm,
lighting persistence and actual closed-door/wall slot selection are covered.
All selected receipts match current product hashes. Logs/elapsed figures in index;
old failures/interruption are retained and never relabelled PASS.

**Preserved baseline:** canonical327 records /28 minimap segments /six doors,
90s drone defence /3.5s transfer, both permanent enclosures,32 exterior luminaires /
eight rendered budget slots. No architecture/decorative expansion.

1280×720 current-source measurements:

| Metric | Firefox | Edge |
|---|---:|---:|
| Quiet warm regional p95 |16.7–50ms|16.8–33.4ms|
| Live/transfer/evacuation p95 |33.3ms|16.8–16.9ms|
| Quiet/live worst |66.7/66.7ms|33.5/17.3ms|
| First20-frame far-facade worst |150ms|66.7ms|
| Resident programs on this path |34|34|

Quiet warm links/geometry-material churn/world-nav rebuilds0. Live windows also
have0 shader links/world-nav rebuilds, but normal actor/effect/drop/contact lifetime
allocations/disposals are recorded. No claim of allocation-free combat. First-visit
spikes retained separately, with no link/generation counters there. These observations
do **not** certify FPS equivalence or end-user-device performance; no paired timing
comparison was made. Program count depends on priming/path and is not compared to
older differently primed tours.

## Qualifications /provenance

- Approved legacy portal recovery can be open temporarily; normal new M4 is sealed.
- Rally/closure can add safety waiting after the3.5s animation, without changing timers.
- Explicit in-memory M1 restoration has a pre-existing disabled duplicate ship-hull
  history record (global328); canonical/cold resume327. Accepted/current data are
  identical in [the read-only probe](restore-solids-probe.json). No facility solid added.
- Source eligibility excludes powered Research light through the sealed portal/west
  wall and selects it inside; this is not per-pixel shadowing. Static facade pools
  do not dynamically light moving actors. No obvious new spill seen in final views.
- Earlier bootstrap/input/checkpoint/radius test setup failures are historical and
  bounded retries passed. Interrupted `e1-combat-final` has only partial screenshots,
  not a completed receipt; `e1-combat-resumed` is the actual successful replacement.
- Actual application runtime still depends on its existing external CDNs; tests
  require local Playwright and Firefox/Edge. Helpers reference this workspace/Windows
  provisioning. Everything in this new evidence directory is local/uncommitted.
- Accepted source copies and private baseline pages are diagnostic, not alternate
  product versions. Older CP3-D/R2 evidence and unrelated work were not overwritten.

## Files /Git /manual gate

Product: `chargefront.html`, `src/world/facility.js`. Updated tests: combat-squad,
m2-progression, sample-lockdown-live. New tests: facility-e0, facility-e-integration,
facility-e2, facility-light-eligibility-e. Docs: milestone and CP3-E ledger; this fresh
evidence directory. All paths are relative to repository root unless linked.

HTML SHA256 `4ed81746f846744f4f70b8706df0794fac3117a465eeba1c5d993aab5b531be3`;
facility `7cbf00aa9691aa2a0c361f58a7f112ab6c3f84b08a6f14338b953662f234996b`.
Branch `milestone-4.2`, accepted HEAD `b9e446c`, index empty; Credits/unrelated files
preserved. Review portal/legacy passage, firing readability, glass/transfer, normal
lighting and on-device smoothness manually. **No known new functional blocker;
manual acceptance pending. No stage, commit, merge, push or Milestone4.3.**
