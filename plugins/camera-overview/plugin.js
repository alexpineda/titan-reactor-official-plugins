const _rayCaster = new THREE.Raycaster();
const intersections = [];
const OVERVIEW_FAR = 1000;

return  {
    gameOptions: {
        audio: "3d",
    },

    async onEnterScene(prevData) {

        const orbit = this.primaryViewport.orbit;

        this._exitCamera = {
            target: new THREE.Vector3()
        };

        if (prevData?.target?.isVector3) {
            this._exitCamera.target.copy(prevData.target);
        }

        this._pipLocation = new THREE.Vector2();

        orbit.camera.far = OVERVIEW_FAR;
        orbit.camera.fov = 15;
        orbit.camera.updateProjectionMatrix();

        const distance = Math.max(this.terrain.mapWidth, this.terrain.mapHeight) * 4;
        orbit.setLookAt(0, distance, 0, 0, 0, 0, false);
        await orbit.zoomTo(1, false);   

        this.primaryViewport.renderOptions.unitScale = 2.5;
        this.primaryViewport.renderOptions.fogOfWarOpacity = 0.7;

        this.secondaryViewport.height = this.config.pipSize;
        this.secondaryViewport.center = new THREE.Vector2;
    },

    onExitScene() {
        return this._exitCamera;
    },

    onShouldHideUnit(unit) {
        return unit.extras.dat.isAddon;
    },

    onCameraMouseUpdate(delta, elapsed, scrollY, screenDrag, lookAt, mouse, clientX, clientY, clicked) {
        if (clicked && clicked.z === 0) {
            _rayCaster.setFromCamera(clicked, this.primaryViewport.camera);
            intersections.length = 0;
            _rayCaster.intersectObject(this.terrain.mesh, true, intersections);
            if (intersections.length) {
                this._exitCamera.target.set(intersections[0].point.x, 0, intersections[0].point.z);
                this.exitScene();
            }
        }

        if (!clicked && mouse.z === 2) {
            _rayCaster.setFromCamera(mouse, this.primaryViewport.camera);
            intersections.length = 0;
            _rayCaster.intersectObject(this.terrain.mesh, true, intersections);
            if (intersections.length) {
                this.secondaryViewport.enabled = true;
                this.secondaryViewport.orbit.moveTo(intersections[0].point.x, 0, intersections[0].point.z);
                this.secondaryViewport.center.set(clientX, clientY);
                this.secondaryViewport.update();
                this._exitCamera.target.set(intersections[0].point.x, 0, intersections[0].point.z);
            }
        } else {
            this.secondaryViewport.enabled = false;
        }
    },

    onUpdateAudioMixerLocation(delta, elapsed, target, position) {
        if (this.secondaryViewport.enabled) {
            return this._exitCamera.target;
        }
        return position;
    },

}