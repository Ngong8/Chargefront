/* Opt-in correction of terrain-side authored props only. Facility-owned meshes
   are never registered. Finalize after legacy population to preserve UUID/RNG
   consumption, material FX references, retained collision footprints and cover tops. */
(function (root) {
    'use strict';
    function create({ THREE, terrainHeight, removeSolids }) {
        const entries = [], lookup = new Map(); let done = false;
        const remember = (mesh, kind = 'ground', options = {}) => {
            let entry = lookup.get(mesh);
            if (!entry) { entry = { mesh, solids: [], id: 'TerrainProp' + (entries.length + 1) }; entries.push(entry); lookup.set(mesh, entry); }
            Object.assign(entry, options, { kind }); return mesh;
        };
        const attachSolids = (mesh, solids) => { lookup.get(mesh).solids = solids; return mesh; };
        const mounted = (mesh, host, cap = false) => remember(mesh, cap ? 'cap' : 'face', { host });
        function finalize() {
            if (done) return; done = true;
            for (const e of entries) {
                const p=e.mesh.geometry.parameters;
                e.before={x:e.mesh.position.x,y:e.mesh.position.y,z:e.mesh.position.z,w:p.width,d:p.depth,h:p.height,yaw:e.yaw??e.mesh.rotation.z};
                e.mesh.name=e.id+'/'+e.kind;e.mesh.userData.terrainCleanup={id:e.id,kind:e.kind};
            }
            for (const e of entries) {
                const mesh=e.mesh,b=e.before;
                if (e.kind==='remove') { mesh.removeFromParent();e.removedSolids=e.solids.length;if(e.solids.length)removeSolids(e.solids);e.solids=[];continue; }
                if (['face','cap','bridge-face','installed'].includes(e.kind)) continue;
                if (e.kind==='bridge') {
                    const a=lookup.get(e.a).before,c=lookup.get(e.b).before;
                    const from=new THREE.Vector3(a.x,a.y,a.z+a.h/2+.17),to=new THREE.Vector3(c.x,c.y,c.z+c.h/2+.17);
                    const direction=to.clone().sub(from),length=direction.length();direction.normalize();
                    mesh.geometry=new THREE.BoxGeometry(length+1.3,.34,.34);mesh.position.copy(from).add(to).multiplyScalar(.5);
                    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),direction);e.direction=direction;continue;
                }
                if (e.kind==='cable') {
                    const {ax,ay,bx,by,radius}=e;
                    class GroundCable extends THREE.Curve { getPoint(t,target=new THREE.Vector3()) {
                        const x=ax+(bx-ax)*t,y=ay+(by-ay)*t;return target.set(x-b.x,y-b.y,terrainHeight(x,y)+radius+.025-b.z);
                    } }
                    mesh.geometry=new THREE.TubeGeometry(new GroundCable(),Math.max(2,Math.ceil(Math.hypot(bx-ax,by-ay)/1.25)),radius,7,false);
                    mesh.rotation.set(0,0,0);continue;
                }
                let geometry;
                const circular=e.kind==='circle'||e.kind==='skin-cylinder';
                if (circular) {
                    const p=mesh.geometry.parameters,radius=p.radius??p.radiusBottom,segments=24,rings=4,positions=[0,0,0],indices=[];
                    for(let r=1;r<=rings;r++)for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments;positions.push(Math.cos(a)*radius*r/rings,Math.sin(a)*radius*r/rings,0);}
                    for(let i=0;i<segments;i++)indices.push(0,1+i,1+(i+1)%segments);
                    for(let r=1;r<rings;r++)for(let i=0;i<segments;i++){const a=1+(r-1)*segments+i,c=1+r*segments+i,an=1+(r-1)*segments+(i+1)%segments,cn=1+r*segments+(i+1)%segments;indices.push(a,c,an,an,c,cn);}
                    geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);
                } else if(e.kind==='surface') geometry=new THREE.PlaneGeometry(b.w,b.d,Math.max(1,Math.ceil(b.w/.75)),Math.max(1,Math.ceil(b.d/.75)));
                else if(e.kind==='cylinder') {
                    const p=mesh.geometry.parameters;geometry=new THREE.CylinderGeometry(p.radiusTop,p.radiusBottom,p.height,p.radialSegments,1);
                } else geometry=new THREE.BoxGeometry(b.w,b.h,b.d,Math.max(1,Math.ceil(b.w/1.25)),1,Math.max(1,Math.ceil(b.d/1.25)));
                const p=geometry.attributes.position,co=Math.cos(b.yaw),si=Math.sin(b.yaw),top=b.z+b.h/2;
                let lowest=Infinity,maxBottomError=0;
                for(let i=0;i<p.count;i++) {
                    const u=p.getX(i),v=(e.kind==='surface'||circular)?p.getY(i):-p.getZ(i);
                    const x=b.x+co*u-si*v,y=b.y+si*u+co*v,ground=terrainHeight(x,y);
                    const bottom=ground-.02;
                    const z=(e.kind==='surface'||circular)?ground+.035:p.getY(i)>0?top:Math.min(bottom,top-.025);
                    if(e.kind!=='surface'&&!circular&&p.getY(i)<=0){lowest=Math.min(lowest,z);maxBottomError=Math.max(maxBottomError,Math.abs(z-bottom));}
                    p.setXYZ(i,x-b.x,y-b.y,z-b.z);
                }
                geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();mesh.geometry=geometry;mesh.rotation.set(0,0,0);
                if(Number.isFinite(lowest))for(const solid of e.solids)solid.bottomY=lowest; // tops/XY stay authoritative
                e.maxBottomError=maxBottomError;
            }
            for(const e of entries)if(['face','cap','bridge-face'].includes(e.kind)) {
                const host=lookup.get(e.host),b=host.before,p=e.before,mesh=e.mesh;
                if(e.kind==='bridge-face') {
                    const direction=host.direction,n=new THREE.Vector3(direction.y,-direction.x,0).normalize();
                    mesh.geometry=new THREE.BoxGeometry(Math.min(p.w,host.mesh.geometry.parameters.width-1.5),.05,.20);
                    mesh.position.copy(host.mesh.position).addScaledVector(n,.195);mesh.quaternion.copy(host.mesh.quaternion);
                } else if(e.kind==='cap') {
                    mesh.position.set(b.x,b.y,b.z+b.h/2+p.h/2-.01);mesh.rotation.set(Math.PI/2,b.yaw,0);
                } else {
                    const d=Math.min(p.d,.08),co=Math.cos(b.yaw),si=Math.sin(b.yaw),offset=b.d/2+d/2;
                    mesh.geometry=new THREE.BoxGeometry(Math.min(p.w,b.w-.12),Math.min(p.h,.3),d);
                    mesh.position.set(b.x+si*offset,b.y-co*offset,b.z+b.h*.18);mesh.rotation.set(Math.PI/2,b.yaw,0);
                }
            }
        }
        function info() { return { finalized:done,entries:entries.map(e=>({id:e.id,kind:e.kind,origin:e.before?{x:e.before.x,y:e.before.y}:null,
            attached:!!e.mesh.parent,solids:e.solids.length,removedSolids:e.removedSolids||0,maxBottomError:e.maxBottomError??null})),counts:entries.reduce((r,e)=>(r[e.kind]=(r[e.kind]||0)+1,r),{}) }; }
        return { remember, attachSolids, mounted, finalize, info };
    }
    root.ChargefrontCampaignExterior=Object.freeze({create});
})(globalThis);
