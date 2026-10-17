/* Campaign-only authored grading/material zoning. No renderer, RNG, mission or
   save ownership. Endless deliberately never calls this profile. */
(function (root) {
    'use strict';
    const SEED = 420042;
    const REAR = Object.freeze({ start:800, end:900, segments:40, apronEnd:848, playableEnd:872 });
    const clamp = v => Math.max(0, Math.min(1, v));
    const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
    const rearWidth = x => smooth((x-275)/35)*smooth((475-x)/35);
    function maxY(x) { return 800+(REAR.playableEnd-800)*rearWidth(x); }
    function rearHeight(x,y,edgeHeight) {
        const north=Math.max(0,y-800),pocket=rearWidth(x);
        const apron=.45+Math.sin(x*.045)*.18+Math.sin(north*.035)*.12;
        const blend=smooth(north/22)*pocket;
        return edgeHeight*(1-blend)+apron*blend+(1-pocket)*smooth(north/35)*28+smooth((y-REAR.apronEnd)/(REAR.end-REAR.apronEnd))**2*55;
    }
    // Compact ellipses, not infinite Gaussian tails through foundations/anchors.
    // x,y,half-width,half-length,rise; cuts are shallow drainage/disturbed earth.
    const FEATURES = Object.freeze([
        ['landing-west-shoulder', 398, 165, 22, 44, 1.7],
        ['landing-east-shoulder', 487, 189, 20, 46, 1.4],
        ['approach-drain', 477, 305, 13, 66, -1.1],
        ['approach-spoil', 391, 348, 22, 52, 2.0],
        ['approach-cut', 376, 452, 15, 40, -1.2],
        ['alpha-utility-berm', 150, 554, 25, 47, 1.6],
        ['alpha-drain', 263, 536, 35, 14, -1.0],
        ['beta-outer-shoulder', 177, 735, 22, 43, 2.2],
        ['beta-service-cut', 297, 773, 20, 32, -1.4],
        ['beta-north-shoulder', 241, 811, 41, 22, 1.9],
        ['gamma-collapse', 634, 572, 26, 38, -2.0],
        ['gamma-spoil', 612, 648, 39, 21, 1.8],
        ['gamma-subsidence', 553, 518, 27, 20, -1.3],
        ['perimeter-west-drain', 303, 714, 10, 54, -1.0],
        ['perimeter-east-swale', 483, 711, 14, 51, -1.3],
        ['evacuation-east-shoulder', 482, 651, 19, 36, 1.5],
        ['evacuation-landmark-berm', 474, 475, 25, 48, 1.8],
    ].map(Object.freeze));
    function create({ relays, foundations, landing }) {
        function protection(x, y, routeDistance) {
            let weight = smooth((routeDistance - 14) / 12);
            weight *= smooth((Math.hypot(x - landing.x, y - landing.y) - 72) / 16);
            for (const p of relays) weight *= smooth((Math.hypot(x - p.x, y - p.y) - 48) / 14);
            for (const [x0,x1,y0,y1] of foundations) {
                const distance = Math.hypot(Math.max(x0-x,0,x-x1),Math.max(y0-y,0,y-y1));
                weight *= smooth((distance - 22) / 12);
            }
            return weight;
        }
        function delta(x, y, routeDistance) {
            let change = 0;
            for (const [,cx,cy,rx,ry,rise] of FEATURES) {
                if (Math.abs(x-cx)>=rx || Math.abs(y-cy)>=ry) continue;
                const r2=((x-cx)/rx)**2+((y-cy)/ry)**2;
                if (r2 < 1) change += rise * (1-r2)**3;
            }
            return (change ? change * protection(x,y,routeDistance) : 0) || 0;
        }
        // Ground wear is part of the existing terrain vertices: no overlay
        // planes, floating strips, collision surfaces or additional draw calls.
        function color(x, y, distance) {
            const road = 1-smooth((distance-4)/7);
            const track = (1-smooth(Math.abs(distance-3)/1.7)) * road;
            const industrial = 1-smooth((Math.hypot(x-245,y-748)-48)/45);
            const damaged = 1-smooth((Math.hypot(x-575,y-585)-45)/48);
            const grain = Math.sin(x*.31+y*.17)*Math.sin(y*.27-x*.11)*.025;
            return [
                .78 + road*.12 - track*.11 + industrial*.025 + grain,
                .70 + road*.14 - track*.10 - damaged*.045 + grain,
                .85 - road*.19 - track*.08 - industrial*.10 - damaged*.055 + grain,
            ];
        }
        return Object.freeze({ delta, color, protection });
    }
    // Same diagonal and Float32 heights as THREE.PlaneGeometry (rows run north
    // to south). Sampling is O(1), including at the world boundary.
    function sampleGrid(positions, x, y, world = 800, segments = 320, height = world, rows = segments) {
        const gx=clamp(x/world)*segments, gy=clamp(1-y/height)*rows;
        const col=Math.min(segments-1,Math.floor(gx)),row=Math.min(rows-1,Math.floor(gy));
        const u=gx-col,v=gy-row,a=row*(segments+1)+col;
        const h00=positions[a*3+2],h10=positions[(a+1)*3+2];
        const h01=positions[(a+segments+1)*3+2],h11=positions[(a+segments+2)*3+2];
        return u+v<=1 ? h00+u*(h10-h00)+v*(h01-h00) : h11+(1-u)*(h01-h11)+(1-v)*(h10-h11);
    }
    root.ChargefrontCampaignTerrain = Object.freeze({ SEED, FEATURES, REAR, maxY, rearHeight, create, sampleGrid });
})(typeof globalThis !== 'undefined' ? globalThis : this);
