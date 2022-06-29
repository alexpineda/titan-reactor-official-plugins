const { THREE, Layers } = arguments[0];

const DEFAULT_FAR = 256;
const POLAR_MAX = (10 * Math.PI) / 64;
const POLAR_MIN = (2 * Math.PI) / 64;

const POV_COMMANDS = [0x0c, 0x14, 0x15, 0x60, 0x61];
const PIP_PROXIMITY = 8;

const _target = new THREE.Vector3();

return {
  boundByMap: {
    scaleBoundsByCamera: true,
  },
  minimap: true,
  background: "tiles",
  fogOfWar: 1,
  unitSelection: true,
  _pipPovPlayerId: null,
  _isPreviewing: false,

  // a few shared setings we can update on init and config change
  _updateSettings() {
    this._edgeSpeed = this.config.screenDragSpeed;
    this._keyboardSpeed = this.config.keyboardSpeed;
    this.orbit.dampingFactor = this.config.damping;
    this.orbit.boundaryFriction = this.config.edgeFriction;
  },

  async onEnterCameraMode(prevData, camera) {
    if (prevData?.target?.isVector3) {
      await this.orbit.setTarget(
        prevData.target.x,
        0,
        prevData.target.z,
        false
      );
    } else {
      await this.orbit.setTarget(0, 0, 0, false);
    }

    this.orbit.camera.far = DEFAULT_FAR;
    this.orbit.camera.fov = 15;
    this.orbit.camera.updateProjectionMatrix();

    this.orbit.dollyToCursor = true;
    this.orbit.verticalDragToForward = true;

    this.orbit.maxDistance = 128;
    this.orbit.minDistance = 20;

    this.orbit.maxPolarAngle = POLAR_MAX;
    this.orbit.minPolarAngle = POLAR_MIN;
    this.orbit.maxAzimuthAngle = 0;
    this.orbit.minAzimuthAngle = 0;
    this._updateSettings();

    await this.orbit.rotatePolarTo(POLAR_MIN, false);
    await this.orbit.rotateAzimuthTo(0, false);
    await this.orbit.zoomTo(1, false);
    await this.orbit.dollyTo(this.config.defaultDistance, false);
  },

  onConfigChanged(oldConfig) {
    if (this.isActiveCameraMode) {
      this._updateSettings();

      // only update default distance if it's changed otherwise we'll get a jump
      if (this.config.defaultDistance !== oldConfig.defaultDistance) {
        this.orbit.dollyTo(this.config.defaultDistance, true);
      }

      if (this.config.pipSize !== oldConfig.pipSize) {
        this.setPipDimensions(null, this.config.pipSize);
      }
    }
  },

  onExitCameraMode(target, position) {
    return {
      target,
      position,
    };
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
        this.orbit.dolly(this.config.dollyAmount, true);
        this.orbit.rotate(0, (Math.PI * this.config.rotateAmount) / 96, true);
      } else {
        this.orbit.dolly(-this.config.dollyAmount, true);
        this.orbit.rotate(0, -(Math.PI * this.config.rotateAmount) / 96, true);
      }
    }

    if (screenDrag.x !== 0) {
      this.orbit.truck(screenDrag.x * delta * this._edgeSpeed, 0, true);
    }

    if (screenDrag.y !== 0) {
      this.orbit.forward(screenDrag.y * delta * this._edgeSpeed, true);
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
      this.orbit.truck(move.x * delta * this._keyboardSpeed, 0, true);
    }

    if (move.y !== 0) {
      this.orbit.forward(move.y * delta * this._keyboardSpeed, true);
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
  },

  onMinimapDragUpdate(pos, isDragStart, isDragging, mouseButton) {
      if (mouseButton === 0) {
        this.orbit.moveTo(pos.x, 0, pos.z, !isDragStart);
      } else if (mouseButton === 2) {
        if (
            this.orbit
            .getTarget(_target)
            .setY(this.getPipCamera().position.y)
            .distanceTo(this.getPipCamera().position) < PIP_PROXIMITY
          ) {
            this.pipHide();
          }
         else {
            this.pipLookAt(pos.x, pos.z);
        }
        this._pipPovPlayerId = null;
      }
  },

  onFrame(frame, commands) {
    if (!this.isActiveCameraMode) {
      return;
    }

    if (this.getFollowedUnits().length) {
      const target = this.calculateFollowedUnitsTarget();
      this.orbit.moveTo(target.x, target.y, target.z, true);
    }

    if (this._pipPovPlayerId !== null) {
        let movedCamera = false;
      for (const command of commands) {
        if (
          command.player === this._pipPovPlayerId &&
          POV_COMMANDS.includes(command.id)
        ) {
          const px = this.pxToGameUnit.x(command.x);
          const pz = this.pxToGameUnit.y(command.y);
          const py = this.terrain.getTerrainY(px, pz);

          if (!movedCamera) {
            this.pipLookAt(px, pz);
            movedCamera = true;
          }

          this.fadingPointers.addPointer(
            px,
            py,
            pz,
            this.getPlayerColor(command.player),
            frame,
          ).layers.set(Layers.PictureInPicture);
        }
      }
    }
  },

  onCustomPlayerBarClicked({ playerId, button }) {
    if (this.isActiveCameraMode && button === 2) {
      if (this._pipPovPlayerId === playerId) {
        this._pipPovPlayerId = null;
        this.pipHide();
        } else {
        this._pipPovPlayerId = playerId;
      }
      return true;
    }
  },
};
