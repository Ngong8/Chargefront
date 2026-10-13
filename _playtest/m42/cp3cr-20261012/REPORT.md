# CP3-C-R — Interior prop placement and visual-logic review

**Inspection complete. Corrections are proposals awaiting user approval.**
CP3-C engineering PASS does not constitute visual acceptance. No product code,
existing test, milestone document, Credits.txt, authored light or asset was edited.
No commit, merge, push or CP3-D work occurred.

## Evidence and method

- Current HEAD: `c0bb414492d5359b2d98367bf31ca7511f65f9ba` on `milestone-4.2`.
- Inspected working facility SHA256:
  `62f23aed1589ae2508c4f96a6274f6407a599d8980ab850c5a720075999aeb86`.
- [Indexed screenshots](SCREENSHOT-INDEX.md): existing CP3-C room comparisons are
  reused for composition; 32 targeted new current-placement close-ups are saved in
  ten sheets. These are observations, not correction mock-ups.
- Firefox155, seed420042, normal M3 gameplay lighting plus explicitly labeled
  **existing M4 emergency lighting** for state-dependent debris. Exposure .78,
  fog40–280 and eight slots unchanged. No diagnostic fill or cutaway.
- Player-height views use the actual 1.62 m eye; side/elevated views are labeled.
  Quiet camera setup teleports and hidden HUD/viewmodel/squad are inspection
  fixtures, not additional walking or performance certification.
- Native mesh/instance world bounds, contact gaps and existing collision queries
  supplement visual judgment. [Concise measurements](MEASUREMENTS.json) and
  [M4 debris receipt](emergency.json) distinguish physical facts from design choices.
- Product/test/documentation hashes were compared before/after each capture pass
  and again after restart recovery. They are unchanged. Only this new review
  directory was written.

The inspected game still has **329 solids, 30 map segments, six doors and eight
rendered light slots**. Existing CP3-C regression receipts are retained; no new
engineering acceptance is claimed for corrections that have not been implemented.

## Overall assessment

Keep the seven-room identities and most existing machinery. The strongest problems
are **unsupported or intersecting display skins**, **decorative floor bodies that
suggest collision**, and a few **incorrectly oriented or disconnected parts**.
Additional decoration or brighter lighting would not solve those problems.

Numbers below are world-space meters. A gap by itself is not necessarily wrong;
a visible standoff can be legitimate. The REMOUNT findings identify assemblies for
which the current authored geometry does not bridge the observed attachment gap.
Prefer fitting existing backings/parts to their hosts over adding decorative brackets.

## Proposed corrections — approval IDs

### F01 — REMOUNT: repeated wall-mounted panel families

**Evidence:** H2/H3, R2, S1/S2, C1/C3, P2/P3; [measurement receipt](MEASUREMENTS.json).

Several apparent equipment faces are separated from their real wall by unsupported
air gaps: Hall rack backing **.17 m**, Research/Decon/Containment west panels
approximately **.29 m**, Security overview monitors **.305 m**, upper archive bays
**.20 m**, and Power distribution backings **.19 m**. They look mounted from the
front, but the side relationships do not provide a clear supporting case or rail.

**Preferred:** seat the existing backing/case against the actual wall, moving its
associated face, trim and labels coherently; retain a small stand-off only where
existing support geometry actually bridges it. Keep room-facing orientation and
stay within current wall-side depth envelopes. No new floor supports or gadgets.

This is one shared placement rule across the listed families, not a request to
rebuild every wall or erase useful equipment. CP3-B's already-supported room signs
are excluded from this correction.

### H01 — REFINE: long Hall intake display versus its host

**Evidence:** [Hall sheet H1–H3](review/H-hall-current.png).

The long cyan face at **(386.2,646)** spans **4.6 m** in Y, while its apparent cabinet
host spans only **2 m**. It overhangs about **1.3 m at each end** and partly enters
the cabinet vertically. Alongside neighboring screens and tops, it reads as loose,
overlapping slabs rather than one installed intake surface.

**Preferred:** resize/reseat this existing face as an integrated display on its
actual supported host, rather than allowing it to bridge open space. Resolve its
host together with H02. Retain the intake purpose and the existing display material;
do not make a wider counter or add another console.

### H02 — REMOVE: redundant pass-through floor cabinet shells

**Evidence:** H1–H3; collision observations in `MEASUREMENTS.json`.

Three CP2 decorative bodies at **x386.4 / y640,646,652** are .9×2×1.1 m floor-sized
cabinet shells. All three centers are outside collision solids. Their bulk suggests
low cover or an obstacle even though players/projectiles do not get that behavior.
The y652 shell also partly overlaps the real y650 cabinet's volume, contributing
to the visually tangled cluster.
This is different from the real existing intake cabinet at **(386,650)**, which is
solid and should remain.

