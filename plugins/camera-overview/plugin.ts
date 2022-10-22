

import * as THREE from "three";
import cameraControls from "camera-controls";
import { SceneController } from "titan-reactor/host";

const _rayCaster = new THREE.Raycaster();
const _intersections = [];
const OVERVIEW_FAR = 1000;

export default class PluginAddon extends SceneController {

    #exitCamera = {
        target: new THREE.Vector3()
    }

    async onEnterScene(prevData) {

        const orbit = this.viewport.orbit;

        this.#exitCamera = {
            target: new THREE.Vector3()
        };

        if (prevData?.target?.isVector3) {
            this.#exitCamera.target.copy(prevData.target);
        }

        orbit.camera.far = OVERVIEW_FAR;
        orbit.camera.fov = 15;
        orbit.camera.updateProjectionMatrix();

        const oDistance = Math.max(this.scene.mapWidth, this.scene.mapHeight) * 4;

        orbit.zoomTo(1, false);
        orbit.setLookAt(0, oDistance, 0, 0, 0, 0, false);
        // 8 (high) to 4 (med high)

        orbit.fitToBox(this.scene.terrain);
        orbit.mouseButtons.wheel = cameraControls.ACTION.ZOOM;
        orbit.mouseButtons.middle = cameraControls.ACTION.ROTATE;

        orbit.maxAzimuthAngle = Math.PI / 32;
        orbit.minAzimuthAngle = -Math.PI / 32;
        orbit.minZoom = 0.75;
        orbit.maxZoom = 3;

        (async () => {
            await orbit.rotatePolarTo(Math.PI / this.config.polarRotation, this.config.animateTransition);
            orbit.minPolarAngle = Math.PI / this.config.polarRotation - 0.1;
            orbit.maxPolarAngle = Math.PI / this.config.polarRotation;
        })();

        this.secondViewport.center = new THREE.Vector2;
        if (this.config.fullScreenPIP) {
            this.secondViewport.center.set(0.5, 0.5);
            this.secondViewport.height = this.secondViewport.surfaceHeight;
        } else {
            this.secondViewport.height = this.config.pipSize;
        }
        this.secondViewport.cameraShake.enabled = true;
        this.secondViewport.cameraShake.maxShakeDistance = 100;
        this.secondViewport.orbit.dampingFactor = 0.5;
        this.secondViewport.orbit.zoomTo(2, false);


        this.viewport.audioType = "3d";
        this.settings.input.unitSelection.set(false);


    }

    onConfigChanged(oldConfig) {

        if (this.config.polarRotation !== oldConfig.polarRotation) {
            this.viewport.orbit.rotatePolarTo(Math.PI / this.config.polarRotation, this.config.animateTransition);
        }

        if (this.config.pipSize !== oldConfig.pipSize) {
            this.secondViewport.height = this.config.pipSize;
        }

        if (this.config.fullScreenPIP !== oldConfig.fullScreenPIP) {
            if (this.config.fullScreenPIP) {
                this.secondViewport.center.set(0.5, 0.5);
                this.secondViewport.height = this.secondViewport.surfaceHeight;
            } else {
                this.secondViewport.height = this.config.pipSize;
            }
        }

    }

    onExitScene() {

        this.settings.input.unitSelection.set(true);

        return this.#exitCamera;

    }

    onCameraMouseUpdate(delta, elapsed, scrollY, screenDrag, lookAt, mouse, clientX, clientY, clicked) {

        if (screenDrag.x !== 0) {
            this.viewport.orbit.truck(screenDrag.x * delta * 2, 0, true);
        }

        if (screenDrag.y !== 0) {
            this.viewport.orbit.forward(screenDrag.y * delta * 2, true);
        }

        if (clicked && clicked.z === 2) {
            _intersections.length = 0;
            _rayCaster.setFromCamera(clicked, this.viewport.camera);
            _rayCaster.intersectObject(this.scene.terrain, true, _intersections);
            if (_intersections.length) {
                this.#exitCamera.target.set(_intersections[0].point.x, 0, _intersections[0].point.z);
                this.callCustomHook("onCustomExitScene");
                this.exitScene();
            }
        }

        if (!clicked && mouse.z === 0) {
            _rayCaster.setFromCamera(mouse, this.viewport.camera);
            _intersections.length = 0;
            _rayCaster.intersectObject(this.scene.terrain, true, _intersections);
            if (_intersections.length) {
                if (!this.secondViewport.enabled) {
                    this.callCustomHook("onCustomPIPEntered");
                }
                this.secondViewport.orbit.moveTo(_intersections[0].point.x, 0, _intersections[0].point.z, this.secondViewport.enabled);
                this.secondViewport.enabled = true;
                // this.mouseCursor = false;

                if (!this.config.fullScreenPIP) {
                    this.secondViewport.center.set(clientX, clientY);
                }
                this.secondViewport.update();
                this.#exitCamera.target.set(_intersections[0].point.x, 0, _intersections[0].point.z);
            }
        } else if (this.secondViewport.enabled) {
            this.callCustomHook("onCustomPIPExited");
            this.secondViewport.enabled = false;
        }
    }

    onCameraKeyboardUpdate(delta, elapsed, move) {
        if (move.x !== 0) {
            this.viewport.orbit.truck(move.x * delta * 2, 0, true);
        }

        if (move.y !== 0) {
            this.viewport.orbit.forward(move.y * delta * 2, true);
        }
    }


    onUpdateAudioMixerLocation(_, position) {
        if (this.secondViewport.enabled) {
            return this.#exitCamera.target;
        }
        return position;
    }
}