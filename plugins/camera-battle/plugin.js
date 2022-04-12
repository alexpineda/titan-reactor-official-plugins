
const { THREE, bwDat } = arguments[0];

const MAX_ACCELERATION = 2;
const ACCELERATION = 1.01;
const BATTLE_FAR = 128;

const deltaYP = new THREE.Vector3();

return  {

    init() {
        this._accel = 1;
    },

    minimap: true,
    pip: false,
    pointerLock: true,
    soundMode: "spatial",
    boundByMap: true,

    async onEnterCameraMode(controls, minimapMouse, camera, mapWidth, mapHeight) {
        minimapMouse.enabled = false;

        camera.far = BATTLE_FAR;
        camera.fov = 85;
        camera.updateProjectionMatrix();
        controls.orbit.boundaryFriction = 0;
        controls.orbit.dollyToCursor = false;
      
      
        controls.orbit.maxDistance = Math.max(mapWidth, mapHeight) * 2;
        controls.orbit.minDistance = 3;
        controls.orbit.dollySpeed = 1;
        controls.orbit.maxZoom = 20;
        controls.orbit.minZoom = 0.3;
        controls.orbit.dampingFactor = 0.01;
      
        controls.orbit.maxPolarAngle = Infinity;
        controls.orbit.minPolarAngle = -Infinity
        controls.orbit.maxAzimuthAngle = Infinity;
        controls.orbit.minAzimuthAngle = -Infinity;
      
        await controls.orbit.dollyTo(13, false);
        await controls.orbit.zoomTo(1, false);
        await controls.orbit.setTarget(controls.oldTarget.x, 0, controls.oldTarget.z, false);
    },

    onCameraMouseUpdate(delta, elapsed, scrollY, screenDrag, lookAt, clicked) {

        // zoom in or out depending on left click or right click
        if (clicked) {
            this.orbit.zoomTo(controls.orbit.camera.zoom * (clicked.z === 0 ? 2 : 1 / 2), false);
        }

        // rotate according to mouse direction (pointer lock)
        if (lookAt.x || lookAt.y) {
            this.orbit.rotate((-lookAt.x / 1000) * this.config.rotateSpeed.value, (-lookAt.y / 1000)  * this.config.rotateSpeed.value, true);
            
        }

        // elevate the y position if mouse scroll is used
        if (scrollY) {
            this.orbit.getPosition(deltaYP);

            if (scrollY < 0) {
                elevateAmount
                this.orbit.setPosition(deltaYP.x, deltaYP.y - this.config.elevateAmount.value, deltaYP.z, true);
            } else {
                this.orbit.setPosition(deltaYP.x, deltaYP.y + this.config.elevateAmount.value, deltaYP.z, true);
            }
        }
    },

    onShouldHideUnit(unit) {
        return bwDat.units[unit.typeId].isAddon;
    },

    onCameraKeyboardUpdate(delta, elapsed, truck) {
        if (truck.x !== 0) {
            this.orbit.truck(truck.x * delta * this._accel, 0, true);
        }

        if (truck.y !== 0) {
            this.orbit.forward(truck.y * delta * this._accel, true);
        }

        if (truck.y === 0 && truck.x === 0) {
            this._accel = 1;
        } else {
            this._accel = Math.min(MAX_ACCELERATION, this._accel * ACCELERATION);
        }
    },

    onUpdateAudioMixerLocation(delta, elapsed, audioMixer, camera, target) {
        audioMixer.updateFromCamera(camera);
    }
}