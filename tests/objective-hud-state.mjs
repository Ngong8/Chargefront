import assert from 'node:assert/strict';
import '../src/hud-objectives.js';
const api=globalThis.ChargefrontObjectiveHUD,c=api.create();
assert.equal(api.hold,0.45);assert.equal(api.fade,0.65);
c.set('main','main','p1','Reach the facility');
c.set('optional','scan','scan','Scan growth');
c.set('optional','cell','cell','Recover cell');
assert.equal(c.rows.filter(r=>r.group==='optional').length,2,'Independent optionals coexist');
// Numeric progress updates in place and never counts as completion.
c.set('main','main','p1','Reach the facility — 50%');
c.set('optional','scan','scan','Scan growth — 40%');
assert(c.rows.every(r=>!r.completed),'Progress is not completion');
assert(c.rows.find(r=>r.group==='main').text.includes('50%'));
// Replacing the main step retires the old row with hold + fade.
c.set('main','main','p2','Advance to relay');
assert.equal(c.rows.filter(r=>r.group==='main'&&r.completed).length,1);
c.tick(.4);assert.equal(c.snapshot().find(r=>r.group==='main'&&r.completed).alpha,1);
c.tick(.375);assert(Math.abs(c.snapshot().find(r=>r.group==='main'&&r.completed).alpha-.5)<1e-9);
c.tick(.325);assert(!c.rows.some(r=>r.group==='main'&&r.completed));
// Completing one optional fades it out without touching the other.
c.complete('optional','scan');assert(c.rows.find(r=>r.id==='scan').completed);
c.tick(1.11);assert(!c.rows.some(r=>r.id==='scan'));assert(c.rows.some(r=>r.id==='cell'&&!r.completed));
// Explicit retire for an objective that disappears (e.g. abandoned/ungated).
c.set('optional','cell',null,null);assert(c.rows.find(r=>r.id==='cell').completed);c.tick(1.11);
assert(!c.rows.some(r=>r.id==='cell'));
// Bounded churn across many step/progress changes.
for(let i=0;i<150;i++){c.set('main','main','s'+i,'Step '+i);c.set('optional','scan','scan'+i,'Scan '+i);c.set('optional','cell','cell'+i,'Cell '+i);assert(c.rows.length<=6,'At most one retiring + one current row per id');}
c.clear();assert.equal(c.rows.length,0);c.set('main','main','restored','Restored step');assert.equal(c.rows.length,1);
console.log('PASS objective HUD: independent optionals, progress-in-place, hold/fade/removal, retire, bounded churn, clear');
