/* Abandoned facility boundary. Loaded as a classic script so chargefront.html
   remains playable directly from file:// (ES module imports of local files are
   blocked by several browsers). No world geometry is built during movement. */
(function (global) {
    'use strict';

    // South-to-north: staging hall, relay vault, decontamination and research.
    const MAP_SEGMENTS = Object.freeze([[330, 618, 352, 618], [368, 618, 390, 618], [330, 618, 330, 660], [390, 618, 390, 660], [330, 660, 352, 660], [368, 660, 390, 660], [342, 660, 342, 684], [378, 660, 378, 684], [342, 684, 352, 684], [368, 684, 378, 684], [330, 690, 352, 690], [368, 690, 390, 690]]);
    const LAB_MAP_SEGMENTS = Object.freeze([[330, 704, 352, 704], [368, 704, 390, 704], [330, 690, 330, 795], [390, 690, 390, 735], [367, 704, 367, 712], [367, 725, 367, 735], [330, 735, 352, 735], [368, 735, 410, 735], [330, 735, 330, 795], [330, 795, 410, 795], [410, 735, 410, 746], [410, 758, 410, 795], [410, 736, 450, 736], [410, 770, 450, 770], [450, 736, 450, 746], [450, 758, 450, 770]]);
    const NAV_BLOCK = Object.freeze({ x0: 325, y0: 612, x1: 455, y1: 799 });
    const BYPASS_WEST = Object.freeze({ x: 285, y: 585 });
    const BYPASS_EAST = Object.freeze({ x: 450, y: 570 });
    const FOUNDATION = Object.freeze([[330, 390, 618, 735], [330, 410, 735, 795], [410, 450, 736, 770]]);

    function foundationHeight(x, y, naturalHeight) {
        if (x <= 312 || x >= 468 || y <= 600 || y >= 813) return naturalHeight;
        let distance = Infinity;
        for (const [x0, x1, y0, y1] of FOUNDATION) {
            const dx = Math.max(x0 - x, 0, x - x1);
            const dy = Math.max(y0 - y, 0, y - y1);
            distance = Math.min(distance, Math.hypot(dx, dy));
        }
        // Flatten only the building foundation; blend to the original ground
        // over 18 m so the emergency exit and backyard have no abrupt ledge.
        if (distance >= 18) return naturalHeight;
        const t = distance / 18;
        return naturalHeight * t * t * (3 - 2 * t);
    }

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
                const H = 9, fx = 360, trim = 0x465064, wallC = 0x303747;
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
                const apron = box(16, 10, 0.12, 0x343b47, { metalness: 0.35, roughness: 0.7 });
                apron.position.set(fx, 613, 0.12); scene.add(apron);
                const stripe = box(18, 0.4, 0.18, 0xd8b322, makeSeam(0xd8b322, 0.7));
                stripe.position.set(fx, 610, H + 0.6); scene.add(stripe);
                for (const x of [351.2, 368.8]) {
                    const gatePost = box(0.7, 0.65, 7.2, 0x69748d, { metalness: 0.72, roughness: 0.32 });
                    gatePost.position.set(x, 610, 3.6); scene.add(gatePost);
                }
                const gateHeader = box(17.6, 0.68, 0.72, 0x69748d, { metalness: 0.72, roughness: 0.32 });
                gateHeader.position.set(fx, 610, 7.15); scene.add(gateHeader);
                for (const x of [349.1, 370.9]) {
                    const gateLamp = box(0.22, 0.22, 5.4, 0xffa84f, makeSeam(0xff8029, 1.2));
                    gateLamp.position.set(x, 610.45, 4.0); scene.add(gateLamp);
                }
                const hx0 = 330, hx1 = 390, hy0 = 618, hy1 = 660;
                seg(hx0, hy0, 352, hy0, H, trim);
                seg(368, hy0, hx1, hy0, H, trim);
                seg(hx0, hy0, hx0, hy1, H, trim);
                seg(hx1, hy0, hx1, hy1, H, trim).name = 'HallEastPerimeterWall';
                seg(hx0, hy1, 352, hy1, H, trim);
                seg(368, hy1, hx1, hy1, H, trim);
                const hallRoof = box(hx1 - hx0, hy1 - hy0, 1.0, 0x262d3b, { metalness: 0.5, roughness: 0.5 });
                hallRoof.position.set((hx0 + hx1) / 2, (hy0 + hy1) / 2, H + 0.5); hallRoof.castShadow = true; scene.add(hallRoof);
                hallRoof.name = 'FacilityHallRoof'; cutawayMeshes.push(hallRoof);
                const hallFloor = box(hx1 - hx0, hy1 - hy0, 0.4, 0x343a48, { metalness: 0.3, roughness: 0.6, emissive: 0x273342, emissiveIntensity: 0.32 });
                hallFloor.position.set((hx0 + hx1) / 2, (hy0 + hy1) / 2, 0.05); hallFloor.receiveShadow = true; scene.add(hallFloor);
                const vx0 = 342, vx1 = 378, vy1 = 684;
                seg(vx0, 660, vx0, vy1, H, trim);
                seg(vx1, 660, vx1, vy1, H, trim);
                seg(vx0, vy1, 352, vy1, H, trim);
                seg(368, vy1, vx1, vy1, H, trim);
                const vaultRoof = box(vx1 - vx0, vy1 - 660, 1.0, 0x333848, { metalness: 0.5, roughness: 0.5 });
                vaultRoof.position.set((vx0 + vx1) / 2, (660 + vy1) / 2, H + 0.5); vaultRoof.castShadow = true; scene.add(vaultRoof);
                vaultRoof.name = 'FacilityVaultRoof'; cutawayMeshes.push(vaultRoof);
                const vaultFloor = box(vx1 - vx0, vy1 - 660, 0.4, 0x303442, { metalness: 0.3, roughness: 0.6, emissive: 0x3b2d2d, emissiveIntensity: 0.28 });
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
                const lgt = new THREE.PointLight(0xffd09a, 90, 42, 1.7);
                lgt.position.set(lp[0], lp[1], H - 0.8); scene.add(addBudgetLight(lgt));
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
            // A clear central lane carries players and formations. Low cargo
            // stays by the walls, with collision matching the visible cover.
            for (const [x, y] of [[339, 640], [381, 632], [381, 653]]) {
                const cargo = new THREE.Mesh(envBoxGeometry(3.2, 2.4, 1.25), envMat(0x505569, { metalness: 0.4, roughness: 0.65 }));
                cargo.rotation.x = Math.PI / 2; cargo.position.set(x, y, 0.7); scene.add(cargo);
                addSolid(x - 1.6, y - 1.2, x + 1.6, y + 1.2, 1.3, 0);
                const latch = new THREE.Mesh(envBoxGeometry(2.8, 0.14, 0.1), envMat(0xe0a84a, makeSeam(0xe0a84a, 0.65)));
                latch.rotation.x = Math.PI / 2; latch.position.set(x, y, 1.33); scene.add(latch);
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
            signCtx.fillStyle = '#ffe1a4'; signCtx.font = 'bold 42px sans-serif'; signCtx.textAlign = 'center'; signCtx.textBaseline = 'middle'; signCtx.fillText('CHARGE FRONT // STAGING', 256, 68);
            const signTexture = new THREE.CanvasTexture(signCanvas);
            const bioSign = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.9), new THREE.MeshBasicMaterial({ map: signTexture, transparent: true }));
            bioSign.rotation.x = Math.PI / 2; bioSign.position.set(360, 619.05, 4.8); scene.add(bioSign);
            const serviceSign = makeFacilitySign('SERVICE // MAINTENANCE', 8.4, '#ffb24d');
            serviceSign.rotation.x = Math.PI / 2; serviceSign.position.set(342, 619.0, 6.35); scene.add(serviceSign);
            const commandSign = makeFacilitySign('COMMAND // SECURITY', 8.0, '#66d8ff');
            commandSign.rotation.x = Math.PI / 2; commandSign.position.set(382, 659.82, 6.35); scene.add(commandSign);
            const labSign = makeFacilitySign('VAULT // 3-RELAY LOCK', 10.5, '#ffb24d');
            labSign.rotation.x = Math.PI / 2; labSign.position.set(360, 659.78, 7.35); scene.add(labSign);
            const sensorSign = makeFacilitySign('SENSORS // INTEL', 5.8, '#66d8ff');
            sensorSign.rotation.y = -Math.PI / 2; sensorSign.position.set(331.18, 630, 5.55); scene.add(sensorSign);
            const supplySign = makeFacilitySign('SUPPLY // FIELD GEAR', 6.2, '#ffb24d');
            supplySign.rotation.y = Math.PI / 2; supplySign.position.set(388.82, 626, 5.55); scene.add(supplySign);
            for (let i = 0; i < 3; i++) {
                const indicator = box(1.5, 0.12, 0.24, 0xff5544, makeSeam(0xff2211, 1.25));
                indicator.position.set(357.8 + i * 2.2, 659.64, 5.85); scene.add(indicator); fx.labIndicators.push(indicator.material);
            }
            for (const x of [350, 360, 370]) {
                // Wall-side overhead housings are technical landmarks, not
                // uncollidable tall cover in the central firing lane.
                const relay = new THREE.Mesh(envBoxGeometry(2.2, 0.5, 1.8), envMat(0x242b39, { metalness: 0.7, roughness: 0.35 }));
                relay.rotation.x = Math.PI / 2; relay.position.set(x, 682.5, 6.8); scene.add(relay);
                const indicator = box(1.2, 0.12, 0.22, 0xff5544, makeSeam(0xff2211, 1.25));
                indicator.position.set(x, 682.18, 6.8); scene.add(indicator); fx.labIndicators.push(indicator.material);
            }
            for (const [x, y] of [[344, 661], [376, 661], [344, 683], [376, 683]]) {
                const guard = new THREE.Mesh(envBoxGeometry(1.2, 1.2, 8.5), envMat(0x252c3c, { metalness: 0.72, roughness: 0.36 }));
                guard.rotation.x = Math.PI / 2; guard.position.set(x, y, 4.25); scene.add(guard);
                const edge = new THREE.Mesh(envBoxGeometry(0.18, 1.25, 6.4), envMat(0xe0a84a, makeSeam(0xe0a84a, 1.15)));
                edge.rotation.x = Math.PI / 2; edge.position.set(x + (x < 360 ? 0.65 : -0.65), y, 3.8); scene.add(edge);
            }
            const vaultLight = new THREE.PointLight(0xffb76c, 105, 35, 1.7);
            vaultLight.position.set(360, 672, 6.0); scene.add(addBudgetLight(vaultLight));
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
                patchLight.position.set(sx, sy, 1.2); scene.add(addBudgetLight(patchLight));
            }
        }

        function buildHallInterior(scene, H, px, py) {
            addDoor(360, 618, 'x', 8, 9, H);
            addDoor(360, 660, 'x', 8, 9, H, 'bio_lab');
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
                const lgt = new THREE.PointLight(0x2ab0d0, 48, 23, 1.7);
                lgt.position.set(x + off * 2.6, y, 2.7); scene.add(addBudgetLight(lgt));
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
            // Repeated wall-mounted rack faces gather the existing loose cargo
            // into a logistics bay. They sit against solid walls, above low-cover
            // firing height, and do not introduce invisible floor obstacles.
            for (const [x, y] of [[331.25, 638], [331.25, 650], [388.75, 636], [388.75, 648]]) {
                placed(x, y, 0.16, 3.2, 2.7, 0x667383,
                    { emissive: 0x302b24, emissiveIntensity: 0.65, metalness: 0.4, roughness: 0.6 }).position.z = 4.2;
                for (const z of [3.3, 4.9]) placed(x + (x < 360 ? 0.1 : -0.1), y, 0.12, 3.0, 0.12,
                    colors.service, makeSeam(colors.service, 0.55)).position.z = z;
            }
            for (const x of [354, 366]) placed(x, 640, 0.12, 27, 0.06, colors.service,
                makeSeam(colors.service, 0.5)).position.z = 0.32;
            // Three matching cable feeds and warm lock panels read as one
            // protected relay system; the relay pads and center aisle stay open.
            for (const x of [350, 360, 370]) {
                placed(x, 672, 0.14, 13, 0.06, colors.service, makeSeam(colors.service, 0.7)).position.z = 0.32;
                placed(x, 682.12, 2.0, 0.1, 0.18, colors.bio, makeSeam(0x753452, 0.6)).position.z = 5.7;
            }
            for (const x of [343.15, 376.85]) for (const y of [668, 678]) {
                placed(x, y, 0.16, 4.0, 3.0, 0x566175,
                    { emissive: 0x282f3b, emissiveIntensity: 0.55, metalness: 0.55, roughness: 0.55 }).position.z = 4.2;
                placed(x + (x < 360 ? 0.1 : -0.1), y, 0.12, 3.6, 0.16,
                    colors.service, makeSeam(colors.service, 0.85)).position.z = 5.35;
            }
            placed(360, 658.2, 15, 0.16, 0.18, colors.bio, makeSeam(colors.bio, 0.8)).position.z = 0.34;
            // This group has no animated or gameplay-referenced meshes. Batch
            // matching static pieces once at build time, never on traversal.
            const batches = new Map();
            for (const mesh of root.children) {
                if (!mesh.isMesh || mesh.castShadow || mesh.receiveShadow) continue;
                const key = mesh.geometry.uuid + '/' + mesh.material.uuid;
                if (!batches.has(key)) batches.set(key, []);
                batches.get(key).push(mesh);
            }
            for (const group of batches.values()) {
                if (group.length < 2) continue;
                const instances = new THREE.InstancedMesh(group[0].geometry, group[0].material, group.length);
                instances.name = 'InteriorIdentityBatch';
                for (let i = 0; i < group.length; i++) {
                    group[i].updateMatrix();
                    instances.setMatrixAt(i, group[i].matrix);
                    root.remove(group[i]);
                }
                instances.computeBoundingSphere();
                root.add(instances);
            }
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
            // Yard guide follows the canonical front approach, never the
            // now-solid east Hall wall.
            const shortcutLane = placedBox(powerThrough, 423.5, 600, 56, 0.3, 0.07, 0x66cfff, makeSeam(0x2288cc, 0.75));
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
            const pillarSpots = [[331, 619], [389, 619], [331, 659], [389, 659], [343, 683], [377, 683], [331, 704], [389, 704], [331, 734], [409, 735], [331, 793], [409, 793], [449, 737], [449, 769]];
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
            envPipe(root, 331, 690.5, 351, 690.5, 3.1, 0.1, 0x6f7f9e, 0.5);
            envPipe(root, 369, 690.5, 389, 690.5, 3.1, 0.1, 0x6f7f9e, 0.5);
            envPipe(root, 329, 706, 329, 731, 5.8, 0.12, 0x6f7f9e, 0.5);
            envPipe(root, 331, 796, 408, 796, 6.8, 0.12, 0x6f7f9e, 0.5);
            envPipe(root, 419, 772, 447, 772, 6.5, 0.12, 0x6f7f9e, 0.5);
            for (const [x, y, c] of [[334, 616.5, colors.comms], [391.4, 657, colors.service], [382, 690.5, colors.bio], [329, 714, colors.lab], [449, 763, colors.crisis]]) utilityBox(x, y, c);
            vent(328.8, 712, false); vent(411.2, 780, false); vent(437, 771.2, true);
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
            for (const [x, y, w, d, height] of [[358, 717, 18, 9, 2.1], [370, 769, 21, 12, 2.6], [431, 752, 14, 8, 1.9]]) {
                const housing = placed(x, y, w, d, height, 0x303848, { metalness: 0.55, roughness: 0.5 });
                const cap = placed(x, y, w - 2, d - 2, 0.5, 0x48566a, { metalness: 0.65, roughness: 0.43 });
                housing.position.z = H + height * 0.5; cap.position.z = H + height + 0.45;
                cutawayMeshes.push(housing, cap);
            }
            // Break the flat roof silhouette without changing any walls or
            // walkable space. All static pieces share the environment caches;
            // roof pieces follow the existing cutaway toggle.
            const roofPiece = (x, y, w, d, h, z, color, opts) => {
                const piece = placed(x, y, w, d, h, color, opts);
                piece.position.z = z; cutawayMeshes.push(piece); return piece;
            };
            const roofSteel = { metalness: 0.6, roughness: 0.45 };
            const roofDark = { metalness: 0.7, roughness: 0.4 };
            const roofGlow = makeSeam(colors.comms, 0.65);
            for (const [x, y, w, d] of [[341, 618, 20, 0.8], [379, 618, 20, 0.8],
                [330, 639, 0.8, 41], [390, 627, 0.8, 17], [390, 656, 0.8, 8],
                [342, 795, 24, 0.8], [397, 795, 24, 0.8], [430, 770, 38, 0.8]]) {
                roofPiece(x, y, w, d, 0.85, 10.45, 0x3e4658, roofSteel);
            }
            // Repeated HVAC banks, short raised duct runs and a small antenna
            // cluster give the hall, containment and power wing separate profiles.
            for (const [x, y] of [[344, 645], [377, 645], [343, 772], [397, 772], [432, 758]]) {
                roofPiece(x, y, 5.0, 3.2, 1.3, 10.75, 0x4a5361, roofSteel);
                roofPiece(x, y, 4.2, 2.4, 0.16, 11.48, 0x101722, roofDark);
                for (const dy of [-0.7, 0, 0.7]) roofPiece(x, y + dy, 3.6, 0.2, 0.2, 11.59, 0x5b6878, roofSteel);
            }
            for (const [x, y, w, d] of [[360, 645, 27, 0.65], [370, 780, 42, 0.65], [430, 744, 22, 0.65]]) {
                roofPiece(x, y, w, d, 0.6, 10.65, 0x333b46, roofSteel);
                roofPiece(x, y, w, 0.13, 0.12, 11.02, colors.comms, roofGlow);
            }
            for (const [x, y, h] of [[422, 750, 5], [438, 749, 3.5]]) {
                roofPiece(x, y, 0.35, 0.35, h, 10.1 + h / 2, 0x5b6878, roofSteel);
                roofPiece(x, y, 1.8, 0.14, 0.14, 10.1 + h - 0.5, colors.comms, roofGlow);
            }
            // Facade-mounted structure and wayfinding sit above head height:
            // no new ground solids, lane obstructions or local PointLights.
            placed(360, 616.8, 19, 2.2, 0.65, 0x3e4658, roofSteel).position.z = 9.25;
            placed(360, 615.63, 17, 0.16, 0.23, colors.service, makeSeam(colors.service, 0.8)).position.z = 9.18;
            for (const x of [348, 372]) {
                placed(x, 617.3, 0.65, 0.7, 3.4, 0x4a5361, roofSteel).position.z = 7.0;
                placed(x, 616.88, 0.14, 0.14, 2.2, colors.comms, roofGlow).position.z = 7.0;
            }
            for (const [x, y, z, w, d] of [[329.1, 718, 6.7, 0.3, 10], [410.9, 782, 6.7, 0.3, 10], [450.9, 762, 6.7, 0.3, 8]]) {
                placed(x, y, w, d, 0.35, 0x5b6878, roofSteel).position.z = z;
                placed(x, y, w, d, 0.12, colors.comms, roofGlow).position.z = z - 0.3;
            }
            for (const [x, y, w, d, color] of [[330, 716, 0.2, 22, colors.lab], [330, 780, 0.2, 23, colors.bio], [450, 740, 0.2, 5, colors.crisis], [450, 766, 0.2, 5, colors.crisis], [429, 736, 28, 0.2, colors.service]]) {
                const edge = placed(x, y, w, d, 0.16, color, makeSeam(color, 0.9));
                edge.position.z = 8.3;
            }
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
            sign('CF-07 // BIO-RESEARCH', 360, 607.6, 8.1, 12, '#66d8ff', 'y');
            sign('LOADING // SERVICE YARD', 415.4, 668, 7.0, 9, '#ffb24d', 'x');
            // Keep the staging board at the edge of the approach, not in front
            // of the primary CF-07 entrance sign from the south-facing view.
            sign('STAGING // FORWARD DEPLOYMENT', 316, 576.8, 6.4, 12, '#ffbf55', 'y');
            sign('POWER // EMERGENCY EGRESS', 430, 770.85, 6.0, 10, '#ffb24d', 'y');
            const marking = (x, y, w, d) => {
                const m = envBoxMesh(w, d, 0.06, colors.service, makeSeam(colors.service, 0.5));
                m.position.set(x, y, terrainHeight(x, y) + 0.16); root.add(m); return m;
            };
            for (let i = 0; i < 4; i++) marking(360 + (i - 1.5) * 2.4, 592 - i * 3, 0.5, 2.2);
            marking(360, 585, 10, 0.5);
            for (const x of [351, 369]) for (const y of [599, 605]) {
                const guide = placed(x, y, 0.24, 3.0, 0.06, colors.service, makeSeam(colors.service, 0.5));
                guide.position.z = terrainHeight(x, y) + 0.16;
            }
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
                const materialOpts = Object.assign({ metalness: 0.5, roughness: 0.48 }, opts);
                // Shared structural geometry/materials; emissive controls keep
                // independent materials for mission-state and FX animation.
                const mesh = new THREE.Mesh(envBoxGeometry(w, d, h), opts.emissive !== undefined ? mat(color, materialOpts) : envMat(color, materialOpts));
                mesh.rotation.x = Math.PI / 2;
                mesh.position.set(x, y, h / 2); mesh.castShadow = h > 0.5; mesh.receiveShadow = true; group.add(mesh);
                if (collision) solids.push(addSolid(x - w / 2, y - d / 2, x + w / 2, y + d / 2, h, 0));
                return mesh;
            };
            // Static, non-colliding dressing uses the shared environment caches.
            // Keep it flush with existing walls or atop already-solid benches;
            // unlike the animated laboratory strips, these materials never vary.
            const detailBatches = new Map();
            const detail = (name, x, y, w, d, h, z, color, opts = {}) => {
                const geometry = envBoxGeometry(w, d, h);
                const material = envMat(color, Object.assign({ metalness: 0.35, roughness: 0.6 }, opts));
                const key = name + '/' + geometry.uuid + '/' + material.uuid;
                if (!detailBatches.has(key)) detailBatches.set(key, { name, geometry, material, positions: [] });
                detailBatches.get(key).positions.push([x, y, z]);
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
            placed(root, 360, 710, 60, 52, 0.35, 0x344354, { emissive: 0x28415a, emissiveIntensity: 0.33 });
            placed(root, 360, 696, 60, 17, 0.08, 0x344b57, { emissive: 0x204c62, emissiveIntensity: 0.25 }).position.z = 0.26;
            placed(root, 378.5, 719, 22, 30, 0.08, 0x303e50, { emissive: 0x244b65, emissiveIntensity: 0.32 }).position.z = 0.27;
            placed(root, 370, 765, 80, 60, 0.35, 0x38334b, { emissive: 0x43314e, emissiveIntensity: 0.33 });
            placed(root, 430, 753, 40, 34, 0.35, 0x354151, { emissive: 0x483a2b, emissiveIntensity: 0.3 });
            const researchCeiling = placed(root, 360, 710, 60, 52, 0.65, 0x1c222d);
            const containmentCeiling = placed(root, 370, 765, 80, 60, 0.65, 0x211b2a);
            const emergencyCeiling = placed(root, 430, 753, 40, 34, 0.65, 0x1c222d);
            researchCeiling.position.z = containmentCeiling.position.z = emergencyCeiling.position.z = 9.3;
            researchCeiling.name = 'ResearchCeiling';
            containmentCeiling.name = 'ContainmentCeiling';
            emergencyCeiling.name = 'EmergencyPassageCeiling';
            cutawayMeshes.push(researchCeiling, containmentCeiling, emergencyCeiling);
            wall(330, 710, 1.4, 52); wall(390, 710, 1.4, 52);
            wall(341, 704, 22, 1.4); wall(379, 704, 22, 1.4);
            wall(367, 708, 1.0, 8); wall(367, 730, 1.0, 10);
            wall(341, 735, 22, 1.4); wall(379, 735, 22, 1.4);
            // Research ends at x390; Containment extends to x410. Close that
            // 20 m north-perimeter return with the same 1.4 m thick, 9 m high
            // wall as its neighbors, including a height-aware collision solid.
            wall(400, 735, 20, 1.4).name = 'ContainmentNorthReturnWall';
            wall(330, 765, 1.4, 60); wall(370, 795, 80, 1.4);
            wall(410, 740, 1.4, 10); wall(410, 764, 1.4, 10); wall(410, 782, 1.4, 26);
            wall(430, 736, 40, 1.4); wall(430, 770, 40, 1.4);
            wall(450, 741, 1.4, 10); wall(450, 764, 1.4, 12);
            const accessDoor = addDoor(360, 690, 'x', 8, 9, 9, 'lab_access');
            const securityDoor = addDoor(360, 735, 'x', 8, 9, 9, 'lab_security');
            const emergencyDoor = addDoor(410, 752, 'y', 7, 8, 9, 'lab_emergency');
            const serviceDoor = addDoor(450, 752, 'y', 6, 7, 9, 'lab_emergency_exit');
            accessDoor.enabled = securityDoor.enabled = emergencyDoor.enabled = serviceDoor.enabled = false;
            sign('ACCESS // DECONTAMINATION', 360, 690.82, 6.7, 10.5, '#66ddff');
            sign('RESEARCH // ANALYSIS', 360, 704.82, 6.7, 9.5, '#66ddff');
            for (const y of [690.8, 703.2]) {
                for (const x of [351.6, 368.4]) {
                    placed(root, x, y, 0.75, 0.75, 8.6, 0x252f3e);
                    strip(root, x + (x < 360 ? 0.42 : -0.42), y, 0.16, 0.8, 0x66ddff, 1.45).position.z = 4.0;
                }
                strip(root, 360, y, 16.8, 0.32, 0x66ddff, 1.5).position.z = 8.4;
            }
            for (const y of [695, 701]) {
                for (const x of [340, 380]) placed(root, x, y, 0.5, 0.5, 7.8, 0x536174);
                placed(root, 360, y, 40, 0.35, 0.35, 0x66ddff, makeSeam(0x2288cc, 1.4));
                strip(root, 360, y + 1.2, 17, 0.18, 0x66ddff, 1.25);
                for (const x of [334, 386]) {
                    placed(root, x, y, 2.6, 3.0, 2.1, 0x354858, {}, true);
                    const readout = placed(root, x + (x < 360 ? 1.36 : -1.36), y, 0.1, 1.6, 0.6, 0x66ddff, makeSeam(0x2288cc, 1.1));
                    readout.position.z = 1.8;
                }
            }
            for (const x of [348, 360, 372]) {
                const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 0.9, 7), mat(0x7891a5, { metalness: 0.72, roughness: 0.3 }));
                nozzle.rotation.x = Math.PI / 2; nozzle.position.set(x, 698, 7.8); root.add(nozzle);
            }
            for (const x of [331.05, 388.95]) for (const y of [695, 701]) {
                detail('DeconWallPanel', x, y, 0.12, 3.8, 2.4, 3.8, 0x8196a5,
                    { emissive: 0x365e71, emissiveIntensity: 0.8, metalness: 0.2, roughness: 0.72 });
                detail('DeconStatus', x + (x < 360 ? 0.08 : -0.08), y, 0.12, 2.8, 0.13, 5.15,
                    0x83e2ee, makeSeam(0x348ca9, 0.9));
            }
            for (const y of [692, 702]) detail('DeconThreshold', 360, y, 17, 0.18, 0.05, 0.34,
                0x88d9ed, makeSeam(0x276e91, 0.65));
            // Emergency state preserves cool fill in decon/research and at the
            // specimen. Security/exit sources retain the pulsing red warning.
            for (const [x, y, color, intensity, distance, emergencyColor] of [[360, 699, 0x75cfff, 125, 39, 0x75cfff], [356, 724, 0xaedfff, 130, 44, 0xaedfff], [378, 718, 0xffbb70, 105, 32, 0xff493d], [360, 748, 0x84bfff, 105, 40, 0x84bfff], [360, 774, 0xff88bb, 150, 48, 0xbfeeff], [406, 752, 0xffa34d, 115, 39, 0xffa34d], [436, 752, 0xffa34d, 110, 36, 0xff493d]]) {
                const light = new THREE.PointLight(color, intensity, distance, 1.7);
                light.position.set(x, y, 6.4); root.add(addBudgetLight(light)); lights.push({ light, color, intensity, emergencyColor });
            }
            sign('RESEARCH // SAMPLE ZERO', 331.0, 710, 6.4, 9.5, '#b9e7ff', 'x');
            sign('SECURITY // OPERATIONS', 389.0, 717, 6.4, 8.5, '#ffb24d', 'x');
            for (const y of [711, 726]) {
                const wallPanel = placed(root, 331.0, y, 0.12, 4.8, 2.8, 0x426981,
                    { emissive: 0x255e85, emissiveIntensity: 0.8 });
                wallPanel.position.z = 4.1;
            }
            for (const y of [707, 731]) {
                strip(root, 367, y, 0.18, 5.5, 0x66ddff, 1.1).position.z = 6.8;
            }
            for (const y of [712, 722]) {
                const station = placed(root, 384, y, 4.0, 2.2, 1.4, 0x414c5d, {}, true);
                station.name = 'SecurityWorkstation';
                const display = placed(root, 383.7, y, 0.15, 1.4, 1.05, 0x8edfff, makeSeam(0x2a8fc9, 1.2));
                display.position.z = 2.2;
                fx.screens.push({ mat: display.material, base: 1.2, seed: rand(Math.PI * 2) });
            }
            for (const y of [710, 716, 722, 728]) {
                placed(root, 387.7, y, 1.8, 2.2, 3.5, 0x273244, {}, true);
                const bank = placed(root, 386.72, y, 0.12, 1.6, 1.3, 0x5dbfe7, makeSeam(0x176194, 0.9));
                bank.position.z = 2.5;
            }
            for (const y of [710, 728]) {
                placed(root, 338, y, 5.0, 2.8, 1.4, 0x495667, {}, true);
                placed(root, 338, y, 3.6, 1.8, 0.12, 0x8ba6b4).position.z = 1.48;
                placed(root, 341, y, 1.2, 0.8, 1.0, 0x364458).position.z = 1.95;
            }
            for (const y of [714, 722]) {
                const bench = placed(root, 347, y, 5.0, 2.4, 1.15, 0x425269, {}, true);
                bench.name = 'AnalysisBench';
                placed(root, 347, y, 3.8, 1.8, 0.14, 0x7795a5).position.z = 1.24;
                placed(root, 348, y, 0.8, 0.8, 0.75, 0x467ea0, makeSeam(0x176194, 0.45)).position.z = 1.7;
                // Instruments share the bench's existing low-cover footprint;
                // their tops remain below standing fire height (~1.7 m).
                detail('ResearchInstrument', 345.6, y, 0.9, 0.55, 0.2, 1.38, 0x91afbc,
                    { emissive: 0x31586c, emissiveIntensity: 0.65 });
                detail('ResearchReadout', 345.6, y - 0.29, 0.65, 0.07, 0.24, 1.51, 0x9ae7f2,
                    makeSeam(0x317d9d, 0.85));
            }
            // A pair of coherent analysis bays and pale wall returns, rather
            // than isolated floor props, define the research loop around cover.
            for (const y of [711, 725]) {
                detail('ResearchWallPanel', 331.05, y, 0.12, 7.6, 2.8, 3.4, 0x728a9b,
                    { emissive: 0x344e60, emissiveIntensity: 0.8, metalness: 0.2, roughness: 0.7 });
                detail('ResearchWallReadout', 331.18, y, 0.12, 5.4, 0.22, 4.3, 0xa4e5eb,
                    makeSeam(0x357d9a, 0.65));
            }
            for (const x of [340, 380]) detail('ResearchFarWall', x, 734.05, 9.0, 0.12, 2.4, 3.4,
                0x6c8092, { emissive: 0x30485c, emissiveIntensity: 0.75, metalness: 0.2, roughness: 0.7 });
            for (const x of [340, 380]) {
                detail('ResearchUpperReturn', x, 734.02, 9.0, 0.13, 2.2, 6.2, 0x72899c,
                    { emissive: 0x294c62, emissiveIntensity: 0.72, metalness: 0.25, roughness: 0.68 });
                detail('ResearchUpperReadout', x, 733.9, 6.0, 0.12, 0.16, 6.35,
                    0x9cdeeb, makeSeam(0x34758c, 0.65));
            }
            detail('ResearchFloorGuide', 341.5, 718, 0.16, 19, 0.05, 0.34,
                0x84cce0, makeSeam(0x256a86, 0.55));
            placed(root, 334, 718, 4.5, 2.1, 1.35, 0x485565, {}, true);
            const researchScreen = placed(root, 335.7, 718, 0.12, 1.4, 0.62, 0x8edfff, makeSeam(0x2a8fc9, 1.2));
            fx.screens.push({ mat: researchScreen.material, base: 1.2, seed: rand(Math.PI * 2) });
            for (const y of [706, 716, 726]) {
                const glass = placed(root, 389.18, y, 0.08, 6.4, 4.1, 0x79bfe8, { transparent: true, opacity: 0.2, emissive: 0x173d66, emissiveIntensity: 0.35, depthWrite: false });
                glass.renderOrder = 2;
                for (const z of [2.0, 5.7]) placed(root, 389.0, y, 0.2, 6.5, 0.14, 0xb4d8ef, makeSeam(0x3b7199, 0.65));
            }
            for (const y of [710, 716, 722, 728]) {
                detail('SecurityMonitor', 388.93, y, 0.13, 1.6, 0.72, 4.25, 0x93d5e2,
                    { emissive: 0x367b9c, emissiveIntensity: 0.95, metalness: 0.2, roughness: 0.65 });
                detail('SecurityStatus', 388.8, y, 0.12, 1.3, 0.12, 4.8, colors.service,
                    makeSeam(0x995a22, 0.7));
            }
            for (const y of [711, 727]) detail('SecurityCommandRail', 367.65, y, 0.12, 3.2, 0.3, 4.1,
                colors.service, makeSeam(0x995a22, 0.85));
            detail('SecurityFloorGuide', 382, 718, 0.12, 19, 0.05, 0.35,
                colors.service, makeSeam(0x995a22, 0.55));
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
            sign('CONTAINMENT // SPECIMEN ARCHIVE', 370, 794.15, 6.6, 12.5, '#ff6688');
            for (const x of [346, 392]) {
                const archivePanel = placed(root, x, 793.95, 6.0, 0.12, 2.8, 0x627c9a,
                    { emissive: 0x28577d, emissiveIntensity: 0.7 });
                archivePanel.position.z = 3.8;
            }
            strip(root, 360, 716, 0.32, 43, 0xaedfff, 1.0);
            strip(root, 360, 761, 0.34, 50, 0xff5577, 0.85);
            strip(root, 428, 752, 37, 0.3, 0xffa04a, 1.0);
            sign('SERVICE // POWER SYSTEMS', 428, 736.9, 6.5, 10.0, '#ffb24d');
            for (const [x, y] of [[418, 742], [434, 742], [418, 764], [434, 764]]) {
                const generator = placed(root, x, y, 5.0, 4.0, 3.6, 0x424b58, {}, true);
                generator.name = 'ServiceGenerator';
                for (const dx of [-1.4, 0, 1.4]) {
                    const vent = placed(root, x + dx, y - 2.06, 0.8, 0.12, 1.2, 0x151d2a);
                    vent.position.z = 2.1;
                }
                const warning = placed(root, x, y + 2.1, 3.5, 0.14, 0.22, 0xffae4f, makeSeam(0xff7425, 1.0));
                warning.position.z = 2.8;
                // Matching aisle-facing access faces make the four existing
                // tall-cover machines readable without enlarging their solids.
                const aisleFace = y < 752 ? y + 2.05 : y - 2.05;
                detail('ServiceGeneratorFace', x, aisleFace, 4.0, 0.12, 1.55, 1.85, 0x78828d,
                    { emissive: 0x484b4d, emissiveIntensity: 0.75, metalness: 0.4, roughness: 0.65 });
                detail('ServiceGeneratorStatus', x, aisleFace + (y < 752 ? 0.09 : -0.09), 3.2, 0.12, 0.16, 2.55,
                    colors.service, makeSeam(0x995b20, 0.8));
            }
            for (const y of [742, 764]) {
                for (const x of [425, 441]) {
                    const cabinet = placed(root, x, y, 2.0, 2.0, 3.0, 0x303b4c, {}, true);
                    cabinet.name = 'ServiceCabinet';
                    placed(root, x, y - 1.05, 1.2, 0.1, 0.25, 0x70c8ff, makeSeam(0x2288cc, 0.8)).position.z = 2.35;
                }
            }
            for (const x of [419, 439]) {
                detail('PowerBus', x, 769.05, 8.0, 0.12, 2.4, 4.4, 0x747168,
                    { emissive: 0x51412b, emissiveIntensity: 0.8, metalness: 0.4, roughness: 0.65 });
                detail('PowerBusStatus', x, 768.9, 5.5, 0.12, 0.2, 4.9,
                    colors.service, makeSeam(0x99602c, 0.9));
                detail('PowerWallPanel', x, 736.95, 8.0, 0.12, 2.4, 3.5, 0x817b70,
                    { emissive: 0x58422e, emissiveIntensity: 0.8, metalness: 0.4, roughness: 0.65 });
                detail('PowerWallHousing', x, 736.93, 7.5, 0.14, 1.6, 6.3, 0x696d70,
                    { emissive: 0x383d48, emissiveIntensity: 0.55, metalness: 0.55, roughness: 0.55 });
            }
            for (const x of [416, 444]) detail('ServiceCableChannel', x, 752, 0.14, 21, 0.06, 0.35,
                colors.service, makeSeam(0x99602c, 0.55));
            for (const y of [746, 758]) detail('ServiceAisleGuide', 430, y, 24, 0.16, 0.05, 0.38,
                colors.service, makeSeam(0x99602c, 0.55));
            detail('EmergencyExitThreshold', 446.5, 752, 0.18, 10, 0.06, 0.35,
                colors.crisis, makeSeam(0x99251d, 0.95));
            for (const x of [419, 433, 447]) strip(root, x, 752, 0.22, 11, 0xe0a84a, 0.85);
            sign('EMERGENCY EXIT', 449.0, 752, 7.2, 8, '#ff493d', 'x');
            for (const y of [746.3, 757.7]) {
                const beacon = placed(root, 449.65, y, 0.18, 0.3, 5.2, 0xff493d, makeSeam(0xff2211, 1.5));
                beacon.position.z = 4.0;
            }
            for (const [x, y] of [[338, 746], [402, 746], [338, 782], [402, 782]]) {
                placed(root, x, y, 3.2, 2.2, 2.1, 0x3b3545, {}, true);
                const warning = placed(root, x, y - 1.2, 2.2, 0.12, 0.26, 0xff5577, makeSeam(0xff2244, 1.25)); emergencyMats.push(warning.material);
            }
            // Wall-side equipment forms a semicircle around the existing vial
            // anchor; the ~12 m annulus around the tube remains unobstructed.
            for (const [x, y] of [[335, 759], [335, 774], [404, 776]]) {
                placed(root, x, y, 2.5, 4.0, 3.2, 0x323b4b, {}, true);
                const status = placed(root, x + (x < 360 ? 1.3 : -1.3), y, 0.12, 2.0, 1.0, 0x78dcf2, makeSeam(0x2286ae, 1.15));
                status.position.z = 2.35;
            }
            for (const x of [331.05, 408.95]) for (const y of [757, 782]) {
                detail('ContainmentWallPanel', x, y, 0.12, 8.0, 2.6, 3.3, 0x6c7d92,
                    { emissive: 0x344f69, emissiveIntensity: 0.8, metalness: 0.2, roughness: 0.7 });
                detail('ContainmentCoolGuide', x + (x < 360 ? 0.1 : -0.1), y, 0.13, 6.2, 0.18, 4.5,
                    0x9cdded, makeSeam(0x347c9c, 0.8));
            }
            for (const x of [346, 393]) detail('ContainmentFarWall', x, 794.05, 10, 0.12, 2.4, 3.4,
                0x6c7d92, { emissive: 0x344f69, emissiveIntensity: 0.8, metalness: 0.2, roughness: 0.7 });
            // Wall-integrated archive bays break the otherwise black upper
            // perimeter. The specimen annulus and combat floor remain empty.
            for (const x of [344, 356, 382, 394]) {
                detail('ArchiveMonitorBay', x, 794.03, 6.0, 0.14, 2.5, 6.45, 0x708398,
                    { emissive: 0x304e64, emissiveIntensity: 0.85, metalness: 0.3, roughness: 0.65 });
                detail('ArchiveMonitor', x, 793.9, 3.7, 0.14, 0.65, 6.45, 0x9ed9e6,
                    makeSeam(0x347d9c, 0.75));
                detail('ArchiveStatus', x + 2.3, 793.88, 0.35, 0.14, 0.3, 6.45,
                    colors.bio, makeSeam(0x853653, 0.65));
            }
            for (const x of [331.04, 408.96]) {
                for (const y of [750, 762, 778, 790]) detail('ContainmentWallRib', x, y, 0.16, 0.65, 4.0, 6.2,
                    0x687d93, { emissive: 0x2b4157, emissiveIntensity: 0.6, metalness: 0.45, roughness: 0.6 });
                detail('ContainmentWallConduit', x + (x < 360 ? 0.1 : -0.1), 770, 0.12, 35, 0.2, 7.7,
                    0x8dcbdd, makeSeam(0x326789, 0.55));
            }
            detail('ArchiveCeilingFeed', 360, 785, 0.26, 18, 0.2, 8.8, 0x68849a,
                { emissive: 0x2e556b, emissiveIntensity: 0.65 });
            detail('ArchiveCeilingSupport', 360, 777, 0.4, 0.4, 1.0, 8.8, 0x68849a,
                { emissive: 0x2e556b, emissiveIntensity: 0.65 });
            for (const x of [348, 385]) {
                placed(root, x, 791, 5.2, 2.0, 2.3, 0x394051, {}, true);
                const screen = placed(root, x, 789.9, 3.5, 0.1, 0.85, 0x8bddf5, makeSeam(0x1c7aac, 1.1));
                screen.position.z = 1.9;
                fx.screens.push({ mat: screen.material, base: 1.1, seed: rand(Math.PI * 2) });
            }
            for (const [x, y] of [[350, 755], [377, 777]]) {
                const crate = placed(root, x, y, 2.5, 2.5, 1.25, 0x505166, {}, true);
                crate.name = 'ContainmentCover';
                placed(root, x, y, 2.2, 0.16, 0.1, 0xff6688, makeSeam(0xff335f, 0.65)).position.z = 1.34;
            }
            const dais = placed(root, containmentPos.x, containmentPos.y, 9.6, 9.6, 0.13, 0x35465b);
            dais.position.z = 0.36; // low visual lip, traversable without a collision step
            const field = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 6.5, 24, 1, true), mat(0x66eaff, { transparent: true, opacity: 0.13, emissive: 0x33aadd, emissiveIntensity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
            field.rotation.x = Math.PI / 2; field.position.set(containmentPos.x, containmentPos.y, 3.35); root.add(field);
            const chamberRing = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.14, 8, 28), mat(0x7eeeff, makeSeam(0x2abddd, 1.8)));
            chamberRing.position.set(containmentPos.x, containmentPos.y, 0.48); root.add(chamberRing);
            for (const radius of [5.0, 6.2]) {
                const guide = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.08, 40), envMat(radius < 6 ? 0x63bfe1 : 0xff6688, { emissive: radius < 6 ? 0x227ba9 : 0x77254e, emissiveIntensity: 0.7, side: THREE.DoubleSide }));
                guide.position.set(containmentPos.x, containmentPos.y, 0.36); root.add(guide);
            }
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
            const rotation = new THREE.Matrix4().makeRotationX(Math.PI / 2);
            const transform = new THREE.Matrix4();
            for (const batch of detailBatches.values()) {
                const instance = new THREE.InstancedMesh(batch.geometry, batch.material, batch.positions.length);
                instance.name = batch.name;
                for (let i = 0; i < batch.positions.length; i++) {
                    const [x, y, z] = batch.positions[i];
                    transform.makeTranslation(x, y, z).multiply(rotation);
                    instance.setMatrixAt(i, transform);
                }
                instance.computeBoundingSphere();
                root.add(instance);
            }
            return {
                root, emergency, solids, emergencyMats, normalMats, lights, accessDoor, securityDoor, emergencyDoor, serviceDoor,
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
                // For Y-spanning panels the glowing edge runs along Y, not
                // 9 m through the wall toward the exterior camera.
                const seam = box(axis === 'x' ? 0.14 : w + 0.06, axis === 'x' ? d + 0.06 : 0.14, panelH - 0.9, 0xff9e42, makeSeam(0xff6b24, 1.4));
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

        function updateDoors(dt, player, squadMembers, hostiles, labAccess, campaign) {
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
                if (!near) for (const enemy of hostiles) {
                    if (!enemy.dead && !enemy.dying && Math.hypot(enemy.pos.x - door.base[0], enemy.pos.y - door.base[1]) < 4.2) { near = true; break; }
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
                            : door.id === 'lab_emergency' || door.id === 'lab_emergency_exit' ? 'MAINTENANCE PASSAGE SEALED' : 'BIO-LAB SEALED — inspect command records for lock status';
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

    global.ChargefrontFacility = Object.freeze({ create, navigationWaypoint, foundationHeight, MAP_SEGMENTS, LAB_MAP_SEGMENTS, NAV_BLOCK, BYPASS_WEST, BYPASS_EAST });
})(globalThis);
