import * as THREE from "three";
import { SceneController, GameViewPort } from "titan-reactor/host";

const DEFAULT_FAR = 256;
const POLAR_MAX = (10 * Math.PI) / 64;
const POLAR_MIN = (2 * Math.PI) / 64;

// const POV_COMMANDS = [0x0c, 0x14, 0x15, 0x60, 0x61];
const PIP_PROXIMITY = 16;

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();

const pipColor = "#aaaaaa";
interface Config {
  config: {
    defaultDistance: number;
    tilt: number;
    rotateAmount: number;
    dollyAmount: number;
    screenDragSpeed: number;
    screenDragAccel: number;
    screenDragAccelMax: number;
    pipSize: number;
    camera: string
  }
}
export default class PluginAddon extends SceneController implements SceneController {
  #edgeSpeed = 0;
  #pip: GameViewPort;

  gameOptions = {
    allowUnitSelection: true,
    audio: "stereo" as const,
  }

  #pipPovPlayerId = null

  // a few shared setings we can update on init and config change
  _updateSettings() {
    this.#edgeSpeed = this.config.screenDragSpeed;
  }

  async onEnterScene(prevData) {
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
    this._updateSettings();

    await orbit.rotatePolarTo(orbit.minPolarAngle, false);
    await orbit.rotateAzimuthTo(0, false);
    await orbit.zoomTo(1, false);
    await orbit.dollyTo(this.config.defaultDistance, false);

    this.#pip = this.secondViewport;
    this.#pip.height = this.config.pipSize;
    this.#pip.right = 0.05;
    this.#pip.bottom = 0.05;

  }

  onConfigChanged(oldConfig) {
    this._updateSettings();

    // only update default distance if it's changed otherwise we'll get a jump
    if (this.config.defaultDistance !== oldConfig.defaultDistance) {
      this.viewport.orbit.dollyTo(this.config.defaultDistance, true);
    }

    if (this.config.pipSize !== oldConfig.pipSize) {
      this.#pip.height = this.config.pipSize;
    }

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
        screenDrag.x * delta * this.#edgeSpeed,
        0,
        true
      );
    }

    if (screenDrag.y !== 0) {
      this.viewport.orbit.forward(screenDrag.y * delta * this.#edgeSpeed, true);
    }

    if (screenDrag.y === 0 && screenDrag.x === 0) {
      this.#edgeSpeed = this.config.screenDragSpeed;
    } else {
      this.#edgeSpeed = Math.min(
        this.config.screenDragAccelMax,
        this.#edgeSpeed * (1 + this.config.screenDragAccel)
      );
    }
  }

  onCameraKeyboardUpdate(delta, elapsed, move) {
    if (move.x !== 0) {
      this.viewport.orbit.truck(move.x * delta * this.cameraMovementSpeed, 0, true);
    }

    if (move.y !== 0) {
      this.viewport.orbit.forward(move.y * delta * this.cameraMovementSpeed, true);
    }

  }

  onUpdateAudioMixerLocation(delta, elapsed, target, position) {

    return target;

  }

  onDrawMinimap(ctx) {

    const view = this.viewport.projectedView;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(...view.tl);
    ctx.lineTo(...view.tr);
    ctx.lineTo(...view.br);
    ctx.lineTo(...view.bl);
    ctx.lineTo(...view.tl);
    ctx.stroke();

    if (this.#pip.enabled) {

      const view = this.#pip.projectedView;
      ctx.strokeStyle = pipColor;
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

    const viewportsAreProximate = this._areProximateViewports(
      this.viewport,
      this.#pip
    );

    if (mouseButton === 0) {
      this.viewport.orbit.moveTo(pos.x, 0, pos.z, !isDragStart);
      if (this.#pip.enabled) {
        this.#pip.enabled = !viewportsAreProximate;
      } else {
        this.#pip.orbit.moveTo(-10000, 0, 0, false);
      }
    } else if (mouseButton === 2) {
      _c.set(pos.x, 0, pos.z);
      this.#pipPovPlayerId = null;

      const isProximateToPrevious = this._areProximate(_c, _b);

      if (isDragStart) {
        if (this.#pip.enabled) {
          this.#pip.enabled =
            !viewportsAreProximate && isProximateToPrevious;
        } else {
          this.#pip.enabled = !viewportsAreProximate;
        }
      } else {
        this.#pip.enabled =
          !viewportsAreProximate &&
          isProximateToPrevious;
      }

      if (this.#pip.enabled) {
        this.#pip.orbit.moveTo(pos.x, 0, pos.z, !isDragStart);
      } else {
        this.#pip.orbit.moveTo(-10000, 0, 0, false);
      }
    }

  }

  onFrame() {

    // if (this.followedUnitsPosition) {

    //   const pos = this.followedUnitsPosition;
    //   this.viewport.orbit.moveTo(pos.x, pos.y, pos.z, true);

    // }

  }

  onCustomPlayerBarClicked({ playerId, button }) {
    if (button === 2) {
      if (this.#pipPovPlayerId === playerId) {
        this.#pipPovPlayerId = null;
        this.#pip.enabled = false;
      } else {
        this.#pip.enabled = true;
        this.#pipPovPlayerId = playerId;
      }
      return true;
    }
  }

};
