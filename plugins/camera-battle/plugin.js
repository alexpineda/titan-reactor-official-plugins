
const { THREE, bwDat } = arguments[0];
const MAX_ACCELERATION = 2;
const ACCELERATION = 1.01;
const BATTLE_FAR = 128;

const deltaYP = new THREE.Vector3();


return  {
    minimap: true,
    pointerLock: true,
    soundMode: "spatial",
    boundByMap: {
        scaleBoundsByCamera: false,
    },
    cameraShake: true,
    rotateSprites: true,
    background: "space",
    fogOfWar: 0.25,

    async onEnterCameraMode(prevData, camera) {
        console.log("@battle-cam enter", this);
        if (prevData?.target?.isVector3) {
            await this.orbit.setTarget(prevData.target.x, 0, prevData.target.z, false);
        } else {
            await this.orbit.setTarget(0, 0, 0, false);
        }

        camera.far = BATTLE_FAR;
        camera.fov = 85;
        camera.updateProjectionMatrix();

        this._accel = 1;

        this.orbit.boundaryFriction = 0;
        this.orbit.dollyToCursor = false;
      
        this.orbit.maxDistance = Math.max(this.terrain.mapWidth, this.terrain.mapHeight) * 2;
        this.orbit.minDistance = 3;
        this.orbit.dollySpeed = 1;
        this.orbit.maxZoom = 20;
        this.orbit.minZoom = 0.3;
        this.orbit.dampingFactor = 0.01;
      
        this.orbit.maxPolarAngle = Infinity;
        this.orbit.minPolarAngle = -Infinity
        this.orbit.maxAzimuthAngle = Infinity;
        this.orbit.minAzimuthAngle = -Infinity;
      
        await this.orbit.dollyTo(13, false);
        await this.orbit.zoomTo(1, false);


    },

    onExitCameraMode(target, position) {
        return {
            target,
            position
        }
    },

    onCameraMouseUpdate(delta, elapsed, scrollY, screenDrag, lookAt, mouse, clientX, clientY, clicked) {
        // zoom in or out depending on left click or right click
        if (clicked) {
            this.orbit.zoomTo(this.orbit.camera.zoom * (clicked.z === 0 ? 2 : 1 / 2), false);
        }

        // rotate according to mouse direction (pointer lock)
        if (lookAt.x || lookAt.y) {
            this.orbit.rotate((-lookAt.x / 1000) * this.config.rotateSpeed.value, (-lookAt.y / 1000)  * this.config.rotateSpeed.value, true);
            
        }

        // elevate the y position if mouse scroll is used
        if (scrollY) {
            this.orbit.getPosition(deltaYP);

            if (scrollY < 0) {
                this.orbit.setPosition(deltaYP.x, deltaYP.y - this.config.elevateAmount.value, deltaYP.z, true);
            } else {
                this.orbit.setPosition(deltaYP.x, deltaYP.y + this.config.elevateAmount.value, deltaYP.z, true);
            }
        }
    },

    onShouldHideUnit(unit) {
        return unit.extras.dat.isAddon;
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

    onUpdateAudioMixerLocation(delta, elapsed, target, position) {
        return position;
    }
}