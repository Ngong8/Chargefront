# Milestone 4.1 — adaptive origin synchronization and ARC hitscan

## Result and baseline

**COMPLETE — implementation and focused/rendered/regression acceptance pass.**
Branch `milestone-4.1`; accepted baseline
`e2ccef776ca7649129190d74d59e84125f394968`. Audited README, relevant 4.1 reports,
A*/display attachment, facility floors, ray/impact/pool ownership and existing tests.
No workspace `AGENTS.md` was found. Original user footage was not available;
browser reproduction and captures are retained locally.

Unrelated `Credits.txt` modification and initial m38/m39/m40 artifacts remain
untouched/excluded. The laptop restart interrupted validation; saved runtime/test
edits survived, were re-audited, and validation resumed. No task commit existed
before final acceptance. No Milestone 4.2 work.

Baseline: four Node suites, Firefox combat-VFX/PX and route-only suites passed.
Before receipts confirm three-second solves, approximately 1.8-pixel guidance and
ARC flight of .067 s nearby / .700 s at distant ground. Existing accepted reloads,
PX-4's 15 rounds, ability catalog/strength/keys and saves are preserved.

## Root causes

- Full-path cadence was deliberately three seconds. Display attachment selected
  whole vertices and destructively trimmed the same array used as the solved path,
  instead of independently projecting the current foot position onto a safe suffix.
- The old terrain-height +.12 m guide was **below the Hall floor's .25 m top** and
  its .30–.3375 m plates/strips. Correct world coordinates could therefore produce
  an apparently disconnected/hidden line inside the facility.
- Approximately 1.8 pixels was a genuinely thin line; projected CPU-width estimates
  alone did not prove the user's requested normal-gameplay visibility.
- ARC flashed lightning immediately but created a hidden, damaging 85 m/s
  projectile. Damage/impact awaited physical travel; that was authoritative flight,
  not an impact-VFX queue. The requested hitscan design required removing that path.

## Route and connector correction

**Full A*: one simulation second while moving.** The eight-neighbour 4 m solver,
terrain checks, .65 m collision clearance, world limits, safe-corridor preferences
and stable valid-suffix preference remain. Objective/reward/destination changes,
teleport/restore, blocked attachment and layout invalidation still bypass cadence.
Stationary players do not repeatedly solve; no per-squadmate guide pathfinding.

**Independent connector: one-second authoritative refresh, with 10 Hz lightweight
visible attachment.** A solved path is retained separately from the displayed
path. `ChargefrontRelayRouting.attach()` projects the actual Commander XY onto
reachable segments, validates the connector, prefers the forward suffix at ties,
and skips obsolete vertices. It never mutates the solved array or persists a
waypoint index. A small safe diagonal avoids a lateral dogleg. If no safe attachment
exists, an immediate bounded solve runs; failure hides the guide rather than
painting an obstacle-crossing or stale segment.

The displayed path begins at the latest sampled actual foot position. All its
vertices/draw range update together, replacing the old connector rather than
leaving geometry behind. Ordinary solves and connector authority tests observe
ticks **59,119,179,239** over four seconds. Native walking/diagonal/strafe/turning/
reversal samples keep origin lag below the bounded 10 Hz movement interval.
Shortcuts, skipped points, farther rejoin, Alpha/Gamma arrival and restore pass.
Reward gating and the authoritative **`<7 m`** arrival latch are unchanged.

### Visible thickness and authored surfaces

One prepared MeshBasic material, fixed geometry/buffers and one cached shader
variant perform screen-space extrusion of the ground centerline. Width targets
**3.8 screen pixels**, independently of perspective/orientation; viewport/near
uniforms update without geometry allocation or shader relinking. Near-plane
trimming and small diamond/bevel caps retain readable joins. Depth testing and
single-pass transparency remain. Minimap stays **5 pixels**.

The facility exposes a read-only guidance-height query derived from its actual
apron/floor/plate/stripe bounds and tops, placing the guide just above those
surfaces. Outdoor elevation remains terrain +.12 m. No floor mesh, physical
height, collision or squad/enemy navigation changes are made. This makes the
Commander connection visible in the Hall as well as on outdoor terrain.

**Actual rendered-pixel difference masks at 1920×1080**, with normal world/HUD:

