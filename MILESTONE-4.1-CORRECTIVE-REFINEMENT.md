# Milestone 4.1 — corrective refinement

## Result and audit

**COMPLETE — targeted implementation and browser acceptance checks pass.**
Baseline `d03b045`, active branch `milestone-4.1`. Read README, the accepted 3.9,
4.0 and 4.1 reports, relevant recent/history changes, gameplay implementations and
existing browser/state harnesses. No applicable `AGENTS.md` was present.

Initial user work, preserved and excluded from the task commit:

- Modified `Credits.txt`.
- Untracked `_playtest/m38-1-correction-screenshots.zip`, `_playtest/m38-1/`,
  `_playtest/m38-exterior/`, `_playtest/m38-interior-before/`,
  `_playtest/m38-interior-emergency/`, `_playtest/m38-interior/`,
  `_playtest/m3_8-1-related-screenshots.zip`,
  `_playtest/m3_8-related-enhancement-screenshots.zip`.
- Untracked `_playtest/m39/traversal-{edge,firefox}-{before,after}.json` and
  `_playtest/m40/regressions/traversal-{edge,firefox}-after.json`.

The history diff into `0b9fa87` shows the removed `RES <count>` squad label and
`CRAFTING` subheader. Those original formats/colors were restored in the existing
canvas HUD. There is no second ammo cache or alternate crafting implementation.

The stronger yellow Runner silhouette is **`tunneler`**, established by the shared
Runner template, gold palette/drill details and authored stats (150 HP/12 m/s,
versus regular Runner 34 HP/16.5 m/s). Its previous attack was melee. Existing
appearance, health, movement tuning and pre-commit burrowing approach are retained.

## Gameplay design

### Sprint/fire arbitration

`movePlayer()` resolves action priority once in the existing fixed simulation
tick, before `updateWeapon()` emits shots:

- New forward-sprint press wins simultaneous input and interrupts sustained fire.
- A subsequent fire press during sprint cancels sprint first. `sprintFireBlocked`
  keeps a held Shift from immediately re-entering sprint; releasing it rearms it.
- `firePending` retains that initiating click until normal reload/switch/global
  shot-cooldown gates allow it. The accepted shot clears the pending request.
- Both normal update dispatch and `fireWeapon()` independently reject sprint-state
  firing. Ordinary held fire works again after normal sprint release.
- Fresh run and pause/resume clear transient input; pause-menu clicks cannot
  become shots on resume/restart. The existing 25-stamina exhaustion hysteresis
  and both weapon records remain authoritative. Existing projectiles continue.

No competing DOM fire handler, separate state machine, weapon cadence changes or
damage-delay animation gate was added.

### Committed Runner detonation

`RUNNER_ATTACKS` centralizes both blast profiles:

| Internal variant | Arm radius | Fuse | Blast radius | Blast damage |
|---|---:|---:|---:|---:|
| `runner` | 3.6 m | 2.0 s | 4.8 m | 26 |
| `tunneler` | 3.6 m | 2.0 s | 5.76 m | 32.5 |

At valid victim range with LOS, before movement/separation, each actor snapshots
its position and commits. Subsequent updates bypass chase, navigation, separation,
scatter, stun repositioning and tunneler specials. The fuse remains committed if
the victim leaves. The existing threat ring plus a blended crouched/arming tilt
provides presentation without new assets or effect pools.

Seven per-actor beep deadlines are **0, .48, .88, 1.22, 1.50, 1.72, 1.88 s**.
Successive intervals are .48/.40/.34/.28/.22/.16 s. The synthesized sound was
shortened to remain distinct at the final interval. A beep index and fuse use
simulation time; there are no asynchronous timer callbacks to outlive death or
cleanup. Pausing freezes the sequence. Render FPS does not set its timing.

After the last beep, the existing idempotent detonation applies one
`radiateFriendlyBlast()` using existing distance, terrain/solid LOS and friendly
recipient filtering, then enters normal death/cleanup. Neither variant performs
melee damage. Killing or destroying an actor cancels future beeps/detonation;
already-played finite audio tails can finish naturally.

### Procedural pose boundaries

- Preserve existing player movement/bob/sprint/ADS/recoil layers. Replace the
  binary sprint gait multiplier with the already-smoothed sprint blend and prevent
  sprint from also requesting ADS. Recoil/projectile response is unchanged.
- Infested gait weight follows **actual resolved displacement**, then blends at
  `1-exp(-10*dt)`. Moving-to-idle/arming no longer zeroes all leg rotations.
- Attacks set a responsive visual envelope; root tilt follows it rather than
  snapping to -0.35 and being reset by the locomotion branch. Damage/projectiles
  still happen in the same accepted attack tick. Arming/stun/locomotion share one
  final visual tilt writer.
- ROOK/VEX/KADE use their existing procedural legs/gun. Evasion and ordinary
  locomotion share `updatePose()`, with speed-based gait blending and
  delta-time-aware weapon-ready/idle interpolation. Downed tilt uses the same
  time-aware approach.

Authoritative actor positions, steering, arrival easing, heading ownership,
collision, wall-slide detection and navigation are not interpolated or rewritten.

