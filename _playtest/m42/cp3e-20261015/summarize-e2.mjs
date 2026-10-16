import assert from 'node:assert/strict';import {readFileSync,writeFileSync,existsSync} from 'node:fs';import {resolve} from 'node:path';
const root=resolve('_playtest/m42/cp3e-20261015'),dest=resolve(root,'e2-metrics-summary.json');assert(!existsSync(dest));const rows=[];
for(const browser of ['firefox','edge']){
    const p=resolve(root,'e2-gameplay-verified',browser,'gameplay-'+browser,'manifest.json'),r=JSON.parse(readFileSync(p,'utf8'));assert(r.passed);assert.deepEqual(r.errors,[]);
    const regions=r.regions.map(s=>({label:s.label,kind:s.kind,frames:s.frames,p95:s.p95,p99:s.p99,worst:s.worst,renderMedian:s.renderMedian,renderP95:s.renderP95,programs:s.programs,counters:s.counters,labMaxMs:s.labMaxMs,first:s.first,renderer:s.renderer}));
    const quiet=regions.filter(s=>s.kind==='quiet-warm'),live=regions.filter(s=>s.kind!=='quiet-warm');const range=a=>[Math.min(...a),Math.max(...a)];
    rows.push({browser,hashes:r.hashes,viewport:r.viewport,captures:r.captures.length,quietP95:range(quiet.map(s=>s.p95)),quietWorst:Math.max(...quiet.map(s=>s.worst)),liveP95:range(live.map(s=>s.p95)),liveWorst:Math.max(...live.map(s=>s.worst)),programs:[...new Set(regions.map(s=>s.programs))],regions});
}
writeFileSync(dest,JSON.stringify({passed:true,method:'Current-source observed timings, not comparative FPS certification; first/warm and live windows separated',browsers:rows},null,2));console.log(JSON.stringify(rows,null,2));
