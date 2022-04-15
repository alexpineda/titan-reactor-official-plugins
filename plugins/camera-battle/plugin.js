
const { THREE, bwDat, postprocessing } = arguments[0];
const MAX_ACCELERATION = 2;
const ACCELERATION = 1.01;
const BATTLE_FAR = 128;

const deltaYP = new THREE.Vector3();
const { DepthOfFieldEffect, ScanlineEffect, EffectPass, ToneMappingEffect, ToneMappingMode } = postprocessing;

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
    fogOfWar: 0.3,

    // a few shared setings we can update on init and config change
    _updateSettings() {
        this._keyboardSpeed = this.getConfig("keyboardSpeed");
        this.orbit.dampingFactor = this.getConfig("damping");
        this.orbit.boundaryFriction = this.getConfig("edgeFriction");
        this._scanlineEffect.blendMode.opacity.value = this.getConfig("scanlineOpacity");
        this._depthOfFieldEffect.getCircleOfConfusionMaterial().uniforms.focalLength.value = this.getConfig("focalLength");
        this._depthOfFieldEffect.bokehScale = this.getConfig("bokehScale");
    },

    async onEnterCameraMode(prevData) {
        if (prevData?.target?.isVector3) {
            await this.orbit.setTarget(prevData.target.x, 0, prevData.target.z, false);
        } else {
            await this.orbit.setTarget(0, 0, 0, false);
        }

        this.orbit.camera.far = BATTLE_FAR;
        this.orbit.camera.fov = 95;
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
            height: 480,
          });
        this._scanlineEffect = new ScanlineEffect({ density: 0.75 });

        this._updateSettings();

        await this.orbit.dollyTo(this.getConfig("defaultDistance"), false);
        await this.orbit.zoomTo(1, false);

    },

    onSetComposerPasses(clearPass, renderPass, fogOfWarEffect) {

        const effects = [];
                    
        if (this.getConfig("depthOfFieldEnabled")) {
            effects.push(this._depthOfFieldEffect);
        }

        effects.push(fogOfWarEffect);

        if (this.getConfig("scanlinesEnabled")) {
            effects.push(this._scanlineEffect);
        }

        if (this.getConfig("toneMappingEnabled")) {
            effects.push(new ToneMappingEffect({ mode: ToneMappingMode.OPTIMIZED_CINEON }));
        }

        return {
            effects,
            passes: [
                clearPass, 
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

    onConfigChanged(newConfig, oldConfig) {
        if (this.isActiveCameraMode) {
            this._updateSettings();

            // only update default distance if it's changed otherwise we'll get a jump
            if (newConfig.defaultDistance.value !== oldConfig.defaultDistance.value) {
                this.orbit.dollyTo(this.getConfig("defaultDistance"), true);
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
            this.orbit.rotate((-lookAt.x / 1000) * this.getConfig("rotateSpeed"), (-lookAt.y / 1000)  * this.getConfig("rotateSpeed"), true);
            
        }

        // elevate the y position if mouse scroll is used
        if (scrollY) {
            this.orbit.getPosition(deltaYP);

            if (scrollY < 0) {
                this.orbit.setPosition(deltaYP.x, deltaYP.y - this.getConfig("elevateAmount"), deltaYP.z, true);
            } else {
                this.orbit.setPosition(deltaYP.x, deltaYP.y + this.getConfig("elevateAmount"), deltaYP.z, true);
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
            this._keyboardSpeed = this.getConfig("keyboardSpeed");
        } else {
            this._keyboardSpeed = Math.min(this.getConfig("keyboardAccelMax"), this._keyboardSpeed * (1 + this.getConfig("keyboardAccel")));
        }
    },

    onUpdateAudioMixerLocation(delta, elapsed, target, position) {
        return position;
    }
}