**Preferred:** retire only those three redundant decorative shells; rehome the
useful CP3-C visitor-record/top components from y646 onto the existing solid intake
installation, fitting the available surface. Keep the original solid stations,
wall information and reception identity. Do not add collision to disguise the issue.

### H03 — REFINE: intake divider crosses printed ID-check text

**Evidence:** H1 and H3.

The new vertical screen divider passes across the `INTAKE / ID CHECK` plate and
obscures text. Its screen-field function is reasonable; its extent is not.

**Preferred:** shorten/reseat that divider to stop above the printed plate. Keep
the label and seated reader/document details; add no extra display decoration.

### H04 — REMOUNT: Hall warning plaques

**Evidence:** H1–H3 and H7.

The east plaque at **(388,650,4.1)** has its rear face at x388.06, almost **.94 m**
from the actual x389 wall face. The nearby reception backing does not bridge that
distance, and its footprint does not fully support the warning board. The west
plaque has the same standalone-offset pattern.

**Preferred:** mount each existing plaque in a clear actual wall/backing bay and
fit its footprint there. Keep the warning style, and avoid stacking it in front
of the reception board or over the accepted Sensors/Supply signs.

### H05 — REPOSITION: utility-unit gauge assembly

**Evidence:** [H6/H7](review/H-service-supplement.png).

The gauge cylinders are horizontal discs rather than a wall-facing dial. The green
face at **(336,623.4,1.9)** is entirely inside the utility casing; the rim at
y623.6 is displaced from it and shows as a small flange. It cannot read as an
installed pressure/condition gauge.

**Preferred:** orient the existing rim/face together along the casing-face normal,
seat the rim on that face and the face on the rim, at an accessible service height.
Preserve the casing, collision, existing materials and source lights.

### H06 — REPOSITION: isolated service standpipe

**Evidence:** [H8](review/H-service-supplement.png).

The 8 m cylinder at **(336,644,1)** extends from z−3 to z5. Its visible upper end
terminates freely, and it sits roughly 22 m from the utility unit with no visible
connection. It resembles installed plumbing without a discernible service role.

**Preferred:** reuse this same pipe as a fitted service riser on the existing
utility installation, sizing its endpoints to the host and an existing upper
service route. Leave no isolated floor pole; add no extra machinery or floor solid.

### H07 — REMOUNT: long overhead utility runs

**Evidence:** H5.

The three 56 m pipe runs stop about 1 m short of the Hall's inner wall faces.
They also sit below the supporting beam grid without authored connectors spanning
the gap. This differs from believable loose/damaged hanging cables, which can remain.

**Preferred:** fit the existing runs to real wall/rib service endpoints and the
existing beam grid. Use only the mounting geometry necessary to make that attachment
legible; avoid a second cable system or additional floor clutter. Do not move lights.

### H08 — REFINE: fallen Hall casing and cover silhouette

**Evidence:** H4; measured bounds in `MEASUREMENTS.json`.

At **(337,656)** the rotated casing extends from approximately **z−.11 to z1.91**,
while its existing collision ends at **z1.4**. It is partly buried and its raised
bulk suggests standing-height cover that does not exist. The source rotation is a
tilt in the Z-up object graph, not simply a floor-plane yaw.

**Preferred:** rest the same fallen casing on the actual floor within its existing
3×3 m solid footprint and keep meaningful visible bulk at/below the 1.4 m cover top.
Retain a plausible abandoned/fallen appearance. Do not simply lift the entire tilted
object, increase its solid height or move its collision.

### D01 — REPOSITION: Decon frame crossbars

**Evidence:** [D1/D2](review/D-decon-current.png), measured crossbar bounds.

The two 40 m crossbars at **y695 and y701** occupy **z0–.35**, at the floor, while
their associated posts end at **z7.8**. They read as detached floor lines beside
unfinished uprights rather than a connected process frame.

**Preferred:** reuse those two bars as the posts' upper cross-members, fitted to
the post tops and clear of the existing nozzle/manifold assembly. Keep the smaller
actual floor guidance markings. No additional arches, lights or posts are needed.

### R01 — REFINE: intersecting Research equipment-panel layers

**Evidence:** [R1/R2](review/R-research-current.png).

The older small backing and the broader wall face intersect as actual volumes,
not just perspective overlap: about **.07 m in X × 4.8 m in Y × 2.1 m in Z** at the
first bay. Their offset top edges create the impression of two unrelated boards.
The other bay repeats the layered arrangement.

