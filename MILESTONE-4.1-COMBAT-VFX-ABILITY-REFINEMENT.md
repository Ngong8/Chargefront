# Milestone 4.1 — final combat, VFX and ability refinement

## Result, scope and audit

**COMPLETE — implementation, focused acceptance and required regressions pass.**
Branch `milestone-4.1`, accepted baseline
`566b63cddfdd33dadb4f58aded1e9f1ca00648a1`. User-confirmed working A* and reload
continuity are preserved; `src/relay-routing.js`, `src/fps-reload.js` and facility
geometry/AI steering are unchanged. No Milestone 4.2 work.

Audited README, relevant 4.0/4.1 reports, routing/rendering, four weapon models,
projectiles/impacts/pools, ability ownership, deployment, durable saves and tests.
No workspace `AGENTS.md` was found. Existing `Credits.txt` modification and initial
m38/m39/m40 untracked artifacts remain untouched/excluded.

The user clarified that ROOK must retain **Z**, not weapon-slot **2**. Existing
**F / Z / X / Y**, weapon 1/2 and squad command 4/5/6 bindings are retained.
No additional reference media was supplied; reproducible before/after captures
and diagnostic receipts supplement the user's reported symptoms.

Baseline Node combat/progression/routing suites and Firefox ARC/four-configuration
Endless suites passed before runtime edits. Pre-edit Edge and Firefox visual
diagnostics measured real material pixels, pooled bounds and projectile flight.

## Route cadence and thickness

- Normal moving-player A* cadence: **1 → 3 simulation seconds**, only after actual
  Commander displacement. The old valid path remains between solves; display
  origin/prefix trimming and geometry uploads remain bounded at **10 Hz**.
- Terrain, .65 m collision clearance, world limits, authored safer preferences,
  deterministic search and stable valid-suffix preference are preserved.
- Objective/reward availability, teleport/restore, destination changes and invalid
  path attachment bypass the timer. Collision footprint enable/disable, locks and
  actual XY-layout changes invalidate caches immediately; only layout changes
  invalidate the shared physical collision buckets, not ordinary movement.
- Reachable close corners trim the visible prefix without a saved counter. Arrival
  still uses the authoritative **`<7 m` activation area** and saved arrival latch.
- Replaced unreliable native one-pixel lines with one prepared cyan ground ribbon:
  terrain-sampled vertices, .12 m elevation, small bevel/diamond joins, depth test,
  fixed dynamic buffer and one cached material. Apparent width targets **1.8 px**;
  measured representative projected cross-sections are approximately **1.83–1.85 px**.
  Minimap thickness is **3 → 5 px** (1.67×), with original color/markers/compass.
- Transparent double-sided ribbons explicitly use **single-pass rendering** to
  avoid unnecessary side-specific shader variants and duplicate opacity passes.

Both browsers measured four ordinary solves over twelve seconds at ticks
**179,359,539,719**. Native Hall/door/relay walks, bypass/rejoin/reversal, stationary
no-work, blocked/invalid-origin/layout/destination exceptions, restore and retirement
pass. No obsolete waypoint index is consulted or introduced.

## ARC magazine pulse: confirmed cause and correction

The installed display's stored opacity/scale were already constant. However, its
**.72-opacity, non-depth-writing cyan window** blended lighting-sensitive backing
and overlapping effects into the displayed color. A controlled local-light probe
measured up to **58 RGB levels** of change in both browsers despite unchanged
magazine state. The raised zigzag also used a different cyan from the window.

Window and zigzag now use opaque, unlit, non-tone-mapped, non-fogged **flat cyan**
display surfaces. Geometry, pivots, grip and continuous cartridge motion remain.
The same local-light test measures **0 RGB change** afterward. Idle/fire/reload/
seating checks verify opacity 1 and scale 1 (floating-point attachment tolerance).
Only the **front channel** retains its independent pulse and accepted reload
power-down/up sequence. No global lighting or weapon handling redesign.

## Lightning visibility and contact positions

Confirmed problems:

