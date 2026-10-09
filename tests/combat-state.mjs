// Pure state-machine tests: no renderer/input mocks and no wall-clock timing.
import assert from 'node:assert/strict';
import '../src/combat.js';
const api = globalThis.ChargefrontCombat;
assert.deepEqual(api.definitions.map(w => w.id), ['rifle', 'scatter', 'arc', 'plasma']);
const c = api.create(), rifle = c.weapons.rifle, scatter = c.weapons.scatter;
assert.equal(c.active.id, 'rifle');
assert(c.consumeShot()); assert(!c.consumeShot(), 'Duplicate fire in one tick');
rifle.mag = 17; scatter.mag = 6;
assert(c.select(1)); assert.equal(c.active.id, 'scatter'); assert(!c.consumeShot());
c.tick(.4); assert(c.select(0)); assert.equal(c.active.mag, 17);
c.tick(.4); assert(c.reload()); c.tick(.5);
assert(c.select(1)); assert(!rifle.reloading); assert.equal(rifle.mag, 17); assert.equal(c.cartridges, 8);
assert(!c.reload(), 'Switch lockout must block reload'); c.tick(.4); assert(c.reload()); c.tick(3);
assert.equal(scatter.mag, 20); assert.equal(c.cartridges, 7);
for (let i = 0; i < 1000; i++) { c.select(i % 2); c.tick(.01); c.consumeShot(); }
assert.equal(c.weapons.rifle, rifle); assert.equal(c.weapons.scatter, scatter);
assert.equal(rifle.mag, 17); assert.equal(scatter.mag, 20);
c.tick(1); scatter.mag = 0; c.cartridges = 0;
assert(!c.consumeShot()); assert(!c.reload()); assert(!c.select(2));
for (const index of [0, 1]) {
    c.select(index); rifle.mag = 17; scatter.mag = 6; c.cartridges = 3;
    c.tick(1); assert(c.reload()); c.tick(.2);
    const saved = JSON.parse(JSON.stringify({ combat: c.snapshot() }));
    const restored = api.create(); restored.restore(saved);
    assert.equal(restored.active.id, api.definitions[index].id);
    assert.equal(restored.weapons.rifle.mag, 17); assert.equal(restored.weapons.scatter.mag, 6);
    assert(!restored.active.reloading); assert.equal(restored.switchT, 0);
    c.cancelActions(); c.cartridges = 3;
}
const migrated = api.create();
migrated.restore({ weapon: { id: 'arc', mag: 999, dmgMult: 100 }, weaponStates: { rifle: { mag: 19, reserve: 2 }, scatter: { mag: 5, reserve: 1 }, plasma: { mag: 9 } } });
assert.equal(migrated.active.id, 'rifle'); assert.equal(migrated.active.mag, 19);
assert.equal(migrated.weapons.scatter.mag, 5); assert.equal(migrated.active.dmgMult, 1);
assert.deepEqual(Object.keys(migrated.weapons), ['rifle', 'scatter']);
assert.equal(migrated.cartridges, 3);
migrated.restore({ combat: { activeId: 'plasma', weapons: { rifle: { mag: -4, reserve: Infinity }, scatter: { mag: 10000, reserve: 10000 } } } });
assert.equal(migrated.active.id, 'rifle'); assert.equal(migrated.active.mag, 0);
assert.equal(migrated.weapons.scatter.mag, 20); assert.equal(migrated.cartridges, 12);
assert.deepEqual(api.endlessConfig({ player: { slot1: 'invalid', slot2: 'invalid' }, posture: 'fake' }), api.endlessConfig());
const config = api.endlessConfig({ player: { slot1: 'rifle', slot2: 'scatter', startingSlot: 2 }, posture: 'escort' });
assert(Object.isFrozen(config)); c.reset({ loadout: config.player });
assert.equal(c.active.id, 'rifle'); assert.equal(c.active.mag, 50); assert.equal(c.cartridges, 8);assert.equal(config.player.ability,'surge');assert(!('startingSlot' in config.player));
// Holding fire for 600 ticks consumes at most one shot per cooldown, even if
// called twice each tick. Switching cannot grant a faster cadence.
c.reset(); let accepted = 0;
for (let i = 0; i < 600; i++) { c.tick(1 / 60); accepted += +c.consumeShot() + +c.consumeShot(); }
assert.equal(accepted, 50); assert.equal(c.shotsFired, 50);
// Every ordered distinct pair, both starting slots; no catalog-only selection.
for (const a of api.definitions) for (const b of api.definitions) if (a !== b) for (const startingSlot of [1, 2]) {
    const cfg = api.endlessConfig({ player: { slot1: a.id, slot2: b.id, startingSlot } });
    c.reset({ loadout: cfg.player }); assert.deepEqual(c.slots, [a.id, b.id]);
    assert.equal(c.activeId,a.id); assert.equal(Object.keys(c.weapons).length, 2);
    assert(!c.select(2));
    for (const index of [0, 1]) {
        c.select(index); c.tick(1); c.active.mag = 0; const supply = c.cartridges;
        assert(c.reload()); c.tick(3); assert.equal(c.cartridges, supply - 1); assert.equal(c.active.mag, c.active.magSize);
    }
    c.reset({ loadout: cfg.player }); assert.equal(c.activeId,a.id);
    c.restore({ combat: c.snapshot() }); assert.deepEqual(c.slots, ['rifle', 'scatter']);
}
for (const w of api.definitions) {
    const cfg = api.endlessConfig({ player: { slot1: w.id, slot2: w.id } }); assert.notEqual(cfg.player.slot1, cfg.player.slot2);
}
assert(Object.isFrozen(config.player) && Object.isFrozen(config.squad.rook));
assert.deepEqual(api.abilities.map(a=>a.id),['surge','bulwark','medic_pulse','target_designator']);
for(const a of api.abilities){
    const cfg=api.endlessConfig({player:{ability:a.id},squad:Object.fromEntries(['rook','vex','kade'].map(id=>[id,{ability:a.id}]))});
    assert.equal(cfg.player.ability,a.id);assert(Object.values(cfg.squad).every(s=>s.ability===a.id));
}
const fallback=api.endlessConfig({player:{ability:'invalid'},squad:{rook:{ability:'invalid'}}});assert.equal(fallback.player.ability,'surge');assert.equal(fallback.squad.rook.ability,'bulwark');
const px=api.create();px.reset({loadout:{slot1:'plasma',slot2:'arc'},cartridges:2});assert.equal(px.active.magSize,15);
for(let i=0;i<15;i++){assert(px.consumeShot());px.tick(.8);}assert(!px.consumeShot());assert(px.reload());px.tick(2.2);assert.equal(px.active.mag,15);assert.equal(px.cartridges,1);
assert.deepEqual(['dmg','cd','range','spread','reloadTime','splash'].map(k=>api.definitions[3][k]),[74,.8,110,.018,2.2,6.5]);
// Duplicate legacy active/cache entries count once; missing inactive adds no reserve.
c.restore({ weapon: { id: 'rifle', mag: 3, reserve: 2 }, weaponStates: { rifle: { reserve: 2 }, scatter: { reserve: 1 } } }); assert.equal(c.cartridges, 3);
c.restore({ weapon: { id: 'rifle', reserve: 2 } }); assert.equal(c.cartridges, 2);
c.restore({ combat: { version: 2, weapons: { rifle: { reserve: 4 }, scatter: { reserve: 4 } } } }); assert.equal(c.cartridges, 8);
const migratedSave = c.snapshot(); c.restore({ combat: migratedSave }); assert.equal(c.cartridges, 8);
const scatterDef = api.definitions[1]; assert.equal(scatterDef.magSize, 20); assert(scatterDef.range > 34 && scatterDef.range < api.definitions[0].range);
for (const w of api.definitions) for (const a of api.abilities) {
    const l = api.squadLoadout({ combat: { lane: 3 }, reserve: 4 }, { weapon: w.id, ability: a.id });
    assert.equal(l.weaponDefinition, w); assert.equal(l.ability, a); assert.equal(l.combat.preferredRange, w.preferredRange);
}
const mods = ['storm', 'corrosive', 'armored', 'blackout'].map(id => ({ id }));
for (let wave = 1; wave <= 5; wave++) assert.equal(api.chooseMutator(wave, null, mods, () => .9), null);
assert.equal(api.chooseMutator(6, null, mods, () => 0), null);
for (let i = 1; i <= 4; i++) assert.equal(api.chooseMutator(6, null, mods, () => i / 5).id, mods[i - 1].id);
for (let i = 0; i < 100; i++) assert.notEqual(api.chooseMutator(7, 'storm', mods, () => i / 100)?.id, 'storm');
assert.equal(api.terminalOpacity(.2), 1); assert.equal(api.terminalOpacity(.06), .5); assert.equal(api.terminalOpacity(0), 0);
console.log('PASS combat state: ordered pairs, four universal abilities/defaults, 15-shot PX accounting, unchanged PX tuning, shared ammo, migration, mutators and cadence');
