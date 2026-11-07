/* Smooth height profiles and construction-time surface zoning for the three
   existing Endless arenas. No RNG, scenery, wave or save ownership. */
(function(root) {
    'use strict';
    const smooth = value => { const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t); };
    const profiles=Object.freeze(Object.fromEntries(Object.entries({
        valley:{name:'Mossy earth',soil:[.32,.20,.38],surface:[.15,.32,.25],stone:[.39,.30,.49],fill:[.17,.28,.27]},
        crater:{name:'Mineral ash',soil:[.43,.23,.35],surface:[.30,.17,.34],stone:[.52,.34,.46],fill:[.40,.12,.32]},
        ridges:{name:'Weathered scree',soil:[.24,.22,.39],surface:[.36,.35,.52],stone:[.23,.28,.43],fill:[.24,.15,.46]},
    }).map(([id,p])=>[id,Object.freeze({...p,soil:Object.freeze(p.soil),surface:Object.freeze(p.surface),stone:Object.freeze(p.stone),fill:Object.freeze(p.fill)})])));
    function height(id,x,y) {
        const dx=x-400,dy=y-400,d=Math.hypot(dx,dy);
        let h;
        if(id==='crater') {
            // Raised, rounded impact shoulder around a lower rolling basin.
            // Build above zero: subtracting a deep crater then clamping it
            // erased the entire old playable floor.
            h=2.5+d*d*.00016+5.5*Math.exp(-(((d-141)/34)**2))
                +1.2*Math.sin(dx*.031)*Math.cos(dy*.025)+.8*Math.cos((dx+dy)*.022);
        }else if(id==='ridges') {
            // Two broad crossing wave trains, never clipped troughs/terraces.
            h=8+4.5*Math.sin((dx+dy)*.027+.8)+2.5*Math.sin((dx-dy)*.044+.3);
        }else {
            // Winding lowland with soft lateral banks and rolling shoulders.
            const channel=dx-18*Math.sin(dy*.014);
            h=4+7*(1-Math.exp(-((channel/84)**2)))
                +1.8*Math.sin(dy*.031+.4)+1.3*Math.sin(dx*.021-dy*.014);
        }
        h+=.25*Math.sin(dx*.073+1)*Math.cos(dy*.061);
        // The only flat interior is the deliberate 24 m relay/vial clearing.
        // Smoothstep has zero endpoint derivative: no pad lip or terrace seam.
        h*=smooth((d-24)/40);
        const rim=smooth((d-185)/65);
        return Math.min(130,h+rim*rim*120+rim*8);
    }
    function color(id,x,y,height) {
        const profile=profiles[id]||profiles.valley,dx=x-400,dy=y-400,d=Math.hypot(dx,dy);
        // Broad irregular soil/vegetation/mineral transitions; the credited
        // neutralized aggregate tile supplies fine detail, not extra overlays.
        const patch=.5+.27*Math.sin(x*.027+Math.sin(y*.019)*1.8)+.20*Math.sin(y*.036-x*.012);
        const clearing=smooth((d-26)/38);
        let cover=0,stone=0;
        if(id==='crater') {
            cover=(1-smooth((d+patch*18-104)/58))*.8;
            stone=smooth((d+patch*16-126)/55)*.65;
        }else if(id==='ridges') {
            cover=smooth((patch-.18)/.7)*.85;
            stone=smooth((height-3)/13)*.65;
        }else {
            cover=smooth((patch-.22)/.62)*.85;
            stone=smooth((height-10)/22)*.55;
        }
        cover*=clearing;stone*=clearing;
        const grain=Math.sin(x*.23+y*.17)*Math.sin(y*.21-x*.13)*.018;
        return profile.soil.map((base,i)=>{
            const soil=base+(profile.surface[i]-base)*cover;
            return Math.max(.08,Math.min(.9,soil+(profile.stone[i]-soil)*stone+grain));
        });
    }
    root.ChargefrontEndlessTerrain=Object.freeze({profiles,color,height});
})(globalThis);
