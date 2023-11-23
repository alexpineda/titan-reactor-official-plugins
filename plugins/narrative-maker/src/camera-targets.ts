import { Unit } from "@titan-reactor-runtime/host";
import { areProximate } from "./utils/camera-utils";
import {
  calculateMedianCenter,
  clamp,
  easeIn,
  easeOut,
  getAngle,
  getCameraDistance,
} from "./utils/math-utils";
import type PluginAddon from "./index";
import { CUT_TRANSITION_PROXIMITY_MIN  } from "./utils/constants";

const _a = new THREE.Vector3(), _b = new THREE.Vector3() ;
const _ma = new THREE.Vector3(), _mb = new THREE.Vector3() ;
const _ml = [_ma, _mb];

const _a2 = new THREE.Vector2(0, 0 );
const _b2 = new THREE.Vector2(0, 0 );

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

  moveTarget: THREE.Vector3 = new THREE.Vector3();
  #maxDistance = 0;

  #plugin: PluginAddon;

  constructor(plugin: PluginAddon) {
    this.#plugin = plugin;
    this.#maxDistance = Math.sqrt(
      Math.pow(plugin.map.size[0], 2) + Math.pow(plugin.map.size[1], 2)
    );
  }

  lookAtMoveTarget(dampingM = 1, force?: "smooth" | "cut") {
    //set damping based on camera origin to move target
    const plugin = this.#plugin;
    plugin.viewport.orbit.getTarget(_a);
    plugin.viewport.orbit.getPosition(_b);
    const originDistanceToTarget = easeIn(
      _a.distanceTo(this.moveTarget) / this.#maxDistance, 2
    );
    const cameraDistance = _a.distanceTo(_b);
    // value closer to 0 the farther away the camera is, so if camera is really far, we can have a lower damping as its not as jarring
    const cameraDistanceDampingFactor = 0.2 + easeOut(1 - cameraDistance / plugin.viewport.orbit.maxDistance, 4) * 0.8;
    const damping = originDistanceToTarget * 5 * cameraDistanceDampingFactor + 0.5;
    plugin.settings.input.dampingFactor.$set(damping * dampingM);

    // modify cut transition promixity based on distance
    const cutProximity = cameraDistance / 4 + CUT_TRANSITION_PROXIMITY_MIN

    // smooth transition if close to target
    if (areProximate(this.moveTarget, _a, cutProximity) && force !== "cut" || force === "smooth") {
      plugin.viewport.orbit.moveTo(
        this.moveTarget.x,
        this.moveTarget.y,
        this.moveTarget.z,
        true
      );
    } else {
      plugin.viewport.orbit.moveTo(
        this.moveTarget.x,
        this.moveTarget.y,
        this.moveTarget.z
      );
    }
  }
  

  adjustDollyToUnitSpread(units: Unit[]) {
    const plugin = this.#plugin;
    const cameraAdjustment = getCameraDistance(units, plugin.map.size);

    this.dollyTarget = THREE.MathUtils.lerp(
      plugin.config!.baseDistance,
      plugin.config!.baseDistance + plugin.config!.distanceVariance,
      easeOut(cameraAdjustment, 2)
    );

  }

  update() {
    const plugin = this.#plugin;

    const clampedSpeed = clamp(
      plugin.targetGameSpeed,
      plugin.config.minReplaySpeed,
      plugin.config.maxReplaySpeed
    );

    const dampSpeed = plugin.targetGameSpeed > 1 ? 0.1 : 0.5;
    plugin.openBW.setGameSpeed(
      THREE.MathUtils.damp(
        plugin.openBW.gameSpeed,
        clampedSpeed,
        dampSpeed,
        plugin.delta / 1000
      )
    );

    //  0-1, 1 is lots of movement on rotation
    const flow = easeIn((1 + Math.sin(plugin.elapsed / 100_000)) * 0.5, 2);
    const rotationDamping = flow * 0.09 + 0.01; // 0.01 - 0.1
    
    plugin.viewport.orbit.rotateAzimuthTo(
      THREE.MathUtils.damp(
        plugin.viewport.orbit.azimuthAngle,
        this.azimuthTarget,
        rotationDamping, 
        plugin.delta / 1000
      ),
      false
    );

    plugin.viewport.orbit.rotatePolarTo(
      THREE.MathUtils.damp(
        plugin.viewport.orbit.polarAngle,
        this.polarTarget,
        rotationDamping,
        plugin.delta / 1000
      ),
      false
    );

    plugin.viewport.orbit.dollyTo(
      THREE.MathUtils.damp(
        plugin.viewport.orbit.distance,
        this.dollyTarget,
        0.1,
        plugin.delta / 1000
      ),
      false
    );

    if (Math.abs(plugin.viewport.orbit.polarAngle - this.polarTarget) < 0.1 ) {
      this.polarTarget =
        plugin.viewport.orbit.minPolarAngle +
        Math.random() * THREE.MathUtils.degToRad(plugin.config!.polarVariance);

      // azimuth target is tied to polar target
      this.azimuthTarget =
        [-1, 0, 1][Math.floor(Math.random() * 3)] *
        easeIn((this.polarTarget - plugin.viewport.orbit.minPolarAngle) / THREE.MathUtils.degToRad(plugin.config!.polarVariance), 2) *
        THREE.MathUtils.degToRad(plugin.config!.azimuthVariance);
    }
  }
}
