# Milestone 3.8 — interior identity and combat readability checkpoint

Historical interior checkpoint; see the [corrected 3.8.1 report](MILESTONE-3.8.1-REFINEMENT.md) for the final perimeter/door changes and current measurements. The experimental M2 service detour has been removed after gameplay review: Alpha → Beta → Gamma → front entrance → command terminal → Mission 3. The archive dressing is retained behind the structural Containment repair.

Continues the validated [exterior checkpoint](MILESTONE-3.8-EXTERIOR.md). No room, route, door, mission anchor, foundation or world footprint was added or relocated. Changes live in `src/world/facility.js` with a narrow existing-light-state update and developer capture views in `chargefront.html`.

## Room-by-room pass

| Space | Identity, light hierarchy and dressing | Combat-space treatment |
|---|---|---|
| Main Hall | Warm amber lane shoulders and four repeated, wall-mounted logistics rack faces tie existing cargo, signs and blue equipment into a staging bay. | Center lane and existing low-cover cargo remain clear; rack faces sit against solid walls above standing fire height. |
| 3-Relay Vault | Three amber cable feeds terminate at matching magenta-status relay housings; pale reinforced wall sections and warm rail trims contrast with the cool decon beyond. The *decorative* housings were raised overhead against the far wall so tall-looking but non-solid boxes no longer occupy the shooting/doorway view. | Relay world objectives and lock indicators stay anchored; center approach and 3-relay door remain open, no new solids. |
| Decontamination | Cool cyan wall panels/status lines and paired threshold guides complement existing spray nozzles, portal frames and access signs. | All marking is at the existing side walls or below movement height; broad crossing preserved. |
| Research | Two existing bench groups gain shared low-profile instruments and readouts; linked pale blue wall panels, rear wall returns and a floor guide give the analysis area an identifiable work loop. | Instrument tops remain below standing fire height; existing benches are still low cover, with clear diagonal and central routes. |
| Security | A repeated monitor/status bank and amber command rails/floor guide pair with existing desks, cabinet bank and security console. Amber/cyan readouts contrast with Research's pale analytical work surfaces. | 13 m partition opening, console and existing tall server-bank cover retain their collision/LOS behavior. |
| Containment / Deep Lab | Existing chamber/rings/pods remain focal; cool perimeter wall panels and guides pick out room edges while the central red floor guide is less intense. Emergency mode now retains cool Research/decon/containment light-source colors instead of making all seven laboratory sources red. | No additions inside the specimen annulus, no changed cover solids or new rendered lights; Security and emergency exit still pulse red. |
| Service / Power | Aisle-facing generator access plates, amber power buses and channels, and a red exit threshold connect the existing four generators/cabinets into one maintenance system. | Generator tall-cover solids are unchanged. Amber guides flank the open center passage; exit stays wide. |

**Resource strategy:** All new static detail uses `envBoxGeometry`/`envMat` and repeated dimensions/colors. Matching `InteriorIdentity` meshes and named lab detail are batched into `InstancedMesh` objects *once at world build*. Existing animated material references, doors, source lights and mission attachments remain separate. The seven authored lab source PointLights still feed eight permanent rendered slots; emergency changes only their color/intensity uniforms. The capture tooling can now select seven room views (`interior`) and optionally use the actual eight-slot arrangement (`--gameplay-lights`) or an M4 emergency snapshot (`--emergency`).

## Comparable browser measurements

Edge/SwiftShader, 1280×720, mission-select M2, existing 272-frame A–E forward/reverse script at 14 m per RAF. Randomized world and frustum coverage affect absolute triangles, draw calls and totals slightly; headless timings are not desktop FPS.

| Metric | M3.7 merged baseline | M3.8 exterior checkpoint | Interior checkpoint |
|---|---:|---:|---:|
| Render calls | 1,300 | 1,321 | 1,357 |
| Triangles | 293,892 | 293,000 | 294,924 |
| Unique scene geometries | 2,071 | 2,099 | 2,126 |
| Unique scene materials | 1,641 | 1,649 | 1,676 |
| Scene meshes | 2,321 | 2,381 | 2,391 |
| Solid count / light slots / programs | 307 / 8 / 23 | 307 / 8 / 23 | 307 / 8 / 23 |
| Traversal links / world builds / grid rebuilds | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Traversal geometry/material creations | 0 / 0 | 0 / 0 | 0 / 0 |
| p95 / worst interval, ms | 33.4 / 150 | 33.5 / 166.5 | 33.4 / 150.1 |

The first unbatched interior draft reached 1,458 calls. Its repeated static panels/rails were identified as the cause and batched before this checkpoint. Net vs post-exterior is +36 calls, +27 scene geometries, +27 materials and +10 meshes; no new PointLights, shader-program variants or movement-time world/facility allocations. Longer live-input playthroughs may count incidental encounter/effect assets as allocations; the quiet, movement-only A–E benchmark is the facility churn gate.

## Validation and images

- `tests/facility-regression.mjs`: PASS — M1→M4 identity, Mission Select/Continue after reload, Endless isolation, M3 security/sample interaction, M4 purge/boarding/result, Beta→Gamma clearance, minimap, A–E profiler and eight fixed light slots. Added standing/low sightline probes across the Hall, Vault, Decon, Research, Security, Containment and Service; checked three actual emergency source-light colors and the batched scene details.
- `tests/facility-playthrough.mjs`: PASS — W-key Hall → Vault → Decon → Research → Security → Containment → Service → Exit, Shift sprint through three transitions, squad FOLLOW and active combat, Infested pursuit inward/outward through the Hall and both service thresholds, indoor shot over low Research cover, M4 exit checkpoint and Continue. No traversal shader links, world builds or nav-grid rebuilds.
- `tests/transition-diagnose.mjs`: PASS — five visible M1 intro cuts, M2→M3, M3→M4 and result with zero new shaders at the cuts/transitions. Covered initial prewarm remains initial-load work.
- Captures made with `node capture-facility.mjs _playtest/m38-interior interior --gameplay-lights`: `facility_interior_hall.png`, `facility_interior_vault.png`, `facility_interior_decon.png`, `facility_interior_research.png`, `facility_interior_security.png`, `facility_interior_deeplab.png`, `facility_interior_service.png`. `m38-interior-emergency/facility_interior_deeplab.png` shows the post-sample M4 state. `_playtest/m38-interior-before/facility_interior_research.png` retains a pre-edit eight-slot comparison.

## Remaining observations

Research and Containment still have very dark upper walls at FPS height despite improved floor/cover and wall-side recognition; further brightness increases should be judged with hostile silhouettes on the target desktop display, not uniformly applied to every room. The M4 emergency capture no longer shows the specimen because it has been secured in M3; its chamber remains a clear objective landmark. The reported M1 landing-loop audio cutoff and occasional character/hostile visual jitter were not part of this geometry/lighting pass and need their own reproducible gameplay review. The automated browser is software WebGL, not a substitute for a desktop visual/FPS gate.