**Preferred:** refit existing pieces into one recognizable wall-integrated analyzer
bay: a seated backing/case and a distinct non-intersecting service face/readout.
Use F01 for wall contact. Keep the Research palette and bay identity; do not add
more screens, taller bench devices or new cover. Large industrial panels are not
automatically wrong—the duplicated geometry is the immediate problem.

### S01 — REMOVE: redundant glass-skin/dead-rail subsystem

**Evidence:** [S1/S2](review/S-security-current.png); exact bounds in `inspection.json`.

Three translucent 6.4×4.1 m skins sit over an opaque wall behind the equipment.
They do not currently frame a window or protect the fronts of the surveillance
equipment. Six supposed rails are two identical copies per pane at **z0–.14**,
fully below the visible floor. The loop's intended 2.0/5.7 values are not applied
to their transforms. They are not functioning top/bottom frames.

**Preferred:** remove this decorative glazing-and-buried-rail subsystem while
retaining every solid rack, seated desktop, wall monitor and mission console.
The missing frame placement is a measured fact; whether the glass has a desired
design purpose is a judgment for your approval. This is not a recommendation to
remove Security's useful surveillance equipment or rebuild its wall.

### C01 — REFINE: overlapping lower archive panels

**Evidence:** [C1](review/C-containment-current.png).

The lower archive layers repeat the Research problem: measured intersection at
the east group is approximately **6 m in X × .02 m in Y × 2.2 m in Z**. The front
shape hangs across a broader plate without a clear installed-case relationship.

**Preferred:** consolidate/reseat those lower layers as coherent sealed archive
equipment faces, with F01 wall attachment. Keep the upper archive bays, their
subdued CP3-C cassette details and the Sample Zero composition unchanged.

### C02 — REMOUNT: turret head-to-base connection

**Evidence:** [C4/C5](review/C-turret-supplement.png).

The actual turret base ends at **z.53**, and the head begins at **z.94**: an
approximately **.41 m unsupported gap**. This is a real functional mission machine,
not a decorative hologram. The missing support is visible from both sides.

**Preferred:** refit/extend the existing base into a compact supporting pedestal
that meets the head. Keep the head/barrel/lamp, aim behavior, firing origin, console
and all mission interactions in place. Do not make the turret new collision cover
or add another surveillance/gun object.

### P02 — REMOUNT: distribution backings, while keeping the feeder

**Evidence:** [P1–P3](review/P-power-current.png).

The CP3-C upper feeder itself is properly supported: its clamps contact the actual
wall and its drops reach the distribution bays. The broad bay backings still have
about **.19 m** of unsupported space behind them. A cable drop does not establish
a convincing mounting system for the whole cabinet face.

**Preferred:** fit the existing distribution case/face assembly against the actual
wall, translating its attached face details together and retaining the feed/drop
contacts. Keep the existing feeder route and clamps; add no second feeder.

### P03 — REMOVE: redundant rear-generator vent masks

**Evidence:** P4; `rearGeneratorVentFaceOverlap` in `MEASUREMENTS.json`.

On the two rear generators at **y764**, the older three large vent masks occupy
almost the same plane as the later aisle-facing service panel: about **.11 m depth
overlap over 1.125 m height**. The new narrow louvers/gauge are then laid over that
competing pattern. This explains the uneven/intersecting-looking service faces.

**Preferred:** retire only the six older aisle-side vent masks on those two rear
machines. Keep the newer coherent service-face/louver/gauge layout on all four
generators. Retain useful far-side vents on the front machines and keep all four
generator bodies, their solids and their maintenance aisles unchanged.

### P04 — REFINE: upper-bay control presentation (lower priority)

**Evidence:** P1/P2.

The white handle-like patches are around **z4 m**, beyond normal manual reach.
The high location is sensible for protected bus/junction equipment, but less
sensible if the face implies locally hand-operated isolation switches.

**Preferred:** retain the high bay as sealed bus/junction/status equipment and
refine its existing small faces accordingly. Leave manual service access associated
with the existing floor cabinets. No new buttons, interactions, cabinets or lights.
This is a functional-presentation judgment, not a collision defect.

### E01 — REFINE: existing M4-only debris silhouettes

**Evidence:** [E1–E3](review/E-emergency-current.png), [M4 bounds/probes](emergency.json).

The three emergency beams are largely buried/tilted, with visible tops near
**1.86 m, 1.50 m and 2.48 m**. None is a collision solid; a 1 m projectile sample
through each is clear. The service piece at **(415,752)** looks like a physical
barrier/cover directly on the evacuation axis even though gameplay passes through it.

