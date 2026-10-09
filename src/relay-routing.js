/* Player guidance only. Deterministic eight-neighbour A* with authored corridor
   preferences and exact segment authorization supplied by the physical world. */
(function (root) {
    'use strict';
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    function corridorDistance(p, corridor) {
        let best = Infinity;
        for (let i = 1; i < corridor.length; i++) {
            const a = corridor[i - 1], b = corridor[i], dx = b.x - a.x, dy = b.y - a.y;
            const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
            best = Math.min(best, Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy));
        }
        return best;
    }
    function create({ world, step = 4, clear }) {
        const side = Math.floor(world / step) + 1, count = side * side;
        const scores = new Float64Array(count + 64), parents = new Int32Array(count + 64);
        const closed = new Uint8Array(count + 64), edges = new Map();
        const point = id => ({ x: (id % side) * step, y: Math.floor(id / side) * step });
        const valid = p => p.x >= 2 && p.y >= 2 && p.x <= world - 2 && p.y <= world - 2;
        let solves = 0, expanded = 0, lastMs = 0, maxMs = 0;
        function solve(origin, destination, corridor) {
            solves++; expanded = 0;
            const extras = [origin, destination, ...corridor], end = count + 1, start = count;
            if (extras.length > 64 || !valid(origin) || !valid(destination)) return [];
            const get = id => id < count ? point(id) : extras[id - count];
            const authorized = (a, b) => {
                if (a >= count || b >= count) return clear(get(a), get(b));
                const key = Math.min(a, b) * count + Math.max(a, b);
                if (!edges.has(key)) edges.set(key, clear(get(a), get(b)));
                return edges.get(key);
            };
            const cost = (a, b) => {
                const length = distance(a, b), samples = Math.max(1, Math.ceil(length / 4));
                let weight = 0;
                for (let i = 0; i < samples; i++) {
                    const t = (i + .5) / samples;
                    weight += 1 + Math.min(.9, corridorDistance({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, corridor) / 18);
                }
                return length * weight / samples;
            };
            scores.fill(Infinity); parents.fill(-1); closed.fill(0);
            const heap = [];
            const push = entry => {
                heap.push(entry); let i = heap.length - 1;
                while (i) { const p = (i - 1) >> 1; if (heap[p].f <= entry.f) break; heap[i] = heap[p]; i = p; } heap[i] = entry;
            };
            const pop = () => {
                const first = heap[0], last = heap.pop();
                if (heap.length) { let i = 0; while (i * 2 + 1 < heap.length) {
                    let c = i * 2 + 1; if (c + 1 < heap.length && heap[c + 1].f < heap[c].f) c++;
                    if (heap[c].f >= last.f) break; heap[i] = heap[c]; i = c;
                } heap[i] = last; } return first.id;
            };
            scores[start] = 0; push({ id: start, f: distance(origin, destination) });
            while (heap.length && expanded < count) {
                const id = pop(); if (closed[id]) continue;
                if (id === end) {
                    const path = []; for (let p = end; p !== -1; p = parents[p]) path.push(get(p)); path.reverse();
                    // String pulling preserves corridor costs as well as physical clearance.
                    const result = [path[0]];
                    for (let i = 0; i < path.length - 1;) {
                        let next = i + 1, oldCost = 0;
                        for (let j = i + 1; j < path.length; j++) {
                            oldCost += cost(path[j - 1], path[j]);
                            if (clear(path[i], path[j]) && cost(path[i], path[j]) <= oldCost * 1.025) next = j;
                        }
                        result.push(path[next]); i = next;
                    }
                    return result.map(p => ({ x: p.x, y: p.y }));
                }
                closed[id] = 1; expanded++;
                const a = get(id), neighbours = [];
                if (id < count) {
                    const x = id % side, y = Math.floor(id / side);
                    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                        if ((!dx && !dy) || x + dx < 0 || y + dy < 0 || x + dx >= side || y + dy >= side) continue;
                        neighbours.push(id + dx + dy * side);
                    }
                } else {
                    const x = Math.round(a.x / step), y = Math.round(a.y / step);
                    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
                        if (x + dx >= 0 && y + dy >= 0 && x + dx < side && y + dy < side) neighbours.push((y + dy) * side + x + dx);
                    }
                }
                for (let i = 0; i < extras.length; i++) {
                    if (id >= count || distance(a, extras[i]) <= step * 3) neighbours.push(count + i);
                }
                for (const n of neighbours) {
                    if (n === id || closed[n]) continue;
                    const b = get(n); if (!valid(b) || !authorized(id, n)) continue;
                    const score = scores[id] + cost(a, b);
                    if (score + 1e-7 >= scores[n]) continue;
                    scores[n] = score; parents[n] = id; push({ id: n, f: score + distance(b, destination) });
                }
            }
            return [];
        }
        return { solve(...args) {const start=performance.now(),path=solve(...args);lastMs=performance.now()-start;maxMs=Math.max(maxMs,lastMs);return path;},
            invalidate() { edges.clear(); }, stats() { return { solves, expanded, cachedEdges: edges.size,lastMs,maxMs }; } };
    }
    root.ChargefrontRelayRouting = Object.freeze({ create, corridorDistance });
})(globalThis);
