# CP4 follow-up — exterior prop and rear-boundary correction

> **Accepted as part of the user's completed CP4 manual visual playtest.** This
> stage's pending-review/unstaged statements describe its historical handoff.
> The final exterior refinement supersedes its327-solid and rear-shape snapshots.
> Current result and curated evidence: [accepted index](_playtest/m42/cp4-accepted/INDEX.html).

**Implemented and validated for manual review.** Branch `milestone-4.2-cp4`,
starting/current HEAD `3ad1938a90d3a432961373d3f5ea6757d1133522`.
Continued the existing unstaged CP4 work. Its five tracked modifications, new
files/evidence and the user-owned `_playtest/m42/cp4.zip` were preserved. No Git
branch operation, staging, commit, push, merge or tag was performed.

## Scope and ownership

This pass corrects the existing terrain-side route/relay prop builders and the
rear Campaign boundary. **`src/world/facility.js` and `Credits.txt` are byte-for-byte
unchanged from the follow-up starting snapshot.** Accepted facility architecture,
interior/exterior dressing, doors, lighting, mission scripts and relay mechanics
were not rewritten. Facility-owned shutter/signage and deliberate alien growth
were distinguished from detached terrain-side helper-like pieces.

New `campaign-exterior.js` is an opt-in construction-time correction registry.
Only meshes explicitly registered by the route, relay and exterior ground-state
builders are eligible. It runs once after legacy population under an isolated
RNG stream. Material references used by relay/state FX stay intact. No recursive
facility sweep, per-frame grounding, new asset family, lights or cover is added.

## Coverage inspection

The initial read-only audit recorded113 exterior objects and32 normal-lighting
viewpoints. The same32 points were revisited after correction in Edge and Firefox.
Actual poses, targets, mission/phase and exposure/fog are in each capture manifest.

| Area | Visited player coordinates (x,y) |
|---|---|
| M1 route / checkpoint / depot / roadblock | (430,205), (430,265), (420,390), (407,423) |
| Facility front approaches | (314,570), (421,583) |
| Alpha / dock / approaches | (205,550), (230,574), (219,603), (181,565), (199,637) |
| Beta platform / perimeter / route landmark | (245,716), (249,752), (274,753), (245,777), (221,747), (225,686) |
| West/south/east bypass | (285,665), (358,575), (477,577) |
| Gamma / return | (544,581), (578,558), (576,611), (604,590), (526,608) |
| M3 service, west/rear perimeter | (464,717), (306,735), (322,795), (370,798), (422,794) |
| M4 exterior debris | (438,689), (404,593) |

An elevated **normal-lighting reference camera** at(450,830,32) compares the whole
rear transition. It is labelled separately from player-eye/native evidence.
The new backyard was then walked with W through(320,810), (335,830), (370,840),
(410,840), (430,820), (410,825), (370,835), up toward(370,858), and to its bounded
north end. A separate native hostile-pursuit leg crosses the old limit at x310.

## Categories found and corrections

The audit confirmed the common Z-up transform error: assigning Euler Z after a
box's X rotation tilted its bulk rather than applying the intended ground yaw.
Other confirmed faults included Beta's unsupported pipe at5.2m clearance, a thin
15×6m platform floating/buried by~1.4m, its42m marking with~3.74m end clearance,
centre-height covers unsupported on slopes, and M4 debris floating~1.6–2.5m.

| Disposition | Objects / action |
|---|---|
| **Removed12 non-colliding pieces** | Beta: detached elevated support pipe, thin unsupported platform, detached warning bar and standalone status tile. M4: four unsupported exterior panels and their four spark bars. No collision record or mission reference was removed. |
| **Grounded52 retained bodies** |47 route/relay boxes and5 cylinders (fuel tanks/masts/landmark). Correct world-plane yaw; lower vertices seat into sampled terrain by.02m. Flat cover tops and original horizontal collision footprints stay unchanged. |
| **Conformed47 ground skins** |34 lanes/pucks,9 existing pools/patches and4 relay/dock pads now follow terrain instead of hovering as rigid slabs/discs. Existing materials/state ownership retained. |
| **Conformed9 existing cables** | Continuous low terrain-following tubes replace endpoint-only suspended cylinders. No new cable layout or draw-call family. |
| **Mounted17 face/cap details** |13 status/warning faces seat on their actual host;4 post/landmark caps contact their supports. No free-floating header/status fragments. |
| **Repaired route gantry** | One fitted crossbeam joins the two actual post tops; its header fits that beam. The existing installed watchtower head is preserved, with its cap seated correctly. |

These are140 explicit registry records:12 removals,127 corrected retained
pieces and one preserved installed landmark head. Each has a meaningful stable
`TerrainProp…/kind` name and an inspectable disposition. The original procedural
scenery positions/rotations remain exactly identical to the starting CP4 state.

All327 obstacle records retain **identical XY bounds, cover tops and enabled
states**. Only73 lower bounds change to follow the corrected bodies' supported
bottoms. Movement footprints and above-ground shot/cover heights are retained;
no collision counts were relaxed. Tests exclude transient `_solidQueryStamp`
bookkeeping from physical comparisons.

## Backyard expansion and enclosing end terrain

- Original0–800m Campaign ground position/color buffers are **bit-identical** to
  the CP4 starting world. No facility move, foundation regrade or route relocation.
- Added a2.5m-grid rear strip from y800–900, sharing the main ground material.
  Usable bounds expand smoothly only behind the facility: full central width
  x310–440, tapered sides x275–475, player north limit y870 centrally instead
  of798. The central low apron runs to about y848; surrounding side rises keep
  the extension enclosing and uncluttered.
- A smooth end embankment rises to approximately55.26m at(370,900). Non-playable
  continuation extends a further80m, without exposed terrain endings.