## HUD and shared menus

- **Vitals:** live `member.reserve` supplies `RES n` between each operator's name
  and command/status. Reload completion and T resupply immediately feed the same
  display. All bars, Commander Surge and squad ability/cooldown rows remain.
- **Combat:** `CRAFTING` sits below supplies/resources and above the original
  C/V/B shortcuts. Compact row spacing preserves the **264×262** frame.
- Vitals stays **264×296**. At all requested desktop sizes both panels retain
  their 16 px left edge, separate top/bottom placement and intact corner frames.
  Below 610 px height they use adjacent, full-size panels on the left side rather
  than overlapping or shrinking readable text; checked at 1280×540.
- **Objective compass:** the existing `targetOfPhase()` supplies authoritative
  mission anchors. `atan2(sin(angle),cos(angle))` normalizes relative bearing;
  positive world-space bearing maps left for the Z-up camera. The ±60-degree
  strip scale clamps outside its bounds and accounts for measured label width.
  Exponential tick smoothing reduces jitter. Crossing the rear seam changes edges
  directly rather than sweeping through an incorrect centered/ahead position.
  Behind objectives display left/right arrows plus metres. Mission/phase/anchor
  changes reset the presentation to the new objective. Cardinal signs were aligned
  with the same camera-right convention.
- **Fullscreen:** one shared Options button, explicit user-gesture API request,
  accurate `fullscreenchange` synchronization, windowed exit, unsupported state
  and rejected-request feedback. The engine/Three plugin remains the sizing owner;
  resize notification preserves camera aspect/canvas size. Shared panels remain
  paused through focus/lock changes and do not automatically reacquire lock.
- **Guide:** shared panel bounded to viewport minus 64 px (32 px outer margins),
  adapting to 16 px margins below 600 px. Heading and Back are fixed flex children;
  only the focusable body scrolls. Mouse wheel and Home/PageDown work; overscroll
  containment and menu event isolation stop page/gameplay forwarding. No horizontal
  overflow. Responsive columns retain readable text.
- **Font:** canonical `Glitch Slap.otf`, existing `@font-face`, explicitly inherited
  by menu body, keys, selects and new controls. Boot awaits the loaded face before
  font-dependent canvas measurements. HUD draws specify Glitch Slap every time,
  with no Arial readiness fallback; briefing measurements quote the family name.
  Tests inspect actual Canvas2D `fillText` fonts after repeated render-state resets.

The intentionally removed minimap legend stays removed; real map markers, routes,
ARC magazine cyan appearance/front channel, saves, missions and performance pools
retain their accepted implementations.

## Validation

**36 distinct suite/browser combinations pass** (18 suites × Edge/Firefox), plus
the two pure Node suites and two additional headed corrective runs:

| Suite | Chromium / Edge | Firefox |
|---|---|---|
| `intro-smoke` | PASS | PASS |
| `m2-progression` | PASS | PASS |
| `runtime-stability --campaign` | PASS | PASS |
| `traversal-performance` | PASS | PASS |
| `facility-regression` | PASS | PASS |
| `facility-playthrough` | PASS | PASS |
| `transition-diagnose` | PASS | PASS |
| `corrective-refinement` | PASS, headless + headed | PASS, headless + headed |
| `hud-refinement` | PASS | PASS |
| `hud-navigation` | PASS | PASS |
| `objective-hud-flow` | PASS | PASS |
| `arc-presentation` | PASS | PASS |
| `screecher-wings` | PASS | PASS |
| `runner-kamikaze` | PASS | PASS |
| `sprint-recovery` | PASS | PASS |
| `combat-squad` | PASS | PASS |
| `combat-playtest` | PASS | PASS |
| `endless-hud` | PASS, headed | PASS |

`combat-state.mjs` and `objective-hud-state.mjs`: PASS.

Focused corrective findings:

- Real walk/fire, fire→sprint interruption, sustained-fire suppression, one-click
  sprint cancellation during cooldown, Shift rearm and normal release fire pass
  for both Campaign slots.
- Both Runner variants: **0 m** post-commit translation, **7 native Sound.play
  calls**, one detonation, no out-of-range damage, kill-before-fuse cancellation.
  Observed fixed-tick beep times: 0/.483/.883/1.233/1.500/1.733/1.883 s. Four mixed
  Runners simultaneously complete seven beeps each. In-range shield damage is
  26 vs 32.5, with no extra damage from repeat detonation calls.
- Skitter attack still damages in its first eligible tick (9 shield damage in the
  controlled fixture); entering attack tilt is ~-.030 instead of -.35 instantly.
  Sampled attack→movement→stop tilt changes stay below .1 rad/tick. All three
  squad gait exit probes retain their leg pose and blend rather than resetting.
- Ahead/left/right/both rear-seam sides and mission-target replacement pass.
  Distance labels remain inside the compass bounds.
- Live reserve labels update from 0/1/2 to 1/0/2 through actual ammo-transfer and
  squad reload logic. CRAFTING ordering and all required viewport bounds pass.
