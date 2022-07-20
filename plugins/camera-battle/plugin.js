
const { THREE, bwDat, postprocessing } = arguments[0];
const MAX_ACCELERATION = 2;
const ACCELERATION = 1.01;
const BATTLE_FAR = 128;

const deltaYP = new THREE.Vector3();
const audioListenerPosition = new THREE.Vector3();

const { DepthOfFieldEffect, ScanlineEffect, EffectPass, ToneMappingEffect, ToneMappingMode } = postprocessing;

return  {
    minimap: true,
    pointerLock: true,
    soundMode: "spatial",
    cameraShake: true,
    rotateSprites: true,
    background: "space",
    fogOfWar: 0.5,

    // a few shared setings we can update on init and config change
    _updateSettings() {

        this._keyboardSpeed = this.config.keyboardSpeed;
        this.orbit.dampingFactor = this.config.damping;
        this.orbit.boundaryFriction = this.config.edgeFriction;
        this._depthOfFieldEffect.getCircleOfConfusionMaterial().uniforms.focalLength.value = this.config.focalLength;
        this._depthOfFieldEffect.bokehScale = this.config.bokehScale;
    },

    async onEnterCameraMode(prevData) {
        if (prevData?.target?.isVector3) {
            await this.orbit.setTarget(prevData.target.x, 0, prevData.target.z, false);
        } else {
            await this.orbit.setTarget(0, 0, 0, false);
        }

        this.orbit.camera.far = BATTLE_FAR;
        this.orbit.camera.fov = this.config.fov;
        this.orbit.camera.updateProjectionMatrix();

        this.orbit.dollyToCursor = false;
      
        this.orbit.maxDistance = Math.max(this.terrain.mapWidth, this.terrain.mapHeight) * 2;
        this.orbit.minDistance = 3;
        this.orbit.maxZoom = 20;
        this.orbit.minZoom = 0.3;
        this.orbit.dampingFactor = 0.01;
      
        this.orbit.maxPolarAngle = Infinity;
        this.orbit.minPolarAngle = -Infinity
        this.orbit.maxAzimuthAngle = Infinity;
        this.orbit.minAzimuthAngle = -Infinity;
      
        this._depthOfFieldEffect = new DepthOfFieldEffect(this.orbit.camera, {
            focusDistance: 0.01,
            focalLength: 0.1,
            bokehScale: 1.0,
            height: this.config.blurQuality,
          });
        this._updateSettings();

        await this.orbit.dollyTo(this.config.defaultDistance, false);
        await this.orbit.zoomTo(1, false);

    },

    onSetComposerPasses(renderPass, fogOfWarEffect) {

        const effects = [];
                    
        if (this.config.depthOfFieldEnabled) {
            effects.push(this._depthOfFieldEffect);
        }

        effects.push(fogOfWarEffect);

        return {
            effects,
            passes: [
                renderPass,
                new EffectPass(
                    this.orbit.camera,
                    ...effects
                )
            ]
        };
    },

    onBeforeRender(delta, elapsed, target, position) {
        if (this.isActiveCameraMode) {
            this._depthOfFieldEffect.setTarget(target);
            this._depthOfFieldEffect.getCircleOfConfusionMaterial().adoptCameraSettings(this.orbit.camera);
        }
    },

    onConfigChanged(oldConfig) {
        if (this.isActiveCameraMode) {
            this._updateSettings();

            // only update default distance if it's changed otherwise we'll get a jump
            if (this.config.defaultDistance !== oldConfig.defaultDistance) {
                this.orbit.dollyTo(this.config.defaultDistance, true);
            }
        }
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
            this.orbit.rotate((-lookAt.x / 1000) * this.config.rotateSpeed, (-lookAt.y / 1000)  * this.config.rotateSpeed, true);
            
        }

        // elevate the y position if mouse scroll is used
        if (scrollY) {
            this.orbit.getPosition(deltaYP);

            if (scrollY < 0) {
                this.orbit.setPosition(deltaYP.x, deltaYP.y - this.config.elevateAmount, deltaYP.z, true);
            } else {
                this.orbit.setPosition(deltaYP.x, deltaYP.y + this.config.elevateAmount, deltaYP.z, true);
            }
        }
    },

    onShouldHideUnit(unit) {
        return unit.extras.dat.isAddon;
    },

    onCameraKeyboardUpdate(delta, elapsed, move) {
        if (move.x !== 0) {
            this.orbit.truck(move.x * delta * this._keyboardSpeed, 0, true);
        }

        if (move.y !== 0) {
            this.orbit.forward(move.y * delta * this._keyboardSpeed, true);
        }

        if (move.y === 0 && move.x === 0) {
            this._keyboardSpeed = this.config.keyboardSpeed;
        } else {
            this._keyboardSpeed = Math.min(this.config.keyboardAccelMax, this._keyboardSpeed * (1 + this.config.keyboardAccel));
        }
    },

    onUpdateAudioMixerLocation(delta, elapsed, target, position) {
        return audioListenerPosition.lerpVectors(target, position, this.config.audioSourceDistance);
    },

    onFrame() {
        if (this.isActiveCameraMode && this.getFollowedUnits().length) {
            const target = this.calculateFollowedUnitsTarget();
            this.orbit.moveTo(target.x, target.y, target.z, true);
        }
    }
}