1. Pooled `Line` vertex positions changed while the cached bounding sphere stayed
   at a previous shot. Before probes found bounds displaced several metres
   (approximately 10 m in an Edge case), allowing incorrect frustum rejection.
2. Native thin-line rasterization produced poor oblique/distant readability.
3. Muzzle presentation used an approximate mount-space offset rather than the
   actual emitter. Predicted endpoints stepped past surfaces and checked enemies
   before intervening walls; logical solid/ground impacts also used step-end
   positions. Vertical roof crossings were not correctly represented by the old
   footprint-entry-height test.

Correction: forty existing pool entries now own small, preallocated **camera-facing
electrical ribbons** (`src/presentation-ribbons.js`). Camera-space projection chooses
the transverse direction; a camera-right/diamond fallback supplies nonzero area
for head-on degeneracy. Near-plane clipping, double-sided depth-tested single-pass
surfaces, finite vertices and bounded screen width remain stable through rotation.
Bounded pool meshes bypass stale bounding-sphere culling. No geometry/material is
created at each shot or contact. Lifetimes remain **.14 s** for shot/chain/contact
electricity and the existing **.32 s** for grenade-blast arcs, not a permanent beam.

The source reads the actual ARC emitter world transform. Presentation prediction
and ARC collision now share first-contact terrain/3D-solid/enemy authorization:
terrain sampling/refinement and slab intersections stop at the actual surface,
including roofs, and reject enemies behind a nearer wall. Ray-transverse jitter
is bounded and primary jitter is checked against nearby obstructions. Existing
range, 85 m/s projectile travel, damage, chain strength/radius/count and stun remain.
Other weapons' projectile/explosion implementation is unchanged.

## Impact timing: flight versus delay

Before probes already showed impact activation in the same collision update.
The primary full-length lightning flash lasts .14 s, while its hidden authoritative
projectile can take about .7 s to reach distant ground. That is genuine flight,
not a queued effect. Imprecise step-end positions could additionally put an impact
behind/inside a wall and make its appearance misleading.

The traveling projectile remains authoritative. At contact, the surface-positioned
impact and three brief electrical fringes activate immediately; sound remains in
that same contact branch. No early trigger-time contact damage/effect or delayed
callback is added. Diagnostic-only bounded traces record accepted fire, creation,
collision, VFX activation and the impact's first render submission.

| Native representative case | Flight (s) | Collision → activation | First eligible render |
|---|---:|---:|---:|
| Nearby flat ground | .067 | 0–1 ms | next frame |
| Distant flat ground (~60 m) | .700 | 0–1 ms | next frame |
| Shallow ground (~35 m) | .417 | 0–1 ms | next frame |
| Strafing/turning shot | .233 | 0–1 ms | next frame |
| Wall | .133 | 0–1 ms | next frame |
| Upward roof hit | .033 | 0–1 ms | next frame |
| Enemy | .150 | 0–1 ms | next frame |
| Uneven ridge slope | .233 | 0–1 ms | next frame |

Receipts include precise per-browser clocks and frame IDs. Terminal-shot tests
verify one collision activation and no leftover impact after expiry/cleanup.
Rendered contact captures accompany submission timing; a draw callback alone is
not treated as proof of unobstructed visible pixels.

## PX-4 capacity and balance

Canonical loaded capacity **10 → 15** for player and selected squad PX-4s. Fresh
loads/refills/HUD use 15; one completed reload still consumes one shared cartridge.
Damage **74**, cadence **.8 s**, speed **85 m/s**, range **110 m**, spread **.018**,
splash **6.5 m**, reload **2.2 s**, crafting price and all reserve grants are unchanged.

Controlled real collision/explosion runs at 20 m give identical old/new shot counts:
Skitter **1**, Shielded **4**, Brute **5**, Carrier **6**; last-shot times
**0 / 2.4 / 3.2 / 4.0 s**, plus unchanged flight. This supports the requested 15-shot
candidate without changing per-shot power or within-magazine TTK.

