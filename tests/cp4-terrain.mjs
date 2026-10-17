// Real renderer/terrain integration; immutable receipts, isolated browser saves.
import assert from 'node:assert/strict';
import {mkdirSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const {firefox,chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href);
const name=process.argv.includes('firefox')?'firefox':'edge',out=resolve(process.env.CF_ARTIFACT_DIR||'_playtest/m42/cp4/terrain','terrain-'+name);assert(!existsSync(out));mkdirSync(out,{recursive:true});
const browser=await(name==='firefox'?firefox.launch({headless:true}):chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--allow-file-access-from-files','--enable-unsafe-swiftshader']}));
const page=await browser.newPage({viewport:{width:1280,height:720}}),report={browser:name,errors:[],campaign:[],endless:[]};page.on('pageerror',e=>report.errors.push(e.message));
const url=pathToFileURL(resolve('chargefront.html'));url.searchParams.set('perfDiagnostics','1');
async function boot(){await page.goto(url.href);await page.waitForFunction(()=>window.__cf?.renderer&&window.__cfPerf,undefined,{timeout:120000});}
async function fingerprint(){return page.evaluate(()=>{
    const c=__cf,g=c.scene.getObjectByName(c.mode==='campaign'?'CampaignGround':'EndlessGround');
    const hash=array=>{let h=2166136261;for(const v of new Uint8Array(array.buffer,array.byteOffset,array.byteLength)){h^=v;h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
    return {height:hash(g.geometry.attributes.position.array),colors:g.geometry.attributes.color?hash(g.geometry.attributes.color.array):null,
        solids:c.solidsForTest().map(({x0,y0,x1,y1,topY,bottomY,overhead,portal})=>({x0,y0,x1,y1,topY,bottomY,overhead,portal})),trees:c.endlessDecorInfo(),arena:c.mode==='endless'?c.endless.arena.id:null};
});}
async function geometryChecks(){return page.evaluate(()=>{
    const c=__cf,g=c.scene.getObjectByName(c.mode==='campaign'?'CampaignGround':'EndlessGround'),p=g.geometry.attributes.position,idx=g.geometry.index;
    const campaign=c.mode==='campaign',paths=campaign?c.campaignTerrainInfo().paths:[[[400,442],[460,460],[480,400]]];
    const distance=(x,y)=>Math.min(...paths.flatMap(path=>path.slice(1).map((b,i)=>{const a=path[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);})));
    let maxVertexError=0,maxCriticalError=0,triangles=0,maxNewSlope=0;
    for(let i=0;i<p.count;i+=19){const x=p.getX(i)+400,y=p.getY(i)+400;maxVertexError=Math.max(maxVertexError,Math.abs(p.getZ(i)-c.terrainHeight(x,y)));}
    // Actual triangle centroids, not a visual/analytic grid count comparison.
    for(let i=0;i<idx.count;i+=3){const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)],x=ids.reduce((n,j)=>n+p.getX(j)+400,0)/3,y=ids.reduce((n,j)=>n+p.getY(j)+400,0)/3;
        if(distance(x,y)>10)continue;const z=ids.reduce((n,j)=>n+p.getZ(j),0)/3;maxCriticalError=Math.max(maxCriticalError,Math.abs(z-c.terrainHeight(x,y)));triangles++;
    }
    if(campaign)for(const [,x,y] of c.campaignTerrainInfo().features){const h=c.campaignTerrainChangeForTest(x,y);maxNewSlope=Math.max(maxNewSlope,Math.abs(c.campaignTerrainChangeForTest(x+.1,y)-h)/.1);}
    const anchors=campaign?[[450,80],[436,90],[205,575],[245,748],[575,585],[285,585],[450,570],[360,618],[360,774],[450,752]]:[[400,400],[413,400],[400,442]];
    const changes=campaign?anchors.map(([x,y])=>c.campaignTerrainChangeForTest(x,y)):[];
    const interactionAccess=anchors.slice(campaign?2:0).map(([x,y])=>({anchor:[x,y],clear:Array.from({length:32},(_,i)=>{const a=i*Math.PI/16;return !c.insideSolid(x+Math.cos(a)*6,y+Math.sin(a)*6,.6);}).filter(Boolean).length}));
    const surfaces=[];
    if(campaign){
        c.scene.updateMatrixWorld(true);
        for(const name of ['CP3CSecuritydark','CP3CVaultsteel','CP3CRHallPipeMounts','CP3CPowersteel']){
            const mesh=c.scene.getObjectByName(name),boxes=[];mesh.geometry.computeBoundingBox();
            for(let i=0;i<mesh.count;i++){const m=mesh.matrixWorld.clone(),local=m.clone();mesh.getMatrixAt(i,local);m.multiply(local);const b=mesh.geometry.boundingBox.clone().applyMatrix4(m);boxes.push({min:b.min.toArray(),max:b.max.toArray()});}
            let coincident=0;for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)for(let axis=0;axis<3;axis++)for(const side of ['min','max']){
                const a=boxes[i],b=boxes[j];if(Math.abs(a[side][axis]-b[side][axis])>1e-5)continue;
                if([0,1,2].filter(k=>k!==axis).every(k=>Math.min(a.max[k],b.max[k])-Math.max(a.min[k],b.min[k])>.0001))coincident++;
            }surfaces.push({name,coincident});
        }
        for(const door of c.facilityDoors){const boxes=door.panels.map(leaf=>{const mesh=leaf.g.children[0];mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);return {min:b.min.toArray(),max:b.max.toArray()};}),axis=door.axis==='x'?0:1;
            const overlap=Math.min(...boxes.map(b=>b.max[axis]))-Math.max(...boxes.map(b=>b.min[axis]));surfaces.push({name:'door/'+(door.id||'front'),overlap});
        }
        const floor=c.scene.getObjectByName('ResearchFloor');surfaces.push({name:'ResearchFloor',north:floor.position.y+floor.geometry.parameters.depth/2});
        const readout=c.scene.getObjectByName('ResearchReadout');surfaces.push({name:'ResearchReadout',height:readout.geometry.parameters.height});
    }
    return {maxVertexError,maxCriticalError,triangles,maxNewSlope,changes,interactionAccess,surfaces,slots:c.performanceInfo().budgetLights.slots,sections:c.facilitySections().length,vertexColors:g.material.vertexColors};
});}
try{
    for(const seed of [1,999999]){
        await boot();await page.evaluate(seed=>{const c=__cf,r=Math.random;Math.random=ChargefrontProgression.seedRandom(seed);try{c.resetCampaignProgress();c.startMission('dead_signal','new_campaign');}finally{Math.random=r;}c.skipIntro();c.setNoSpawn(true);c.setNoAggro(true);c.setInvulnerable(true);c.clearTestEnemies();c.pause(true);},seed);
        await page.evaluate(()=>__cf.waitCombatPreparation());
        const world=await fingerprint(),checks=await geometryChecks();report.campaign.push({seed,world,checks});
        // Final refinement explicitly retires26 exterior records; no facility solid is removed.
        assert.equal(world.solids.length,301);assert(checks.maxVertexError<.00001);assert(checks.maxCriticalError<.00001,JSON.stringify(checks));assert(checks.changes.every(v=>v===0));assert(checks.interactionAccess.every(p=>p.clear>0));assert.equal(checks.slots,8);
        for(const s of checks.surfaces){if('coincident'in s)assert.equal(s.coincident,0,s.name);if('overlap'in s)assert(s.overlap<.00001,s.name);if('north'in s)assert.equal(s.north,735);if('height'in s)assert.equal(s.height,.01);}
        if(report.campaign.length>1)assert.deepEqual(world,report.campaign[0].world,'Campaign depends on ambient seed');
        await page.evaluate(()=>{__cf.completeMission();__cf.completeMission();__cf.clearTestEnemies();__cf.checkpoint();__cf.pause(true);});
        assert.deepEqual(await fingerprint(),world,'Mission transition rebuilt terrain/scatter');
        await page.evaluate(()=>{const saved=JSON.parse(localStorage.cf_campaign_v1);saved.version=3;saved.operation.continuedState.version=3;
            if(!ChargefrontProgression.campaignValid(saved))throw Error('v3 compatibility fixture rejected');localStorage.cf_campaign_v1=JSON.stringify(saved);});
        await boot();await page.evaluate(()=>{const c=__cf;if(!c.startMission('sample_zero','continue_campaign'))throw Error('v3 Continue failed');c.setNoSpawn(true);c.clearTestEnemies();c.pause(true);});
        assert.deepEqual(await fingerprint(),world,'Cold v3 Continue changed geography');
    }
    assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS CP4 Campaign determinism, v3 load, critical mesh/collision and objective access',name,JSON.stringify(report.campaign.map(r=>({seed:r.seed,checks:r.checks}))));
}finally{writeFileSync(resolve(out,'manifest.json'),JSON.stringify(report,null,2));await browser.close();}
