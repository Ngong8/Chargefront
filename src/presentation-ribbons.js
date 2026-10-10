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
    function configureGround(THREE,material) {
        const viewport={value:new THREE.Vector2(1920,1080)},width={value:3.8},near={value:.0525};
        material.onBeforeCompile=shader=>{
            shader.uniforms.cfRouteViewport=viewport;shader.uniforms.cfRouteWidth=width;shader.uniforms.cfRouteNear=near;
            shader.vertexShader='attribute vec3 routeOther;\nattribute float routeSide;\nattribute vec2 routeCap;\nuniform vec2 cfRouteViewport;\nuniform float cfRouteWidth;\nuniform float cfRouteNear;\n'+shader.vertexShader;
            shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
                vec4 cfOtherView = modelViewMatrix * vec4(routeOther, 1.0);
                float cfNear = -cfRouteNear;
                if (mvPosition.z > cfNear && cfOtherView.z < cfNear) {
                    mvPosition.xyz = mix(mvPosition.xyz, cfOtherView.xyz, (cfNear-mvPosition.z)/(cfOtherView.z-mvPosition.z));
                }
                vec4 cfClip = projectionMatrix * mvPosition;
                vec4 cfOtherClip = projectionMatrix * cfOtherView;
                vec2 cfDelta = (cfOtherClip.xy / max(abs(cfOtherClip.w), 0.00001) - cfClip.xy / max(abs(cfClip.w), 0.00001)) * cfRouteViewport;
                float cfLength = length(cfDelta);
                vec2 cfNormal = cfLength > 0.00001 ? vec2(-cfDelta.y, cfDelta.x) / cfLength : vec2(1.0,0.0);
                vec2 cfOffset = abs(routeSide) > 0.5 ? cfNormal * routeSide : routeCap;
                cfClip.xy += cfOffset * cfRouteWidth / cfRouteViewport * cfClip.w;
                gl_Position = cfClip;
            `);
        };
        material.customProgramCacheKey=()=> 'chargefront-ground-ribbon-screen-v1';
        material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;
        return {viewport,width,near};
    }
    root.ChargefrontRibbons=Object.freeze({createElectric,configureGround});
})(globalThis);
