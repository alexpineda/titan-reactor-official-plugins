const DEFAULT_FAR = 256;
const POLAR_MAX = (10 * Math.PI) / 64;
const POLAR_MIN = (2 * Math.PI) / 64;

const POV_COMMANDS = [0x0c, 0x14, 0x15, 0x60, 0x61];
const PIP_PROXIMITY = 16;

const _target = new THREE.Vector3();

const pipColor = "#aaaaaa"

return {
  gameOptions: {
    showMinimap: true,
    allowUnitSelection: true,
    audio: "stereo",
  },

  _pipPovPlayerId: null,
  _isPreviewing: false,

  // a few shared setings we can update on init and config change
  _updateSettings() {
    this._edgeSpeed = this.config.screenDragSpeed;
    this._keyboardSpeed = this.config.keyboardSpeed;
    this.primaryViewport.orbit.dampingFactor = this.config.damping;
  },

  async onEnterScene(prevData, camera) {
    const orbit = this.primaryViewport.orbit;

    if (prevData?.target?.isVector3) {
      await orbit.setTarget(
        prevData.target.x,
        0,
        prevData.target.z,
        false
      );
    } else {
      await orbit.setTarget(0, 0, 0, false);
    }

    orbit.camera.far = DEFAULT_FAR;
    orbit.camera.fov = 15;
    orbit.camera.updateProjectionMatrix();

    orbit.dollyToCursor = true;
    orbit.verticalDragToForward = true;

    orbit.maxDistance = 128;
    orbit.minDistance = 20;

    orbit.maxPolarAngle = POLAR_MAX;
    orbit.minPolarAngle = POLAR_MIN;
    orbit.maxAzimuthAngle = 0;
    orbit.minAzimuthAngle = 0;
    this._updateSettings();

    await orbit.rotatePolarTo(POLAR_MIN, false);
    await orbit.rotateAzimuthTo(0, false);
    await orbit.zoomTo(1, false);
    await orbit.dollyTo(this.config.defaultDistance, false);

    this.secondaryViewport.height = this.config.pipSize;
    this.secondaryViewport.right = .05;
    this.secondaryViewport.bottom = .05;
  },

  onConfigChanged(oldConfig) {
      this._updateSettings();

      // only update default distance if it's changed otherwise we'll get a jump
      if (this.config.defaultDistance !== oldConfig.defaultDistance) {
        this.primaryViewport.orbit.dollyTo(this.config.defaultDistance, true);
      }

      if (this.config.pipSize !== oldConfig.pipSize) {
        this.secondaryViewport.height = this.config.pipSize;
      }
  },

  onCameraMouseUpdate(
    delta,
    elapsed,
    scrollY,
    screenDrag,
    lookAt,
    mouse,
    clientX,
    clientY,
    clicked
  ) {
    if (scrollY) {
      if (scrollY < 0) {
        this.primaryViewport.orbit.dolly(this.config.dollyAmount, true);
        this.primaryViewport.orbit.rotate(0, (Math.PI * this.config.rotateAmount) / 96, true);
      } else {
        this.primaryViewport.orbit.dolly(-this.config.dollyAmount, true);
        this.primaryViewport.orbit.rotate(0, -(Math.PI * this.config.rotateAmount) / 96, true);
      }
    }

    if (screenDrag.x !== 0) {
      this.primaryViewport.orbit.truck(screenDrag.x * delta * this._edgeSpeed, 0, true);
    }

    if (screenDrag.y !== 0) {
      this.primaryViewport.orbit.forward(screenDrag.y * delta * this._edgeSpeed, true);
    }

    if (screenDrag.y === 0 && screenDrag.x === 0) {
      this._edgeSpeed = this.config.screenDragSpeed;
    } else {
      this._edgeSpeed = Math.min(
        this.config.screenDragAccelMax,
        this._edgeSpeed * (1 + this.config.screenDragAccel)
      );
    }
  },

  onCameraKeyboardUpdate(delta, elapsed, move) {
    if (move.x !== 0) {
      this.primaryViewport.orbit.truck(move.x * delta * this._keyboardSpeed, 0, true);
    }

    if (move.y !== 0) {
      this.primaryViewport.orbit.forward(move.y * delta * this._keyboardSpeed, true);
    }

    if (move.y === 0 && move.x === 0) {
      this._keyboardSpeed = this.config.keyboardSpeed;
    } else {
      this._keyboardSpeed = Math.min(
        this.config.keyboardAccelMax,
        this._keyboardSpeed * (1 + this.config.keyboardAccel)
      );
    }
  },

  onUpdateAudioMixerLocation(delta, elapsed, target, position) {
    return target;
  },

  onDrawMinimap(ctx) {
    const view = this.primaryViewport.projectedView;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(...view.tl);
    ctx.lineTo(...view.tr);
    ctx.lineTo(...view.br);
    ctx.lineTo(...view.bl);
    ctx.lineTo(...view.tl);
    ctx.stroke();

    if (this.secondaryViewport.enabled) {
    const view = this.secondaryViewport.projectedView;
    const camera = this.secondaryViewport.camera;
        const h = 5;
        const w = h * camera.aspect;
        ctx.strokeStyle = pipColor;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
        ctx.moveTo(...view.tl);
        ctx.lineTo(...view.tr);
        ctx.lineTo(...view.br);
        ctx.lineTo(...view.bl);
        ctx.lineTo(...view.tl);
        ctx.stroke();
        // ctx.beginPath();
        // ctx.moveTo(camera.position.x - w, camera.position.z - h);
        // ctx.lineTo(camera.position.x + w, camera.position.z - h);
        // ctx.lineTo(camera.position.x + w, camera.position.z + h);
        // ctx.lineTo(camera.position.x - w, camera.position.z + h);
        // ctx.lineTo(camera.position.x - w, camera.position.z - h);
        // ctx.stroke();
      }
  },


  onMinimapDragUpdate(pos, isDragStart, isDragging, mouseButton) {
      if (
        this.secondaryViewport.enabled && 
        this.primaryViewport.orbit
        .getTarget(_target)
        .setY(this.secondaryViewport.camera.position.y)
        .distanceTo(this.secondaryViewport.camera.position) < PIP_PROXIMITY
      ) {
        this.secondaryViewport.enabled = false;
      }
      
      if (mouseButton === 0) {
        this.primaryViewport.orbit.moveTo(pos.x, 0, pos.z, !isDragStart);
      } else if (mouseButton === 2) { 
        this.secondaryViewport.enabled = true;
        this.secondaryViewport.orbit.moveTo(pos.x, 0, pos.z)
        this._pipPovPlayerId = null;
      }

      
  },

  onFrame() {
    if (this.followedUnitsPosition) {
      const pos = this.followedUnitsPosition;
      this.primaryViewport.orbit.moveTo(pos.x, pos.y, pos.z, true);
    }
  },

  onCustomPlayerBarClicked({ playerId, button }) {
    if (button === 2) {
      if (this._pipPovPlayerId === playerId) {
        this._pipPovPlayerId = null;
        this.secondaryViewport.enabled = false;
        } else {
        this.secondaryViewport.enabled = true;
        this._pipPovPlayerId = playerId;
      }
      return true;
    }
  },

  onMacroPIPPlayer(playerId) {

  }
};