| Segment distance | Straight view | Oblique +.35 rad | Oblique −.35 rad |
|---|---:|---:|---:|
| 10 m | 3.84 px | 3.47 px | 3.45 px |
| 30 m | 3.34 px | 3.57–3.59 px | 3.87 px |
| 60 m | 3.89 px | 3.50 px | 3.72 px |

Firefox and Edge agree within raster rounding. The measured 3.3–3.9-pixel coverage
supersedes the prior 1.83–1.85-pixel result. Hall/native traversal captures are
also visually reviewed, not accepted from width uniforms or CPU geometry alone.

## ARC-9 authoritative hitscan

The accepted firing gate still owns ammo/cooldown/sprint/reload/switch eligibility.
ARC consumes **one round**, then synchronously resolves the normalized aiming
direction from the current camera origin. Other weapons retain their existing
camera-offset physical projectile path. Existing spread/ADS/airborne behavior,
damage multipliers/critical/mutator rules remain upstream of resolution.

**Maximum primary attack range: 72 m**, the canonical established ARC range.
There was no intended ARC distance falloff. A finite camera ray chooses the
nearest authorized contact using the accepted terrain-refinement, 3D solid-slab
and living/non-burrowing hostile hit-volume tests. A nearer terrain/structure
contact blocks an enemy. Targets whose authoritative range point lies beyond
72 m cannot receive primary damage; misses end at the bounded ray endpoint.

The actual emitter world transform supplies only the lightning origin. A nearer
solid/terrain obstruction on emitter-to-contact replaces the hit with that blocked
surface **before damage**, so camera peeking cannot send a visual beam through a
nearby wall. Gameplay damage, lightning end and contact VFX use one common resolved
point. The surface query and visual origin are distinct from the aiming origin.

One synchronous `resolveArcHitscan()` path applies primary damage, existing chains,
hit marker, lightning and contact sound/VFX. A reusable CPU resolution context
replaces physical ARC shot records. It works even when all 192 ordinary projectile
slots are occupied; effects retain their prepared bounded pools.

The old ARC movement/collision branch is removed from `updateShots()`. ARC dispatch
returns before borrowing a bolt/glow or adding to `shots`. A defense-in-depth guard
retires any explicit obsolete ARC record **without collision or damage**. There
is no invisible pending primary projectile, duplicate impact handler, timer or
saved flight state. Cleanup clears transient effects/last-hit diagnostics on
restart and mission transitions; nothing new is serialized.

### Preserved special mechanics and timing

Base damage **42**, cadence **.42 s**, magazine **32**, reload **1.9 s**, cyan color,
continuous reload hierarchy, constant flat magazine and front-channel pulse/power
remain. Existing up-to-three chain hops use **12 m**, source-range/LOS/solid checks,
damage multipliers **.72 / .60 / .48** and **.65 s** stun. Chains still apply during
resolution; .14 s electricity is presentation lifetime, not damage delay.

| Probe | Damage when firing returns | Later damage after advancing projectiles |
|---|---:|---:|
| Enemy at 8 m | 42 | 42 |
| Enemy at 60 m | 42 | 42 |
| Enemy beyond range (74 m) | 0 | 0 |
| Enemy behind camera-ray wall | 0 | 0 |
| Clear camera aim, near emitter obstruction | 0 | 0 |
| Injected obsolete ARC projectile | 0 | 0 |

Nearby/distant ground, wall, roof, enemy, shallow, strafing and uneven-slope probes
record fire/resolution/damage/contact activation in **the same simulation update
and render-frame ID**. Primary flight time is **0**, independent of distance.
Contact activation is approximately **0–1 ms** after resolution and renders by
the next eligible frame. Ribbons still use the accepted camera-facing fallback,
clipping, occlusion and normal-render-loop refresh. Same-call traces and actual
visible captures accompany assertions; no early fake VFX drives damage.

## Validation and evidence

**23 suites per browser PASS (46 combinations), plus four Node suites.** All
nineteen accepted regression suites pass in Firefox and Edge: campaign/M1–4,
transition/facility/traversal/runtime, checkpoint/Endless continuation/restart,
combat/squad/orders, abilities, sprint/fire, Runner/Tunneler, Screecher, HUD/map/
compass, ARC presentation and audio/resource lifecycle. Updated full route/reload,
combat-VFX/PX and universal-ability suites plus new route-hitscan correction pass.
Four-weapon continuity covers **36 configurations / 241 sequential poses** per
browser; universal abilities retain all **16 combinations** and duplicate casts.

