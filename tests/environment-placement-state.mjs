// Pure placement safety cases, with independent seeded terrain/proposal streams.
import assert from 'node:assert/strict';
import '../src/world/environment-placement.js';
import '../src/progression.js';
const P = ChargefrontEnvironmentPlacement;
const box = (x = 50, y = 50, extra = {}) => ({ purpose: 'decoration', x, y, width: 1, depth: 1, height: 1, ...extra });
const rect = { x0: 2, y0: 2, x1: 998, y1: 998 };
const make = (overrides = {}) => P.create({ terrainHeight: () => 3, intersectsSolid: () => false,
    getZones: () => [], getBounds: () => rect, ...overrides });
const valid = make();
const grounded = valid.validate(box());
assert(grounded.ok); assert.equal(grounded.baseZ, 3); assert.equal(grounded.topY, 4); assert.equal(grounded.centerZ, 3.5);
assert.equal(grounded.solid, false); assert.equal(valid.stats().terrainSamples, 25);
assert(valid.validate(box(50, 50, { purpose: 'cover' })).solid);
assert(valid.validate(box(50, 50, { purpose: 'landmark' })).solid);
assert.equal(valid.validate(box(50, 50, { purpose: 'interactable' })).reason, 'authored-anchor');
for (const purpose of ['__proto__', 'constructor', 'cover-ish', undefined]) assert.equal(valid.validate(box(50, 50, { purpose })).reason, 'purpose');
for (const extra of [{ x: NaN }, { width: Infinity }, { width: 0 }, { depth: -1 }, { width: 1e-320 }, { height: 0 }]) {
    assert.equal(valid.validate(box(50, 50, extra)).reason, 'dimensions');
}
assert.equal(valid.validate(box(50, 50, { width: 13 })).reason, 'footprint-size');
assert.equal(valid.validate(box(50, 50, { height: 21 })).reason, 'footprint-size');
assert.equal(valid.validate(box(50, 50, { scale: 1.21 })).reason, 'scale');
assert.equal(valid.validate(box(50, 50, { purpose: 'cover', scale: 1.05 })).reason, 'scale');
assert(valid.validate(box(50, 50, { scale: .8, yaw: Math.PI * .7 })).ok);
assert.equal(valid.validate(box(50, 50, { purpose: 'cover', yaw: .16 })).reason, 'yaw');
assert(valid.validate(box(50, 50, { purpose: 'cover', yaw: Math.PI / 2 + .1, facing: Math.PI / 2 })).ok);
assert(valid.validate(box(50, 50, { purpose: 'landmark', yaw: Math.PI * 2, facing: 0 })).ok);
for (const extra of [{ pitch: .01 }, { roll: -.01 }]) assert.equal(valid.validate(box(50, 50, extra)).reason, 'tilt');
assert.equal(valid.validate(box(50, 50, { baseZ: 3.1 })).reason, 'floating');
assert.equal(valid.validate(box(50, 50, { baseZ: 2.9 })).reason, 'buried');
assert.equal(valid.validate(box(50, 50, { baseZ: NaN })).reason, 'terrain');
assert.equal(make({ terrainHeight: () => NaN }).validate(box()).reason, 'terrain');
assert.equal(make({ terrainHeight: x => x * .4 }).validate(box()).reason, 'slope');
assert.equal(make({ terrainHeight: x => x * .1 }).validate(box(50, 50, { width: 3 })).reason, 'support');
assert.equal(make({ terrainHeight: (x, y) => x === 50 && y === 50 ? 0 : 3 }).validate(box()).reason, 'slope', 'Center pit cannot pass corner-only checks');
for (const point of [[2, 50], [998, 50], [50, 2], [50, 998]]) assert.equal(valid.validate(box(...point)).reason, 'boundary');
assert(valid.validate(box(2.85, 50)).ok, 'Exact padded boundary is permitted');
const circleWorld = make({ getBounds: () => ({ ...rect, circle: { x: 50, y: 50, radius: 40 } }) });
assert(circleWorld.validate(box(89, 50)).ok);
assert.equal(circleWorld.validate(box(90, 50)).reason, 'boundary', 'Center inside circle is insufficient for full corners');
const zoneCases = [
    { id: 'room', type: 'rect', x0: 10, y0: 10, x1: 20, y1: 20 },
    { id: 'objective', type: 'circle', x: 15, y: 15, radius: 5 },
    { id: 'diagonal', type: 'corridor', ax: 10, ay: 10, bx: 20, by: 20, radius: 2 },
    { id: 'door', type: 'corridor', ax: 10, ay: 10, bx: 10, by: 10, radius: 2 },
];
for (const zone of zoneCases) {
    const rules = make({ getZones: () => [zone] });
    const point = zone.id === 'door' ? 10.1 : 15;
    assert.equal(rules.validate(box(point, point)).reason, 'exclusion');
    assert(rules.validate(box(50, 50)).ok);
}
const footprint = make({ getZones: () => [zoneCases[0]] });
assert.equal(footprint.validate(box(22, 15, { width: 5, depth: .5 })).zone, 'room', 'Center outside cannot hide footprint overlap');
assert.equal(footprint.validate(box(21.3, 21.3, { width: 4, depth: .5, yaw: Math.PI / 4 })).reason, 'exclusion');
const solidRules = make({ intersectsSolid: b => b.x0 <= 51.4 && b.x1 >= 51.2 && b.y0 <= 51 && b.y1 >= 49 });
assert.equal(solidRules.validate(box(50, 50, { width: 3 })).reason, 'solid');
assert(solidRules.validate(box(50, 50)).ok);
assert.equal(valid.validate(box(), [grounded.bounds]).reason, 'occupied');
assert.equal(valid.validate(box(60, 60), [{ x0: NaN }]).reason, 'occupied-data');
assert.equal(valid.validate(box(), Array(257).fill(grounded.bounds)).reason, 'occupied-budget');
assert.equal(make({ getZones: () => Array(257).fill(zoneCases[0]) }).validate(box()).reason, 'zone-budget');
assert.equal(make({ getZones: () => [{ type: 'circle', id: 'bad', radius: -1 }] }).validate(box()).reason, 'zone-data');
assert.equal(make({ getBounds: () => ({ x0: NaN }) }).validate(box()).reason, 'world-bounds');
assert.equal(make({ collisionBounds: () => ({ x0: NaN }) }).validate(box(50, 50, { purpose: 'cover' })).reason, 'collision-footprint');
const physical = make({ collisionBounds: b => ({ ...b, x1: 999 }) });
assert.equal(physical.validate(box(990, 50, { purpose: 'cover' })).reason, 'boundary');

