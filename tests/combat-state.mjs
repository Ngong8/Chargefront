// Pure state-machine tests: no renderer/input mocks and no wall-clock timing.
import assert from 'node:assert/strict';
import '../src/combat.js';
const api = globalThis.ChargefrontCombat;
assert.deepEqual(api.definitions.map(w => w.id), ['rifle', 'scatter']);
const c = api.create(), rifle = c.weapons.rifle, scatter = c.weapons.scatter;
assert.equal(c.active.id, 'rifle');
assert(c.consumeShot()); assert(!c.consumeShot(), 'Duplicate fire in one tick');
rifle.mag = 17; scatter.mag = 6;
assert(c.select(1)); assert.equal(c.active.id, 'scatter'); assert(!c.consumeShot());
c.tick(.4); assert(c.select(0)); assert.equal(c.active.mag, 17);
c.tick(.4); assert(c.reload()); c.tick(.5);
assert(c.select(1)); assert(!rifle.reloading); assert.equal(rifle.mag, 17); assert.equal(rifle.reserve, 4);
assert(!c.reload(), 'Switch lockout must block reload'); c.tick(.4); assert(c.reload()); c.tick(3);
assert.equal(scatter.mag, 12); assert.equal(scatter.reserve, 3);
for (let i = 0; i < 1000; i++) { c.select(i % 2); c.tick(.01); c.consumeShot(); }
assert.equal(c.weapons.rifle, rifle); assert.equal(c.weapons.scatter, scatter);
assert.equal(rifle.mag, 17); assert.equal(scatter.mag, 12);
c.tick(1); scatter.mag = 0; scatter.reserve = 0;
assert(!c.consumeShot()); assert(!c.reload()); assert(!c.select(2));
for (const index of [0, 1]) {
    c.select(index); rifle.mag = 17; scatter.mag = 6;
    c.tick(1); assert(c.reload()); c.tick(.2);
    const saved = JSON.parse(JSON.stringify({ combat: c.snapshot() }));
    const restored = api.create(); restored.restore(saved);
    assert.equal(restored.active.id, api.definitions[index].id);
    assert.equal(restored.weapons.rifle.mag, 17); assert.equal(restored.weapons.scatter.mag, 6);
    assert(!restored.active.reloading); assert.equal(restored.switchT, 0);
    c.cancelActions(); scatter.reserve = 3;
}
const migrated = api.create();
migrated.restore({ weapon: { id: 'arc', mag: 999, dmgMult: 100 }, weaponStates: { rifle: { mag: 19, reserve: 2 }, scatter: { mag: 5, reserve: 1 }, plasma: { mag: 9 } } });
assert.equal(migrated.active.id, 'rifle'); assert.equal(migrated.active.mag, 19);
assert.equal(migrated.weapons.scatter.mag, 5); assert.equal(migrated.active.dmgMult, 1);
assert.deepEqual(Object.keys(migrated.weapons), ['rifle', 'scatter']);
migrated.restore({ combat: { activeId: 'plasma', weapons: { rifle: { mag: -4, reserve: Infinity }, scatter: { mag: 10000, reserve: 10000 } } } });
assert.equal(migrated.active.id, 'rifle'); assert.equal(migrated.active.mag, 0);
assert.equal(migrated.weapons.scatter.mag, 12); assert.equal(migrated.weapons.scatter.reserve, 8);
assert.deepEqual(api.endlessConfig({ startingWeapon: 'arc', squadPosture: 'fake' }), { startingWeapon: 'rifle', squadPosture: 'balanced' });
const config = api.endlessConfig({ startingWeapon: 'scatter', squadPosture: 'escort' });
assert(Object.isFrozen(config)); c.reset({ activeId: config.startingWeapon });
assert.equal(c.active.id, 'scatter'); assert.equal(c.active.mag, 12); assert.equal(c.active.reserve, 4);
// Holding fire for 600 ticks consumes at most one shot per cooldown, even if
// called twice each tick. Switching cannot grant a faster cadence.
c.reset(); let accepted = 0;
for (let i = 0; i < 600; i++) { c.tick(1 / 60); accepted += +c.consumeShot() + +c.consumeShot(); }
assert.equal(accepted, 50); assert.equal(c.shotsFired, 50);
console.log('PASS combat state: two weapons, selection, independent ammo, reload cancellation, rapid switching, cadence, migration, configuration');