Raw direct magazine payload rises **740 → 1110**, approximately BUL-117's 1100
(ARC 1344 before chaining; CRW 2080 if all pellets connect). Reserve efficiency does
increase; it is not claimed unchanged. Sustained single-target output mainly gains
fewer 2.2 s reload interruptions, while PX retains its slow splash role. Long-form
horde/splash balance remains a manual acceptance item; no arbitrary damage cut.

Older loaded ten-round records remain ten rounds with a current capacity of 15;
no free five rounds on Continue. Saved old `magSize:10` cannot override the new PX
definition. Invalid oversized saved magazines clamp to 15. Rifle magazine upgrades
and other existing durable weapon stats remain supported.

## Universal abilities and save ownership

One frozen four-ability catalog and **one owner-parameterized dispatcher** serve
Commander and squad. Endless configuration owns selected identities; actor fields
own independent cooldowns/protection timers. Campaign retains Surge/Bulwark/Medic/
Designator defaults and existing Commander-to-squad coordination behavior.

| Ability | Preserved effect / owner-relative behavior |
|---|---|
| Surge Pulse | +35 nearby friendly shield within 16 m; 32 damage / 1.6 s disruption within 11 m; 22 s cooldown |
| Bulwark | Activating owner's 9 s protection, .45 incoming-damage multiplier; 28 s cooldown; Commander uses the same protection rule |
| Medic Pulse | Living friendly +32 HP / +18 shield within 20 m, capped at maxima; 24 s cooldown when useful |
| Target Designator | Valid target within 65 m / LOS, 10 s mark and existing 1.35 damage benefit; 18 s cooldown; Commander uses current aim, squads use acquisition/threat context |

Dead/downed owners cannot cast; dead/downed recipients are not revived by healing.
Manual duplicate casts retain individual cooldowns. Shields/heals cap at maxima,
Bulwark is a fixed owner-local multiplier/timer and designation does not stack
multiplicatively. Autonomous squad Surge uses existing throttling/coordination;
urgent Medic prioritization remains ahead of other abilities.

All four native dropdowns contain all four options, preserving four cards, weapon
selectors, posture, controls, responsive dimensions and Glitch Slap. Vitals reads
the selected ability, readiness and cooldown; Commander remains F and squad Z/X/Y.
No HUD/inventory-only implementation or duplicate ability timer machine.

Existing `cf_endless_v1` version 1 and Campaign namespaces remain. All four choices
and actor cooldown/Bulwark state serialize. Missing legacy choices fall back to
Surge / Bulwark / Medic / Designator; invalid IDs remain rejected. Configuration
identity is authoritative on Endless restore, preventing stale actor identities
from replacing selected choices. Browser reload, native Continue, restart, Game
Over/fresh deployment and Campaign isolation pass.

## Validation, evidence and limitations

**22 suites per browser PASS (44 combinations), plus four Node suites.**
All nineteen accepted browser regressions passed in Edge/Chromium and Firefox:
intro, M2, campaign runtime, traversal, facility regression/playthrough, transitions,
corrective, HUD/navigation/objectives, ARC, Screecher, Runner/Tunneler, sprint,
combat/squad, guided combat, Endless and additional refinement. Updated route/reload
acceptance and new combat-VFX/universal-ability suites also pass in both browsers.
Focused Firefox ability/VFX acceptance additionally passes **headed**.

| Operator / native key | Surge | Bulwark | Medic | Designator |
|---|---|---|---|---|
| Commander / F | PASS | PASS | PASS | PASS |
| ROOK / Z | PASS | PASS | PASS | PASS |
| VEX / X | PASS | PASS | PASS | PASS |
| KADE / Y | PASS | PASS | PASS | PASS |

Each combination verifies selection, gameplay effect/source, cooldown/HUD, invalid
owner guarding and persistence. Duplicate/simultaneous casts of all four abilities
pass. Four simultaneous Surges produce exactly **128 damage** and capped shields;
multiple Designators retain one **1.35×** benefit. Invalid Commander aim does not
fall back to AI selection.

