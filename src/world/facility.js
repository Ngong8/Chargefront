/* Abandoned facility boundary. Loaded as a classic script so chargefront.html
   remains playable directly from file:// (ES module imports of local files are
   blocked by several browsers). No world geometry is built during movement. */
(function (global) {
    'use strict';

    const MAP_SEGMENTS = Object.freeze([[330, 618, 352, 618], [368, 618, 390, 618], [330, 618, 330, 660], [390, 618, 390, 636], [390, 652, 390, 660], [330, 660, 352, 660], [368, 660, 390, 660], [342, 660, 342, 684], [378, 660, 378, 684], [342, 684, 352, 684], [368, 684, 378, 684]]);
    const LAB_MAP_SEGMENTS = Object.freeze([[330, 690, 352, 690], [368, 690, 390, 690], [330, 684, 330, 795], [330, 795, 410, 795], [410, 735, 410, 746], [410, 758, 410, 795], [390, 684, 390, 735], [410, 746, 450, 746], [410, 758, 450, 758]]);
    const NAV_BLOCK = Object.freeze({ x0: 325, y0: 612, x1: 415, y1: 799 });
    const BYPASS_WEST = Object.freeze({ x: 285, y: 585 });
    const BYPASS_EAST = Object.freeze({ x: 450, y: 570 });

    function navigationWaypoint(fromX, fromY, targetX, targetY, intersectsRect) {
        const block = NAV_BLOCK;
        const fromInside = fromX > block.x0 && fromX < block.x1 && fromY > block.y0 && fromY < block.y1;
        const targetInside = targetX > block.x0 && targetX < block.x1 && targetY > block.y0 && targetY < block.y1;
        if (fromInside || targetInside || !intersectsRect(fromX, fromY, targetX, targetY, block.x0, block.y0, block.x1, block.y1)) return null;
        const targetWest = targetX < (block.x0 + block.x1) / 2;
        const handoffY = 12;
        if (fromX <= block.x0) return !targetWest && fromY <= BYPASS_WEST.y + handoffY ? BYPASS_EAST : BYPASS_WEST;
        if (fromX >= block.x1) return targetWest && fromY <= BYPASS_EAST.y + handoffY ? BYPASS_WEST : BYPASS_EAST;
        return targetWest ? BYPASS_WEST : BYPASS_EAST;
    }

    function create({ THREE, getScene, box, addWallPanel, addSolid, addRotatedSolid, SOLIDS, makeSeam, sound, denied, getTime, envBoxGeometry, envMat, envBoxMesh, envBox, envPipe, mat, colors, terrainHeight, addBudgetLight, makeFacilitySign, makeInfestedTree, makeSpecimenTube, rand, vec2 }) {
        const sections = new Map(); // retained roots and solids; no scene traversal on the update path
        const doors = [], cutawayMeshes = [], referenceLights = [];
        const fx = { dust: null, dustBase: null, screens: [], powerStrips: [], labIndicators: [] };
        let zones = null;
        let fxUpdateT = 0, fxAccum = 0, lastNearFacility;

        function buildSection(name, builder) {
            if (sections.has(name)) return sections.get(name);
            const scene = getScene();
            const objectStart = scene.children.length, solidStart = SOLIDS.length;
            builder();
            const section = { objects: scene.children.slice(objectStart), solids: SOLIDS.slice(solidStart) };
            sections.set(name, section);
            return section;
        }

        function buildShell() {
            buildSection('shell', () => {
                const scene = getScene();
                const H = 9, fx = 360, trim = 0x77809a, wallC = 0x565a6e;
                const seg = (x0, y0, x1, y1, h, col) => {
                    const horiz = Math.abs(y1 - y0) < 0.001;
                    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
                    const w = horiz ? Math.abs(x1 - x0) : 2;
                    const d = horiz ? 2 : Math.abs(y1 - y0);
                    return addWallPanel(cx, cy, w, d, h, col || wallC);
                };
                // Only the actual building and lab-access facade: no old compound enclosure.
                seg(330, 690, 352, 690, H + 1);
                seg(368, 690, 390, 690, H + 1);
                const stripe = box(14, 1.6, 0.4, 0xd8b322, makeSeam(0xd8b322, 0.4));
                stripe.position.set(fx, 610, H + 0.6); scene.add(stripe);
                for (const x of [351.2, 368.8]) {
                    const gatePost = box(0.7, 0.65, 7.2, 0x69748d, { metalness: 0.72, roughness: 0.32 });
                    gatePost.position.set(x, 610, 3.6); scene.add(gatePost);
                }
                const gateHeader = box(17.6, 0.68, 0.72, 0x69748d, { metalness: 0.72, roughness: 0.32 });
                gateHeader.position.set(fx, 610, 7.15); scene.add(gateHeader);
                for (const [x, tilt] of [[347.7, -0.20], [372.3, 0.20]]) {
                    const panel = box(5.8, 0.22, 5.8, 0x394052, { metalness: 0.68, roughness: 0.38 });
                    panel.position.set(x, 610.65, 2.9); panel.rotation.z = tilt; scene.add(panel);
                    const panelLight = box(4.3, 0.08, 0.14, 0xff8b35, makeSeam(0xff5b1d, 1.4));
                    panelLight.position.set(x, 610.48, 4.7); panelLight.rotation.z = tilt; scene.add(panelLight);
                }
                const hx0 = 330, hx1 = 390, hy0 = 618, hy1 = 660;
                seg(hx0, hy0, 352, hy0, H, trim);
                seg(368, hy0, hx1, hy0, H, trim);
                seg(hx0, hy0, hx0, hy1, H, trim);
                seg(hx1, hy0, hx1, 636, H, trim);
                seg(hx1, 652, hx1, hy1, H, trim);
                seg(hx0, hy1, 352, hy1, H, trim);
                seg(368, hy1, hx1, hy1, H, trim);
                const hallRoof = box(hx1 - hx0, hy1 - hy0, 1.0, 0x333848, { metalness: 0.5, roughness: 0.5 });
                hallRoof.position.set((hx0 + hx1) / 2, (hy0 + hy1) / 2, H + 0.5); hallRoof.castShadow = true; scene.add(hallRoof);
                hallRoof.name = 'FacilityHallRoof'; cutawayMeshes.push(hallRoof);
                const hallFloor = box(hx1 - hx0, hy1 - hy0, 0.4, 0x3a3e4e, { metalness: 0.3, roughness: 0.6 });
                hallFloor.position.set((hx0 + hx1) / 2, (hy0 + hy1) / 2, 0.05); hallFloor.receiveShadow = true; scene.add(hallFloor);
                const vx0 = 342, vx1 = 378, vy1 = 684;
                seg(vx0, 660, vx0, vy1, H, trim);
                seg(vx1, 660, vx1, vy1, H, trim);
                seg(vx0, vy1, 352, vy1, H, trim);
                seg(368, vy1, vx1, vy1, H, trim);
                const vaultRoof = box(vx1 - vx0, vy1 - 660, 1.0, 0x333848, { metalness: 0.5, roughness: 0.5 });
                vaultRoof.position.set((vx0 + vx1) / 2, (660 + vy1) / 2, H + 0.5); vaultRoof.castShadow = true; scene.add(vaultRoof);
                vaultRoof.name = 'FacilityVaultRoof'; cutawayMeshes.push(vaultRoof);
                const vaultFloor = box(vx1 - vx0, vy1 - 660, 0.4, 0x3a3e4e, { metalness: 0.3, roughness: 0.6 });
                vaultFloor.position.set((vx0 + vx1) / 2, (660 + vy1) / 2, 0.05); vaultFloor.receiveShadow = true; scene.add(vaultFloor);
            });
        }

        function buildHall(position, containment) {
            const scene = getScene(), H = 9;
            buildShell();
            // Mission code owns pickup/progression; the facility owns the cradle.
            const px = containment.x, py = containment.y;
            const tube = makeSpecimenTube();
            tube.group.scale.setScalar(0.6);
            tube.group.position.set(px, py, 0);
            scene.add(tube.group);
            const solid = addSolid(px - 1.45, py - 1.45, px + 1.45, py + 1.45, 3.5, 0);
            // Revealed in M3: source data for persistent light slots, not an
            // additional rendered PointLight or a chapter-time shader variant.
            addBudgetLight(tube.light);
            buildHallEquipment(scene, H);
            buildHallServiceYard(scene, H, position.x, position.y);
            buildHallInterior(scene, H, px, py);
            return { group: tube.group, light: tube.light, tube, solid };
        }

        function buildHallEquipment(scene, H) {
            const device = (gx, gy, w, d, h, col, opts) => {
                const m = box(w, d, h, col, Object.assign({ metalness: 0.4, roughness: 0.6 }, opts));
                m.position.set(gx, gy, h / 2); m.castShadow = true; m.receiveShadow = true;
                scene.add(m);
                addSolid(gx - w / 2, gy - d / 2, gx + w / 2, gy + d / 2, h, 0);
                return m;
            };
            for (let i = 0; i < 3; i++) {
                const ry = 626 + i * 12;
                device(334, ry, 1.8, 2.6, 2.6, 0x22252e);
                const lights = box(0.5, 2.2, 0.24, 0x66ccff, makeSeam(0x33aaff, 1.1));
                lights.position.set(335.2, ry, 1.7); scene.add(lights);
            }
            for (let i = 0; i < 2; i++) {
                const cy = 626 + i * 24;
                device(386, cy, 1.4, 2.6, 1.3, 0x2a2e3a);
                const screen = box(0.2, 1.8, 0.9, 0x66e0ff, makeSeam(0x2ab0d0, 0.9));
                screen.position.set(385.2, cy, 1.35); scene.add(screen);
            }
            device(336, 622, 3.0, 3.2, 2.0, 0x4a4e60);
            const genLight = box(0.4, 0.4, 0.4, 0x66ffcc, makeSeam(0x33ffaa, 1.3));
            genLight.position.set(336, 622, 2.1); scene.add(genLight);
            for (let i = 0; i < 2; i++) {
                const tx2 = 342 + i * 36, ty2 = 656;
                const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.0, 10), mat(0x5a4a3a, { metalness: 0.4, roughness: 0.5 }));
                tank.rotation.x = Math.PI / 2; tank.position.set(tx2, ty2, 1.5); tank.castShadow = true; scene.add(tank);
                addSolid(tx2 - 1, ty2 - 1, tx2 + 1, ty2 + 1, 3.0, 0);
                const valve = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), mat(0xffcc66, makeSeam(0xffaa33, 1.2)));
                valve.position.set(tx2, ty2, 3.1); scene.add(valve);
            }
            for (let i = 0; i < 3; i++) {
                const py2 = 628 + i * 14;
                const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 56, 8), mat(0x4a4e60, { metalness: 0.5, roughness: 0.5 }));
                pipe.rotation.z = Math.PI / 2; pipe.position.set(360, py2, 7.4); scene.add(pipe);
            }
            const hallLightPos = [[344, 630], [360, 626], [376, 630], [352, 652], [368, 652]];
            for (let i = 0; i < hallLightPos.length; i++) {
                const lp = hallLightPos[i];
                const panel = box(1.4, 0.5, 0.12, 0xfff2cc, makeSeam(0xffdd88, 1.5));
                panel.position.set(lp[0], lp[1], H - 0.4); scene.add(panel);
                const lgt = new THREE.PointLight(0xffeebb, 24, 36, 1.8);
                lgt.position.set(lp[0], lp[1], H - 0.8); scene.add(lgt);
            }
            for (let i = 0; i < 5; i++) {
                const y = 621 + i * 8;
                const westRib = box(0.18, 1.4, 6.8, 0x343a4c, { metalness: 0.62, roughness: 0.42 });
                westRib.position.set(331.1, y, 3.4); scene.add(westRib);
                const eastRib = box(0.18, 1.4, 6.8, 0x343a4c, { metalness: 0.62, roughness: 0.42 });
                eastRib.position.set(388.9, y, 3.4); scene.add(eastRib);
                const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 4.0 + (i % 2) * 1.6, 6), mat(0x171922, { metalness: 0.45, roughness: 0.65 }));
                cable.rotation.x = Math.PI / 2; cable.position.set(333.0, y + 0.5, 6.4); cable.rotation.z = i % 2 ? 0.22 : -0.16; scene.add(cable);
            }
            for (const [x, y, rot] of [[350, 640, 0.48], [367, 636, -0.72], [377, 651, 0.18]]) {
                const beam = box(9.0, 0.36, 0.36, 0x414858, { metalness: 0.72, roughness: 0.45 });
                beam.position.set(x, y, 1.55); beam.rotation.z = rot; scene.add(beam);
                const spar = box(2.0, 0.26, 0.24, 0x735c3c, { metalness: 0.45, roughness: 0.62 });
                spar.position.set(x + 1.1, y - 0.45, 0.48); spar.rotation.z = rot + 0.6; scene.add(spar);
            }
            for (const [x, y] of [[332.0, 634], [388.0, 650]]) {
                const warningPanel = box(0.12, 3.4, 1.1, 0xffa13e, makeSeam(0xff591b, 1.7));
                warningPanel.position.set(x, y, 4.1); scene.add(warningPanel);
                for (let j = -1; j <= 1; j++) {
                    const stripeDecal = box(0.13, 0.28, 0.9, 0x241d23, { metalness: 0.25, roughness: 0.85 });
                    stripeDecal.position.set(x + (x < 360 ? 0.07 : -0.07), y + j * 0.85, 4.1); stripeDecal.rotation.z = 0.38; scene.add(stripeDecal);
                }
            }
            const signCanvas = document.createElement('canvas');
            signCanvas.width = 512; signCanvas.height = 128;
            const signCtx = signCanvas.getContext('2d');
            signCtx.fillStyle = '#17131d'; signCtx.fillRect(0, 0, 512, 128);
            signCtx.strokeStyle = '#ff9e42'; signCtx.lineWidth = 10; signCtx.strokeRect(8, 8, 496, 112);
            signCtx.fillStyle = '#ffe1a4'; signCtx.font = 'bold 42px sans-serif'; signCtx.textAlign = 'center'; signCtx.textBaseline = 'middle'; signCtx.fillText('BIOHAZARD // QUARANTINE', 256, 68);
            const signTexture = new THREE.CanvasTexture(signCanvas);
            const bioSign = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.9), new THREE.MeshBasicMaterial({ map: signTexture, transparent: true }));
            bioSign.rotation.x = Math.PI / 2; bioSign.position.set(360, 619.05, 4.8); scene.add(bioSign);
            const serviceSign = makeFacilitySign('SERVICE // MAINTENANCE', 8.4, '#ffb24d');
            serviceSign.rotation.x = Math.PI / 2; serviceSign.position.set(342, 619.0, 6.35); scene.add(serviceSign);
            const commandSign = makeFacilitySign('COMMAND // SECURITY', 8.0, '#66d8ff');
            commandSign.rotation.x = Math.PI / 2; commandSign.position.set(382, 659.82, 6.35); scene.add(commandSign);
            const labSign = makeFacilitySign('BIO-LAB // 3-RELAY LOCK', 10.5, '#ff6655');
            labSign.rotation.x = Math.PI / 2; labSign.position.set(360, 659.78, 7.35); scene.add(labSign);
            const sensorSign = makeFacilitySign('SENSORS // INTEL', 5.8, '#66d8ff');
            sensorSign.rotation.y = -Math.PI / 2; sensorSign.position.set(331.18, 630, 5.55); scene.add(sensorSign);
            const supplySign = makeFacilitySign('SUPPLY // FIELD GEAR', 6.2, '#ffb24d');
            supplySign.rotation.y = Math.PI / 2; supplySign.position.set(388.82, 626, 5.55); scene.add(supplySign);
            for (let i = 0; i < 3; i++) {
                const indicator = box(1.5, 0.12, 0.24, 0xff5544, makeSeam(0xff2211, 1.25));
                indicator.position.set(357.8 + i * 2.2, 659.64, 5.85); scene.add(indicator); fx.labIndicators.push(indicator.material);
            }
            const vaultLight = new THREE.PointLight(0xccbbff, 18, 32, 1.8);
            vaultLight.position.set(360, 672, 6.0); scene.add(vaultLight);
        }

        function buildHallServiceYard(scene, H, fxPos, fyPos) {
            const tx = fxPos + 40, ty = fyPos + 22;
            const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.6, 26, 6), mat(0x4a4e60, { metalness: 0.5, roughness: 0.5 }));
            tower.rotation.x = Math.PI / 2; tower.position.set(tx, ty, 13); tower.castShadow = true; scene.add(tower);
            const towerTip = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), mat(0xff5566, makeSeam(0xff2233, 1.2)));
            towerTip.position.set(tx, ty, 27); scene.add(towerTip);
            addSolid(tx - 1, ty - 1, tx + 1, ty + 1, 26, 0);

            const wallTrim = (x0, y0, x1, y1) => {
                const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
                const horiz = Math.abs(y1 - y0) < 0.001;
                const w = (horiz ? Math.abs(x1 - x0) : 2) - 0.5;
                const d = (horiz ? 2 : Math.abs(y1 - y0)) - 0.5;
                const t = box(w, d, 0.18, 0xd8b322, makeSeam(0xd8b322, 0.5));
                t.position.set(cx, cy, H + 1.15); scene.add(t);
            };
            wallTrim(330, 690, 352, 690);
            wallTrim(368, 690, 390, 690);

            // Recessed panels belong to real walls; no artificial enclosure.
            const exteriorPanels = [[341, 618, 20, 0.16], [379, 618, 20, 0.16], [330, 639, 0.16, 38], [390, 639, 0.16, 38], [341, 690, 20, 0.16], [379, 690, 20, 0.16]];
            for (const p of exteriorPanels) {
                const horizontal = p[2] > p[3];
                const panel = box(p[2], p[3], 2.5, 0x3e4658, { metalness: 0.68, roughness: 0.42 });
                panel.position.set(p[0], p[1], 4.2); scene.add(panel);
                const conduit = box(horizontal ? Math.max(2, p[2] - 3) : 0.10, horizontal ? 0.10 : Math.max(2, p[3] - 3), 0.16, 0x6f7f9e, makeSeam(0x173c72, 0.75));
                conduit.position.set(p[0], p[1] + (horizontal ? -0.12 : 0), 6.2); scene.add(conduit);
            }
            const contCol = 0x5a4a3a;
            const container = (cx, cy, rot, w, d, h) => {
                const c = box(w, d, h, contCol, { roughness: 0.9, metalness: 0.1 });
                c.position.set(cx, cy, h / 2); c.rotation.z = rot; c.castShadow = true; c.receiveShadow = true;
                scene.add(c);
                const stripe = box(w - 0.4, 0.4, 0.14, 0xd8b322, makeSeam(0xd8b322, 0.5));
                stripe.position.set(cx, cy, h + 0.07); stripe.rotation.z = rot; scene.add(stripe);
                addRotatedSolid(cx, cy, w, d, rot, h, 0);
            };
            container(424, 700, 0.06, 5.2, 2.6, 2.8);
            container(418, 693, -0.04, 5.2, 2.6, 2.8);
            container(427, 706, 0.02, 4.0, 2.4, 2.6);
            container(296, 690, 0.4, 4.0, 2.4, 2.6);

            const pylon = (cx, cy, h, r) => {
                const p = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.72, r, h, 6), mat(0x4a4e60, { metalness: 0.5, roughness: 0.5 }));
                p.rotation.x = Math.PI / 2; p.position.set(cx, cy, h / 2); p.castShadow = true; scene.add(p);
                addSolid(cx - r * 0.6, cy - r * 0.6, cx + r * 0.6, cy + r * 0.6, h, 0);
            };
            pylon(296, 660, 6.0, 1.0);
            pylon(426, 650, 6.0, 1.0);
            pylon(430, 688, 7.0, 0.9);

            const wreck = new THREE.Group();
            const wBody = box(3.6, 1.3, 1.4, 0x3a3a46, { metalness: 0.5, roughness: 0.6 });
            wBody.position.set(0, 0, 0.7); wreck.add(wBody);
            const wCabin = box(1.7, 1.0, 1.1, 0x2a2a34, { metalness: 0.4, roughness: 0.6 });
            wCabin.position.set(-0.7, 0, 1.4); wreck.add(wCabin);
            for (let i = 0; i < 3; i++) {
                const wl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat(0x1a1a22));
                wl.position.set(-1 + i * 1.5, -0.9, 0.42); wreck.add(wl);
            }
            wreck.position.set(fxPos + 68, fyPos - 54, 0);
            wreck.rotation.z = 0.85;
            scene.add(wreck);
            addRotatedSolid(fxPos + 68, fyPos - 54, 3.8, 1.5, 0.85, 1.8, 0);

            for (let i = 0; i < 5; i++) {
                const a = rand(Math.PI * 2), r = rand(46, 72);
                const sx = fxPos + Math.cos(a) * r, sy = fyPos + Math.sin(a) * r;
                const patch = new THREE.Mesh(new THREE.SphereGeometry(rand(0.6, 1.2), 7, 6), mat(0xcc44ff, { emissive: 0xaa22ff, emissiveIntensity: 1.4, roughness: 0.4 }));
                patch.position.set(sx, sy, 0.35); scene.add(patch);
                const patchLight = new THREE.PointLight(0xaa44ff, 12, 30, 1.8);
                patchLight.position.set(sx, sy, 1.2); scene.add(patchLight);
            }
        }

        function buildHallInterior(scene, H, px, py) {
            addDoor(360, 618, 'x', 8, 9, H);
            addDoor(360, 660, 'x', 8, 9, H, 'bio_lab');
            addDoor(390, 644, 'y', 8, 9, H);
            const pillar = (x, y) => {
                const p = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, H, 6), mat(0x4a5268, { metalness: 0.55, roughness: 0.4 }));
                p.rotation.x = Math.PI / 2; p.position.set(x, y, H / 2); p.castShadow = true; scene.add(p);
            };
            for (const c of [[331.5, 619.5], [388.5, 619.5], [331.5, 658.5], [388.5, 658.5], [343.5, 661.5], [376.5, 661.5], [343.5, 682.5], [376.5, 682.5]]) pillar(c[0], c[1]);

            const wallScreen = (x, y, w, h, flip) => {
                const off = flip ? -0.1 : 0.1;
                const frame = box(0.14, w, h, 0x22262e, { metalness: 0.5, roughness: 0.5 });
                frame.position.set(x + off, y, 4.2); scene.add(frame);
                const scr = box(0.18, w - 0.3, h - 0.3, 0x66e0ff, makeSeam(0x2ab0d0, 1.3));
                scr.position.set(x + off * 1.1, y, 4.2); scene.add(scr);
                fx.screens.push({ mat: scr.material, base: 1.3, seed: rand(Math.PI * 2) });
            };
            wallScreen(331, 624, 1.7, 1.2, false);
            wallScreen(331, 633, 1.7, 1.2, false);
            wallScreen(389, 642, 1.7, 1.2, true);
            const sconce = (x, y) => {
                const off = x < 360 ? 0.12 : -0.12;
                const strip = box(0.14, 0.2, 0.95, 0x66d8ff, makeSeam(0x2ab0d0, 1.6));
                strip.position.set(x + off, y, 2.6); scene.add(strip);
                const lgt = new THREE.PointLight(0x2ab0d0, 11, 18, 1.8);
                lgt.position.set(x + off * 2.6, y, 2.7); scene.add(lgt);
            };
            sconce(331, 628); sconce(331, 646);
            sconce(389, 634); sconce(389, 652);

            const genPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 8, 8), mat(0x6a6f88, { metalness: 0.7, roughness: 0.35 }));
            genPipe.rotation.x = Math.PI / 2; genPipe.position.set(336, 644, 1.0); scene.add(genPipe);
            const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 12), mat(0x22262e, { metalness: 0.6, roughness: 0.4 }));
            gauge.rotation.x = Math.PI / 2; gauge.position.set(336, 623.6, 1.9); scene.add(gauge);
            const gaugeFace = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 12), mat(0x66ffcc, makeSeam(0x33ffaa, 1.5)));
            gaugeFace.rotation.x = Math.PI / 2; gaugeFace.position.set(336, 623.4, 1.9); scene.add(gaugeFace);

            const toppled = box(1.8, 2.5, 1.2, 0x1e222c, { metalness: 0.5, roughness: 0.55 });
            toppled.position.set(337, 656, 0.9); toppled.rotation.z = 1.35; toppled.castShadow = true; scene.add(toppled);
            addSolid(335.5, 654.5, 338.5, 657.5, 1.4, 0);
            for (const [bx, by, br] of [[377, 655, 0.35], [380, 656, -0.2]]) {
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.0, 8), mat(0x6a5a3a, { metalness: 0.5, roughness: 0.5 }));
                barrel.rotation.x = Math.PI / 2; barrel.position.set(bx, by, 0.5); barrel.rotation.z = br; barrel.castShadow = true; scene.add(barrel);
                const band = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.1, 8), mat(0xd8b322, makeSeam(0xd8b322, 0.3)));
                band.rotation.x = Math.PI / 2; band.position.set(bx, by, 0.5); scene.add(band);
                addSolid(bx - 0.5, by - 0.5, bx + 0.5, by + 0.5, 1.1, 0);
            }

            const floorRing = new THREE.Mesh(new THREE.RingGeometry(2.7, 3.0, 32), mat(0x66ffcc, { emissive: 0x22ffaa, emissiveIntensity: 1.2, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide }));
            floorRing.rotation.x = Math.PI / 2; floorRing.position.set(px, py, 0.22); scene.add(floorRing);
            fx.vaultFloorRing = floorRing; // persistent material for first-gameplay prewarm
            wallScreen(343, 668, 1.7, 1.2, false);
            wallScreen(343, 676, 1.7, 1.2, false);
            wallScreen(377, 668, 1.7, 1.2, true);
            wallScreen(377, 676, 1.7, 1.2, true);
            sconce(343, 672); sconce(377, 672);
            const vaultNorthPanel = box(26, 0.14, 1.1, 0x22262e, { metalness: 0.5, roughness: 0.5 });
            vaultNorthPanel.position.set(360, 682.9, 4.4); scene.add(vaultNorthPanel);
            const vaultNorthGlow = box(24, 0.18, 0.5, 0x66e0ff, makeSeam(0x2ab0d0, 1.3));
            vaultNorthGlow.position.set(360, 682.8, 4.4); scene.add(vaultNorthGlow);
            fx.screens.push({ mat: vaultNorthGlow.material, base: 1.3, seed: rand(Math.PI * 2) });

            const ceilingBeam = (x, y, horiz, len) => {
                const m = box(horiz ? len : 0.5, horiz ? 0.5 : len, 0.4, 0x2e3442, { metalness: 0.6, roughness: 0.4 });
                m.position.set(x, y, 8.1); m.castShadow = true; scene.add(m);
            };
            ceilingBeam(360, 624, true, 54);
            ceilingBeam(360, 652, true, 54);
            ceilingBeam(340, 639, false, 40);
            ceilingBeam(380, 639, false, 40);
            ceilingBeam(360, 670, true, 30);
            ceilingBeam(352, 672, false, 22);
            ceilingBeam(368, 672, false, 22);
            const ceilingDrop = (x, y) => {
                const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), mat(0x171922, { metalness: 0.45, roughness: 0.65 }));
                cable.rotation.x = Math.PI / 2; cable.position.set(x, y, 7.9); scene.add(cable);
                const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(0x66d8ff, makeSeam(0x2ab0d0, 1.4)));
                lamp.position.set(x, y, 7.0); scene.add(lamp);
            };
            ceilingDrop(348, 630); ceilingDrop(372, 642); ceilingDrop(356, 668);

            const floorPlate = (x, y, w, d) => {
                const p = box(w, d, 0.06, 0x2e3442, { metalness: 0.5, roughness: 0.6 });
                p.position.set(x, y, 0.3); p.receiveShadow = true; scene.add(p);
            };
            floorPlate(338, 632, 6, 4); floorPlate(382, 646, 6, 4);
            floorPlate(360, 664, 8, 4);
            const floorStripe = (x, y, horiz, len) => {
                const s = box(horiz ? len : 0.3, horiz ? 0.3 : len, 0.05, 0xd8b322, makeSeam(0xd8b322, 0.55));
                s.position.set(x, y, 0.29); scene.add(s);
            };
            floorStripe(360, 619.2, true, 14);
            floorStripe(360, 659.8, true, 14);
            const lane = box(0.9, 38, 0.05, 0x2a6a8a, { emissive: 0x1a4a6a, emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.6 });
            lane.position.set(360, 638, 0.28); scene.add(lane);
            const zoneStrip = (x, y, w, d, color, base = 0.9) => {
                const strip = box(w, d, 0.055, color, { emissive: color, emissiveIntensity: base, metalness: 0.25, roughness: 0.58 });
                strip.position.set(x, y, 0.31); scene.add(strip); fx.powerStrips.push({ mat: strip.material, base, color }); return strip;
            };
            zoneStrip(332.2, 639, 0.16, 36, 0xffa64d, 0.72);
            zoneStrip(387.8, 639, 0.16, 36, 0x66cfff, 0.8);
            zoneStrip(342, 625, 12, 0.22, 0xffa64d, 0.85);
            zoneStrip(381, 645, 10, 0.22, 0x66cfff, 0.95);
            zoneStrip(360, 657.5, 15, 0.24, 0xff5b4d, 1.05);
            for (const y of [626, 638, 650]) {
                const seam = box(54, 0.08, 0.06, 0x566477, { emissive: 0x20364f, emissiveIntensity: 0.45, metalness: 0.45, roughness: 0.55 });
                seam.position.set(360, y, 0.32); scene.add(seam);
            }

            const n = 160;
            const arr = new Float32Array(n * 3);
            for (let i = 0; i < n; i++) {
                const inHall = Math.random() < 0.72;
                arr[i * 3] = inHall ? 332 + rand(56) : 344 + rand(32);
                arr[i * 3 + 1] = inHall ? 620 + rand(38) : 662 + rand(20);
                arr[i * 3 + 2] = rand(0.4, H - 0.4);
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
            const dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xcfe2ff, size: 0.07, transparent: true, opacity: 0.45, depthWrite: false }));
            dust.name = 'facilityDust';
            scene.add(dust);
            fx.dust = dust;
            fx.dustBase = arr.slice();
        }

        function buildInteriorIdentity() {
            const root = new THREE.Group(); root.name = 'InteriorIdentity'; getScene().add(root);
            const placed = (x, y, w, d, h, color, opts = {}) => {
                const mesh = new THREE.Mesh(envBoxGeometry(w, d, h), envMat(color, Object.assign({ metalness: 0.55, roughness: 0.45 }, opts)));
                mesh.rotation.x = Math.PI / 2;
                mesh.position.set(x, y, h / 2); mesh.castShadow = false; mesh.receiveShadow = false; root.add(mesh);
                return mesh;
            };
            const doorFrame = (x, y, horiz, color) => {
                const span = 9.2;
                for (const s of [-1, 1]) {
                    if (horiz) placed(x + s * span / 2, y, 0.4, 0.6, 8.6, 0x2a3040, { metalness: 0.7, roughness: 0.35 });
                    else placed(x, y + s * span / 2, 0.6, 0.4, 8.6, 0x2a3040, { metalness: 0.7, roughness: 0.35 });
                }
                const glow = horiz ? placed(x, y, span, 0.16, 0.24, color, makeSeam(color, 1.5)) : placed(x, y, 0.16, span, 0.24, color, makeSeam(color, 1.5));
                glow.position.z = 8.7;
            };
            doorFrame(360, 618, true, colors.service);
            doorFrame(390, 644, false, colors.service);
            doorFrame(360, 660, true, colors.bio);
            doorFrame(360, 690, true, colors.lab);
            doorFrame(360, 735, true, colors.service);
            doorFrame(410, 752, false, colors.crisis);
            for (const y of [640, 646, 652]) placed(386.4, y, 0.9, 2.0, 1.1, 0x2a2e3a, { metalness: 0.5, roughness: 0.5 });
            placed(386.2, 646, 0.12, 4.6, 0.7, colors.comms, makeSeam(colors.comms, 1.1)).position.z = 1.35;
            for (let i = 0; i < 3; i++) {
                const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6), mat(colors.service, { metalness: 0.6, roughness: 0.4, emissive: colors.service, emissiveIntensity: 0.35 }));
                pipe.rotation.x = Math.PI / 2; pipe.position.set(337.6 + i * 0.34, 648, 1.4); root.add(pipe);
            }
            placed(334.6, 645, 0.8, 5.0, 1.4, 0x3a3f4b, { metalness: 0.5, roughness: 0.55 });
            for (const y of [628, 634, 655]) {
                placed(388.6, y, 0.5, 2.2, 1.6, 0x2f3542, { metalness: 0.6, roughness: 0.45 });
                placed(388.4, y, 0.12, 1.6, 0.16, colors.service, makeSeam(colors.service, 1.2)).position.z = 1.0;
                placed(388.4, y, 0.12, 1.6, 0.16, colors.comms, makeSeam(colors.comms, 0.9)).position.z = 0.6;
            }
            placed(360, 658.2, 15, 0.16, 0.18, colors.bio, makeSeam(colors.bio, 0.8)).position.z = 0.34;
        }

        function buildExpansion(missionId) {
            const scene = getScene();
            const shared = new THREE.Group(), deadSignal = new THREE.Group(), powerThrough = new THREE.Group();
            deadSignal.visible = missionId === 'dead_signal'; powerThrough.visible = missionId === 'power_through';
            scene.add(shared, deadSignal, powerThrough);
            const sharedSolids = [], deadSignalSolids = [];
            const placedBox = (group, x, y, w, d, h, color, opts = {}, solids = null) => {
                const mesh = box(w, d, h, color, Object.assign({ metalness: 0.55, roughness: 0.5 }, opts));
                mesh.position.set(x, y, terrainHeight(x, y) + h / 2); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
                if (solids) solids.push(addSolid(x - w / 2, y - d / 2, x + w / 2, y + d / 2, terrainHeight(x, y) + h, terrainHeight(x, y)));
                return mesh;
            };
            const floodlight = (group, x, y, color) => {
                placedBox(group, x, y, 0.35, 0.35, 5.5, 0x465064);
                const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat(color, makeSeam(color, 2.1)));
                lamp.position.set(x, y, terrainHeight(x, y) + 5.8); group.add(lamp);
                const light = new THREE.PointLight(color, 26, 62, 1.9);
                light.position.copy(lamp.position); group.add(addBudgetLight(light));
            };

            placedBox(shared, 338, 600, 7, 5, 3.2, 0x4c5868, {}, sharedSolids);
            placedBox(shared, 338, 597.4, 5.4, 0.18, 1.1, 0x78d8ff, makeSeam(0x2d9bd8, 1.1));
            placedBox(shared, 311, 595, 14, 8, 0.35, 0x343b47);
            placedBox(shared, 305, 594, 4.8, 2.4, 1.45, 0x657082, {}, sharedSolids);
            placedBox(shared, 317, 594, 4.8, 2.4, 1.45, 0x657082, {}, sharedSolids);
            placedBox(shared, 434, 621, 8, 7, 3.4, 0x485364, {}, sharedSolids);
            for (let i = 0; i < 3; i++) placedBox(shared, 430 + i * 4, 614, 2.6, 2.6, 2.1, 0x596579, {}, sharedSolids);
            for (const [x, y] of [[329, 605], [391, 605], [421, 630], [299, 612]]) floodlight(shared, x, y, 0x8acfff);
            const statusMast = placedBox(shared, 405, 600, 0.5, 0.5, 8.5, 0x424c5c);
            const statusLights = [];
            for (let i = 0; i < 3; i++) {
                const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), mat(0xff5544, makeSeam(0xff2211, 1.8)));
                lamp.position.set(405, 600, terrainHeight(405, 600) + 5.8 + i * 1.05); shared.add(lamp); statusLights.push(lamp.material);
            }

            for (const [x, y, w, d, r] of [[319, 575, 2.2, 22, 0.08], [424, 585, 2.2, 22, -0.1]]) {
                const barrier = placedBox(deadSignal, x, y, w, d, 1.5, 0x5a4d45);
                barrier.rotation.z = r;
                deadSignalSolids.push(...addRotatedSolid(x, y, d, w, r + Math.PI / 2, terrainHeight(x, y) + 1.5, terrainHeight(x, y)));
                for (let j = -1; j <= 1; j++) placedBox(deadSignal, x, y + j * 6, w + 0.12, 1.1, 0.22, 0xff9b35, makeSeam(0xff5b1f, 1.2));
            }
            for (const solid of deadSignalSolids) solid.disabled = missionId !== 'dead_signal';
            for (const [x, y, rot] of [[326, 566, 0.45], [416, 596, -0.55], [322, 585, -0.3]]) {
                const beam = placedBox(deadSignal, x, y, 7, 0.7, 0.7, 0x363d48);
                beam.rotation.z = rot;
            }

            placedBox(powerThrough, 333, 579, 12, 8, 3.3, 0x42566a, {}, null);
            placedBox(powerThrough, 333, 574.9, 8, 0.16, 1.0, 0xffbf55, makeSeam(0xff7d22, 1.4));
            placedBox(powerThrough, 390, 578, 8, 6, 2.5, 0x566172, {}, null);
            for (const [x, y] of [[345, 573], [375, 573], [345, 589], [375, 589]]) floodlight(powerThrough, x, y, 0xffbd55);
            const routeBoard = placedBox(powerThrough, 382, 589, 5.8, 0.35, 3.2, 0x303a49);
            const routeGlow = placedBox(powerThrough, 382, 588.78, 4.8, 0.08, 2.2, 0x70c8ff, makeSeam(0x258fdd, 1.35));
            for (const [x, y] of [[346, 585], [393, 588], [325, 586]]) placedBox(powerThrough, x, y, 3.2, 2.1, 1.2, 0x75633d, {}, null);

            const shortcutField = placedBox(powerThrough, 455, 625, 0.35, 20, 4.2, 0xff754f, { emissive: 0xff321c, emissiveIntensity: 1.15, transparent: true, opacity: 0.62 });
            const shortcutSolid = addSolid(454.6, 615, 455.4, 635, terrainHeight(455, 625) + 4.2, terrainHeight(455, 625));
            shortcutSolid.disabled = missionId !== 'power_through';
            const shortcutLights = [];
            for (const y of [613.5, 636.5]) {
                placedBox(powerThrough, 455, y, 1.2, 1.2, 6.4, 0x465064);
                const light = placedBox(powerThrough, 454.35, y, 0.18, 0.7, 0.75, 0xff754f, makeSeam(0xff321c, 1.8));
                shortcutLights.push(light.material);
            }
            const shortcutLane = placedBox(powerThrough, 423.5, 634.5, 66, 0.3, 0.07, 0x66cfff, makeSeam(0x2288cc, 0.75));
            shortcutLane.rotation.z = Math.atan2(644 - 625, 392 - 455);
            zones = { shared, dead_signal: deadSignal, power_through: powerThrough, deadSignalSolids, sharedSolids, statusLights, statusMast, routeBoard, routeGlow, shortcut: { field: shortcutField, solid: shortcutSolid, lights: shortcutLights, lane: shortcutLane } };
        }

        function buildExteriorDetail(gamma) {
            const root = new THREE.Group(); root.name = 'FacilityExterior'; getScene().add(root);
            const H = 10;
            const placed = (x, y, w, d, h, color, opts = {}) => {
                const mesh = new THREE.Mesh(envBoxGeometry(w, d, h), envMat(color, Object.assign({ metalness: 0.55, roughness: 0.5 }, opts)));
                mesh.rotation.x = Math.PI / 2;
                mesh.position.set(x, y, h / 2); mesh.castShadow = false; mesh.receiveShadow = false; root.add(mesh);
                return mesh;
            };
            const pillarSpots = [[331, 619], [389, 619], [331, 659], [389, 659], [343, 683], [377, 683], [351, 689], [369, 689]];
            const pillarMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.85, H + 1.6, 0.85), mat(0x3e4658, { metalness: 0.55, roughness: 0.5 }), pillarSpots.length);
            const trimMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.92, 0.16, 0.92), mat(colors.comms, makeSeam(colors.comms, 0.55)), pillarSpots.length);
            const rotX = new THREE.Matrix4().makeRotationX(Math.PI / 2), inst = new THREE.Matrix4();
            for (let i = 0; i < pillarSpots.length; i++) {
                const [px, py] = pillarSpots[i];
                inst.makeTranslation(px, py, (H + 1.6) / 2); pillarMesh.setMatrixAt(i, inst.multiply(rotX));
                inst.makeTranslation(px, py, H + 0.9); trimMesh.setMatrixAt(i, inst.multiply(rotX));
            }
            pillarMesh.computeBoundingSphere(); trimMesh.computeBoundingSphere();
            root.add(pillarMesh, trimMesh);
            const vent = (x, y, horiz) => {
                placed(x, y, horiz ? 2.4 : 0.3, horiz ? 0.3 : 2.4, 1.2, 0x2a3040, { metalness: 0.7, roughness: 0.4 });
                placed(x, y, horiz ? 1.8 : 0.14, horiz ? 0.14 : 1.8, 0.8, 0x101722, { metalness: 0.4, roughness: 0.8 });
            };
            const utilityBox = (x, y, lamp) => {
                placed(x, y, 1.2, 0.8, 1.0, 0x4a5361, { metalness: 0.6, roughness: 0.42 });
                placed(x, y, 1.0, 0.14, 0.2, lamp, makeSeam(lamp, 1.4));
            };
            vent(338, 616.5, true); vent(382, 616.5, true);
            vent(328.5, 642, false); vent(391.5, 650, false);
            envPipe(root, 331, 616.7, 351, 616.7, 2.5, 0.1, 0x6f7f9e, 0.5);
            envPipe(root, 369, 616.7, 389, 616.7, 2.5, 0.1, 0x6f7f9e, 0.5);
            envPipe(root, 328.5, 620, 328.5, 658, 2.3, 0.09, 0x6f7f9e, 0.45);
            envPipe(root, 391.5, 620, 391.5, 635, 2.7, 0.09, 0x6f7f9e, 0.45);
            envPipe(root, 391.5, 653, 391.5, 658, 2.7, 0.09, 0x6f7f9e, 0.45);
            envPipe(root, 331, 685.4, 351, 685.4, 3.1, 0.1, 0x6f7f9e, 0.5);
            envPipe(root, 369, 685.4, 389, 685.4, 3.1, 0.1, 0x6f7f9e, 0.5);
            for (const [x, y, c] of [[334, 616.5, colors.comms], [391.4, 657, colors.service], [382, 685.5, colors.bio]]) utilityBox(x, y, c);
            const hallRoofHousing = placed(360, 639, 18, 12, 3.0, 0x2e3442, { metalness: 0.55, roughness: 0.5 });
            const hallRoofCap = placed(360, 639, 14, 8, 1.0, 0x3e4658, { metalness: 0.6, roughness: 0.45 });
            hallRoofHousing.position.z = H + 2.0; hallRoofCap.position.z = H + 4.0;
            cutawayMeshes.push(hallRoofHousing, hallRoofCap);
            for (const [x, y] of [[352, 636], [368, 642]]) {
                const rv = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 8), mat(0x4a5361, { metalness: 0.6, roughness: 0.4 }));
                rv.rotation.x = Math.PI / 2; rv.position.set(x, y, H + 4.9); root.add(rv); cutawayMeshes.push(rv);
            }
            const vaultRoofHousing = placed(360, 672, 14, 10, 2.2, 0x2e3442, { metalness: 0.55, roughness: 0.5 });
            const vaultRoofCap = placed(360, 672, 10, 6, 0.9, 0x3e4658, { metalness: 0.6, roughness: 0.45 });
            vaultRoofHousing.position.z = H + 1.6; vaultRoofCap.position.z = H + 3.1;
            cutawayMeshes.push(vaultRoofHousing, vaultRoofCap);
            placed(342, 608.5, 2.4, 0.2, 2.0, 0x394052, { metalness: 0.68, roughness: 0.4 }).rotation.z = 0.16;
            placed(342, 608.3, 2.0, 0.1, 0.18, colors.crisis, makeSeam(colors.crisis, 1.6)).rotation.z = 0.16;
            placed(432, 668, 9, 6, 0.7, 0x343b47, { metalness: 0.4, roughness: 0.65 });
            for (const [x, y] of [[429, 665], [435, 671], [430, 672]]) {
                placed(x, y, 1.8, 1.8, 1.6, 0x5a4a3a, { metalness: 0.35, roughness: 0.72 });
                placed(x, y, 1.5, 1.5, 0.14, colors.hazard, makeSeam(colors.hazard, 0.6));
            }
            const craneMast = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 8, 6), mat(0x4a5361, { metalness: 0.65, roughness: 0.4 }));
            craneMast.rotation.x = Math.PI / 2; craneMast.position.set(437, 674, 4); root.add(craneMast);
            envPipe(root, 437, 674, 428, 662, 7.6, 0.2, 0x4a5361, 0.1);
            const sign = (text, x, y, z, w, color, face) => {
                const s = makeFacilitySign(text, w, color);
                s.material.side = THREE.DoubleSide;
                if (face === 'y') s.rotation.x = Math.PI / 2; else s.rotation.y = Math.PI / 2;
                s.position.set(x, y, z); root.add(s); return s;
            };
            sign('ABANDONED FACILITY // BIO-RESEARCH', 360, 607.6, 8.1, 12, '#66d8ff', 'y');
            sign('LOADING // SERVICE YARD', 415.4, 668, 7.0, 9, '#ffb24d', 'x');
            sign('STAGING // FORWARD DEPLOYMENT', 360, 576.8, 6.4, 12, '#ffbf55', 'y');
            const marking = (x, y, w, d) => {
                const m = envBoxMesh(w, d, 0.06, colors.service, makeSeam(colors.service, 0.5));
                m.position.set(x, y, terrainHeight(x, y) + 0.16); root.add(m); return m;
            };
            for (let i = 0; i < 4; i++) marking(360 + (i - 1.5) * 2.4, 592 - i * 3, 0.5, 2.2);
            marking(360, 585, 10, 0.5);
            const bypassPoints = [{ x: 285, y: 690 }, BYPASS_WEST, BYPASS_EAST, gamma];
            for (let i = 0; i < bypassPoints.length - 1; i++) {
                const a = bypassPoints[i], b = bypassPoints[i + 1];
                const angle = Math.atan2(b.y - a.y, b.x - a.x);
                for (const t of [0.22, 0.5, 0.78]) {
                    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
                    const dash = envBoxMesh(4.2, 0.28, 0.06, colors.comms, makeSeam(colors.comms, 0.55));
                    dash.position.set(x, y, terrainHeight(x, y) + 0.17); dash.rotation.z = angle; root.add(dash);
                }
            }
            envBox(root, 304, 626, 6.0, 0.55, 1.05, 0x5a4d45, { metalness: 0.42, roughness: 0.68 }, true);
            envBox(root, 420, 585, 5.2, 0.55, 1.05, 0x5a4d45, { metalness: 0.42, roughness: 0.68 }, true);
        }

        function buildLaboratory(securityPos, containmentPos) {
            const root = new THREE.Group(), emergency = new THREE.Group();
            root.name = 'DeepLaboratory'; emergency.name = 'ContainmentEmergency';
            root.visible = false; emergency.visible = false; getScene().add(root, emergency);
            const solids = [], emergencyMats = [], normalMats = [], lights = [];
            const placed = (group, x, y, w, d, h, color, opts = {}, collision = false) => {
                const mesh = box(w, d, h, color, Object.assign({ metalness: 0.5, roughness: 0.48 }, opts));
                mesh.position.set(x, y, h / 2); mesh.castShadow = h > 0.5; mesh.receiveShadow = true; group.add(mesh);
                if (collision) solids.push(addSolid(x - w / 2, y - d / 2, x + w / 2, y + d / 2, h, 0));
                return mesh;
            };
            const wall = (x, y, w, d) => placed(root, x, y, w, d, 9, 0x384354, {}, true);
            const strip = (group, x, y, w, d, color, intensity = 1.2, emergencyStrip = false) => {
                const mesh = placed(group, x, y, w, d, 0.07, color, { emissive: color, emissiveIntensity: intensity, metalness: 0.2, roughness: 0.5 });
                (emergencyStrip ? emergencyMats : normalMats).push(mesh.material);
                return mesh;
            };
            const sign = (text, x, y, z, width, color, axis = 'y') => {
                const mesh = makeFacilitySign(text, width, color);
                if (axis === 'y') mesh.rotation.x = Math.PI / 2; else mesh.rotation.y = Math.PI / 2;
                mesh.position.set(x, y, z); root.add(mesh); return mesh;
            };
            placed(root, 360, 710, 60, 52, 0.35, 0x242c39);
            placed(root, 370, 765, 80, 60, 0.35, 0x2b2638);
            placed(root, 410, 752, 40, 14, 0.35, 0x252d38);
            const researchCeiling = placed(root, 360, 710, 60, 52, 0.65, 0x1c222d);
            const containmentCeiling = placed(root, 370, 765, 80, 60, 0.65, 0x211b2a);
            const emergencyCeiling = placed(root, 410, 752, 40, 14, 0.65, 0x1c222d);
            researchCeiling.position.z = containmentCeiling.position.z = emergencyCeiling.position.z = 9.3;
            researchCeiling.name = 'ResearchCeiling';
            containmentCeiling.name = 'ContainmentCeiling';
            emergencyCeiling.name = 'EmergencyPassageCeiling';
            cutawayMeshes.push(researchCeiling, containmentCeiling, emergencyCeiling);
            wall(330, 710, 1.4, 52); wall(390, 710, 1.4, 52);
            wall(341, 735, 22, 1.4); wall(379, 735, 22, 1.4);
            wall(330, 765, 1.4, 60); wall(370, 795, 80, 1.4);
            wall(410, 740, 1.4, 10); wall(410, 764, 1.4, 10); wall(410, 782, 1.4, 26);
            wall(430, 746, 40, 1.4); wall(430, 758, 40, 1.4);
            const accessDoor = addDoor(360, 690, 'x', 8, 9, 9, 'lab_access');
            const securityDoor = addDoor(360, 735, 'x', 8, 9, 9, 'lab_security');
            const emergencyDoor = addDoor(410, 752, 'y', 7, 8, 9, 'lab_emergency');
            accessDoor.enabled = securityDoor.enabled = emergencyDoor.enabled = false;
            sign('ACCESS // DECONTAMINATION', 360, 690.82, 6.7, 10.5, '#66ddff');
            for (const y of [695, 701]) {
                for (const x of [340, 380]) placed(root, x, y, 0.5, 0.5, 7.8, 0x536174);
                placed(root, 360, y, 40, 0.35, 0.35, 0x66ddff, makeSeam(0x2288cc, 1.4));
                strip(root, 360, y + 1.2, 17, 0.18, 0x66ddff, 1.25);
            }
            for (const x of [348, 360, 372]) {
                const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 0.9, 7), mat(0x7891a5, { metalness: 0.72, roughness: 0.3 }));
                nozzle.rotation.x = Math.PI / 2; nozzle.position.set(x, 698, 7.8); root.add(nozzle);
            }
            for (const [x, y, color, intensity, distance] of [[360, 699, 0x75cfff, 16, 30], [356, 724, 0xaedfff, 14, 28], [360, 766, 0xff7aa5, 16, 30], [406, 752, 0xffa34d, 12, 24]]) {
                const light = new THREE.PointLight(color, intensity, distance, 1.7);
                light.position.set(x, y, 6.4); root.add(addBudgetLight(light)); lights.push({ light, color, intensity });
            }
            sign('RESEARCH // SAMPLE ZERO', 331.0, 710, 6.4, 9.5, '#b9e7ff', 'x');
            for (const y of [708, 720, 728]) {
                placed(root, 334, y, 4.5, 2.1, 1.35, 0x485565, {}, y !== 720);
                const screen = placed(root, 335.7, y, 0.12, 1.4, 0.62, 0x8edfff, makeSeam(0x2a8fc9, 1.2));
                fx.screens.push({ mat: screen.material, base: 1.2, seed: Math.random() * Math.PI * 2 });
            }
            for (const y of [706, 716, 726]) {
                const glass = placed(root, 389.18, y, 0.08, 6.4, 4.1, 0x79bfe8, { transparent: true, opacity: 0.2, emissive: 0x173d66, emissiveIntensity: 0.35, depthWrite: false });
                glass.renderOrder = 2;
                for (const z of [2.0, 5.7]) placed(root, 389.0, y, 0.2, 6.5, 0.14, 0xb4d8ef, makeSeam(0x3b7199, 0.65));
            }
            for (const [x, y, r] of [[348, 714, 0.35], [374, 707, -0.6], [382, 727, 0.18]]) {
                const wreck = placed(root, x, y, 4.4, 1.6, 0.9, 0x252d38); wreck.rotation.z = r;
                const sparks = placed(root, x + 1, y, 0.55, 0.2, 0.16, 0xff9b45, makeSeam(0xff4a1f, 1.5)); sparks.rotation.z = r;
            }
            const securityConsole = placed(root, securityPos.x, securityPos.y, 1.6, 1.0, 1.45, 0x4b5565, {}, true);
            const securityScreen = placed(root, securityPos.x, securityPos.y - 0.56, 1.25, 0.08, 0.66, 0xffa34d, makeSeam(0xff5d22, 1.45)); securityScreen.position.z = 1.42;
            const turretConsolePos = vec2(342, 711);
            const turretConsole = placed(root, turretConsolePos.x, turretConsolePos.y, 1.5, 1.0, 1.35, 0x44505f, {}, true);
            const turretConsoleScreen = placed(root, turretConsolePos.x, turretConsolePos.y - 0.56, 1.15, 0.08, 0.58, 0x66ccff, makeSeam(0x2266aa, 0.7)); turretConsoleScreen.position.z = 1.35;
            const turretPos = vec2(342, 744);
            const turretGroup = new THREE.Group(); turretGroup.position.set(turretPos.x, turretPos.y, 0); root.add(turretGroup);
            const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.0, 0.5, 8), mat(0x435061, { metalness: 0.7, roughness: 0.34 })); turretBase.rotation.x = Math.PI / 2; turretBase.position.z = 0.28; turretGroup.add(turretBase);
            const turretHead = box(1.25, 0.8, 0.62, 0x5b6878, { metalness: 0.72, roughness: 0.3 }); turretHead.position.z = 1.25; turretGroup.add(turretHead);
            const turretBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 2.2, 7), mat(0x7b8799, { metalness: 0.82, roughness: 0.25 })); turretBarrel.rotation.z = Math.PI / 2; turretBarrel.position.set(1.25, 0, 1.25); turretGroup.add(turretBarrel);
            const turretLamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 7, 6), mat(0xff6644, makeSeam(0xff2211, 1.5))); turretLamp.position.set(0.62, -0.42, 1.45); turretGroup.add(turretLamp);
            sign('CONTAINMENT // DNA ARCHIVE', 370, 794.15, 6.6, 11.0, '#ff6688');
            strip(root, 360, 716, 0.32, 43, 0xaedfff, 1.0);
            strip(root, 360, 761, 0.34, 50, 0xff5577, 1.25);
            strip(root, 397, 752, 26, 0.3, 0xffa04a, 1.0);
            for (const [x, y] of [[338, 746], [402, 746], [338, 782], [402, 782]]) {
                placed(root, x, y, 3.2, 2.2, 2.1, 0x3b3545, {}, true);
                const warning = placed(root, x, y - 1.2, 2.2, 0.12, 0.26, 0xff5577, makeSeam(0xff2244, 1.25)); emergencyMats.push(warning.material);
            }
            const field = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 6.5, 24, 1, true), mat(0x66eaff, { transparent: true, opacity: 0.13, emissive: 0x33aadd, emissiveIntensity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
            field.rotation.x = Math.PI / 2; field.position.set(containmentPos.x, containmentPos.y, 3.35); root.add(field);
            const chamberRing = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.14, 8, 28), mat(0x7eeeff, makeSeam(0x2abddd, 1.8)));
            chamberRing.position.set(containmentPos.x, containmentPos.y, 0.4); root.add(chamberRing);
            for (const x of [344, 376]) for (const y of [754, 782]) {
                const pod = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 4.5, 10), mat(0x5a465f, { metalness: 0.42, roughness: 0.4, emissive: 0x351847, emissiveIntensity: 0.4 }));
                pod.rotation.x = Math.PI / 2; pod.position.set(x, y, 2.3); root.add(pod); solids.push(addSolid(x - 1.1, y - 1.1, x + 1.1, y + 1.1, 4.5, 0));
            }
            for (const y of [694, 704, 724, 742, 760, 786]) strip(emergency, 360, y, 12, 0.22, 0xff3f35, 1.8, true);
            for (const [x, y, r] of [[395, 750, 0.45], [415, 752, -0.3], [405, 760, 0.75]]) {
                const debris = placed(emergency, x, y, 5.5, 0.7, 0.7, 0x332936); debris.rotation.z = r;
            }
            for (const [x, y] of [[335, 738], [405, 770], [386, 790]]) {
                const growth = makeInfestedTree(0.42); growth.position.set(x, y, 0); emergency.add(growth);
            }
            return {
                root, emergency, solids, emergencyMats, normalMats, lights, accessDoor, securityDoor, emergencyDoor,
                securityConsole: { group: securityConsole, screen: securityScreen, pos: securityPos.copy() },
                turretConsole: { group: turretConsole, screen: turretConsoleScreen, pos: turretConsolePos },
                turret: { group: turretGroup, head: turretHead, lamp: turretLamp, pos: turretPos, active: false, fireT: 0 },
                field, chamberRing,
            };
        }

        function addDoor(x, y, axis, gapHalf, panelW, panelH, id = '') {
            const scene = getScene();
            const door = { id, base: [x, y], axis, openT: 0, lastTarget: 0, denied: false, enabled: true, locked: false, forceOpen: false, panels: [] };
            for (const s of [-1, 1]) {
                const w = axis === 'x' ? panelW : 0.32, d = axis === 'x' ? 0.32 : panelW;
                const g = new THREE.Group();
                const panel = box(w, d, panelH, 0x3e4658, { metalness: 0.72, roughness: 0.34 });
                panel.castShadow = true; panel.receiveShadow = true; g.add(panel);
                const seam = box(axis === 'x' ? 0.14 : d + 0.06, axis === 'x' ? d + 0.06 : 0.14, panelH - 0.9, 0xff9e42, makeSeam(0xff6b24, 1.4));
                seam.position.set(axis === 'x' ? -s * (w * 0.5 - 0.1) : 0, axis === 'x' ? 0 : -s * (d * 0.5 - 0.1), 0);
                g.add(seam); g.position.z = panelH / 2;
                const offC = s * (gapHalf * 0.55), offO = s * (gapHalf + panelW * 0.5 + 0.4);
                if (axis === 'x') { g.position.x = x + offC; g.position.y = y; }
                else { g.position.x = x; g.position.y = y + offC; }
                scene.add(g); door.panels.push({ g, seam, s, offC, offO });
            }
            const solid = axis === 'x'
                ? { x0: x - gapHalf, y0: y - 0.5, x1: x + gapHalf, y1: y + 0.5, topY: panelH, bottomY: 0, disabled: false }
                : { x0: x - 0.5, y0: y - gapHalf, x1: x + 0.5, y1: y + gapHalf, topY: panelH, bottomY: 0, disabled: false };
            SOLIDS.push(solid); door.solid = solid; doors.push(door);
            return door;
        }

        function updateDoors(dt, player, squadMembers, labAccess, campaign) {
            for (const door of doors) {
                if (!door.enabled) {
                    door.solid.disabled = true;
                    for (const p of door.panels) p.g.visible = false;
                    continue;
                }
                for (const p of door.panels) p.g.visible = true;
                let near = Math.hypot(player.pos.x - door.base[0], player.pos.y - door.base[1]) < 4.2;
                if (!near) for (const m of squadMembers) {
                    if (!m.downed && Math.hypot(m.pos.x - door.base[0], m.pos.y - door.base[1]) < 4.2) { near = true; break; }
                }
                const locked = !!door.locked || (campaign && door.id === 'bio_lab' && !labAccess);
                if (door.id === 'bio_lab' || door.id.startsWith('lab_')) {
                    const color = locked ? 0xff5544 : 0x66ffcc;
                    for (const p of door.panels) {
                        p.seam.material.color.setHex(color); p.seam.material.emissive.setHex(locked ? 0xff2211 : 0x22cc99);
                        p.seam.material.emissiveIntensity = locked ? 1.15 + Math.sin(getTime() * 2.2) * 0.18 : 1.8;
                    }
                    if (near && locked && !door.denied) {
                        const text = door.id === 'lab_security' ? 'CONTAINMENT LOCKED — use the local security console'
                            : door.id === 'lab_emergency' ? 'MAINTENANCE PASSAGE SEALED' : 'BIO-LAB SEALED — inspect command records for lock status';
                        door.denied = true; denied(text); sound('accessDeny', 0.45);
                    } else if (!near) door.denied = false;
                }
                const target = door.forceOpen ? 1 : near && !locked ? 1 : 0;
                if (target !== door.lastTarget) { sound('slidingDoor', 0.55, 1, door.base[0], door.base[1]); door.lastTarget = target; }
                door.openT = Math.max(0, Math.min(1, door.openT + (target - door.openT) * Math.min(1, dt * 3.2)));
                door.solid.disabled = door.openT > 0.35;
                const t = door.openT * door.openT * (3 - 2 * door.openT);
                for (const p of door.panels) {
                    const off = p.offC + (p.offO - p.offC) * t;
                    if (door.axis === 'x') { p.g.position.x = door.base[0] + off; p.g.position.y = door.base[1]; }
                    else { p.g.position.x = door.base[0]; p.g.position.y = door.base[1] + off; }
                }
            }
        }

        function setShortcutState(open, stagingActive) {
            const shortcut = zones && zones.shortcut;
            if (!shortcut) return;
            shortcut.field.visible = stagingActive && !open; shortcut.solid.disabled = !stagingActive || open;
            for (const material of shortcut.lights) {
                material.color.setHex(open ? 0x66ffcc : 0xff754f);
                material.emissive.setHex(open ? 0x22cc99 : 0xff321c);
            }
            shortcut.lane.material.emissiveIntensity = open ? 1.6 : 0.35;
            if (zones.routeGlow) {
                zones.routeGlow.material.color.setHex(open ? 0x66ffcc : 0x70c8ff);
                zones.routeGlow.material.emissive.setHex(open ? 0x22cc99 : 0x258fdd);
                zones.routeGlow.material.emissiveIntensity = open ? 1.9 : 1.35;
            }
        }

        function applySnapshot({ missionId, stagingActive, relaysOnline, shortcutOpen }) {
            if (zones) {
                zones.dead_signal.visible = missionId === 'dead_signal';
                zones.power_through.visible = stagingActive;
                for (const solid of zones.deadSignalSolids) solid.disabled = missionId !== 'dead_signal';
                for (const material of zones.statusLights) {
                    material.color.setHex(relaysOnline ? 0x66ffcc : missionId === 'power_through' ? 0xffb84d : 0xff5544);
                    material.emissive.setHex(relaysOnline ? 0x22cc99 : missionId === 'power_through' ? 0xff6a1c : 0xff2211);
                }
            }
            setShortcutState(shortcutOpen, stagingActive);
            for (const material of fx.labIndicators) {
                material.color.setHex(relaysOnline ? 0x66ffcc : 0xff5544);
                material.emissive.setHex(relaysOnline ? 0x22cc99 : 0xff2211);
                material.emissiveIntensity = relaysOnline ? 1.8 : 1.25;
            }
        }

        // Retain the stabilized 12 Hz / 190 m gate: only existing buffer data and
        // material uniforms are updated here; no mesh, material or light is built.
        function updateFx(dt, time, viewX, viewY, localPower, emergency) {
            fxUpdateT -= dt; fxAccum += dt;
            if (fxUpdateT > 0) return null;
            fxUpdateT = 1 / 12;
            const elapsed = fxAccum; fxAccum = 0;
            const distance = Math.hypot(viewX - 360, viewY - 710);
            const nearFacility = distance < 190;
            const boundary = lastNearFacility !== nearFacility;
            lastNearFacility = nearFacility;
            if (fx.dust) fx.dust.visible = nearFacility;
            if (nearFacility && fx.dust && fx.dustBase) {
                const pos = fx.dust.geometry.attributes.position, base = fx.dustBase;
                for (let i = 0; i < pos.count; i++) {
                    pos.setXYZ(i,
                        base[i * 3] + Math.sin(time * 0.3 + i * 1.7) * 1.2,
                        base[i * 3 + 1] + Math.cos(time * 0.25 + i * 2.3) * 1.2,
                        base[i * 3 + 2] + Math.sin(time * 0.6 + i) * 0.8);
                }
                pos.needsUpdate = true;
            }
            if (nearFacility) {
                for (const s of fx.screens) {
                    const flick = 0.72 + Math.sin(time * (6 + s.seed) + s.seed * 13) * 0.22 + (Math.random() < 0.05 ? 0.45 : 0);
                    s.mat.emissiveIntensity = s.base * flick * (localPower ? 1 : 0.12);
                }
                for (let i = 0; i < fx.powerStrips.length; i++) {
                    const strip = fx.powerStrips[i];
                    strip.mat.color.setHex(emergency ? 0xff493d : strip.color);
                    strip.mat.emissive.setHex(emergency ? 0xff1f18 : strip.color);
                    strip.mat.emissiveIntensity = strip.base * (localPower ? (emergency ? 1.0 + Math.sin(time * 7 + i) * 0.55 : 0.9 + Math.sin(time * 1.4 + i) * 0.08) : 0.16);
                }
            }
            return { elapsed, nearFacility, boundary, distance };
        }

        return {
            buildSection, buildShell, buildHall, buildInteriorIdentity, buildExpansion, buildExteriorDetail, buildLaboratory, addDoor, updateDoors, setShortcutState, applySnapshot, updateFx,
            set zones(value) { zones = value; }, get zones() { return zones; },
            doors, cutawayMeshes, referenceLights, fx,
            sectionSummary() { return [...sections].map(([name, section]) => ({ name, objects: section.objects.length, solids: section.solids.length })); },
        };
    }

    global.ChargefrontFacility = Object.freeze({ create, navigationWaypoint, MAP_SEGMENTS, LAB_MAP_SEGMENTS, NAV_BLOCK, BYPASS_WEST, BYPASS_EAST });
})(globalThis);