**Preferred:** keep the emergency wreckage story but rest/refine the same pieces
as low, non-cover debris, clear of the main evacuation line and full door travel.
Use correct floor-plane orientation, avoiding chest-high tilted false cover.
No new solids, breach, floor machinery or emergency lighting changes. Retain the
intentional M4 growth; this is not another scatter-exclusion pass.

## KEEP register — coverage of all seven rooms

| Area | Significant families to keep | Why |
|---|---|---|
| Main Hall | Solid intake stations; seated CP3-C reader/document functions; Sensors/Supply signs and CP3-B supports; perimeter cargo/tanks/barrels and broad axis | Useful reception/logistics functions. Retain real cover and lanes; trim the identified redundant/unsupported parts rather than replacing the station. Ground-base overlap with a floor skin is not by itself a reason to raise a whole prop and change cover height. |
| Three-Relay Vault | Three housings, live state faces, CP3-B ceiling straps/plates, CP3-C rear backplanes/local jumpers, wall information and relay lanes | Side views show valid housing-to-ceiling support and local backplane-to-case contacts. The short jumpers are local connections, not a demonstrated upstream ceiling power circuit. No added machinery or new full cable network is justified. |
| Decontamination | Existing process cabinets and seated service/grille faces; three nozzles, CP3-B manifold/hangers/ceiling plates; thresholds | Cabinet functions are coherent. Nozzle contact/mounting is valid in the inspected side/upward views; do not redo the accepted mount. Address the detached frame bars and generic wall attachment separately. |
| Research | Actual bench/table bodies and their cover; CP3-B shallow instruments/readout; CP3-C sample trays/control beds; mission turret console and signs | R3 confirms supported compact workstation controls. Scale/profile are appropriate for a work surface. Do not reintroduce bulk or add scientific clutter to solve wall-panel placement. |
| Security | Four solid server/rack bodies; two real workstations; CP3-B flat seated displays and CP3-C bezels; overview monitors, console and partition access | S3 reads naturally as a low-profile operator touch/display panel. Rack cover and surveillance identity are sound. High monitors can serve overview/status roles once properly mounted; no camera prop or extra desk clutter is necessary. |
| Containment | Sample Zero tube/field/dais/rings and interactions; pod family, real low-cover crates, peripheral equipment cabinets; upper archive bays/details; existing ceiling feed/support | Strong focus and clear annulus remain. Existing ceiling-feed/support contact is meaningful; do not invent missing mounts simply because a conduit runs below the roof. Keep cylindrical pods rather than adding cosmetic rectangular seams. |
| Service / Power | Four solid generators; existing floor service cabinets and clear maintenance aisle; CP3-C supported feeder/clamps/drops; egress guides and unchanged emergency signs | Industrial utility identity and route are coherent. Focus corrections on the disconnected wall case, duplicate vent layers and operating-height logic. Do not relocate generator bodies or alter signs. |

## Preferred approval order

1. **Avoid misleading collision/cover:** H02, H08, E01.
2. **Resolve priority presentation targets:** H01/H03/H04, R01, S01, P02/P03.
3. **Repair actual mechanical installation:** F01, D01, H05/H06/H07, C01/C02.
4. **Optional functional polish:** P04, after deciding whether the upper bay is
   passive/status equipment or intended manual switchgear.

These are selectable review IDs, not authorization to implement the whole list.
Some overlap: F01 supplies the mounting rule for R01/C01/P02; H01/H02 should be
treated as one intake-host arrangement rather than separate decoration changes.

Any approved implementation must preserve CP2-R shell/doors, CP3-B corrected
equipment/room signs/mounts, all mission anchors and gun behavior, existing solids
and cover behavior, Squad/Infested traversal, eight light slots, source-light
architecture, cached/batched rendering and deterministic construction. Visual
objects should fit existing collision instead of acquiring new solids. Retire
redundant legacy parts after their original construction stream, not by shifting
seeded generation. Mounting corrections must not become a new decoration pass.

## Stop and repository state

The CP3-C work remains uncommitted and visually unaccepted. HEAD remains `c0bb414`;
the staging index is empty. Existing modifications to `src/world/facility.js` and
`MILESTONE-4.2-ENVIRONMENT.md` are the pre-existing CP3-C work, not review-session
implementation. Credits.txt, existing tests and unrelated untracked work remain
unchanged. New files from this review are confined to `_playtest/m42/cp3cr-20261012/`.

**Await approval of the proposed correction IDs. Do not implement, commit, push,
merge or begin CP3-D from this inspection session.**
