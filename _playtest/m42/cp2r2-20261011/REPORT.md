# Milestone 4.2 CP2-R2 — approved exterior refinement

**Engineering PASS; manual visual acceptance pending. STOP after R2.**

This pass follows the accepted Sealed Bio-Containment Plant direction. The user's
R1 walls/roofline/door architecture is retained, not redesigned. The before set
was captured from actual accepted-R1 source before any R2 product edit, on both
Firefox and Edge. Its source snapshot is `accepted-r1-facility.js`.

## Implemented decisions

| Item | Result |
|---|---|
| S1 | Nameplate, backing, brackets and uprights retained exactly. |
| S2 | AIR SYSTEMS billboard not constructed; no roof sign remains. |
| S3 | Legacy loading sign removed from its parent and its private geometry/texture/material disposed after legacy population. |
| S4 | Misplaced Power/egress sign removed/disposed the same way. |
| S5 | Rear containment sign and backing not constructed. |
| S6 | Existing Emergency Exit sign is inside on the x450 lintel, facing -X. Its 8 m source is scaled to 3.6 × .675 m, fitting the 8.2–8.9 m band. The external roof-edge backing/mounts/brackets are removed. |
| Exit ID | One 2.8 m-wide E-04 plaque at the actual exterior exit header. No duplicate exit billboard. |
| M1 | Broad blank front panels replaced by two compact 6.2 × 2 m louvered intakes, risers and roof feeds terminating at the existing Hall handlers x344/x377,y645. Roof feeds bear on the accepted roof; they are functional utility geometry, not unrelated rooftop filling. |
| M2 | Four large repetitive side panels reduced to one small 4.6 × 1.5 m ventilation bank per side. Brown scuff meshes removed, without replacement scatter. |
| M3 | Inaccessible rear archive panels removed. |
| M4 | One small generator ventilation bank on the Power Wing's yard-facing south wall; CP2 north-face panel/vent decoration removed. |
| M5 | Three cabinet bodies span z0.4–2.0 m, with status strips at service height and conduits from z2.0–7.2 m. Cabinet projection is .18/.18/.30 m; complete cabinet/status/conduit assemblies remain within .35 m, inside the .4 m actor wall stand-off. |
| M6/supports | Crane position and geometry, equipment plinths, cap gaskets, HVAC skids and duct feet retained exactly. |
| Roof colour | Existing equipment recolouring slightly darker and less emissive (.24 skins/HVAC, .30 caps). No light sources, global exposure or fog changes. |
| Staging | Existing board retained at the same pose. |

The removed legacy signs are constructed in the original builder order then
detached/disposed in the existing scoped post-build pass, preserving the UUID/
cache consumption stream for seeded scenery. Removed CP2 finalizer-only objects
are simply no longer constructed. R1's finalizer and all architecture builders
are unchanged. The HTML and Credits blob hashes remain unchanged from R2 start.

## Runtime and regression validation

`tests/facility-refinement.mjs` compares the live scene to the before manifest,
not visibility from one camera. Both `verified/` capture stages and `final-check/`
assertion-only stages PASS in both browsers. Eleven obsolete named object families
are absent from the scene graph (signs, backings, scuffs, broad facade/Power panels
and old egress mounts). There are no door-sweep intersections and no CP2 wall
identity detail on the rear or north Power face. The inside sign's parent is the
laboratory; its exterior counterpart carries only E-04.

Exact before/after equality passes for all **329 collision solids**, all **30 map
segments**, section snapshots, door widths/heights/seams/travel offsets, R1 core
walls/roofs, portal instance matrices, roof coping, laboratory mesh snapshots
(excluding the intentionally moved exit plaque), nameplate, staging board, crane
and approved support transforms. Eight light slots and the source-light count match.

| Check | Result / receipt |
|---|---|
| New R2 inventory, exact R1 preservation and mount/sweep clearance | Both browsers PASS: `verified/{firefox,edge}/manifest.json`, `final-check/{firefox,edge}/manifest.json` |
| Permanent enclosure, both recess walks and six door cycles | Both browsers PASS: `enclosure/facility-enclosure-{firefox,edge}.json` |
| Facility regression, native playthrough, traversal performance, transition diagnostics | All eight suite/browser runs status 0: `regression/results-edge-firefox.json` and individual logs |
| Environmental placement / actual archived-HEAD scenery and Endless parity | Both browsers PASS: `placement/environment-placement-{firefox,edge}.json` |
| CP2 capture/clearance compatibility harness | Both browsers PASS: `../cp2-20261011/r2-compatibility-verified/{firefox,edge}/manifest.json` |
| Environment placement state tests | PASS: purpose/support/slope/footprint/fallback checks and five repeatable terrain seeds |
| Syntax and whitespace | `node --check` and `git diff --check` PASS |

Enclosure remains zero outside-reachable interior samples with all doors closed
in M1–M4, and in settled live M1/M2/M3. M4 admits the expected 29,474 samples via
the deliberately open emergency exit; closing that exit alone restores zero.
Both real-input Vault recess breach routes and their reverse routes remain blocked.

Performance stress retains **29 warmed programs** and eight light slots, with zero
traversal geometry/material creation/disposal, world/facility/nav builds or shader
links in the facility-regression sweep. Firefox p95/p99/worst RAF intervals were
66.7/150/216.7 ms; Edge 17.1/49.8/116.8 ms. These are bounded software-WebGL test
results, not desktop FPS acceptance. Matched Firefox screenshot draw-call deltas
range **-10 to +2** across views; fewer visible meshes do not imply a frame-rate
guarantee. Animated actors/FX can contribute small per-frame differences.

