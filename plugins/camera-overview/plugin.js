
const { THREE } = arguments[0];

const rayCaster = new THREE.Raycaster();
const intersections = [];
const OVERVIEW_FAR = 1000;

return  {
    unitScale: 2.5,
    fogOfWar: 0.7,

    async onEnterCameraMode(prevData, camera) {

        this._exitCamera = prevData;

        this.orbit.camera.far = OVERVIEW_FAR;
        this.orbit.camera.fov = 15;
        this.orbit.camera.updateProjectionMatrix();

        //TODO: improve algorithm to actually encompass the terrain
        this.orbit.setLookAt(0, Math.max(this.terrain.mapWidth, this.terrain.mapHeight) * 4, 0, 0, 0, 0, false);
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
                this._exitCamera = {
                    target: new THREE.Vector3(intersections[0].point.x, 0, intersections[0].point.z)
                };
                this.exitCameraMode();
            }
        }

        if (!clicked && mouse.z === 2) {
            rayCaster.setFromCamera(mouse, this.orbit.camera);
            intersections.length = 0;
            rayCaster.intersectObject(this.terrain.terrain, false, intersections);
            if (intersections.length) {
                this.pipLookAt(intersections[0].point.x, intersections[0].point.z);
                this.setPipDimensions(new THREE.Vector2(clientX, clientY), this.config.pipSize.value);
            }
        } else {
            this.pipHide();
        }
    },

    onUpdateAudioMixerLocation(delta, elapsed, target, position) {
        return target;
    }
}