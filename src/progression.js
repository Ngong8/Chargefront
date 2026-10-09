/* Pure persistence/balance helpers; runtime inventories remain owned by the game. */
(function(root) {
    'use strict';
    const missions = ['dead_signal','power_through','sample_zero','break_contact'];
    const reserves = Object.freeze({dead_signal:Object.freeze({player:6,squad:3}),power_through:Object.freeze({player:5,squad:2}),sample_zero:Object.freeze({player:4,squad:2}),break_contact:Object.freeze({player:3,squad:2})});
    const scrap = Object.freeze(Object.fromEntries(Object.entries({
        skitter:[.32,2,3],runner:[.32,2,3],spitter:[.45,3,4],screecher:[.45,3,4],drone:[.45,3,4],
        shielded:[.50,3,5],tunneler:[.60,4,5],support:[.55,4,5],brute:[.65,4,6],
        artillery:[.65,4,6],carrier:[.70,5,6],boss:[1,10,14],
    }).map(([id,[chance,min,max]])=>[id,Object.freeze({chance,min,max})])));
    const actorNumbers = Object.freeze(['maxHp','hp','maxShield','shield','mag','magSize','reserve','abilityCd','bulwarkT',
        'stamina','shieldDelayT','hpDelayT','speed','dmgMult','rateMult','dmgTakenMult','staminaDrainMult','staminaRegenMult',
        'critChance','reloadMult','jumpMult','grenadeDmgMult','critMult','speedMult','grenades','grenadeCd']);
    const weaponNumbers = Object.freeze(['mag','magSize','dmgMult','rateMult','spread','reloadTime','range']);
    const bounded = (value,fallback=0,max=1e6)=>Number.isFinite(value)?Math.max(0,Math.min(max,value)):fallback;
    const finiteTree = (value,depth=0)=>depth<16 && (value===null || ['string','boolean'].includes(typeof value) ||
        typeof value==='number'&&Number.isFinite(value) || Array.isArray(value)&&value.length<=512&&value.every(v=>finiteTree(v,depth+1)) ||
        value&&typeof value==='object'&&Object.keys(value).length<=256&&Object.values(value).every(v=>finiteTree(v,depth+1)));
    const checkpointValid = s=>!!s&&missions.includes(s.missionId)&&s.player&&Number.isFinite(s.player.hp)&&s.player.hp>0&&finiteTree(s)&&(!s.version||s.version<=4);
    const campaignValid = s=>!!s&&(!s.version||s.version<=4)&&s.missions&&missions.some(id=>s.missions[id])&&finiteTree(s)&&
        (!s.operation?.continuedState||checkpointValid(s.operation.continuedState));
    const endlessValid = s=>!!s&&s.version===1&&s.mode==='endless'&&['valley','crater','ridges'].includes(s.arena)&&
        s.configuration?.player&&s.run&&Number.isInteger(s.run.wave)&&s.run.wave>=0&&s.run.wave<=10000&&
        typeof s.run.waveActive==='boolean'&&Number.isFinite(s.run.budgetLeft)&&s.run.budgetLeft>=0&&
        s.player?.combat?.weapons&&Number.isFinite(s.player.hp)&&s.player.hp>0&&s.squad?.length===3&&finiteTree(s)&&
        [s.configuration.player.slot1,s.configuration.player.slot2].every(id=>['rifle','scatter','arc','plasma'].includes(id))&&
        s.configuration.player.slot1!==s.configuration.player.slot2&&(!s.configuration.player.ability||['surge','bulwark','medic_pulse','target_designator'].includes(s.configuration.player.ability))&&
        ['balanced','escort','screen'].includes(s.configuration.posture)&&['rook','vex','kade'].every(id=>
            ['rifle','scatter','arc','plasma'].includes(s.configuration.squad?.[id]?.weapon)&&
            (!s.configuration.squad?.[id]?.ability||['surge','bulwark','medic_pulse','target_designator'].includes(s.configuration.squad[id].ability)))&&
        Number.isFinite(s.player.combat.cartridges)&&s.player.combat.cartridges>=0&&s.squad.every(a=>Number.isFinite(a.hp)&&a.hp>=0)&&
        [s.configuration.player.slot1,s.configuration.player.slot2].every(id=>Number.isInteger(s.player.combat.weapons[id]?.mag)&&s.player.combat.weapons[id].mag>=0)&&
        [s.configuration.player.slot1,s.configuration.player.slot2].includes(s.player.combat.activeId);
    function read(storage,key,validate) {
        let problem='';
        for(const candidate of [key,key+'.backup']) {
            try { const raw=storage.getItem(candidate);if(!raw)continue;const data=JSON.parse(raw);
                if(validate(data))return {data,message:candidate===key?'':'Recovered the last valid backup checkpoint.'};
                problem='Saved progress is incompatible or invalid; Start New Game remains available.';
            } catch(error) {problem='Saved progress could not be read; Start New Game remains available.';}
        }
        return {data:null,message:problem};
    }
    function write(storage,key,data,validate) {
        if(!validate(data))return false;
        try {
            const encoded=JSON.stringify(data);const previous=read(storage,key,validate).data;
            if(previous)storage.setItem(key+'.backup',JSON.stringify(previous));
            storage.setItem(key,encoded);
            return true;
        } catch(error) {return false;}
    }
    function remove(storage,key) {try{storage.removeItem(key);storage.removeItem(key+'.backup');return true;}catch(error){return false;}}
    function actorSnapshot(actor) {
        const saved={};for(const key of actorNumbers)if(Number.isFinite(actor[key]))saved[key]=actor[key];
        saved.downed=!!actor.downed;saved.dead=!!actor.dead;return saved;
    }
    function restoreActor(actor,saved={}) {
        for(const key of actorNumbers)if(Number.isFinite(saved[key]))actor[key]=bounded(saved[key]);
        actor.maxHp=Math.max(1,actor.maxHp);actor.hp=Math.min(actor.hp,actor.maxHp);actor.shield=Math.min(actor.shield,actor.maxShield);
        if('mag' in actor)actor.mag=Math.floor(Math.min(actor.mag,actor.magSize));
        actor.downed=!!saved.downed;actor.dead=!!saved.dead;actor.reloading=false;actor.reloadT=0;
    }
    function scrapReward(type,random=Math.random) {
        const row=scrap[type]||scrap.skitter;
        return random()<row.chance?row.min+Math.min(row.max-row.min,Math.floor(random()*(row.max-row.min+1))):0;
    }
    function seedRandom(seed) {let state=seed>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
    root.ChargefrontProgression=Object.freeze({reserves,scrap,actorNumbers,weaponNumbers,bounded,checkpointValid,campaignValid,endlessValid,read,write,remove,actorSnapshot,restoreActor,scrapReward,seedRandom});
})(globalThis);
