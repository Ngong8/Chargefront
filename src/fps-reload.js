/* Presentation-only cartridge ownership. Combat remains the sole reload clock
   and ammunition owner. One prepared cartridge is recycled outside the frustum. */
(function (root) {
    'use strict';
    const phases = Object.freeze({ grip:.20, clear:.32, out:.46, replacement:.54, approach:.68, seated:.82, release:.86 });
    const ease = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    function phase(progress, active) {
        if (!active) return 'COMPLETE';
        if (progress < phases.grip) return 'REACH';
        if (progress < phases.clear) return 'WITHDRAW';
        if (progress < phases.out) return 'CARRY_OUT';
        if (progress < phases.replacement) return 'RETRIEVE';
        if (progress < phases.approach) return 'BRING_IN';
        if (progress < phases.seated) return 'INSERT';
        if (progress < phases.release) return 'LOCK';
        return 'RETURN';
    }
    function create({ THREE, viewModel, camera, model, part, grip, config }) {
        const basePosition = part.position.clone(), baseQuaternion = part.quaternion.clone();
        const socket = new THREE.Object3D(); socket.name = model.name + 'CartridgeSocket';
        socket.position.copy(basePosition); socket.quaternion.copy(baseQuaternion); model.add(socket);
        const bounds = new THREE.Box3().setFromObject(part);
        const radius = bounds.getSize(new THREE.Vector3()).length() / 2 + .10;
        const pulled = basePosition.clone().add(new THREE.Vector3(config.withdraw, -.025, .015));
        const out = new THREE.Vector3(), position = new THREE.Vector3(), cameraPosition = new THREE.Vector3();
        const quaternion = new THREE.Quaternion(), rootQuaternion = new THREE.Quaternion();
        let visibleInFrustum = true, ownership = 'socket', stage = 'COMPLETE', recycled = false;
        function outside() {
            part.getWorldPosition(cameraPosition); camera.worldToLocal(cameraPosition);
            const depth = -cameraPosition.z, tangent = Math.tan(camera.fov * Math.PI / 360);
            // Conservative bounding sphere, including the glove, fully outside any side plane.
            return cameraPosition.x + radius < -(depth + radius) * tangent * camera.aspect ||
                cameraPosition.y + radius < -(depth + radius) * tangent;
        }
        function reset() {
            if (part.parent !== model) model.attach(part);
            part.position.copy(basePosition); part.quaternion.copy(baseQuaternion); part.scale.setScalar(1);part.visible=true;
            ownership='socket';stage='COMPLETE';recycled=false;
        }
        function update(progress, active, maxFov) {
            if (!active) { reset(); return; }
            stage=phase(progress,true);
            viewModel.updateWorldMatrix(true,true);
            // An actual camera-space boundary, not a fixed model-local hide offset.
            const depth=.65, tangent=Math.tan(Math.max(maxFov,camera.fov)*Math.PI/360);
            socket.getWorldPosition(out);camera.worldToLocal(out);
            out.set(out.x-.25,-tangent*(depth+radius)-radius-.12,-depth);
            camera.localToWorld(out);model.worldToLocal(out);
            position.copy(basePosition);
            quaternion.copy(baseQuaternion);
            if(progress>=phases.grip&&progress<phases.seated){
                if(part.parent!==viewModel)viewModel.attach(part); // preserve pose at acquisition
                ownership='hand';
                if(progress<phases.clear)position.lerp(pulled,ease((progress-phases.grip)/(phases.clear-phases.grip)));
                else if(progress<phases.out)position.copy(pulled).lerp(out,ease((progress-phases.clear)/(phases.out-phases.clear)));
                else if(progress<phases.replacement)position.copy(out);
                else if(progress<phases.approach)position.copy(out).lerp(pulled,ease((progress-phases.replacement)/(phases.approach-phases.replacement)));
                else position.copy(pulled).lerp(basePosition,ease((progress-phases.approach)/(phases.seated-phases.approach)));
                model.localToWorld(position);viewModel.worldToLocal(position);part.position.copy(position);
                model.getWorldQuaternion(quaternion);viewModel.getWorldQuaternion(rootQuaternion).invert();
                part.quaternion.copy(rootQuaternion.multiply(quaternion).multiply(baseQuaternion));
            }else{
                if(part.parent!==model)model.attach(part); // exact socket pose at seating
                ownership='socket';part.position.copy(basePosition);part.quaternion.copy(baseQuaternion);
            }
            viewModel.updateWorldMatrix(true,true);visibleInFrustum=!outside();
            // Both hand and cartridge stay at the same offscreen pose during exchange.
            // Never hide a seated/on-screen part, including on resize or changing FOV.
            const exchanging=progress>=phases.out&&progress<phases.replacement;
            part.visible=!exchanging||visibleInFrustum;
            recycled=progress>=phases.replacement;
        }
        return { update, reset, socket, grip, phases,
            info() { return {ownership,stage,recycled,visibleInFrustum,radius}; } };
    }
    root.ChargefrontFpsReload=Object.freeze({create,phases,phase,ease});
})(globalThis);
