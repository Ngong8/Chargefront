// Bounded batches of unchanged suites; preserve all receipts, no overwrites.
import {mkdirSync,existsSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve('_playtest/m42/cp3cr-implementation-20261013'),tag=process.env.CF_REGRESSION_TAG||'final';
const suites=process.argv.slice(2),rows=[];
for(const name of process.env.CF_BROWSER?[process.env.CF_BROWSER]:['firefox','edge']){
    const out=resolve(root,'regression-'+tag+'-'+name);mkdirSync(out,{recursive:true});
    for(const suite of suites){const log=resolve(out,suite+'.log');if(existsSync(log))throw Error('Fresh logs only: '+log);
        const started=Date.now(),sourceSha256=createHash('sha256').update(readFileSync('src/world/facility.js')).digest('hex');
        const result=spawnSync(process.execPath,['tests/'+suite+'.mjs',name],{env:{...process.env,CF_ARTIFACT_DIR:out,TEMP:'C:/Users/User/AppData/Local/Temp/opencode',TMP:'C:/Users/User/AppData/Local/Temp/opencode'},encoding:'utf8',timeout:Number(process.env.CF_SUITE_BUDGET_MS)||360000,maxBuffer:64*1024*1024});
        writeFileSync(log,(result.stdout||'')+(result.stderr||''));const row={browser:name,suite,status:result.status,signal:result.signal,error:result.error?.message||null,seconds:(Date.now()-started)/1000,sourceSha256};
        rows.push(row);writeFileSync(resolve(root,'results-'+tag+'-'+(process.env.CF_BROWSER||'both')+'-'+suites.join('-')+'.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(row));
        if(result.status!==0){console.log((result.stdout||'')+(result.stderr||''));process.exitCode=1;}
    }
}
