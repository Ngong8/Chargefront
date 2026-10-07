import assert from 'node:assert/strict';
import '../src/hud-objectives.js';
const api=globalThis.ChargefrontObjectiveHUD,c=api.create();
c.set('main','relay-defense','Defend — 20%'); c.set('optional','escort','Escort — 90%');
c.set('main','relay-defense','Defend — 50%'); c.set('optional','escort','Escort — 65%');
assert(c.rows.every(r=>!r.completed),'Numeric progress is not completion');
c.set('main','next-relay','Advance to Beta');assert.equal(c.rows.filter(r=>r.completed).length,1);
c.tick(.4);assert.equal(c.snapshot().find(r=>r.completed).alpha,1);
c.tick(.375);assert(Math.abs(c.snapshot().find(r=>r.completed).alpha-.5)<1e-9);
c.tick(.325);assert(!c.rows.some(r=>r.completed));
c.set('optional',null,'');assert(c.rows.find(r=>r.kind==='optional').completed);
c.tick(1.11);assert(!c.rows.some(r=>r.kind==='optional'));
c.set('optional','turret','Restore turret');c.set('optional',null,'');c.set('optional','another','Next optional');
assert.equal(c.rows.filter(r=>r.kind==='optional').length,2);
for(let i=0;i<100;i++){c.set('main','step-'+i,'Step '+i);c.set('optional','side-'+i,'Side '+i);assert(c.rows.length<=4);}
c.set('main','alias','Step 99');assert.equal(c.rows.filter(r=>r.kind==='main'&&!r.completed).length,1);
c.clear();assert.equal(c.rows.length,0);c.set('main','checkpoint','Restored step');assert.equal(c.rows.length,1);
console.log('PASS objective HUD: progress identity, hold/fade/removal, optional retirement, bounded churn, checkpoint reset');
