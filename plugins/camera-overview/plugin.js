
const { THREE } = arguments[0];

const rayCaster = new THREE.Raycaster();
const intersections = [];
const OVERVIEW_FAR = 1000;

return  {
    minimap: false,
    pip: true,
    unitScale: 2.5,

    async onEnterCameraMode(controls, camera, prevTarget) {
        camera.far = OVERVIEW_FAR;
        camera.fov = 15;
        camera.updateProjectionMatrix();
        controls.orbit.setLookAt(0, Math.max(mapWidth, mapHeight) * 4, 0, 0, 0, 0, false);
        await controls.orbit.zoomTo(1, false);   
        await controls.orbit.setTarget(controls.oldTarget.x, 0, controls.oldTarget.z, false);
    },

    onExitCameraMode() {
        // define target?
    },

    onShouldHideUnit(unit) {
        return bwDat.units[unit.typeId].isAddon;
    },

    onCameraMouseUpdate(delta, elapsed, scrollY, screenDrag, lookAt, clicked) {
        if (clicked && clicked.z === 0) {
            rayCaster.setFromCamera(clicked, this.orbit.camera);
            intersections.length = 0;
            rayCaster.intersectObject(terrain, false, intersections);
            if (intersections.length) {
                this.orbit.moveTo(intersections[0].point.x, 0, intersections[0].point.z, false);
                controls.keys.onToggleCameraMode(CameraMode.Default);
            }
        }

        if (!clicked && this._mouse.z === 2) {
            controls.PIP.enabled = true;
            rayCaster.setFromCamera(this._mouse, controls.orbit.camera);
            intersections.length = 0;
            rayCaster.intersectObject(terrain, false, intersections);
            if (intersections.length) {
                controls.PIP.camera.position.set(intersections[0].point.x, controls.PIP.camera.position.y, intersections[0].point.z);
                controls.PIP.camera.lookAt(intersections[0].point.x, 0, intersections[0].point.z)
            }
        } else {
            controls.PIP.enabled = false;
        }
    },
    onUpdateAudioMixerLocation(delta, elapsed, audioMixer, camera, target) {
        audioMixer.update(camera.position.x, camera.position.y, camera.position.z, delta);
    }
}