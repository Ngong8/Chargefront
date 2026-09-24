# Facility architecture — Milestone 3.7 Part A

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

**Extraction complete for Part A.** All facility structural, dressing and navigation code now lives in `src/world/facility.js`; `chargefront.html` retains only the thin builder wrappers that register sections and the mission/campaign state that consumes the returned attachment data. The specimen-tube cradle is owned by the facility, while its pickup, world-state toggling and M3 reveal remain in campaign code. The architecture gate passed: identical solid count (269), identical section list, zero new light-count variants, zero world/collision rebuilds during the A–E traversal, and visually identical captures. Part B reconstruction has not started.

## Regression harness

The existing repo has no package manager or automated test suite. The optional browser harness `tests/facility-regression.mjs` runs the real `file://` game with Playwright and Chrome/Edge. Set `PLAYWRIGHT_PACKAGE` to an installed `playwright/index.mjs` (or install it locally), optionally set `CHROME_PATH`, then run `node tests/facility-regression.mjs`. It checks M1→M4 world identity, sample exterior and indoor collision, mission-select/continued state, M4 purge/boarding/result, Endless independence, minimap draws and the fixed 14 m/frame A–E round-trip profiler. The test uses debug hooks for mission transitions and does not replace a manual desktop FPS/AI movement pass. Route-clearance samples include intentional relay pads and closed doors; compare against their pre-refactor locations, not zero.
