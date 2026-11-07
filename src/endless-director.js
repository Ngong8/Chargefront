/* CP3-B: pure seeded encounter plans. Actor stats, economy, navigation, world
   construction and persistence stay with their existing owners. */
(function(root) {
    'use strict';
    const costs=Object.freeze({skitter:1,runner:1,spitter:2,screecher:2,drone:2,shielded:3,tunneler:3,support:3,brute:4,artillery:4,carrier:5,boss:12});
    const unlock=Object.freeze({skitter:1,runner:2,spitter:2,brute:3,shielded:4,tunneler:4,drone:5,carrier:6,screecher:6,support:8,artillery:10});
    const weights=Object.freeze({
        assault:{skitter:6,runner:2,spitter:4,brute:2,shielded:2,tunneler:1,drone:2,screecher:1,carrier:1,support:1,artillery:1},
        rush:{skitter:9,runner:5,tunneler:4,spitter:2,drone:1,screecher:2,shielded:1,brute:1,carrier:1,support:1},
        pressure:{skitter:4,runner:1,spitter:8,drone:5,screecher:3,shielded:2,brute:1,carrier:1,support:2,artillery:3},
        tactical:{skitter:4,runner:1,spitter:3,drone:2,brute:4,shielded:5,tunneler:2,screecher:1,carrier:2,support:3,artillery:2},
        airborne:{skitter:4,runner:1,spitter:2,drone:12,screecher:3,shielded:1,brute:1,carrier:1,support:1,artillery:1},
    });
    function random(seed) {let state=seed>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
    function shuffle(list,rng) {for(let i=list.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;}
    function replaySeed(seed,ordinal=0) {
        if(!ordinal)return seed>>>0;
        let value=(seed^Math.imul(ordinal,0x9e3779b1)^0x43d)>>>0;
        value=Math.imul(value^(value>>>16),0x7feb352d);
        value=Math.imul(value^(value>>>15),0x846ca68b);
        return (value^(value>>>16))>>>0;
    }
    function family(wave,seed) {
        if(wave<3)return wave===1?'arrival':'contact';
        const early=shuffle(['assault','rush','pressure','tactical'],random((seed>>>0)^0xd3ea));
        if(wave<5)return early[wave-3];
        const block=Math.floor((wave-5)/5);
        const raw=index=>shuffle(['assault','rush','pressure','tactical','airborne'],random((seed>>>0)^Math.imul(index+1,0x85ebca6b)^0xd3fa));
        const bag=raw(block),previous=block?raw(block-1):early.slice(0,2);
        // Repair only the first three entries. The last two stay canonical, so
        // the next block can enforce no A/A or A/B/A without a history scan.
        const last=previous[previous.length-1],penultimate=previous[previous.length-2];
        const first=bag.findIndex((id,i)=>i<3&&id!==last&&id!==penultimate);
        [bag[0],bag[first]]=[bag[first],bag[0]];
        if(bag[1]===last)[bag[1],bag[2]]=[bag[2],bag[1]];
        return bag[(wave-5)%5];
    }
    function eligibleMutators(modifiers,configuration={}) {
        const rifle=[configuration.player?.slot1,configuration.player?.slot2].includes('rifle');
        return modifiers.filter(m=>m.id!=='storm'||rifle);
    }
    function plan(wave,seed=0,version=2) {
        const w=Math.max(1,Math.min(10000,Math.floor(wave)||1));
        const rng=random((seed>>>0)^Math.imul(w,0x9e3779b1)^0x43b);
        // Version 1 remains exact for accepted pre-D wave-start saves. Version 2
        // reshuffles each balanced block; budgets/weights/unlocks stay CP3-B's.
        const bag=shuffle(['assault','rush','pressure','tactical'],random((seed>>>0)^0xb431));
        const slot=w-3,index=((slot%4)+Math.floor(slot/4))%4;
        const pattern=version===1?(w===1?'arrival':w===2?'contact':w%5===0?'airborne':bag[index]):family(w,seed);
        const total=w===1?8:w===2?10:Math.min(54,12+w*2);
        const queue=[],counts={};
        const add=type=>{queue.push(type);counts[type]=(counts[type]||0)+1;};
        const max=type=>type==='carrier'?(w<12?1:2):type==='support'||type==='artillery'?2:
            type==='brute'?Math.ceil(total*.16):type==='shielded'?Math.ceil(total*.22):
            type==='drone'?Math.ceil(total*(pattern==='airborne'?.48:.28)):total;
        const allowed=type=>(unlock[type]||Infinity)<=w&&(counts[type]||0)<max(type)&&
            (!['runner','tunneler'].includes(type)||(counts.runner||0)+(counts.tunneler||0)<Math.min(8,Math.ceil(total*.24)));
        if(w===1)for(let i=0;i<total;i++)add('skitter');
        else if(w===2)for(const type of ['skitter','skitter','runner','spitter','skitter','skitter','runner','spitter','skitter','skitter'])add(type);
        else {
            // Anchor the intended role pairing before weighted variation fills
            // the rest; early unlocks safely fall back to familiar melee.
            const anchors=pattern==='rush'?['skitter','runner','tunneler','spitter']:
                pattern==='pressure'?['skitter','spitter','drone','artillery']:
                pattern==='tactical'?['brute','shielded','spitter','support']:
                pattern==='airborne'?['drone','drone','skitter','spitter']:['skitter','spitter','runner','shielded'];
            for(const type of anchors)add(allowed(type)?type:'skitter');
            if(w>=6)add('carrier');
            if(w>=8)add('support');
            if(w>=10)add('artillery');
            while(queue.length<total){
                const pool=Object.entries(weights[pattern]).filter(([type])=>allowed(type));
                let roll=rng()*pool.reduce((sum,[,weight])=>sum+weight,0),type='skitter';
                for(const [candidate,weight] of pool){roll-=weight;if(roll<0){type=candidate;break;}}
                add(type);
            }
            shuffle(queue,rng);
            // A short familiar opening packet; specialists follow the approach.
            const first=queue.indexOf('skitter');if(first>0)[queue[0],queue[first]]=[queue[first],queue[0]];
        }
        if(w%8===0)queue.splice(6,0,'boss');
        const activeCap=w===1?5:w===2?7:Math.min(24,8+Math.floor(w*.8));
        const interval=w<3?2.2:Math.max(.95,1.9-w*.045);
        const delays=queue.map((_,i)=>+(interval*(.85+rng()*.3)+(i>0&&i%6===0?4:0)).toFixed(3));
        return {version:version===1?1:2,wave:w,pattern,queue,delays,activeCap,threatCap:Math.ceil(activeCap*2.4),
            batchSize:w<3?1:w<12?2:3,initialDelay:w<3?2:1.5,rest:w%8===0?12:w<3?6:8,
            minRadius:w<3?65:58,maxRadius:w<3?125:160};
    }
    function live(enemies) {
        const counts={};let count=0,cost=0;
        for(const e of enemies)if(!e.dead&&!e.dying){count++;cost+=costs[e.type]||1;counts[e.type]=(counts[e.type]||0)+1;}
        return {count,cost,counts};
    }
    function permits(p,state,types,source='endless_wave') {
        if(state.count+types.length>p.activeCap||state.cost+types.reduce((n,t)=>n+(costs[t]||1),0)>p.threatCap)return false;
        const counts={...state.counts};for(const t of types)counts[t]=(counts[t]||0)+1;
        if((counts.runner||0)+(counts.tunneler||0)>Math.min(4,Math.ceil(p.activeCap*.24)))return false;
        if((counts.carrier||0)>2||(counts.support||0)>2||(counts.artillery||0)>2)return false;
        return source!=='carrier_spawn'||types.every(t=>t==='skitter');
    }
    root.ChargefrontEndlessDirector=Object.freeze({plan,live,permits,costs,unlock,family,replaySeed,eligibleMutators});
})(globalThis);
