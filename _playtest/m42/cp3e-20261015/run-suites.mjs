// Serial browser batches with immutable receipts and per-suite product hashes.
import {mkdirSync,existsSync,readFileSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const root=resolve('_playtest/m42/cp3e-20261015'),tag=process.argv[2],suites=process.argv.slice(3),rows=[];
for(const browser of process.env.CF_BROWSER?[process.env.CF_BROWSER]:['firefox','edge'])for(const suite of suites){const out=resolve(root,tag,browser);mkdirSync(out,{recursive:true});const log=resolve(out,suite+'.log');if(existsSync(log))throw Error('Fresh evidence required: '+log);
    const hashes=Object.fromEntries(['chargefront.html','src/world/facility.js'].map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')])),start=Date.now();
    const r=spawnSync(process.execPath,['tests/'+suite+'.mjs',browser],{encoding:'utf8',timeout:720000,maxBuffer:64*1024*1024,env:{...process.env,CF_ARTIFACT_DIR:out,TEMP:'C:/Users/User/AppData/Local/Temp/opencode',TMP:'C:/Users/User/AppData/Local/Temp/opencode'}});writeFileSync(log,(r.stdout||'')+(r.stderr||''));
    const row={browser,suite,status:r.status,error:r.error?.message||null,seconds:(Date.now()-start)/1000,hashes,log:tag+'/'+browser+'/'+suite+'.log'};rows.push(row);writeFileSync(resolve(root,tag+'-'+(process.env.CF_BROWSER||'both')+'-'+suites.join('-')+'.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(row));if(r.status!==0){process.exitCode=1;console.log((r.stdout||'')+(r.stderr||''));}
}
