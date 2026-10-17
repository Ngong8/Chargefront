import assert from 'node:assert/strict';
import '../src/world/campaign-terrain.js';
const T=globalThis.ChargefrontCampaignTerrain;
const profile=T.create({relays:[{x:205,y:575},{x:245,y:748},{x:575,y:585}],
    foundations:[[330,390,618,735],[330,410,735,795],[410,450,736,770]],landing:{x:450,y:80}});
assert.equal(T.SEED,420042);assert.equal(T.FEATURES.length,17);
for(const [,x,y,rx,ry]of T.FEATURES){
    for(const [dx,dy]of [[rx,0],[-rx,0],[0,ry],[0,-ry]])assert(Number.isFinite(profile.delta(x+dx,y+dy,30)));
    assert.equal(profile.delta(x,y,10),0,'Canonical route must retain its grade');
}
for(const [x,y]of [[450,80],[436,90],[205,575],[245,748],[575,585],[360,620],[360,774],[450,752]])
    assert.equal(profile.protection(x,y,100),0,'Critical anchor protected');
let maxDelta=0,maxSlope=0;const samples=[];
for(let y=0;y<=820;y+=2.5)for(let x=0;x<=800;x+=2.5){
    const h=profile.delta(x,y,30);maxDelta=Math.max(maxDelta,Math.abs(h));
    maxSlope=Math.max(maxSlope,Math.abs(profile.delta(x+.1,y,30)-h)/.1,Math.abs(profile.delta(x,y+.1,30)-h)/.1);
    samples.push(h);
    const color=profile.color(x,y,(x+y)%40);assert(color.every(c=>c>0&&c<=1));
}
assert(maxDelta>1.5&&maxDelta<=2.2);assert(maxSlope<.3,'New grading creates an excessive slope');
// Asymmetric saddle catches using bilinear interpolation or the wrong diagonal.
const grid=new Float32Array([0,0,0, 0,0,2, 0,0,4, 0,0,10]);
assert.equal(T.sampleGrid(grid,.25,.75,1,1),1.5);
assert.equal(T.sampleGrid(grid,.75,.25,1,1),6.5);
assert.equal(T.sampleGrid(grid,0,1,1,1),0);assert.equal(T.sampleGrid(grid,1,0,1,1),10);
let i=0;for(let y=0;y<=820;y+=2.5)for(let x=0;x<=800;x+=2.5)assert.equal(profile.delta(x,y,30),samples[i++]);
console.log('PASS Campaign terrain compact shaping, critical exclusions, determinism and slope',{maxDelta,maxSlope});
