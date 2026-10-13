// Runs existing authoritative suites without editing them. Fresh receipts only.
import {mkdirSync,existsSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve('_playtest/m42/cp3c-20261012');
const suites=process.argv.slice(2);const results=[];
const tag=process.env.CF_REGRESSION_TAG?'-'+process.env.CF_REGRESSION_TAG:'';
for(const name of process.env.CF_BROWSER?[process.env.CF_BROWSER]:['firefox','edge']) {
    const out=resolve(root,'regression-'+name+tag);mkdirSync(out,{recursive:true});
    for(const suite of suites) {
        const log=resolve(out,suite+'-'+name+'.log');if(existsSync(log))throw Error('Fresh logs only: '+log);
        const start=Date.now();const result=spawnSync(process.execPath,['tests/'+suite+'.mjs',name],{
            env:{...process.env,CF_ARTIFACT_DIR:out},encoding:'utf8',timeout:300000,maxBuffer:64*1024*1024});
        writeFileSync(log,(result.stdout||'')+(result.stderr||''));
        const receipt={browser:name,suite,status:result.status,signal:result.signal,error:result.error?.message||null,seconds:(Date.now()-start)/1000,
            sourceSha256:createHash('sha256').update(readFileSync('src/world/facility.js')).digest('hex')};
        results.push(receipt);writeFileSync(resolve(root,'results-'+suites.join('-')+tag+'.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(receipt));
        if(result.status!==0){console.log((result.stdout||'')+(result.stderr||''));process.exitCode=1;}
    }
}