- Player/squad/hostile movement, saved actor/pickup restoration, spawn bounds,
  guidance bounds and minimap rows recognize the Campaign-only extension. Existing
  coordinate/save formats stay unchanged. Other world edges and Endless limits
  retain their former values. No new objective or mission scripting.
- The exact triangle sampler handles the rear strip. Sampled collision error is
  below2.5e-13m; old/new height and color seams are exactly zero. Native movement,
  squad FOLLOW, hostile pursuit, boundary constraint and v3 Continue at y835 PASS.

## Boundary material/color correction

The old rim used Campaign's vertex-colored ground material **without a color
attribute**, producing the conspicuous black cutoff. The rim now receives the
same deterministic palette, world-space UV treatment and actual edge heights as
the playable ground. The rear strip uses that same material and palette as well.
Sampled rim colors match the expected profile to Float32 precision; they are not
a black default attribute. Terrain height/shape communicates the boundary rather
than an abrupt material switch. Lighting/exposure/fog were not boosted.

## Functional validation

Fifteen browser-suite executions PASS; all use fresh follow-up artifact paths.
Six existing pure state suites also PASS (terrain, placement, progression,
relay routing, combat and objective HUD).

| Check | Firefox | Edge |
|---|---|---|
| New prop/boundary test: full original ground/scenery/cover preservation, support, seams, native backyard, FOLLOW/pursuit, rear v3 Continue | PASS | PASS |
| Existing CP4 terrain determinism, objective access, v3 saves and facility surfaces | PASS | PASS |
| Safe Staged Seal/turret/legacy recovery (`facility-e0`) | PASS | PASS |
| Guidance/route ribbons and hitscan consistency | PASS | PASS |
| Full native M1 battery/grid/command and M2 Alpha/Beta/Gamma/bypasses/front return | PASS | PASS |
| Facility regression / cover / minimap / zero-link static stress | PASS | PASS |
| Full native M4 east exit → beacon → boarding → departure | — | PASS |
| Endless9 arena/seed cases, exact archived layout/height parity | — | PASS |
| Endless valley/crater/ridges native movement, waves1→2 and restart | — | PASS |

Controlled tests use invulnerability/no ambient spawns where indicated. Relay
defence and extraction hold completion hooks are explicit in the existing native
test; movement/interaction inputs are real. This is not an unassisted survival
claim. The full unchanged Safe Staged Seal/turret suite passes; no combat tuning
or facility implementation was changed.

Initial follow-up test incorrectly assumed every valid palette component must
exceed.5; the real palette includes.475. Replaced that arbitrary threshold with
an exact expected-profile color comparison, retaining the failed receipt under
`checks-edge/`. No product colors were changed to satisfy that test.

## Evidence and review

Open the [curated acceptance index](_playtest/m42/cp4-accepted/INDEX.html).
The original full local gallery remains at `_playtest/m42/cp4-fix-props-boundary/INDEX.html`.

- `before/edge/`: initial screenshots, source snapshots and113-object audit.
- `after/{edge,firefox}/`:32 matched coverage views/browser plus the labelled rear
  reference camera. All use normal .78 exposure / fog40–280.
- `review/`: five before/after sheets for route/Alpha, Beta, Gamma, backyard and M4.
- `targeted/{browser}/checks-{browser}/`: actual native backyard screenshots,
  sampled mesh/ground checks, saved rear positions, squad and pursuit records.
- `native/`: full route/mission traversal receipts and gameplay screenshots.
- `safety/edge/`: independent Endless layouts/waves/restart and facility stress.
  Existing placement-suite SVG overlays here are diagnostic, not gameplay captures.
- `targeted-both.json`, `native-{edge,firefox}.json`, `safety-edge.json`:
  machine-readable successful suite receipts with exact source hashes.
- `final-checks.json`: syntax/pure suites, preservation checks, evidence links and
  final Git status. Intermediate `after-candidate/` and `verified/` are retained.

Before/after views and native rear images were visually inspected. No remaining
included-scope floating helper piece was identified in the inspected views.
**User manual visual acceptance is still pending.** Low-priority qualifications:
the established dark lighting and low-poly facets remain, and thin ground markings
retain the game's existing distance/aliasing limits. No known new functional
blocker remains after these targeted tests; no new desktop FPS certification.

## Exact follow-up file changes / Git handoff

Modified from the starting CP4 working state:
- `chargefront.html` — opt-in registrations/finalization, rear mesh/boundary
  colors, Campaign-only movement/save/guidance/minimap boundary integration.
- `src/world/campaign-terrain.js` — pure rear profile/limits and rectangular-grid
  sampling support, retaining original square-grid behavior.

Added:
- `src/world/campaign-exterior.js`
- `tests/prop-boundary-fix.mjs`
- `MILESTONE-4.2-CP4-PROP-BOUNDARY-FIX.md`
- `_playtest/m42/cp4-fix-props-boundary/{inspect,run,review,final-checks}.mjs`
  and generated index, screenshots, source snapshots, logs and JSON receipts.

Existing CP4 modifications in `src/world/facility.js` and its three previously
edited test files remain carried work, not edits from this follow-up. Credits,
the previous CP4 report/evidence and user ZIP remain preserved. Final status and
follow-up-versus-starting-source diff counts are recorded in `final-checks.json`.
`git diff --check`: **PASS**; index remains empty. Total tracked diff against
HEAD (including carried CP4 work) is5 files /222 insertions /88 deletions.
The follow-up changes to existing working files are HTML132+/64− and Campaign
terrain module13+/4−; newly added files/evidence are separate from those counts.

**STOP for manual review. Everything remains unstaged and uncommitted.**