## Fresh screenshot comparison

Each of eleven poses has **normal and diagnostic** views, in both browsers,
before and after: **44 before + 44 final screenshots**. These use actual source,
seed 420042, 1600×900. The principal entrance/sides/yard/exit/overview poses match
the CP2-R audit; roof, Power-yard and close sign views supplement them. The header
plaques initially overlapped the emissive strip; visual review moved them just
proud of it. The `review/` stage records that issue, and `verified/` is the final set.

Normal views retain gameplay lights, exposure and fog. Diagnostic views add two
temporary non-shadow fill lights and exposure 1.25 in the isolated capture page.
No diagnostic light or exposure change is persisted to the game.

| View | Before (normal) | Final (normal) | Final (diagnostic) |
|---|---|---|---|
| Entrance | [Before](before/firefox/entrance-normal.png) | [After](verified/firefox/entrance-normal.png) | [Fill](verified/firefox/entrance-diagnostic.png) |
| West side | [Before](before/firefox/west-side-normal.png) | [After](verified/firefox/west-side-normal.png) | [Fill](verified/firefox/west-side-diagnostic.png) |
| East side | [Before](before/firefox/east-side-normal.png) | [After](verified/firefox/east-side-normal.png) | [Fill](verified/firefox/east-side-diagnostic.png) |
| Service yard | [Before](before/firefox/service-yard-normal.png) | [After](verified/firefox/service-yard-normal.png) | [Fill](verified/firefox/service-yard-diagnostic.png) |
| Elevated overview | [Before](before/firefox/overview-normal.png) | [After](verified/firefox/overview-normal.png) | [Fill](verified/firefox/overview-diagnostic.png) |
| Roof feeds | [Before](before/firefox/roof-detail-normal.png) | [After](verified/firefox/roof-detail-normal.png) | [Fill](verified/firefox/roof-detail-diagnostic.png) |
| Power north | [Before](before/firefox/power-north-normal.png) | [After](verified/firefox/power-north-normal.png) | [Fill](verified/firefox/power-north-diagnostic.png) |
| Exit outside | [Before](before/firefox/exit-outside-normal.png) | [After](verified/firefox/exit-outside-normal.png) | [Fill](verified/firefox/exit-outside-diagnostic.png) |
| Exit inside | [Before](before/firefox/exit-inside-normal.png) | [After](verified/firefox/exit-inside-normal.png) | [Fill](verified/firefox/exit-inside-diagnostic.png) |
| Exit sign closer | [Before](before/firefox/exit-sign-detail-normal.png) | [After](verified/firefox/exit-sign-detail-normal.png) | [Fill](verified/firefox/exit-sign-detail-diagnostic.png) |
| Yard-facing Power | [Before](before/firefox/power-yard-normal.png) | [After](verified/firefox/power-yard-normal.png) | [Fill](verified/firefox/power-yard-diagnostic.png) |

Edge counterparts use the same filenames under `before/edge/` and `verified/edge/`.
Direct review covered normal entrance, both sides, service yard, overview and exit
inside/outside (including the Edge exterior), plus diagnostic intakes/roof feeds,
Power-yard and before/after north-face clearance. The front looks less like a row
of advertising boards; the north-face overlap is gone and the cabinets are usable
height. No replacement decorative objects were added to fill the cleared walls.

### Remaining visual questions for manual review

- The long side walls and rear remain deliberately sparse and very dark in normal
  gameplay lighting. The new utilities read more clearly in diagnostic light; no
  global brightening was used to claim they are always prominent.
- The inside emergency plaque fits the accepted narrow header band. It is readable
  on approach/close view but small from the far end of the Power passage; red jamb
  and threshold cues remain the main long-range guidance.
- Legacy luminous horizontal wall strips and the low-detail rooftop housing shapes
  still look stylized. The new intake risers/feeds have a function but remain simple
  box geometry; this is a manual art-acceptance question, not a new architectural fix.
- The staging board's pre-existing unsupported appearance and buried yard equipment
  remain as recorded in CP2-R. This pass preserves those unrelated items.

No unresolved gameplay, enclosure, collision, door or shader regression was found.
Two harness corrections were necessary: classify the Power cabinet on its south
face, and include its .03 m status trim in the actor stand-off guard. The product
correction during review was the plaque/strip separation, verified in the final set.

## Changed files and stop boundary

R2 product change: only `src/world/facility.js`'s post-build exterior identity pass.
Tests: new `tests/facility-refinement.mjs`; `tests/facility-exterior.mjs` updated for
removed objects, R1 door height and approved service-height trim clearance.
Documentation: this report, milestone R2 record and architecture addendum.
New evidence stays under this directory (plus the fresh compatibility stages in
the existing CP2 evidence root). All earlier evidence is preserved.

Source blob at R2 start: `14c5e576328eed28dea761b3f664c399cb87575b`.
Final facility blob: `f14944b1707993939056ec9b2c5cc2255cfadae9`.
Unchanged HTML blob: `b24179b46a9a2884472e401b874e28e893331a11`.
Unchanged Credits blob: `1b289ed081c738e671eacc1077ec9b4435b65e25`.

**STOP: await manual R2 acceptance. No CP3, commit, push or merge.**
