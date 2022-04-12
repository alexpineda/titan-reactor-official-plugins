

const MAX_ACCELERATION = 2;
const ACCELERATION = 1.01;
const DEFAULT_FAR = 256;
const POLAR_MAX = (10 * Math.PI) / 64;
const POLAR_MIN = (2 * Math.PI) / 64;

// reference only, delete after:
// import CameraControls from "camera-controls";

// export const smoothDollyIn = (orbit: CameraControls, amp = 1, withRotate = true) => {
//     orbit.dolly(3 * amp, true);
//     withRotate && orbit.rotate(0, (Math.PI * amp) / 96, true);
// }

// export const smoothDollyOut = (orbit: CameraControls, amp = 1, withRotate = true) => {
//     orbit.rotate(0, -(Math.PI * amp) / 96, true);
//     withRotate && orbit.dolly(-3 * amp, true);
// }

return  {
    init() {
        this._accel = 1;
    },

    boundByMap: true,
    minimap: true,
    pip: true,

    async onEnterCameraMode(controls, minimapMouse, camera, mapWidth, mapHeight) {
        controls.orbit.boundaryFriction = 1;

        camera.far = DEFAULT_FAR;
        camera.zoom = 1;
        camera.fov = 15;
        camera.updateProjectionMatrix();

        controls.orbit.dollyToCursor = true;
        controls.orbit.verticalDragToForward = true;

        controls.orbit.maxDistance = DEFAULT_FAR;
        controls.orbit.minDistance = 20;
        controls.orbit.dollySpeed = 0.2

        controls.orbit.maxPolarAngle = POLAR_MAX;
        controls.orbit.minPolarAngle = POLAR_MIN;
        controls.orbit.maxAzimuthAngle = 0;
        controls.orbit.minAzimuthAngle = 0;
        controls.orbit.dampingFactor = 0.05;

        await controls.orbit.rotatePolarTo(POLAR_MIN, false);
        await controls.orbit.rotateAzimuthTo(0, false);
        await controls.orbit.zoomTo(1, false);
        await controls.orbit.dollyTo(80, false);
        await controls.orbit.setTarget(controls.oldTarget.x, 0, controls.oldTarget.z, false);
    },

    onCameraMouseUpdate(delta, elapsed, scrollY, screenDrag, lookAt, clicked) {
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

    onUpdateAudioMixerLocation(delta, elapsed, audioMixer, camera, target) {
        audioMixer.update(target.x, target.y, target.z, delta);
    }

}