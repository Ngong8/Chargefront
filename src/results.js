/* Pure debrief snapshots. No save, gameplay, DOM or animation ownership. */
(function(root) {
    'use strict';
    const metricKeys = ['activeSeconds','kills','cartridgesCrafted','medkitsCrafted'];
    const number = value => Number.isFinite(value) ? Math.max(0,Math.min(1e9,value)) : 0;
    const count = value => Math.floor(number(value));
    const whole = value => Number.isFinite(value) ? Math.floor(Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,value))) : 0;
    const integer = value => whole(value).toLocaleString('en-US');
    function clock(value) {
        const seconds = whole(value), minutes = Math.floor(seconds/60);
        return minutes >= 60 ? Math.floor(minutes/60)+':'+String(minutes%60).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')
            : minutes+':'+String(seconds%60).padStart(2,'0');
    }
    function freeze(value) {
        for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child);
        return Object.freeze(value);
    }
    function chapter(mission,counters,optional={},success=true,mainIndex=0) {
        return {missionId:mission.id,kills:count(counters.kills),activeSeconds:number(counters.activeSeconds),
            cartridgesCrafted:count(counters.cartridgesCrafted),medkitsCrafted:count(counters.medkitsCrafted),
            mainCompleted:success?mission.mainObjectives.length:Math.min(count(mainIndex),mission.mainObjectives.length),
            optionalCount:mission.optionalObjectives.filter(o=>!!optional[o.id]).length};
    }
    function history(missions,missionId,rows) {
        const earlier = missions.slice(0,missions.findIndex(m=>m.id===missionId));
        return earlier.flatMap(mission=>{
            const row = Array.isArray(rows) ? rows.filter(r=>r?.missionId===mission.id).at(-1) : null;
            if (!row) return [];
            const result = {missionId:mission.id,mainCompleted:mission.mainObjectives.length,
                optionalCount:Number.isFinite(row.optionalCount)?Math.min(count(row.optionalCount),mission.optionalObjectives.length):mission.optionalObjectives.length?null:0};
            for (const key of metricKeys) result[key] = Number.isFinite(row[key]) ? (key==='activeSeconds'?number(row[key]):count(row[key])) : null;
            return [result];
        });
    }
    function performanceStats(metrics,timeLabel) {
        return [{id:'time',label:timeLabel,value:clock(metrics.activeSeconds)},
            {id:'kills',label:'Hostile eliminations',value:integer(metrics.kills)},
            {id:'cartridges',label:'Cartridges crafted',value:integer(metrics.cartridgesCrafted)},
            {id:'medkits',label:'Medkits crafted',value:integer(metrics.medkitsCrafted)}];
    }
    function campaign({missions,missionId,origin,success,profileComplete,rows,current,optional,mainIndex}) {
        const mission = missions.find(m=>m.id===missionId);
        const standalone = origin==='mission_select';
        const chapters = history(missions,missionId,rows).map(row=>({...row,success:true}));
        chapters.push({...chapter(mission,current,optional,success,mainIndex),success});
        const totals = Object.fromEntries(metricKeys.map(key=>[key,chapters.reduce((sum,row)=>sum+(row[key]||0),0)]));
        const expected = standalone ? chapters.length : mission.number;
        const partial = chapters.length<expected || chapters.some(row=>metricKeys.some(key=>row[key]===null));
        const fullCampaign = success && !standalone && profileComplete && !mission.nextMission;
        return freeze({mode:'campaign',success,missionId,origin,fullCampaign,
            title:success?(fullCampaign?'CAMPAIGN COMPLETE':'MISSION '+mission.number+' COMPLETE'):'MISSION FAILED',
            identity:'MISSION '+mission.number+' / '+mission.name,
            summary:success?'DNA SAMPLE EXTRACTED — SQUAD ABOARD':'COMMANDER DOWN — OPERATION INTERRUPTED',
            scope:(partial?'Recorded operation totals':chapters.length>1?'Operation totals':'Mission totals')+' · '+chapters.length+' mission'+(chapters.length===1?'':'s'),
            stats:performanceStats(totals,'Operation time'),totals,chapters:chapters.map(row=>{
                const def=missions.find(m=>m.id===row.missionId);
                return {...row,number:def.number,name:def.name,mainTotal:def.mainObjectives.length,optionalTotal:def.optionalObjectives.length};
            }),
            notes:[standalone?'Mission Select run — Campaign checkpoint unchanged.':success?'Campaign run — use Mission Select to replay unlocked operations.':'Retry starts this mission fresh. Continue from the menu restores the last saved checkpoint.',
                ...(partial?['Earlier statistics are unavailable in this checkpoint; totals cover recorded missions only.']:[]),
                ...(chapters.some(row=>row.optionalCount===null)?['Some earlier optional-objective counts were not recorded by this save.']:[]),
                'Eliminations include all neutralized hostiles, including squad support and hostile detonations.'],
            replay:!success,selectMission:true});
    }
    function endless({success,run,current}) {
        const wave=count(run.wave),cleared=Math.max(0,wave-(run.waveActive?1:0));
        const totals={activeSeconds:number(current.activeSeconds),kills:count(current.kills),cartridgesCrafted:count(current.cartridgesCrafted),medkitsCrafted:count(current.medkitsCrafted)};
        return freeze({mode:'endless',success,title:'SURVIVAL DEBRIEF',identity:'ENDLESS HORDE / '+run.arena.name,
            summary:success?'EXTRACTION SECURED':'GAME OVER — COMMANDER DOWN',scope:'Final run statistics',totals,wave,cleared,
            stats:[{id:'wave',label:'Final wave reached',value:integer(wave)},{id:'cleared',label:'Waves cleared',value:integer(cleared)},
                ...performanceStats(totals,'Survival time'),{id:'dna',label:'DNA banked',value:integer(run.dnaBanked)}],chapters:[],
            notes:['Survival time includes intermissions and excludes pauses.','Eliminations include all neutralized hostiles. Replay retains this deployment and arena with fresh supplies.'],
            replay:true,selectMission:false});
    }
    root.ChargefrontResults=Object.freeze({chapter,history,campaign,endless,clock,integer});
})(globalThis);