let draws = 0;
const noSpace = make({ getZones: () => [{ id: 'sealed', type: 'rect', ...rect }] });
const exhausted = noSpace.find({ candidate: box(), maxAttempts: 1e9, random: () => { draws++; return .5; }, propose: random => ({ x: random() * 500, y: 50 }) });
assert.equal(exhausted.reason, 'exhausted'); assert.equal(exhausted.attempts, 32); assert.equal(draws, 32);
assert.equal(noSpace.find({ candidate: box(), maxAttempts: 0, propose: () => box(), fallback: { x: 50, y: 50 } }).reason, 'exhausted');
const fallback = footprint.find({ candidate: box(), maxAttempts: 2, propose: () => ({ x: 15, y: 15 }), fallback: { x: 50, y: 50 } });
assert(fallback.ok && fallback.fallback && fallback.attempts === 2);
assert.equal(footprint.find({ candidate: box(), maxAttempts: 2, propose: () => null }).lastReason, 'proposal');
assert.equal(footprint.find({ candidate: box(), maxAttempts: NaN, propose: () => box() }).reason, 'search-input');
assert.equal(valid.find({ candidate: box(50, 50, { purpose: 'interactable' }), propose: () => assert.fail('Must not scatter objectives') }).reason, 'authored-anchor');
assert.equal(valid.find({ candidate: box(50, 50, { purpose: 'cover' }), maxAttempts: 1,
    propose: () => ({ purpose: 'decoration', scale: 1.1 }) }).lastReason, 'scale', 'Proposal cannot weaken purpose policy');

const seeds = [0, 1, 420042, 0x7fffffff, 0xffffffff];
const originalRandom = Math.random, runs = [];
for (const seed of seeds) {
    const parameters = ChargefrontProgression.seedRandom(seed);
    const a = parameters() * 6, b = parameters() * 6;
    // Seeded height fields exercise different support gradients without adding a
    // new terrain seed/input setting to the accepted game terrain formula.
    const terrainHeight = (x, y) => 3 + Math.sin(x * .03 + a) * .04 + Math.cos(y * .04 + b) * .03;
    const run = () => {
        const rules = make({ terrainHeight, getZones: () => zoneCases.slice(0, 3) }), occupied = [], positions = [];
        const random = ChargefrontProgression.seedRandom(seed);
        for (let i = 0; i < 32; i++) {
            const result = rules.find({ candidate: box(), random, occupied, propose: rng => ({ x: 3 + rng() * 100, y: 3 + rng() * 100, yaw: (rng() - .5) * Math.PI * 2, scale: .8 + rng() * .4 }) });
            assert(result.ok); assert(result.groundRange <= P.PURPOSES.decoration.maxGap);
            assert(result.baseZ >= terrainHeight(result.x, result.y) - .005);
            occupied.push(result.bounds); positions.push([result.x, result.y, result.baseZ, result.yaw, result.scale]);
        }
        return { positions, stats: rules.stats() };
    };
    const first = run(), second = run(); assert.deepEqual(first, second);
    assert.equal(Math.random, originalRandom); runs.push({ seed, accepted: first.positions.length, stats: first.stats });
}
console.log('PASS environment placement state: purposes, full footprint/clearance, support/slope, transforms, obstacles, budgets, safe fallback and five repeatable terrain seeds', JSON.stringify(runs));
