import assert from 'node:assert/strict';import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_PACKAGE)).href),root=resolve('_playtest/m42/cp3e-20261015'),out=resolve(root,'review');assert(!existsSync(out));mkdirSync(out);
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{const page=await browser.newPage();const sheet=async(name,images,columns=2)=>{
    const input=images.map(i=>({...i,src:'data:image/png;base64,'+readFileSync(resolve(root,i.path)).toString('base64')}));const data=await page.evaluate(async({input,columns})=>{const cv=document.createElement('canvas');cv.width=800*columns;cv.height=480*Math.ceil(input.length/columns);const c=cv.getContext('2d');c.fillStyle='#111720';c.fillRect(0,0,cv.width,cv.height);for(let i=0;i<input.length;i++){const im=new Image();im.src=input[i].src;await im.decode();const x=i%columns*800,y=Math.floor(i/columns)*480;c.drawImage(im,x,y+30,800,450);c.fillStyle='#edf3fa';c.font='16px sans-serif';c.fillText(input[i].label,x+8,y+22);}return cv.toDataURL('image/png').split(',')[1];},{input,columns});writeFileSync(resolve(out,name+'.png'),Buffer.from(data,'base64'));
};
for(const b of ['firefox','edge']){const game='e2-gameplay-verified/'+b+'/gameplay-'+b+'/',control='e0-verified/'+b+'/'+b+'/',light='e2-regression/'+b+'/lighting-'+b+'/';
    await sheet('01-portal-'+b,[{path:'e0-before/'+b+'/01-reference-normal.png',label:'ACCEPTED BASELINE | internal portal forced OPEN'},{path:control+'02-corrected-reference-portal.png',label:'E0 CONTROLLED MATCH | original panels CLOSED'}]);
    await sheet('02-turret-'+b,[{path:control+'01-real-hitscan-firing.png',label:'CONTROLLED TARGET | native activation, verified HP damage'},{path:game+'11-turret-live-drone-hit.png',label:'ACTUAL LIVE DEFENCE | player-eye shot/beam'}]);
    const group=async(name,ids)=>sheet(name+'-'+b,ids.map(id=>({path:game+id+'.png',label:'NORMAL PLAYER EYE | '+id+' | '+b})));
    await group('03-rooms',['05-main-hall','06-vault','07-decontamination','08-research-security']);
    await group('04-containment',['09-containment-before','10-lockdown-activation','12-active-drone-defence-30','12-active-drone-defence-60','13-defence-89','14-transfer-start','15-transfer-mid','16-transfer-complete']);
    await group('05-evacuation',['17-M4-north-access-sealed','18-M4-native-evacuation','19-power-service','20-emergency-exit','21-emergency-evacuated']);
    await group('06-exterior-player-eye',['01-exterior-far','02-exterior-near','03-exterior-approach','04-front-entrance']);
    await sheet('07-exterior-fixed-frame-'+b,['west','power-exit'].flatMap(zone=>['near','far','inside'].map(condition=>({path:light+zone+'-'+condition+'.png',label:zone+' | ACTOR '+condition.toUpperCase()+' | '+b}))),3);
}}finally{await browser.close();}
