/* Classic script: usable through file:// and in the isolated Node state tests.
   This module owns player weapon availability and action/ammunition state. */
(function (root) {
    'use strict';
    const definitions = Object.freeze([
        Object.freeze({ id: 'rifle', name: 'BUL-117', kind: 'bolt', dmg: 22, cd: 0.095, magSize: 50, spread: 0.012, range: 153, reloadTime: 1.7, color: 0x66e0ff }),
        Object.freeze({ id: 'scatter', name: 'CRW-8', kind: 'scatter', dmg: 13, cd: 0.68, magSize: 12, spread: 0.105, range: 34, reloadTime: 2.05, pellets: 8, color: 0xffbb66 }),
    ]);
    const finiteInt = (value, fallback, max) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : fallback;
    function template(def, reserve) {
        return Object.assign({}, def, { mag: def.magSize, reserve, reloading: false, reloadT: 0, reloadDuration: def.reloadTime, dmgMult: 1, rateMult: 1 });
    }
    function endlessConfig(input = {}) {
        return Object.freeze({ startingWeapon: input.startingWeapon === 'scatter' ? 'scatter' : 'rifle',
            squadPosture: ['balanced', 'escort', 'screen'].includes(input.squadPosture) ? input.squadPosture : 'balanced' });
    }
    function create() {
        const state = {
            weapons: {}, activeId: 'rifle', switchT: 0, switchDuration: 0.32, fireT: 0, shotsFired: 0,
            get active() { return this.weapons[this.activeId]; },
            get index() { return definitions.findIndex(def => def.id === this.activeId); },
            reset({ activeId = 'rifle', rifleReserve = 4, scatterReserve = 4 } = {}) {
                this.weapons = { rifle: template(definitions[0], rifleReserve), scatter: template(definitions[1], scatterReserve) };
                this.activeId = activeId === 'scatter' ? 'scatter' : 'rifle';
                this.switchT = this.fireT = this.shotsFired = 0;
            },
            cancelActions() {
                for (const def of definitions) { const w = this.weapons[def.id]; w.reloading = false; w.reloadT = 0; }
                this.switchT = 0;
            },
            select(index) {
                const def = definitions[index];
                if (!def || def.id === this.activeId) return false;
                const old = this.active; old.reloading = false; old.reloadT = 0;
                this.activeId = def.id;
                this.switchT = this.switchDuration;
                return true;
            },
            reload(mult = 1) {
                const w = this.active;
                if (this.switchT > 0 || w.reloading || w.mag >= w.magSize || w.reserve <= 0) return false;
                w.reloadDuration = w.reloadTime * mult; w.reloadT = w.reloadDuration; w.reloading = true;
                return true;
            },
            tick(dt) {
                this.fireT = Math.max(0, this.fireT - dt);
                this.switchT = Math.max(0, this.switchT - dt);
                const w = this.active;
                if (w.reloading) {
                    w.reloadT = Math.max(0, w.reloadT - dt);
                    if (!w.reloadT) { if (w.reserve > 0) { w.reserve--; w.mag = w.magSize; } w.reloading = false; }
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
                for (const def of definitions) { const w = this.weapons[def.id]; weapons[def.id] = { mag: w.mag, reserve: w.reserve }; }
                return { version: 2, activeId: this.activeId, weapons };
            },
            restore(savedPlayer = {}, reserveCap = 8) {
                // Campaign combat definitions always win over old upgrades/experimental IDs.
                // Absent legacy inactive weapons use the authored starting supply already reset.
                const data = savedPlayer.combat;
                const legacy = savedPlayer.weapon || {};
                for (const def of definitions) {
                    const saved = data ? data.weapons?.[def.id] : legacy.id === def.id ? legacy : savedPlayer.weaponStates?.[def.id];
                    if (!saved) continue;
                    const w = this.weapons[def.id];
                    w.mag = finiteInt(saved.mag, w.mag, def.magSize);
                    w.reserve = finiteInt(saved.reserve, w.reserve, reserveCap);
                }
                const id = data ? data.activeId : legacy.id;
                this.activeId = definitions.some(def => def.id === id) ? id : 'rifle';
                this.cancelActions(); this.fireT = 0;
            },
        };
        state.reset();
        return state;
    }
    root.ChargefrontCombat = Object.freeze({ definitions, create, endlessConfig });
})(globalThis);
