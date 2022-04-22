
const { THREE } = arguments[0];

const rayCaster = new THREE.Raycaster();
const intersections = [];
const OVERVIEW_FAR = 1000;

return  {
    unitScale: 2.5,
    fogOfWar: 0.7,
    soundMode: "spatial",
    maxSoundDistance: 100,


    async onEnterCameraMode(prevData, camera) {

        this._exitCamera = {
            target: new THREE.Vector3()
        };

        if (prevData?.target?.isVector3) {
            this._exitCamera.target.copy(prevData.target);
        }

        this._pipLocation = new THREE.Vector2();

        this.orbit.camera.far = OVERVIEW_FAR;
        this.orbit.camera.fov = 15;
        this.orbit.camera.updateProjectionMatrix();

        const distance = Math.max(this.terrain.mapWidth, this.terrain.mapHeight) * 4;
        this.maxSoundDistance = distance;

        //TODO: improve algorithm to actually encompass the terrain
        this.orbit.setLookAt(0, distance, 0, 0, 0, 0, false);
        await this.orbit.zoomTo(1, false);   
    },

    onExitCameraMode(target, position) {
        return this._exitCamera;
    },

    onShouldHideUnit(unit) {
        return unit.extras.dat.isAddon;
    },

    onCameraMouseUpdate(delta, elapsed, scrollY, screenDrag, lookAt, mouse, clientX, clientY, clicked) {
        if (clicked && clicked.z === 0) {
            rayCaster.setFromCamera(clicked, this.orbit.camera);
            intersections.length = 0;
            rayCaster.intersectObject(this.terrain.terrain, false, intersections);
            if (intersections.length) {
                this._exitCamera.target.set(intersections[0].point.x, 0, intersections[0].point.z);
                this.exitCameraMode();
            }
        }

        if (!clicked && mouse.z === 2) {
            rayCaster.setFromCamera(mouse, this.orbit.camera);
            intersections.length = 0;
            rayCaster.intersectObject(this.terrain.terrain, false, intersections);
            if (intersections.length) {
                this.pipLookAt(intersections[0].point.x, intersections[0].point.z);
                this._pipLocation.set(clientX, clientY);
                this.setPipDimensions(this._pipLocation, this.config.pipSize);
                this._exitCamera.target.set(intersections[0].point.x, 0, intersections[0].point.z);
            }
        } else {
            this.pipHide();
        }
    },

    onUpdateAudioMixerLocation(delta, elapsed, target, position) {
        if (this.pipIsActive()) {
            return this._exitCamera.target;
        }
        return position;
    }
}