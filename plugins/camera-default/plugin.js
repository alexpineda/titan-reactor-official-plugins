

const MAX_ACCELERATION = 2;
const ACCELERATION = 1.01;
const DEFAULT_FAR = 256;
const POLAR_MAX = (10 * Math.PI) / 64;
const POLAR_MIN = (2 * Math.PI) / 64;

console.log("@camera-default arguments", arguments);

return  {
    boundByMap: {
        scaleBoundsByCamera: true,
    },
    minimap: true,

    async onEnterCameraMode( prevData, camera ) {
        if (prevData?.target?.isVector3) {
            await this.orbit.setTarget(prevData.target.x, 0, prevData.target.z, false);
        } else {
            await this.orbit.setTarget(0, 0, 0, false);
        }

        this._accel = 1;

        camera.far = DEFAULT_FAR;
        camera.zoom = 1;
        camera.fov = 15;
        camera.updateProjectionMatrix();

        this.orbit.boundaryFriction = 1;
        this.orbit.dollyToCursor = true;
        this.orbit.verticalDragToForward = true;

        this.orbit.maxDistance = DEFAULT_FAR;
        this.orbit.minDistance = 20;
        this.orbit.dollySpeed = 0.2

        this.orbit.maxPolarAngle = POLAR_MAX;
        this.orbit.minPolarAngle = POLAR_MIN;
        this.orbit.maxAzimuthAngle = 0;
        this.orbit.minAzimuthAngle = 0;
        this.orbit.dampingFactor = 0.05;

        await this.orbit.rotatePolarTo(POLAR_MIN, false);
        await this.orbit.rotateAzimuthTo(0, false);
        await this.orbit.zoomTo(1, false);
        await this.orbit.dollyTo(80, false);


    },

    onExitCameraMode(target, position) {
        return {
            target,
            position
        }
    },

    onCameraMouseUpdate(delta, elapsed, scrollY, screenDrag, lookAt, mouse, clicked) {
        if (scrollY) {
            if (scrollY < 0) {
                this.orbit.dolly(this.config.dollyAmount.value, true);
                this.orbit.rotate(0, (Math.PI * 1) / 96, true)
            } else {
                this.orbit.dolly(-this.config.dollyAmount.value, true);
                this.orbit.rotate(0, -(Math.PI * 1) / 96, true);
            }
        }

        if (screenDrag.x !== 0) {
            this.orbit.truck(screenDrag.
                x * delta * this._accel, 0, true);
        }

        if (screenDrag.y !== 0) {
            this.orbit.forward(screenDrag.y * delta * this._accel, true);
        }

        if (screenDrag.y === 0 && screenDrag.x === 0) {
            this._accel = 1;
        } else {
            this._accel = Math.min(MAX_ACCELERATION, this._accel * ACCELERATION);
        }
    },

    onCameraKeyboardUpdate(delta, elapsed, move) {
        if (move.x !== 0) {
            this.orbit.truck(move.x * delta * this._accel, 0, true);
        }

        if (move.y !== 0) {
            this.orbit.forward(move.y * delta * this._accel, true);
        }

        if (move.y === 0 && move.x === 0) {
            this._accel = 1;
        } else {
            this._accel = Math.min(MAX_ACCELERATION, this._accel * ACCELERATION);
        }
    },

    onUpdateAudioMixerLocation(delta, elapsed, target, position) {
        return target;
    },

    onDrawMinimap(ctx, view, target, position) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(...view.tl);
        ctx.lineTo(...view.tr);
        ctx.lineTo(...view.br);
        ctx.lineTo(...view.bl);
        ctx.lineTo(...view.tl);
        ctx.stroke();
    }

}