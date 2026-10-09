/* Small preallocated electrical ribbons. Camera-facing geometry is rebuilt
   before rendering, not in onBeforeRender (which can be too late for upload). */
(function(root) {
    'use strict';
    function createElectric(THREE) {
        const geometry=new THREE.BufferGeometry(),positions=new THREE.BufferAttribute(new Float32Array(180),3).setUsage(THREE.DynamicDrawUsage);
        geometry.setAttribute('position',positions);geometry.setDrawRange(0,0);
        const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0x88eeff,transparent:true,opacity:1,depthWrite:false,depthTest:true,side:THREE.DoubleSide,forceSinglePass:true,toneMapped:false}));
        mesh.name='PooledElectricalRibbon';mesh.frustumCulled=false;
        const points=new Float32Array(18),a=new THREE.Vector3(),b=new THREE.Vector3(),v=new THREE.Vector3(),inverse=new THREE.Matrix4();
        let written=0;
        const put=(x,y,z,camera)=>{v.set(x,y,z).applyMatrix4(camera.matrixWorld);positions.setXYZ(written++,v.x,v.y,v.z);};
        function rebuild(camera,height) {
            camera.updateWorldMatrix(true,false);inverse.copy(camera.matrixWorld).invert();
            const focal=Math.max(1,height)/(2*Math.tan(camera.fov*Math.PI/360)),near=-camera.near*1.05;
            written=0;
            for(let i=0;i<5;i++){
                a.fromArray(points,i*3).applyMatrix4(inverse);b.fromArray(points,(i+1)*3).applyMatrix4(inverse);
                if(a.z>near&&b.z>near)continue;
                if(a.z>near)a.lerp(b,(near-a.z)/(b.z-a.z));
                if(b.z>near)b.lerp(a,(near-b.z)/(a.z-b.z));
                const dx=b.x/-b.z-a.x/-a.z,dy=b.y/-b.z-a.y/-a.z,length=Math.hypot(dx,dy);
                // Head-on / nearly vertical projected segments have a stable
                // camera-right fallback, with a diamond joint guaranteeing area.
                const nx=length>1e-8?-dy/length:1,ny=length>1e-8?dx/length:0;
                const wa=Math.max(.0001,Math.min(.25,-a.z/focal*1.2)),wb=Math.max(.0001,Math.min(.25,-b.z/focal*1.2));
                put(a.x+nx*wa,a.y+ny*wa,a.z,camera);put(a.x-nx*wa,a.y-ny*wa,a.z,camera);put(b.x+nx*wb,b.y+ny*wb,b.z,camera);
                put(b.x+nx*wb,b.y+ny*wb,b.z,camera);put(a.x-nx*wa,a.y-ny*wa,a.z,camera);put(b.x-nx*wb,b.y-ny*wb,b.z,camera);
                put(b.x-wb,b.y,b.z,camera);put(b.x,b.y+wb,b.z,camera);put(b.x+wb,b.y,b.z,camera);
                put(b.x-wb,b.y,b.z,camera);put(b.x+wb,b.y,b.z,camera);put(b.x,b.y-wb,b.z,camera);
            }
            positions.needsUpdate=true;geometry.setDrawRange(0,written);
        }
        return {mesh,points,rebuild};
    }
    root.ChargefrontRibbons=Object.freeze({createElectric});
})(globalThis);
