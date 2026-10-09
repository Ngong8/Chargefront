/* Classic script: file:// compatible. Catalog != owned slots; combat owns ammo/actions. */
(function (root) {
    'use strict';
    const definitions = Object.freeze([
        Object.freeze({ id: 'rifle', name: 'BUL-117', kind: 'bolt', dmg: 22, cd: 0.095, magSize: 50, spread: 0.012, range: 153, reloadTime: 1.7, color: 0x66e0ff, preferredRange: 34 }),
        Object.freeze({ id: 'scatter', name: 'CRW-8', kind: 'scatter', dmg: 13, cd: 0.68, magSize: 20, spread: 0.105, range: 60, reloadTime: 2.05, pellets: 8, color: 0xffbb66, preferredRange: 18 }),
        Object.freeze({ id: 'arc', name: 'ARC-9', kind: 'arc', dmg: 42, cd: 0.42, magSize: 32, spread: 0.01, range: 72, reloadTime: 1.9, chains: 3, color: 0x88eeff, preferredRange: 26 }),
        Object.freeze({ id: 'plasma', name: 'PX-4', kind: 'plasma', dmg: 74, cd: 0.8, magSize: 15, spread: 0.018, range: 110, reloadTime: 2.2, splash: 6.5, color: 0xff7818, preferredRange: 32 }),
    ]);
    const abilities = Object.freeze([
        Object.freeze({ id: 'surge', name: 'Surge Pulse', category: 'disruption', cooldown: 22 }),
        Object.freeze({ id: 'bulwark', name: 'Bulwark', category: 'defense', cooldown: 28 }),
        Object.freeze({ id: 'medic_pulse', name: 'Medic Pulse', category: 'support', cooldown: 24 }),
        Object.freeze({ id: 'target_designator', name: 'Target Designator', category: 'offense', cooldown: 18 }),
    ]);
    const campaignSlots = Object.freeze(['rifle', 'scatter']);
    const defaults = Object.freeze({ rook: Object.freeze({ weapon: 'scatter', ability: 'bulwark' }), vex: Object.freeze({ weapon: 'arc', ability: 'medic_pulse' }), kade: Object.freeze({ weapon: 'rifle', ability: 'target_designator' }) });
    const finiteInt = (value, fallback, max) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : fallback;
    const definition = id => definitions.find(w => w.id === id);
    function endlessConfig(input = {}) {
        input = input && typeof input === 'object' ? input : {};
        const p = input.player || {};
        const slot1 = definition(p.slot1) ? p.slot1 : 'rifle';
        const slot2 = definition(p.slot2) && p.slot2 !== slot1 ? p.slot2 : definitions.find(w => w.id !== slot1).id;
        const squad = {};
        for (const id of Object.keys(defaults)) {
            const s = input.squad?.[id] || {};
            squad[id] = Object.freeze({ weapon: definition(s.weapon) ? s.weapon : defaults[id].weapon,
                ability: abilities.some(a => a.id === s.ability) ? s.ability : defaults[id].ability });
        }
        const playerAbility=abilities.some(a=>a.id===p.ability)?p.ability:'surge';
        return Object.freeze({ player: Object.freeze({ slot1, slot2, ability: playerAbility }),
            squad: Object.freeze(squad), posture: ['balanced', 'escort', 'screen'].includes(input.posture) ? input.posture : 'balanced' });
    }
    function squadLoadout(base, selection) {
        const w = definition(selection.weapon), ability = abilities.find(a => a.id === selection.ability);
        return Object.freeze(Object.assign({}, base, { weapon: w.id, weaponDefinition: w, ability,
            dmg: w.dmg * 0.48, cd: Math.max(0.16, w.cd), range: Math.min(70, w.range), acc: w.spread,
            magSize: w.magSize, pellets: w.pellets || 1,
            combat: Object.freeze(Object.assign({}, base.combat, { preferredRange: w.preferredRange,
                closeWeight: w.kind === 'scatter' ? 1.8 : w.kind === 'bolt' ? 0.45 : 0.9 })) }));
    }
    function chooseMutator(wave, previousId, modifiers, random = Math.random) {
        if (wave < 6) return null;
        const choices = [null, ...modifiers.filter(m => m.id !== previousId)];
        return choices[Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))];
    }
    const fadeDuration = 0.12;
    const terminalOpacity = life => Math.max(0, Math.min(1, life / fadeDuration));
    function create() {
        const state = {
            weapons: {}, slots: campaignSlots, cartridges: 8, activeId: 'rifle', switchT: 0, switchDuration: 0.32, fireT: 0, shotsFired: 0,
            get active() { return this.weapons[this.activeId]; },
            get index() { return this.slots.indexOf(this.activeId); },
            reset({ loadout = null, cartridges = 8 } = {}) {
                const p = loadout ? endlessConfig({ player: loadout }).player : null;
                this.slots = p ? Object.freeze([p.slot1, p.slot2]) : campaignSlots;
                this.weapons = {};
                for (const id of this.slots) { const def = definition(id); this.weapons[id] = Object.assign({}, def, { mag: def.magSize, reloading: false, reloadT: 0, reloadDuration: def.reloadTime, dmgMult: 1, rateMult: 1 }); }
                this.cartridges = finiteInt(cartridges, 8, 12);
                this.activeId = this.slots[0];
                this.switchT = this.fireT = this.shotsFired = 0;
            },
            cancelActions() {
                for (const w of Object.values(this.weapons)) { w.reloading = false; w.reloadT = 0; }
                this.switchT = 0;
            },
            select(index) {
                const id = this.slots[index];
                if (!id || id === this.activeId) return false;
                this.active.reloading = false; this.active.reloadT = 0;
                this.activeId = id; this.switchT = this.switchDuration;
                return true;
            },
            reload(mult = 1) {
                const w = this.active;
                if (this.switchT > 0 || w.reloading || w.mag >= w.magSize || this.cartridges <= 0) return false;
                w.reloadDuration = w.reloadTime * mult; w.reloadT = w.reloadDuration; w.reloading = true;
                return true;
            },
            tick(dt) {
                this.fireT = Math.max(0, this.fireT - dt); this.switchT = Math.max(0, this.switchT - dt);
                const w = this.active;
                if (w.reloading) {
                    w.reloadT = Math.max(0, w.reloadT - dt);
                    if (!w.reloadT) { if (this.cartridges > 0) { this.cartridges--; w.mag = w.magSize; } w.reloading = false; }
                }
            },
            consumeShot() {
                const w = this.active;
                if (this.switchT > 0 || this.fireT > 0 || w.reloading || w.mag <= 0) return false;
                w.mag--; this.fireT = w.cd / w.rateMult; this.shotsFired++;
                return true;
            },
            snapshot() {
                const weapons = {};
                for (const id of this.slots) weapons[id] = { mag: this.weapons[id].mag };
                return { version: 3, activeId: this.activeId, cartridges: this.cartridges, weapons };
            },
            restore(savedPlayer = {}, reserveCap = 12) {
                // Campaign boundary: saved catalog/pair/upgrade data cannot change authored slots.
                const data = savedPlayer.combat, legacy = savedPlayer.weapon || {};
                const authoredSupply = this.cartridges;
                this.reset({ cartridges: authoredSupply });
                let sum = 0, found = false;
                for (const id of campaignSlots) {
                    const saved = data ? data.weapons?.[id] : legacy.id === id ? legacy : savedPlayer.weaponStates?.[id];
                    if (!saved) continue;
                    found = true;
                    const w = this.weapons[id]; w.mag = finiteInt(saved.mag, w.mag, w.magSize);
                    sum += finiteInt(saved.reserve, 0, reserveCap);
                }
                this.cartridges = data?.version >= 3 ? finiteInt(data.cartridges, authoredSupply, reserveCap) : found ? Math.min(reserveCap, sum) : authoredSupply;
                const id = data ? data.activeId : legacy.id;
                this.activeId = campaignSlots.includes(id) ? id : 'rifle';
                this.cancelActions(); this.fireT = 0;
            },
        };
        state.reset(); return state;
    }
    root.ChargefrontCombat = Object.freeze({ definitions, abilities, campaignSlots, create, endlessConfig, squadLoadout, chooseMutator, fadeDuration, terminalOpacity });
})(globalThis);
