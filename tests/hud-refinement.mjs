// UI-only browser checks. --before captures the accepted header/panels before editing.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium, firefox } = await import(process.env.PLAYWRIGHT_PACKAGE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href : 'playwright');
const ff = process.argv.includes('firefox'), before = process.argv.includes('--before'), name = ff ? 'firefox' : 'edge';
const out = resolve(process.env.CF_ARTIFACT_DIR || '_playtest/m41/hud-refinement'); mkdirSync(out, {recursive:true});
const browser = await (ff ? firefox : chromium).launch(ff ? {headless:true} : {headless:!process.argv.includes('--headed'),
    executablePath:process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',args:['--enable-unsafe-swiftshader','--allow-file-access-from-files']});
const page = await browser.newPage({viewport:{width:1280,height:720}}), errors=[], consoles=[], results={};
page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error') consoles.push(m.text());});
const url=pathToFileURL(resolve('chargefront.html')); url.searchParams.set('perfDiagnostics','1');
const capture=async(label,clip)=>{if(!ff) await page.screenshot({path:resolve(out,label+'.png'),...(clip?{clip}:{})});};
const inspect=()=>page.evaluate(()=>__cf.inspectHUD());
const select=async(key,index)=>{
    await page.keyboard.press(key); await page.waitForFunction(i=>__cf.player.weaponIndex===i && !__cf.player.swapT,index);
};
try {
    // Firefox doesn't report file:// image requests through Playwright's request
    // events. Observe native src assignments in both browsers to verify one-time loading.
    await page.addInitScript(()=>{
        window.__iconLoads=[];
        const src=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
        Object.defineProperty(HTMLImageElement.prototype,'src',{...src,set(value){
            if(/\/(health-normal|shield|walking-boot)\.svg$/.test(String(value)))__iconLoads.push(String(value).split('/').pop());
            src.set.call(this,value);
        }});
    });
    await page.goto(url.href); await page.waitForFunction(()=>!!window.__cf?.renderer,undefined,{timeout:120000});
    await page.locator('#btn-start').click(); await page.locator('#btn-sound-start').click();
    await page.waitForFunction(()=>__cf.intro && !__cf.intro.prewarmPending,undefined,{timeout:120000});
    await page.keyboard.press('Space');
    await page.evaluate(()=>{
        const c=__cf; c.setNoSpawn(true); c.setNoAggro(true); c.clearTestEnemies(); c.setInvulnerable(true);
        c.player.hpDelayT=100; c.player.shieldDelayT=100; c.player.yaw=Math.PI/2; c.player.pitch=0;
        c.combat.weapons.rifle.mag=26; c.combat.weapons.scatter.mag=8;
        for(const m of c.squad) {m.hpDelayT=100;m.shieldDelayT=100;}
        document.getElementById('cf-perf-diagnostics').style.display='none';
    });
    await page.waitForTimeout(250);
    if(before) {await capture('01-before'); console.log('PASS baseline HUD capture');}
    else {
        results.slot1=await inspect();
        const weaponRows=h=>h.text.filter(t=>/^\[[12]\] (BUL-117|CRW-8)$/.test(t.value));
        const checkWeapons=(h,active)=>{
            const rows=weaponRows(h); assert.equal(rows.length,2);
            assert(rows[0].value.startsWith('[1]')); assert(rows[1].value.startsWith('[2]')); assert(rows[1].y>rows[0].y && rows[1].y-rows[0].y<25);
            assert(rows[active].size>rows[1-active].size); assert(rows[active].color[0]>rows[1-active].color[0]);
            assert(h.text.some(t=>t.value==='26 / 50')); assert(h.text.some(t=>t.value==='8 / 20'));
            const y=value=>h.text.find(t=>t.value===value).y;
            assert(y('MEDKITS')<y('[1/2] EQUIP  [Q] CYCLE  [R] RELOAD')); assert(y('[1/2] EQUIP  [Q] CYCLE  [R] RELOAD')<y('SUPPLIES'));
        };
        checkWeapons(results.slot1,0); await capture('02-slot1-full-vitals');
        await select('2',1); results.slot2=await inspect(); checkWeapons(results.slot2,1);
        await select('1',0); checkWeapons(await inspect(),0);
        await select('q',1); checkWeapons(await inspect(),1);
        await select('q',0); checkWeapons(await inspect(),0);
        // Preserve smooth reload fill/cancel/complete and shared magazine presentation.
        await page.keyboard.press('r'); await page.waitForFunction(()=>__cf.player.weapon.reloading);
        const reload1=await inspect(); await page.waitForTimeout(300); const reload2=await inspect();
        const reloadBar=h=>h.bars.find(b=>b.width===100);
        assert(reloadBar(reload2).progress>reloadBar(reload1).progress);
        const cartridges=await page.evaluate(()=>__cf.combat.cartridges);
        await select('2',1); assert(!(await inspect()).text.some(t=>t.value==='RELOADING'));
        assert.equal(await page.evaluate(()=>__cf.combat.cartridges),cartridges);
        await page.keyboard.press('r'); await page.waitForFunction(()=>__cf.player.weapon.reloading);
        await page.waitForFunction(()=>!__cf.player.weapon.reloading);
        assert.equal(await page.evaluate(()=>__cf.combat.cartridges),cartridges-1);
        // Sensing actual fill draw calls (transforms/colors), not just input percentages.
        await page.evaluate(()=>{
            window.__statusPaint=[];
            const original=CanvasRenderingContext2D.prototype.fillRect;
            CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){
                const t=this.getTransform(), pw=Math.abs(t.a*w), ph=Math.abs(t.d*h);
                if(ph===6 && pw>0 && pw<=230) {
                    const sx=Math.min(t.a*x+t.e,t.a*(x+w)+t.e), sy=Math.min(t.d*y+t.f,t.d*(y+h)+t.f);
                    if(sx>=45 && sx<280 && sy>400) {__statusPaint.push({x:sx,y:sy,width:pw,style:this.fillStyle}); if(__statusPaint.length>300) __statusPaint.shift();}
                }
                return original.call(this,x,y,w,h);
            };
        });
        await page.evaluate(()=>{
            const c=__cf; c.pause(true); c.player.hp=45;c.player.shield=25;c.player.stamina=40;
            for(let i=0;i<3;i++){const m=c.squad[i];m.hp=m.maxHp*(i+1)/4;m.shield=m.maxShield*(3-i)/4;m.abilityCd=i?6:0;}
            c.squad[1].pos.x=c.player.pos.x+35; c.squad[1].pos.y=c.player.pos.y;
            c.squad[2].downed=true;
        });
        await page.waitForTimeout(100); results.damaged=await inspect();
        assert(results.damaged.text.some(t=>t.value==='COMMANDER')); assert(results.damaged.text.some(t=>t.value==='VITALS'));
        assert(!results.damaged.text.some(t=>/^(PLAYER|TEAM \/ VITALS|HP |.*% HP)/.test(t.value)));
        const statusBars=h=>h.bars.filter(b=>b.framed===false);
        const damagedBars=statusBars(results.damaged); assert.equal(damagedBars.length,9);
        assert.deepEqual(damagedBars.slice(0,3).map(b=>b.progress),[.45,.25,.4]);
        assert.deepEqual(damagedBars.slice(3).map(b=>b.progress),[.25,.75,.5,.5,0,0]);
        for(const status of ['FOLLOW','AFAR','DOWN']) assert(results.damaged.text.some(t=>t.value===status));
        assert(results.damaged.text.some(t=>t.value.includes('Bulwark READY')));
        assert.equal(results.damaged.icons.length,9); assert(results.damaged.icons.every(i=>i.loaded && i.width===i.height));
        assert.equal(results.damaged.icons.filter(i=>i.id==='stamina').length,1);
        results.statusPaint=await page.evaluate(()=>__statusPaint.slice(-50));
        const stamina=damagedBars[2];
        assert(results.statusPaint.some(p=>Math.abs(p.y-(stamina.y-3))<1 && Math.abs(p.width-stamina.width*.4)<1),'Actual partial stamina fill must be proportional');
        await capture('03-slot2-damaged-vitals');
        await page.evaluate(()=>{__cf.player.stamina=0;__statusPaint=[];}); await page.waitForTimeout(100); results.exhausted=await inspect();
        assert.equal(statusBars(results.exhausted)[2].progress,0);
        const emptyPaint=await page.evaluate(y=>__statusPaint.filter(p=>Math.abs(p.y-y)<1),stamina.y-3);
        assert(emptyPaint.length>0 && emptyPaint.every(p=>p.width===200)); assert.equal(new Set(emptyPaint.map(p=>p.style)).size,1,'Empty stamina must paint only the dark track');
        results.staminaFill={trackWidth:200,partialFillWidth:80,emptyFillWidth:0};
        await capture('04-exhausted-vitals',{x:12,y:402,width:272,height:312});
        // Real sprint input and idle recovery prove the same gameplay stamina feeds the HUD.
        await page.evaluate(()=>{const c=__cf;c.player.hp=c.player.maxHp;c.player.shield=c.player.maxShield;c.player.stamina=100;c.squad[2].downed=false;c.pause(false);});
        await page.keyboard.down('w');await page.keyboard.down('ShiftLeft');await page.waitForTimeout(2400);
        await page.keyboard.up('ShiftLeft');await page.keyboard.up('w');
        const consumed=await page.evaluate(()=>__cf.player.stamina); assert(consumed>0 && consumed<70);
        assert(Math.abs(statusBars(await inspect())[2].progress-consumed/100)<.03);
        await page.waitForTimeout(1800); const recovered=await page.evaluate(()=>__cf.player.stamina);assert(recovered>consumed);
        await page.waitForFunction(()=>__cf.player.stamina===100,undefined,{timeout:10000}); assert.equal(statusBars(await inspect())[2].progress,1);
        results.sprint={consumed,recovered,full:100};
        // Layout/data inspection uses the same render functions at each real viewport.
        results.layouts=[];
        for(const viewport of [{width:1280,height:720},{width:1366,height:768},{width:1920,height:1080}]) {
            await page.setViewportSize(viewport);await page.waitForTimeout(150);const h=await inspect();
            const left=h.panels.filter(p=>p.x===148);assert.equal(left.length,2);
            assert(left[0].y-left[0].height/2>=0 && left[0].y+left[0].height/2<=viewport.height);
            assert(left[1].y-left[1].height/2>=0 && left[1].y+left[1].height/2<=viewport.height);
            assert(left[0].y-left[0].height/2>left[1].y+left[1].height/2);
            assert(h.icons.every(i=>i.x-i.width/2>=16 && i.x+i.width/2<280));
            assert(h.text.filter(t=>t.x<280).every(t=>t.y>12 && t.y<viewport.height-16));
            const textBounds=await page.evaluate(text=>{
                const ctx=document.createElement('canvas').getContext('2d');
                return text.filter(t=>[30,32,256,262].includes(t.x)).map(t=>{
                    ctx.font=t.size+'px "Glitch Slap"'; const width=ctx.measureText(t.value).width;
                    const left=t.align==='right'?t.x-width:t.align==='center'?t.x-width/2:t.x;
                    return {value:t.value,left,right:left+width};
                });
            },h.text);
            assert(textBounds.every(t=>t.left>=24 && t.right<=272),'Left panel text must remain inside its frame');
            const main=h.text.find(t=>t.value==='MAIN OBJECTIVE');assert.equal(main.x,viewport.width-16);assert.equal(main.align,'right');assert(main.y>=170);
            assert(h.text.some(t=>t.value==='[F] SURGE READY'||/^\[F\] SURGE [\d.]+s$/.test(t.value)));
            results.layouts.push({viewport,panels:left,icons:h.icons.length});
        }
        await page.evaluate(()=>__cfPerf.reset());await page.waitForTimeout(1000);
        results.renderCounters=await page.evaluate(()=>__cfPerf.summary().counters);
        for(const key of ['materialsCreated','geometriesCreated','linkProgram','buildTerrain','buildFacility']) assert.equal(results.renderCounters[key]||0,0);
        assert.deepEqual(errors,[]);assert.deepEqual(consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s)),[]);
        const iconLoads=await page.evaluate(()=>__iconLoads);
        assert.deepEqual(iconLoads.slice().sort(),['health-normal.svg','shield.svg','walking-boot.svg']);
        results.iconRequests=iconLoads;
        results.passed=true; console.log('PASS HUD refinement',name,JSON.stringify({sprint:results.sprint,layouts:results.layouts}));
    }
} finally {
    await page.mouse.up().catch(()=>{});for(const key of ['w','ShiftLeft']) await page.keyboard.up(key).catch(()=>{});
    if(!before) {
        const vitals=h=>h?.bars.filter(b=>!b.framed).map(b=>b.progress);
        const weapons=h=>h?.text.filter(t=>/^\[[12]\] (BUL-117|CRW-8)$/.test(t.value));
        writeFileSync(resolve(out,`validation-${name}.json`),JSON.stringify({passed:!!results.passed,weaponRows:{slot1:weapons(results.slot1),slot2:weapons(results.slot2)},
            damagedVitals:vitals(results.damaged),exhaustedVitals:vitals(results.exhausted),sprint:results.sprint,layouts:results.layouts,
            icons:results.iconRequests,staminaFill:results.staminaFill,renderCounters:results.renderCounters,errors,unexpectedConsoleErrors:consoles.filter(s=>!/XMLHttpRequest|CORS|Access-Control|net::ERR_FAILED|Cross-Origin Request Blocked/.test(s))},null,2));
    }
    await browser.close();
}