- Main and pause Options/Guide: native fullscreen enter/exit and external API exit
  synchronization, synthetic host rejection/unsupported feedback, aspect resizing,
  internal wheel/keyboard scroll, fixed heading/Back, font and page-height checks.
  No menu clicks leak into firing; paused guide keys do not move/equip/fire.
- Quiet rendering after preparation adds **zero** materials, geometries, shader
  links or terrain/facility builds in the focused probe. Existing combat and
  traversal performance gates pass. No unexpected page/console errors.

One runner invocation exceeded the terminal's 20-minute operation budget after
16 passing Firefox suites. The remaining suites were rerun in bounded batches.
The initial Endless restart assertion used a deployment snapshot taken after a
gameplay click had spent a round; it now verifies **canonical full magazines and
zero restart shots**, preserving the real restart guarantee rather than the old
menu-input leak. Both browsers pass. After the final menu-scope/keyboard-audio
audit, intro, campaign runtime, corrective and Endless checks passed again in
both browsers. No product behavior was changed just to make fixtures pass.

### Reproduction and local evidence

The existing sequential GPU-safe runner now supports `--corrective` and optional
`--suites=a,b` for bounded batches. Pure tests are independent:

```powershell
$env:PLAYWRIGHT_PACKAGE='C:\Users\User\AppData\Local\Temp\opencode\node_modules\playwright\index.mjs'
$env:CF_ARTIFACT_DIR='_playtest/m41/regressions/corrective-review'
node tests/combat-state.mjs
node tests/objective-hud-state.mjs
node tests/m40-regressions.mjs firefox
node tests/m40-regressions.mjs edge
node tests/m40-regressions.mjs --corrective firefox --suites=corrective-refinement,hud-refinement,hud-navigation,objective-hud-flow,arc-presentation,screecher-wings,runner-kamikaze,sprint-recovery,combat-squad,combat-playtest,endless-hud
node tests/m40-regressions.mjs --corrective edge --suites=corrective-refinement,hud-refinement,hud-navigation,objective-hud-flow,arc-presentation,screecher-wings,runner-kamikaze,sprint-recovery,combat-squad,combat-playtest,endless-hud
node tests/corrective-refinement.mjs --headed
node tests/corrective-refinement.mjs firefox --headed
```

Evidence is local under the already-ignored `_playtest/m41/regressions/`; no
temporary artifacts enter the consolidated commit:

- `corrective-before/01-before.png`: pre-edit HUD capture.
- `corrective-final/hud-{1780x832,1280x720,1920x1080,1280x540}-{edge,firefox}.png`.
- `corrective-final/{main-options,pause-options,main-guide,pause-guide}-{edge,firefox}.png`.
- `corrective-final/corrective-{edge,firefox}.json`: focused observations including
  native sound counts, browser Fullscreen API/aspect receipts and canvas fonts.
- `corrective-full/`: authoritative suite logs and most initial Firefox receipts.
- `corrective-focused/`: the eleven passing Edge corrective suites.
- `corrective-remaining/combat-playtest-firefox.log`: passing remaining combat run.
- `corrective-final/`: passing final rechecks including Endless in both browsers.
- `corrective-headed/`: headed corrective captures/receipts in both browsers.

Rendered captures were inspected at the reference size and reduced-height layout,
including Firefox HUD and main/pause Guide/Options. Browser probes use real input
and rendering with controlled fixture positions/HP and accelerated mission/fuse
updates; they are not an unassisted full-duration Campaign/Endless survival run.

## Changed files and remaining acceptance limits

| Exact path | Purpose |
|---|---|
| `chargefront.html` | Targeted gameplay, procedural animation, canvas HUD, shared menu/font corrections |
| `tests/corrective-refinement.mjs` | Focused real-browser corrective acceptance and useful screenshots |
| `tests/endless-hud.mjs` | Assert fresh canonical restart magazines and no leaked menu shot |
| `tests/hud-navigation.mjs` | Accept the deliberately directional distance/behind-arrow placement |
| `tests/hud-refinement.mjs` | Add 1780×832 reference-size coverage |
| `tests/sprint-recovery.mjs` | Honor existing artifact-directory routing, preserving prior evidence |
| `tests/m40-regressions.mjs` | Reuse sequential runner for corrective suites/bounded batches |
| `README.md` | Document sprint/fire interaction, shared menu improvements and report link |
| `MILESTONE-4.1-ENDLESS-HUD.md` | Link this corrective follow-up and supersede the earlier Runner description |
| `MILESTONE-4.1-CORRECTIVE-REFINEMENT.md` | Audit, design, results, evidence and reproduction |

No failing critical checks remain. Subjective attack feel/audio listening in the
user's normal browser profile, physical ESC/fullscreen gestures across different
OS/hosting policies, and multi-hour play/soak are not certified by these automated
checks. External fullscreen exit was tested through the browser API; host
rejection/unsupported conditions were injected to exercise feedback. Existing
Campaign progression/traversal is tested with the established accelerated harness.

Commit policy: one final consolidated commit only after passing validation;
baseline/history remain intact, unrelated user work and generated artifacts are
excluded. No push, merge, reset or rebase; no Milestone 4.2 content.
