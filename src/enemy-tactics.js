/* Small engine-independent enemy policies. Actor, collision, damage and save
   ownership remain in chargefront.html; no world graph or per-frame search. */
(function(root) {
    'use strict';
    const roles=Object.freeze(Object.fromEntries(Object.entries({
        skitter:{style:'flank',windup:.28},runner:{style:'commit',windup:0},
        brute:{style:'assault',windup:.65},shielded:{style:'assault',windup:.38},
        carrier:{style:'assault',windup:.55},tunneler:{style:'burrow',windup:0},
        spitter:{style:'skirmish',windup:.4},screecher:{style:'orbit',windup:.4},
        drone:{style:'strafe',windup:.28},support:{style:'support',windup:0},
        artillery:{style:'stand-off',windup:.65},boss:{style:'siege',windup:.75},
    }).map(([id,role])=>[id,Object.freeze(role)])));
    const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    function chooseVisible(current,candidates,origin,visible,valid,committed=false) {
        const currentVisible=valid(current)&&visible(current);
        let choice=currentVisible?current:null,best=choice?distance(origin,choice.pos):Infinity;
        if (choice&&committed) return choice;
        for(const target of candidates) {
            if(target===current||!valid(target))continue;
            const d=distance(origin,target.pos);
            if(d>=(choice?best*.65:Infinity)||!visible(target))continue;
            choice=target;best=d;
        }
        return choice;
    }
    function engagement(role,origin,known,range,reach,visible,side) {
        const d=distance(origin,known),dx=known.x-origin.x,dy=known.y-origin.y;
        if(!visible)return {x:known.x,y:known.y,mode:'investigate',stop:.65};
        if(range>0) {
            if(d<Math.max(6,range-6)) {
                const n=d||1;
                return {x:origin.x-dx/n*5,y:origin.y-dy/n*5,mode:'withdraw',stop:.65};
            }
            if(d<=range+1) {
                if(role.style==='strafe'||role.style==='orbit') {
                    const n=d||1,r=role.style==='orbit'?5:3;
                    return {x:origin.x-dy/n*r*side,y:origin.y+dx/n*r*side,mode:role.style,stop:.65};
                }
                return {x:origin.x,y:origin.y,mode:'hold-range',stop:.65};
            }
        }else if(role.style==='flank'&&d>8&&d<26) {
            return {x:known.x-dy/d*3*side,y:known.y+dx/d*3*side,mode:'flank',stop:.65};
        }
        return {x:known.x,y:known.y,mode:'advance',stop:range ? .65 : reach};
    }
    function detour(origin,goal,blockers,clear,previous=null,side=1) {
        let best=null,score=Infinity;
        const visited=Array.isArray(previous)?previous:previous?[previous]:[];
        // At most twelve blockers / 48 corners, no unbounded world search.
        for(const box of blockers.slice(0,12))for(const x of [box.x0-.75,box.x1+.75])for(const y of [box.y0-.75,box.y1+.75]) {
            const p={x,y},d=distance(origin,p);
            if(d<.22||d>70||visited.some(old=>distance(old,p)<.35)||!clear(origin,p))continue;
            const turn=(goal.x-origin.x)*(y-origin.y)-(goal.y-origin.y)*(x-origin.x);
            const cost=d+distance(p,goal)+(clear(p,goal)?0:8)+(turn*side<0?.4:0);
            if(cost<score){best=p;score=cost;}
        }
        if(best)return best;
        // Crowded corners: choose a short clear local escape, retaining a side.
        const facing=Math.atan2(goal.y-origin.y,goal.x-origin.x);
        for(const turn of [side*.7,-side*.7,side*1.3,-side*1.3,side*1.8]) {
            const p={x:origin.x+Math.cos(facing+turn)*4,y:origin.y+Math.sin(facing+turn)*4};
            if(clear(origin,p))return p;
        }
        return {x:origin.x,y:origin.y};
    }
    function relayObjective(origin,center,free) {
        const angle=Math.atan2(origin.y-center.y,origin.x-center.x);
        // The relay is a solid landmark, not an attackable target. Pick a free
        // approach ring rather than directing actors into its collider.
        for(const radius of [8,12])for(const offset of [0,.35,-.35,.7,-.7,1.2,-1.2,Math.PI]) {
            const p={x:center.x+Math.cos(angle+offset)*radius,y:center.y+Math.sin(angle+offset)*radius};
            if(free(p))return p;
        }
        return null;
    }
    root.ChargefrontEnemyTactics=Object.freeze({roles,chooseVisible,engagement,detour,relayObjective});
})(globalThis);
