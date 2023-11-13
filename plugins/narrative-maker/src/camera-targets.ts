import { Unit } from "@titan-reactor-runtime/host";
import { areProximate } from "./camera-utils";
import { easeOutCubic, getCameraDistance } from "./math-utils";
import type PluginAddon from "./index";

const _a = new THREE.Vector3();

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

  moveTarget = new THREE.Vector3();

  #plugin: PluginAddon;

  constructor(plugin: PluginAddon) {
    this.#plugin = plugin;
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

    if (
      Math.abs(plugin.viewport.orbit.azimuthAngle - this.azimuthTarget) < 0.1
    ) {
      this.azimuthTarget =
        (-0.5 + Math.random()) *
        THREE.MathUtils.degToRad(plugin.config!.azimuthVariance);
    }

    if (Math.abs(plugin.viewport.orbit.polarAngle - this.polarTarget) < 0.1) {
      this.polarTarget =
      plugin.viewport.orbit.minPolarAngle +
        Math.random() * THREE.MathUtils.degToRad(plugin.config!.polarVariance);
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

    plugin.viewport.orbit.getTarget(_a);
    if (areProximate(this.moveTarget, _a)) {
      const x = THREE.MathUtils.damp(
        _a.x,
        this.moveTarget.x,
        0.5,
        plugin.delta / 1000
      );

      const z = THREE.MathUtils.damp(
        _a.z,
        this.moveTarget.z,
        0.5,
        plugin.delta / 1000
      );

      plugin.viewport.orbit.moveTo(x, _a.y, z, true);
    } else {
      plugin.viewport.orbit.moveTo(
        this.moveTarget.x,
        this.moveTarget.y,
        this.moveTarget.z
      );
    }
  }
}