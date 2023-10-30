import * as THREE from "three";

const DEFAULT_FAR = 256;
const POLAR_MAX = (10 * Math.PI) / 64;
const POLAR_MIN = (2 * Math.PI) / 64;

// const POV_COMMANDS = [0x0c, 0x14, 0x15, 0x60, 0x61];
const PIP_PROXIMITY = 16;

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();

export default class PluginAddon extends SceneController  {
  // #pip: GameViewPort;

  gameOptions = {
    audio: "stereo" as const,
  }

  async onEnterScene(prevData) {

    this.viewport.fullScreen();

    const orbit = this.viewport.orbit;

    if (typeof prevData?.target?.x === "number" && typeof prevData?.target?.z === "number") {
      await orbit.setTarget(prevData.target.x, 0, prevData.target.z, false);
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
    orbit.minPolarAngle = POLAR_MIN + THREE.MathUtils.degToRad(this.config.tilt);
    orbit.maxAzimuthAngle = 0;
    orbit.minAzimuthAngle = 0;

    await orbit.rotatePolarTo(orbit.minPolarAngle, false);
    await orbit.rotateAzimuthTo(0, false);
    await orbit.zoomTo(1, false);
    await orbit.dollyTo(this.config.defaultDistance, false);

    // this.#pip = this.secondViewport;
    // this.#pip.name = "pip";
    // this.#pip.height = this.config.pipSize;
    // this.#pip.right = 0.05;
    // this.#pip.bottom = 0.05;
    // this.#pip.orbit.setLookAt(0, 50, 0, 0, 0, 0, false);

  }

  onConfigChanged(oldConfig) {
    // only update default distance if it's changed otherwise we'll get a jump
    if (this.config.defaultDistance !== oldConfig.defaultDistance) {
      this.viewport.orbit.dollyTo(this.config.defaultDistance, true);
    }

    // if (this.config.pipSize !== oldConfig.pipSize) {
    //   this.#pip.height = this.config.pipSize;
    // }

    if (this.config.tilt !== oldConfig.tilt) {
      this.viewport.orbit.minPolarAngle = POLAR_MIN + THREE.MathUtils.degToRad(this.config.tilt);
      this.viewport.orbit.rotatePolarTo(this.viewport.orbit.minPolarAngle, true);
    }

  }

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
    const _delta = delta * this.config.sensitivity;

    if (scrollY) {
      if (scrollY < 0) {
        this.viewport.orbit.dolly(this.config.dollyAmount, true);
        this.viewport.orbit.rotate(
          0,
          (Math.PI * this.config.rotateAmount) / 96,
          true
        );
      } else {
        this.viewport.orbit.dolly(-this.config.dollyAmount, true);
        this.viewport.orbit.rotate(
          0,
          -(Math.PI * this.config.rotateAmount) / 96,
          true
        );
      }
    }

    if (screenDrag.x !== 0) {
      this.viewport.orbit.truck(
        screenDrag.x * _delta * this.settings.input.movementSpeed(),
        0,
        true
      );
    }

    if (screenDrag.y !== 0) {
      this.viewport.orbit.forward(screenDrag.y * _delta * this.settings.input.movementSpeed(), true);
    }

  }

  onCameraKeyboardUpdate(delta, elapsed, move) {
    const _delta = delta * this.config.sensitivity;

    if (move.x !== 0) {
      this.viewport.orbit.truck(move.x * _delta * this.settings.input.movementSpeed(), 0, true);
    }

    if (move.y !== 0) {
      this.viewport.orbit.forward(move.y * _delta * this.settings.input.movementSpeed(), true);
    }

  }

  _groundTarget(viewport, t) {
    return viewport.orbit.getTarget(t).setY(0);
  }

  _areProximate(a, b) {
    return a.distanceTo(b) < PIP_PROXIMITY;
  }

  _areProximateViewports(a, b) {
    return this._areProximate(
      this._groundTarget(a, _a),
      this._groundTarget(b, _b)
    );
  }

  onMinimapDragUpdate(pos, isDragStart, mouseButton) {

    // const viewportsAreProximate = this._areProximateViewports(
    //   this.viewport,
    //   this.#pip
    // );

    if (mouseButton === 0) {
      this.viewport.orbit.moveTo(pos.x, 0, pos.y, !isDragStart);
      // if (this.#pip.enabled) {
      //   this.#pip.enabled = !viewportsAreProximate;
      // } else {
      //   this.#pip.orbit.moveTo(-10000, 0, 0, false);
      // }
    } else if (mouseButton === 2) {
      // _c.set(pos.x, 0, pos.y);
      // this.#pipPovPlayerId = null;

      // const isProximateToPrevious = this._areProximate(_c, _b);

      // if (isDragStart) {
      //   if (this.#pip.enabled) {
      //     this.#pip.enabled =
      //       !viewportsAreProximate && isProximateToPrevious;
      //   } else {
      //     this.#pip.enabled = !viewportsAreProximate;
      //   }
      // } else {
      //   this.#pip.enabled =
      //     !viewportsAreProximate &&
      //     isProximateToPrevious;
      // }

      // if (this.#pip.enabled) {
      //   this.#pip.orbit.moveTo(pos.x, 0, pos.y, !isDragStart);
      // } else {
      //   this.#pip.orbit.moveTo(-10000, 0, 0, false);
      // }
    }

  }

  onFrame() {
    
    if (this.followedUnits.size) {
      
      const pos = this.getFollowedUnitsCenterPosition();

      if (pos) {

        this.viewport.orbit.moveTo(pos.x, pos.y, pos.z, true);

      }

    }

  }

  onCustomPlayerBarClicked({ playerId, button }) {
    // if (button === 2) {
    //   if (this.#pipPovPlayerId === playerId) {
    //     this.#pipPovPlayerId = null;
    //     this.#pip.enabled = false;
    //   } else {
    //     this.#pip.enabled = true;
    //     this.#pipPovPlayerId = playerId;
    //   }
    //   return true;
    // }
  }

};
