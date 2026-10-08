/* Presentation-only, bounded objective retirement. No mission/save ownership.
   Rows are identified by (group,id); a changed key/text for the same id updates in
   place (progress), while a real replacement/completion retires the old row. */
(function(root) {
    'use strict';
    const hold = 0.45, fade = 0.65;
    function create() {
        return {
            rows: [],
            clear() { this.rows.length = 0; },
            _current(group, id) { return this.rows.find(row => row.group === group && row.id === id && !row.completed); },
            _retire(group, id) {
                const current = this._current(group, id);
                if (!current) return;
                // keep at most one retiring row per id
                this.rows = this.rows.filter(row => !(row.group === group && row.id === id && row.completed));
                current.completed = true; current.age = 0;
            },
            set(group, id, key, text) {
                const current = this._current(group, id);
                if (text == null) { this._retire(group, id); return; }
                if (current && (current.key === key || current.text === text)) {
                    if (current.text !== text) { current.text = text; current.lines = null; }
                    return;
                }
                if (current) this._retire(group, id);
                this.rows.push({group, id, key, text, completed:false, age:0, lines:null, layoutWidth:0, layoutFont:'', extraHeight:0});
            },
            complete(group, id) {
                const current = this._current(group, id);
                if (current) { current.completed = true; current.age = 0; }
            },
            tick(dt) {
                for (let i = this.rows.length - 1; i >= 0; i--) {
                    const row = this.rows[i];
                    if (row.completed) { row.age += dt; if (row.age >= hold + fade) this.rows.splice(i, 1); }
                }
            },
            alpha(row) { return row.completed ? Math.max(0, 1 - Math.max(0, row.age - hold) / fade) : 1; },
            snapshot() { return this.rows.map(row => ({group:row.group, id:row.id, key:row.key, text:row.text, completed:row.completed, age:row.age, alpha:this.alpha(row)})); },
        };
    }
    root.ChargefrontObjectiveHUD = Object.freeze({create, hold, fade});
})(globalThis);