Prepared route/ARC probes show **zero new materials, geometries or shader links**.
The correction performance test was repeated four times in Firefox after the
restart; all pass. An intermittent first-use shader count was investigated with
linked-source instrumentation; no recurring weapon/ribbon relink reproduces after
preparation, but its exact root cause is not established. Existing world/enemy
first-use assets remain outside these probes.

Local ignored `_playtest/m41/regressions/` evidence:

- `route-hitscan-before/`: pre-edit three-second/thin route and ARC flight receipts.
- `route-hitscan-regressions/`: all accepted browser suite logs per browser.
- `route-hitscan-final/`: full Firefox reload/ability/VFX results and Hall/Alpha/
  Gamma/ground/impact captures.
- `route-hitscan-resumed/`: Edge full focused suites and post-restart correction
  receipts; `ground-ribbon-*`, `hitscan-8`, `hitscan-60`, `wall-block`,
  `near-muzzle-block` PNGs.
- `route-hitscan-shader-check/`: repeated Firefox correction/performance receipts.
- `route-hitscan-evidence/`: final Firefox/Edge correction receipts and ground/
  impact PNGs; `combat-vfx-firefox.webm` and its JSON receipt record eight native
  ARC shots at FOV 75. Extracted `native-arc-01.png` through `native-arc-04.png`
  and `combat-vfx-firefox-review.png` provide sampled recording inspection.
  Firefox's paused screenshot initially captured a cleared WebGL surface; a
  render-only animation-frame loop corrected capture presentation, and both
  browser correction suites passed again. One headed rerun exceeded the command
  timeout; the subsequent headless Firefox run completed successfully. Original
  media was not available; reproducible fixtures supply before/after evidence.

Native traversal, visible route widths, impact frames and lightning/reload states
were visually inspected. These are controlled browser fixtures, not unassisted
full-duration survival or subjective animation-quality certification. The laptop
restart required resuming saved validation; no user files were reset or discarded.

### Limitations

The existing conservative 4 m graph can fall back to ordinary guidance in
unvalidated narrow passages. Visible connection sampling is 10 Hz (bounded small
motion lag), not expensive per-render pathfinding. Terrain contact is refined from
.5 m samples and existing authored collision footprints/hit volumes, not a full
triangle-mesh physics replacement. Screen-width raster coverage varies slightly
with antialiasing/occlusion; depth testing correctly hides obstructed parts. Effect
pool saturation can drop presentation without dropping authoritative hitscan damage.
Normal-profile feel/audio and multi-hour soak remain manual acceptance limits.
No critical automated acceptance defects remain open.

## Files and reproduction

Runtime: `chargefront.html`, `src/relay-routing.js` (attachment helper; A* unchanged),
`src/presentation-ribbons.js`, `src/world/facility.js` (read-only surface query).
Tests: `tests/relay-routing-state.mjs`, `tests/route-reload-refinement.mjs`,
`tests/arc-presentation.mjs`, `tests/combat-vfx-refinement.mjs`,
`tests/combat-vfx-diagnose.mjs`, `tests/endless-hud.mjs`,
`tests/m40-regressions.mjs`, new `tests/route-hitscan-correction.mjs`.
Docs: `README.md`, this report. Weapon/ability definitions, save schemas and
`src/fps-reload.js` are unchanged; PX-4 and universal abilities are not rebalanced.

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
$env:CF_ARTIFACT_DIR='_playtest/m41/regressions/route-hitscan-review'
node tests/combat-state.mjs
node tests/progression-state.mjs
node tests/relay-routing-state.mjs
node tests/objective-hud-state.mjs
node tests/m40-regressions.mjs --final-refinement firefox --suites=route-reload-refinement,combat-vfx-refinement,universal-abilities,route-hitscan-correction
node tests/m40-regressions.mjs --final-refinement edge --suites=route-reload-refinement,combat-vfx-refinement,universal-abilities,route-hitscan-correction
```

Use bounded `--suites=a,b` batches for accepted regressions. One final consolidated
commit only after acceptance/review; no intermediate commit, amend, push or merge.
Unrelated user modifications and generated test media are excluded.
