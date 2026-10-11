/* Construction-time placement checks, not a prop renderer or physics system.
   The game injects its existing terrain, solid query and protected authored zones.
   Classic script keeps file:// distribution; tests can inject seeded height fields. */
(function (root) {
    'use strict';
    const PURPOSES = Object.freeze({
        decoration: Object.freeze({ solid: false, minScale: 0.8, maxScale: 1.2, yawVariation: Math.PI, maxSlope: 0.3, maxGap: 0.12 }),
        cover: Object.freeze({ solid: true, minScale: 1, maxScale: 1, yawVariation: 0.15, maxSlope: 0.15, maxGap: 0.08 }),
        landmark: Object.freeze({ solid: true, minScale: 1, maxScale: 1, yawVariation: 0.05, maxSlope: 0.1, maxGap: 0.06 }),
        interactable: Object.freeze({ authoredOnly: true }),
    });
    const LIMITS = Object.freeze({ attempts: 32, zones: 256, occupied: 256, span: 12, height: 20, samples: 25, clearance: 0.35 });
    const finite = Number.isFinite;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const overlaps = (a, b) => a.x0 <= b.x1 && a.x1 >= b.x0 && a.y0 <= b.y1 && a.y1 >= b.y0;
    const rectValid = r => r && [r.x0, r.y0, r.x1, r.y1].every(finite) && r.x0 <= r.x1 && r.y0 <= r.y1;
    const expanded = (b, pad) => ({ x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad });
    function segmentIntersects(ax, ay, bx, by, rect) {
        let enter = 0, exit = 1;
        for (const [a, delta, min, max] of [[ax, bx - ax, rect.x0, rect.x1], [ay, by - ay, rect.y0, rect.y1]]) {
            if (Math.abs(delta) < 1e-12) { if (a < min || a > max) return false; }
            else {
                const t0 = (min - a) / delta, t1 = (max - a) / delta;
                enter = Math.max(enter, Math.min(t0, t1)); exit = Math.min(exit, Math.max(t0, t1));
                if (enter > exit) return false;
            }
        }
        return true;
    }
    function zoneValid(z) {
        if (!z || typeof z.id !== 'string') return false;
        if (z.type === 'rect') return rectValid(z);
        if (z.type === 'circle') return [z.x, z.y, z.radius].every(finite) && z.radius >= 0;
        return z.type === 'corridor' && [z.ax, z.ay, z.bx, z.by, z.radius].every(finite) && z.radius >= 0;
    }
    function touchesZone(bounds, zone) {
        if (zone.type === 'rect') return overlaps(bounds, zone);
        if (zone.type === 'circle') {
            const x = clamp(zone.x, bounds.x0, bounds.x1), y = clamp(zone.y, bounds.y0, bounds.y1);
            return Math.hypot(zone.x - x, zone.y - y) <= zone.radius;
        }
        // Conservative corridor capsule: includes rounded endpoints and formation
        // shoulders. It may reject extra near-corner space, never a crossing prop.
        return segmentIntersects(zone.ax, zone.ay, zone.bx, zone.by, expanded(bounds, zone.radius));
    }
    function create({ terrainHeight, intersectsSolid, getZones, getBounds, collisionBounds = b => b }) {
        const counts = { validations: 0, accepted: 0, terrainSamples: 0, solidQueries: 0, searches: 0, attempts: 0, fallbackChecks: 0 };
        const rejections = Object.create(null);
        const reject = (reason, details = {}) => {
            rejections[reason] = (rejections[reason] || 0) + 1;
            return { ok: false, reason, ...details };
        };
        function validate(candidate, occupied = []) {
            counts.validations++;
            if (!candidate || !Object.hasOwn(PURPOSES, candidate.purpose)) return reject('purpose');
            const policy = PURPOSES[candidate.purpose];
            if (policy.authoredOnly) return reject('authored-anchor'); // never relocate gameplay anchors by scatter/fallback
            const { x, y, width, depth, height } = candidate;
            const scale = candidate.scale ?? 1, yaw = candidate.yaw ?? 0, facing = candidate.facing ?? 0;
            const pitch = candidate.pitch ?? 0, roll = candidate.roll ?? 0;
            if (![x, y, width, depth, height, scale, yaw, facing, pitch, roll].every(finite)
                || width <= 0 || depth <= 0 || height <= 0) return reject('dimensions');
            if (scale < policy.minScale || scale > policy.maxScale) return reject('scale');
            if (pitch !== 0 || roll !== 0) return reject('tilt'); // ground boxes stay upright; no arbitrary 3-axis jitter
            const yawDelta = Math.atan2(Math.sin(yaw - facing), Math.cos(yaw - facing));
            if (Math.abs(yawDelta) > policy.yawVariation + 1e-9) return reject('yaw');
            const w = width * scale, d = depth * scale, h = height * scale;
            if (Math.min(w, d) < 0.05 || h < 0.01) return reject('dimensions');
            if (Math.max(w, d) > LIMITS.span || h > LIMITS.height) return reject('footprint-size');
            const cos = Math.cos(yaw), sin = Math.sin(yaw);
            const ex = (Math.abs(cos) * w + Math.abs(sin) * d) / 2, ey = (Math.abs(sin) * w + Math.abs(cos) * d) / 2;
            const visibleBounds = { x0: x - ex, y0: y - ey, x1: x + ex, y1: y + ey };
            const physicalBounds = policy.solid ? collisionBounds(visibleBounds, { x, y, width: w, depth: d, height: h, yaw }) : visibleBounds;
            if (!rectValid(physicalBounds)) return reject('collision-footprint');
            const bounds = { x0: Math.min(visibleBounds.x0, physicalBounds.x0), y0: Math.min(visibleBounds.y0, physicalBounds.y0),
                x1: Math.max(visibleBounds.x1, physicalBounds.x1), y1: Math.max(visibleBounds.y1, physicalBounds.y1) };
            if (Math.max(bounds.x1 - bounds.x0, bounds.y1 - bounds.y0) > LIMITS.span) return reject('footprint-size');
            const clearance = expanded(bounds, LIMITS.clearance), world = getBounds();
            if (!rectValid(world)) return reject('world-bounds');
            if (clearance.x0 < world.x0 || clearance.y0 < world.y0 || clearance.x1 > world.x1 || clearance.y1 > world.y1) return reject('boundary');
            if (world.circle) {
                const c = world.circle;
                if (![c.x, c.y, c.radius].every(finite) || c.radius <= 0) return reject('world-bounds');
                for (const px of [clearance.x0, clearance.x1]) for (const py of [clearance.y0, clearance.y1]) {
                    if (Math.hypot(px - c.x, py - c.y) > c.radius) return reject('boundary');
                }
            }
            const zones = getZones();
            if (!Array.isArray(zones) || zones.length > LIMITS.zones) return reject('zone-budget');
            for (const zone of zones) {
                if (!zoneValid(zone)) return reject('zone-data');
                if (touchesZone(clearance, zone)) return reject('exclusion', { zone: zone.id });
            }
            if (!Array.isArray(occupied) || occupied.length > LIMITS.occupied) return reject('occupied-budget');
            for (const other of occupied) {
                if (!rectValid(other)) return reject('occupied-data');
                if (overlaps(clearance, other)) return reject('occupied'); // ground props cannot stack, even without SOLIDS
            }
            counts.solidQueries++;
            if (intersectsSolid(clearance)) return reject('solid');
            // Bounded 5x5 grid over the conservative union of the rotated visible
            // base and existing physical footprint. Large surfaces need authored
            // subdivision; this is not an exhaustive triangle-mesh support test.
            const samples = [], stepX = (bounds.x1 - bounds.x0) / 4, stepY = (bounds.y1 - bounds.y0) / 4;
            let min = Infinity, max = -Infinity, slope = 0;
            for (let iy = 0; iy < 5; iy++) for (let ix = 0; ix < 5; ix++) {
                const z = terrainHeight(bounds.x0 + stepX * ix, bounds.y0 + stepY * iy);
                counts.terrainSamples++;
                if (!finite(z)) return reject('terrain');
                min = Math.min(min, z); max = Math.max(max, z);
                const index = samples.length;
                if (ix) slope = Math.max(slope, Math.abs(z - samples[index - 1]) / stepX);
                if (iy) slope = Math.max(slope, Math.abs(z - samples[index - 5]) / stepY);
                samples.push(z);
            }
            if (slope > policy.maxSlope + 1e-9) return reject('slope', { slope });
            if (max - min > policy.maxGap + 1e-9) return reject('support', { groundRange: max - min });
            const baseZ = candidate.baseZ ?? max;
            if (!finite(baseZ)) return reject('terrain');
            if (baseZ < max - 0.005) return reject('buried');
            if (baseZ > max + 0.005 || baseZ - min > policy.maxGap + 1e-9) return reject('floating');
            counts.accepted++;
            return { ok: true, purpose: candidate.purpose, solid: policy.solid, x, y, width: w, depth: d, height: h, yaw,
                scale, baseZ, centerZ: baseZ + h / 2, bottomY: baseZ, topY: baseZ + h,
                visibleBounds, collisionBounds: physicalBounds, bounds, slope, groundRange: max - min };
        }
        function find({ candidate, propose, random = Math.random, maxAttempts = 16, fallback = null, occupied = [] }) {
            counts.searches++;
            if (!candidate || !Object.hasOwn(PURPOSES, candidate.purpose)) return reject('purpose');
            if (PURPOSES[candidate.purpose].authoredOnly) return reject('authored-anchor');
            if (typeof propose !== 'function' || typeof random !== 'function' || !finite(maxAttempts)) return reject('search-input');
            const limit = clamp(Math.floor(maxAttempts), 0, LIMITS.attempts);
            let last = null;
            for (let i = 0; i < limit; i++) {
                counts.attempts++;
                const proposal = propose(random, i);
                last = proposal && typeof proposal === 'object' ? validate({ ...candidate, ...proposal, purpose: candidate.purpose }, occupied) : reject('proposal');
                if (last.ok) return { ...last, attempts: i + 1, fallback: false };
            }
            if (fallback) {
                counts.fallbackChecks++;
                last = validate({ ...candidate, ...fallback, purpose: candidate.purpose }, occupied);
                if (last.ok) return { ...last, attempts: limit, fallback: true };
            }
            return { ok: false, reason: 'exhausted', attempts: limit, lastReason: last?.reason, zone: last?.zone };
        }
        return Object.freeze({ validate, find, stats: () => ({ ...counts, rejections: { ...rejections } }) });
    }
    root.ChargefrontEnvironmentPlacement = Object.freeze({ create, PURPOSES, LIMITS });
})(globalThis);
