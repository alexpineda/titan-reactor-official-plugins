import { Unit } from "@titan-reactor-runtime/host";
import { areProximate } from "./camera-utils";
import {
  calculateMeanCenter,
  calculateMedianCenter,
  easeIn,
  easeOut,
  getAngle,
  getCameraDistance,
} from "./math-utils";
import type PluginAddon from "./index";
import { CUT_TRANSITION_PROXIMITY_MIN  } from "./constants";
import { Quadrant } from "./structures/array-grid";
import { isHarvesting, isWorkerUnit } from "./unit-helpers";

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

  #moveTargets: THREE.Vector3[] = [];
  #maxDistance = 0;

  #plugin: PluginAddon;

  #zoomEnabledMS: null | number = null;

  constructor(plugin: PluginAddon) {
    this.#plugin = plugin;
    this.#maxDistance = Math.sqrt(
      Math.pow(plugin.map.size[0], 2) + Math.pow(plugin.map.size[1], 2)
    );
  }

  get moveTargets() {
    return this.#moveTargets;
  }

  setMoveTargets(value: THREE.Vector3[], _damping?: number, force?: "smooth" | "cut") {
    this.#moveTargets = value;

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
    plugin.settings.input.dampingFactor.$set(_damping ?? damping);


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
  #calculateUnitPosWeightedCenter = calculateMedianCenter(unit => unit)
  #calculateUnitHeadingWeightedCenter = calculateMedianCenter(unit => {
    const plugin = this.#plugin;
    if (plugin.assets.bwDat.units[unit.typeId].isBuilding) { 
      return unit;
    }
    const angle = getAngle(unit.currentVelocityDirection);
    _a2.x = unit.x + Math.cos(angle) * unit.currentSpeed * 64;
    _a2.y = unit.y + Math.sin(angle) * unit.currentSpeed * 64;
    return _a2;
  })

  moveToUnits(units: Unit[], damping?: number, force?: "smooth" | "cut") {
    const plugin = this.#plugin;
    const center = this.#calculateUnitPosWeightedCenter(
      _a2,
      units,
    );
    const moveCenter = this.#calculateUnitHeadingWeightedCenter(
      _b2,
      units,
    );

    plugin.pxToWorld.xyz(center.x, center.y, _ma);
    plugin.pxToWorld.xyz(moveCenter.x, moveCenter.y, _mb);

    // plugin.selectedUnits.set(quadrant.items)

    this.setMoveTargets(_ml, damping, force);

    return _ml;

  }

  // todo calc once
  get moveTarget() {
    if (this.#moveTargets.length > 1) {
      // lerp between the two targets
      // its "stickier" to the a than to b
      const a = this.#moveTargets[0];
      const b = this.#moveTargets[1];
      const dist = easeIn(1 - a.distanceTo(b) / this.#maxDistance, 3);
      return _moveTarget.lerpVectors(
        this.#moveTargets[0],
        this.#moveTargets[1],
        dist
      );
    }
    return this.#moveTargets[0];
  }

  adjustDollyToUnitSpread(units: Unit[]) {
    const plugin = this.#plugin;
    // multiply by 2 as its barely getting past 0.5 otherwise
    const cameraAdjustment = getCameraDistance(units, plugin.map.size) * 1.2;

    //todo: this doesnt capture surrounding areas
    this.dollyTarget = THREE.MathUtils.lerp(
      plugin.config!.baseDistance,
      plugin.config!.baseDistance + plugin.config!.distanceVariance,
      easeOut(cameraAdjustment, 3)
    );

    // random zoom
    if (this.#zoomEnabledMS === null && Math.random() < 0.1) {
      this.#zoomEnabledMS = plugin.elapsed;
      plugin.viewport.orbit.zoomTo(1.25 + Math.random() * 0.75, false);
    }

  }

  update() {
    const plugin = this.#plugin;

    if (this.#zoomEnabledMS !== null && plugin.elapsed - this.#zoomEnabledMS > 2500) {
      this.#zoomEnabledMS = null;
      plugin.viewport.orbit.zoomTo(1, false);
    }

    const dampSpeed = plugin.targetGameSpeed > 1 ? 0.1 : 0.5;
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
        0.1,
        plugin.delta / 1000
      ),
      false
    );
    plugin.viewport.orbit.rotatePolarTo(
      THREE.MathUtils.damp(
        plugin.viewport.orbit.polarAngle,
        this.polarTarget,
        0.1,
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

      this.azimuthTarget =
        [-1, 0, 1][Math.floor(Math.random() * 3)] *
        easeIn((this.polarTarget - plugin.viewport.orbit.minPolarAngle) / THREE.MathUtils.degToRad(plugin.config!.polarVariance), 2) *
        THREE.MathUtils.degToRad(plugin.config!.azimuthVariance);
    }
  }
}
