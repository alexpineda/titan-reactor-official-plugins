import { Unit } from "@titan-reactor-runtime/host";
import { areProximate } from "./camera-utils";
import {
  easeInCubic,
  easeInQuad,
  easeInQuart,
  easeOutCubic,
  getCameraDistance,
} from "./math-utils";
import type PluginAddon from "./index";
import { CUT_TRANSITION_PROXIMITY, PIP_PROXIMITY, POLAR_MAX } from "./constants";

const _a = new THREE.Vector3();

const _moveTarget = new THREE.Vector3();

export class CameraTargets {
  /**
   * The polar angle target of the camera
   */
  polarTarget = 0;
  /**
   * The azimuth angle target of the camera
   */
  azimuthTarget = 0;
  /**
   * The distance target of the camera
   */
  dollyTarget = 55;

  #moveTargets: THREE.Vector3[] = [];
  #maxDistance = 0;

  #plugin: PluginAddon;

  constructor(plugin: PluginAddon) {
    this.#plugin = plugin;
    this.#maxDistance = Math.sqrt(
      Math.pow(plugin.map.size[0], 2) + Math.pow(plugin.map.size[1], 2)
    );
  }

  get moveTargets() {
    return this.#moveTargets;
  }

  setMoveTargets(value: THREE.Vector3[], _damping?: number, forceSmooth?: boolean) {
    this.#moveTargets = value;

    const plugin = this.#plugin;
    plugin.viewport.orbit.getTarget(_a);
    const dist = easeInQuad(
      _a.distanceTo(this.moveTarget) / this.#maxDistance
    );
    const damping = dist * 5 + 0.5;
    plugin.settings.input.dampingFactor.$set(_damping ?? damping);

    if (areProximate(this.moveTarget, _a, CUT_TRANSITION_PROXIMITY) || forceSmooth) {
      // const x = THREE.MathUtils.damp(
      //   _a.x,
      //   this.moveTarget.x,
      //   this.#moveDamping,
      //   plugin.delta / 1000
      // );

      // const z = THREE.MathUtils.damp(
      //   _a.z,
      //   this.moveTarget.z,
      //   this.#moveDamping,
      //   plugin.delta / 1000
      // );

      plugin.viewport.orbit.moveTo(
        this.moveTarget.x,
        this.moveTarget.y,
        this.moveTarget.z,
        true
      );
      // plugin.viewport.orbit.moveTo(x, _a.y, z, true);
    } else {
      plugin.viewport.orbit.moveTo(
        this.moveTarget.x,
        this.moveTarget.y,
        this.moveTarget.z
      );
    }
  }

  get moveTarget() {
    if (this.#moveTargets.length > 1) {
      const a = this.#moveTargets[0];
      const b = this.#moveTargets[1];
      const dist = easeInQuart(1 - a.distanceTo(b) / this.#maxDistance);
      return _moveTarget.lerpVectors(
        this.#moveTargets[0],
        this.#moveTargets[1],
        dist
      );
    }
    return this.#moveTargets[0];
  }

  adjustToUnits(units: Unit[]) {
    const plugin = this.#plugin;
    const cameraAdjustment = getCameraDistance(units, plugin.map.size);

    //todo: this doesnt capture surrounding areas
    this.dollyTarget = THREE.MathUtils.lerp(
      plugin.config!.baseDistance,
      plugin.config!.baseDistance + plugin.config!.distanceVariance,
      easeOutCubic(cameraAdjustment)
    );

    // if (
    //   Math.abs(plugin.viewport.orbit.azimuthAngle - this.azimuthTarget) < 0.1
    // ) {
    //   this.azimuthTarget =
    //     (-0.5 + Math.random()) *
    //     THREE.MathUtils.degToRad(plugin.config!.azimuthVariance);
    // }

    if (Math.abs(plugin.viewport.orbit.polarAngle - this.polarTarget) < 0.1) {
      this.polarTarget =
        plugin.viewport.orbit.minPolarAngle +
        Math.random() * THREE.MathUtils.degToRad(plugin.config!.polarVariance);

      console.log(
        plugin.viewport.orbit.minPolarAngle +
          THREE.MathUtils.degToRad(plugin.config!.polarVariance),
        POLAR_MAX
      );

      const maxPolarAngle =
        plugin.viewport.orbit.minPolarAngle +
        THREE.MathUtils.degToRad(plugin.config!.polarVariance);

      this.azimuthTarget =
        (-0.5 + Math.random()) *
        (this.polarTarget / maxPolarAngle) *
        THREE.MathUtils.degToRad(plugin.config!.azimuthVariance);
    }
  }

  update() {
    const plugin = this.#plugin;

    const dampSpeed = plugin.targetGameSpeed > 1 ? 0.5 : 1;
    plugin.openBW.setGameSpeed(
      THREE.MathUtils.damp(
        plugin.openBW.gameSpeed,
        THREE.MathUtils.clamp(
          plugin.targetGameSpeed,
          1,
          plugin.config.maxReplaySpeed
        ),
        dampSpeed,
        plugin.delta / 1000
      )
    );

    plugin.viewport.orbit.rotateAzimuthTo(
      THREE.MathUtils.damp(
        plugin.viewport.orbit.azimuthAngle,
        this.azimuthTarget,
        1,
        plugin.delta / 1000
      ),
      true
    );
    plugin.viewport.orbit.rotatePolarTo(
      THREE.MathUtils.damp(
        plugin.viewport.orbit.polarAngle,
        this.polarTarget,
        1,
        plugin.delta / 1000
      ),
      true
    );

    plugin.viewport.orbit.dollyTo(
      THREE.MathUtils.damp(
        plugin.viewport.orbit.distance,
        this.dollyTarget,
        0.5,
        plugin.delta / 1000
      ),
      true
    );

    

    // if (this.#moveTargets.length > 1) {
    //   plugin.viewport.orbit.getTarget(_a);
    //   if (areProximate(this.moveTarget, _a, PIP_PROXIMITY / 2)) {
    //     this.#moveTargets.shift();
    //   }
    // }
  }
}