VFX: **45 actual rendered-pixel angle/FOV/viewport cases per browser**, including
steep up/down and near/far shots; 60/75/100° at 1280×720, 1780×832, 1920×1080.
Head-on fallback, visible contact faces, obstruction authorization, chain damage,
magazine invariance and front-channel power are separately checked. Accepted four-
weapon reload continuity is rechecked with **36 combinations / 241 sequential
poses each per browser**, plus native moving/paused reloads.

Focused prepared route/fire/contact/reload/rotation probes show **zero new materials,
geometries or shader links**. Vertex buffers/pool objects are reused; preparation
readiness is explicit in diagnostics. Existing enemy/world first-use resources and
bounded effect drops at pool saturation remain. Existing Firefox/traversal gates
pass; short traces do not certify multi-hour soak.

Final review additionally verifies that the normal render callback refreshes
camera-facing vertex versions during live rotation, without a diagnostic render
call. Snapshot serialization performs no ribbon mutation. VFX/ARC suites passed
again in both browsers after this render-hook correction.

Local ignored evidence under `_playtest/m41/regressions/`:

- `combat-vfx-before/`: Edge/Firefox diagnostic receipts and old ARC captures;
  lighting delta 58 and stale pooled bounds.
- `combat-vfx-focused/`: both-browser 16-case matrix, VFX/contact/PX and route
  receipts, UI/HUD, angle, contact and reload PNGs.
- `combat-vfx-regressions/`: all accepted regression logs and full reload results.
- `combat-vfx-final/`: final route/reload and headed Firefox ability/VFX evidence,
  full recorded inspection session.
- `combat-vfx-video/`: headed native-LMB recording (12 real shots).
- `combat-vfx-video-clean/arc-live-firefox.webm`: clean **8 s** fixed-viewport
  Firefox excerpt (9 real shots in the final recorded burst run), with changing aim and
  natural projectile/contact timing. Full recordings and sampled frames remain
  local. The headless version avoids the OS-scaled browser notification/crop in
  the headed capture; gameplay and renderer probes also pass headed.

Rendered before/after images, reload stages and recording frames were inspected.
These are controlled browser fixtures, not an unassisted survival run or subjective
human VFX/animation certification. One long regression batch reached its terminal
budget after passing fourteen suites; its final suite was completed separately.
Fixture corrections use the production document reload/Continue path to avoid
stacking old terrain, and inject legacy records from the menu after beforeunload
saving. No product semantics were altered to make probes pass.

Remaining manual limits: normal-profile subjective brightness/audio feel, complete
horde/splash balance, multi-hour soak and rare hardware/hosting combinations. The
existing conservative 4 m grid fallback and low-poly hand geometry remain. No
critical automated acceptance defect remains open.

## Files and reproduction

Runtime: `chargefront.html`, `src/combat.js`, `src/progression.js`, new
`src/presentation-ribbons.js`. Tests: `tests/arc-presentation.mjs`,
`tests/combat-state.mjs`, `tests/route-reload-refinement.mjs`,
`tests/m40-regressions.mjs`, new `tests/combat-vfx-diagnose.mjs`,
`tests/combat-vfx-refinement.mjs`, `tests/universal-abilities.mjs`.
Docs: `README.md`, this report.

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
$env:CF_ARTIFACT_DIR='_playtest/m41/regressions/combat-vfx-review'
node tests/combat-state.mjs
node tests/progression-state.mjs
node tests/relay-routing-state.mjs
node tests/objective-hud-state.mjs
node tests/m40-regressions.mjs --final-refinement firefox --suites=route-reload-refinement,combat-vfx-refinement,universal-abilities
node tests/m40-regressions.mjs --final-refinement edge --suites=route-reload-refinement,combat-vfx-refinement,universal-abilities
node tests/combat-vfx-diagnose.mjs firefox
node tests/combat-vfx-refinement.mjs firefox --headed --video --record-only
```

Use existing `--suites=a,b` bounded batches for the full runner. One consolidated
commit only after review/acceptance; no intermediate commits, amend, push or merge.
Prior user modifications and generated media are excluded.
