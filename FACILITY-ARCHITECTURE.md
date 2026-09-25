# Facility architecture — Milestone 3.7 Parts A–B

The HTML game imports `src/world/facility.js` as a **classic script** ahead of its main module so opening the game through `file://` still works. `ChargefrontFacility.create()` accepts world primitives at startup; it does not depend on campaign phases, input handling or the renderer's local-light-slot implementation. The factory obtains the scene lazily, since Three.js creates it after the module itself is evaluated.

## Ownership audit

| Concern | Owner / integration |
|---|---|
| Main hall and vault floors, roofs, exterior shell, gate and lab-access facade | Facility module `buildShell()`; static section retained under `shell` and `hall` |
| Doors, physical collision strips, animation, denial feedback | Facility module `addDoor()` / `updateDoors()`; generic `SOLIDS` query grid stays in HTML |
| M2 bypass navigation rectangle/anchors; minimap wall lines | Facility module constants and `navigationWaypoint()`; phase gating, route selection and minimap drawing stay in HTML |
| Staging, service spur structures and status/shortcut props | Facility module `buildExpansion()`; generic terrain height, budget-light registration and collision helpers are injected |
| Exterior buttresses, roof housings, signs, bypass markings, service yard detail | Facility module `buildExteriorDetail()` with shared world geometry/material factories |
| Deep laboratory research spine, containment, emergency layer, mission attachment meshes | Facility module `buildLaboratory()` returns a narrow bundle consumed by mission code, without moving the mission triggers |
| Hall equipment, interior dressing, service yard, specimen tube cradle | Facility module `buildHall()` / `buildHallEquipment()` / `buildHallInterior()` / `buildHallServiceYard()`; returns the tube bundle so mission code keeps the pickup/progression |
| Interior identity framing/zone details | Facility module `buildInteriorIdentity()` using shared environment geometry/material caches |
| Lab/shortcut/relay indicators and ambient FX | Facility module `applySnapshot()`, `setShortcutState()` and gated `updateFx()`; campaign passes state into it |
| Relay gameplay, objectives, optional survey drone, security turret and DNA sample pickup | Campaign code in HTML, referencing physical attachment points; *not* moved into facility module |
| Terrain, generic collision/grid queries, world decoration and renderer light slots | Generic world/rendering code in HTML, not facility geometry |
| Ship, extraction purge, mission snapshots and checkpoint/Continue behavior | Campaign code in HTML; facility is constructed once and retained throughout M1–M4 |
| Cleanup | No current whole-world reset/teardown path. Sections persist for the browser session; mission transitions must not call `dispose()` or rebuild any section. Browser teardown releases the scene. |

`buildCampaignWorld()` remains the sole coordinator and is called once per campaign world. `buildSection(name, builder)` records direct scene objects and solids at build time, and refuses to rebuild a section on a second call. The stabilized eight renderer-side `LocalLightSlot` PointLights and their authored source lights remain in the HTML and are untouched by facility construction. Movement updates only door transforms/collision-enabled flags and facility FX at the previous 12 Hz / 190 m gate. Snapshot changes toggle existing group/material state; no geometry is allocated.

**Part A checkpoint:** `be4f6b4` extracted the original geometry without changing its appearance. All facility structural, dressing and navigation code lives in `src/world/facility.js`; `chargefront.html` retains the thin section builder wrappers and mission/campaign state that consumes attachment data. The specimen-tube cradle belongs to the facility; its pickup, world-state toggling and M3 reveal remain in campaign code.

## Part B reconstruction

The cutaway reference is mapped south-to-north to Main Hall (`x330–390, y618–660`), the 3-Relay Vault (`x342–378, y660–684`), Decontamination (`x330–390, y690–704`), Research with an adjoining east Security bay (`y704–735`), and Containment (`x330–410, y735–795`). A Service/Power wing branches east from Containment (`x410–450, y736–770`), ending at a separate emergency exit at `(450,752)`. The original M1 hall consoles, M3 Security console `(376,718)`, specimen/vial `(360,774)`, and interior emergency door `(410,752)` remain anchored. The M4 objective/route now continues through the wing to its exterior exit; M4 contact completion happens after that exit.

Door openings are 12–16 m wide at the main transitions. The research/security partition has a 13 m opening; low cover and generators sit beside the main routes and use height-aware projectile solids. The new service wing does not extend toward the south Beta→Gamma bypass. The facility navigation rectangle includes the east wing; map segments trace each partition, room and wing, and M3/M4 route bends avoid the new walls and outdoor yard equipment. `foundationHeight()` grades only the three facility footprints, blending over 18 m into unmodified neighboring terrain so neither natural ground nor a foundation step protrudes through the floors.

Hall, Vault, Decontamination, Research, Security, Containment and Service lights are authored source PointLights registered with `addBudgetLight()` and selected by the existing eight permanent rendered slots. Animated screens and emergency materials are retained; repeated structural box sizes/materials in the lab share the environment caches. `updateDoors()` also opens unlocked doors for nearby pursuing Infested, without allocating geometry or changing mission locks. Shell, doors, wing and laboratory are built once per world lifecycle; existing snapshot state still controls access and emergency visuals.

## Regression harness

The optional browser harness `tests/facility-regression.mjs` runs the real `file://` game with Playwright and Chrome/Edge. Set `PLAYWRIGHT_PACKAGE` to an installed `playwright/index.mjs` (or install it locally), optionally set `CHROME_PATH`, then run `node tests/facility-regression.mjs` or append `firefox`. It checks M1→M4 world identity, outdoor/indoor collision, low-cover shots, room clearances, M3 specimen interaction, Mission Select/Continue, M4 purge/boarding/result, Endless independence, minimap draws and the fixed 14 m/frame A–E round-trip profiler. `tests/facility-playthrough.mjs` uses actual W-key movement through each threshold, squad FOLLOW/combat, Infested pursuit into and out of the Main Hall and through both service doors, the M4 exterior exit and its reload checkpoint. `tests/transition-diagnose.mjs` checks visible M1 intro cuts and M2→M3→M4/result shader links. These scripts do not replace a desktop visual/FPS pass. Route-clearance samples still include intentional relay pads and closed doors.
