import assert from 'node:assert/strict';
import '../src/relay-routing.js';
const intersects=(a,b)=>{
    for(let t=0;t<=1;t+=.005){const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(x>=38&&x<=62&&y>=25&&y<=75)return true;}return false;
};
const solver=ChargefrontRelayRouting.create({world:100,step:4,clear:(a,b)=>!intersects(a,b)});
const corridor=[{x:10,y:50},{x:30,y:15},{x:70,y:15},{x:90,y:50}];
for(const origin of [{x:10,y:50},{x:72,y:18},{x:80,y:70},{x:20,y:80}]){
    const path=solver.solve(origin,{x:90,y:50},corridor);
    assert(path.length>=2);assert.deepEqual(path[0],origin);assert.deepEqual(path.at(-1),{x:90,y:50});
    for(let i=1;i<path.length;i++)assert(!intersects(path[i-1],path[i]));
    if(origin.x===72)assert(path.every(p=>p.x>=70),'Rejoining beyond obstacle must not return to the old waypoints');
    assert.deepEqual(path,solver.solve(origin,{x:90,y:50},corridor),'Equal paths are deterministic');
}
const sealed=ChargefrontRelayRouting.create({world:100,clear:()=>false});assert.deepEqual(sealed.solve({x:10,y:10},{x:90,y:90},corridor),[]);
console.log('PASS relay routing: obstacle traversal, skipped corridors, rejoin, reverse, deterministic ties, no-path fallback');
