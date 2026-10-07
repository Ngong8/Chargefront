/* Presentation-only, bounded objective retirement. No mission/save ownership. */
(function(root) {
    'use strict';
    const hold = 0.45, fade = 0.65;
    function create() {
        return {
            rows: [],
            clear() { this.rows.length = 0; },
            set(kind, key, text) {
                const current = this.rows.find(row => row.kind === kind && !row.completed);
                if (current && (current.key === key || current.text === text)) {
                    current.key = key;
                    if (current.text !== text) { current.text = text; current.lines = null; }
                    return;
                }
                if (current) {
                    // At most one retiring and one current row per category.
                    this.rows = this.rows.filter(row => row.kind !== kind || !row.completed);
                    current.completed = true; current.age = 0;
                }
                if (key && text) this.rows.push({kind, key, text, completed:false, age:0, lines:null, layoutWidth:0, layoutFont:''});
            },
            tick(dt) {
                for (let i = this.rows.length - 1; i >= 0; i--) {
                    const row = this.rows[i];
                    if (row.completed) { row.age += dt; if (row.age >= hold + fade) this.rows.splice(i, 1); }
                }
            },
            alpha(row) { return row.completed ? Math.max(0, 1 - Math.max(0, row.age - hold) / fade) : 1; },
            snapshot() { return this.rows.map(row => ({kind:row.kind, key:row.key, text:row.text, completed:row.completed, age:row.age, alpha:this.alpha(row)})); },
        };
    }
    root.ChargefrontObjectiveHUD = Object.freeze({create, hold, fade});
})(globalThis);
