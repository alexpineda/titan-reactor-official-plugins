import { PrevSceneData, Unit } from "@titan-reactor-runtime/host";
import {
  areProximate,
  areProximateViewports,
  groundTarget,
  setupViewports,
} from "./utils/camera-utils";
import {
  AO_Unit,
  Quadrant,
  canOnlySelectOne,
  canSelectUnit,
  getAverageUnitDirectionAndSpeed,
  getUnitsFromLargestRepresentedTeam,
  isHarvesting,
  isTownCenter,
  isWorkerUnit,
  unitIsCompleted,
} from "./utils/unit-helpers";
import { PIP_PROXIMITY, POLAR_MIN, QUAD_SIZE } from "./utils/constants";
import { CameraTargets } from "./camera-targets";
import {
  calcCoeff,
  clamp,
  constrain,
  easeIn,
  easeInSine,
  moveVectorByAngleAndMagnitude,
  normalizeWorldDistance,
  standardDeviation,
} from "./utils/math-utils";
import {
  buildingUnitRanks,
  regularOrderRanks,
  regularUnitRanks,
} from "./unit-interest/rankings";

import { ScoreManager, TensionManager } from "./scores";
import { createUnitScoreCalculator } from "./unit-interest/unit-score-calculator";
import {
  getClusters,
  getUnitsNearCluster,
  unitScoreReducer,
} from "./utils/kmeans-utils";

const _a4 = new THREE.Vector4(0, 0, 0, 0);
const _b4 = new THREE.Vector4(0, 0, 0, 0);

const _a3 = new THREE.Vector3(0, 0, 0);
const _b3 = new THREE.Vector3(0, 0, 0);
const _c3 = new THREE.Vector3(0, 0, 0);

const _a2 = new THREE.Vector2(0, 0);
const _b2 = new THREE.Vector2(0, 0);
const _c2 = new THREE.Vector2(0, 0);

const allUnitRanks = [buildingUnitRanks.flat(), ...regularUnitRanks];
const allUnitRanksFlat = allUnitRanks.flat();

const _unitClusterA: AO_Unit[][] = [];

const unitOfInterest = (unit: Unit) =>
  unit.owner < 8 &&
  canSelectUnit(unit) &&
  allUnitRanksFlat.includes(unit.typeId);

const lowHealthUnitScoreReducer = (acc: number, unit: AO_Unit) => {
  // low health boosts score
  return (
    acc + unit.extras.ao_score + (1 - unit.hp / unit.extras.dat.hp)
  );
};

export default class PluginAddon extends SceneController {
  viewportsCount = 2;

  u8!: ScoreManager;
  t5!: TensionManager;
  targets!: CameraTargets;
  unitScore = createUnitScoreCalculator({
    unitRanks: allUnitRanks,
    unitRankCurve: easeInSine,
    orderRanks: regularOrderRanks,
    orderRankCurve: (t) => 0.1 + (t - 0.1), // minimum 0.1
  });
  strategyQueue: AO_Unit[] = [];
  lastSelectedStrategyOwner = -1;
  timeSinceLastStrategySelectionMS = 0;

  lastActiveQuadrantUpdateMS = 0;
  lastSecondaryActiveQuadrantUpdateMS = 0;

  lastDecayUpdateMS = 0;
  lastUnitDestroyedMS = 0;
  lastUnitAttackedMS = 0;

  targetGameSpeed = 1;
  lastTimeGameStartedActionMS = 0;
  lastTimeGameStartedLullMS = 0;
  activeQuadrant: Quadrant | undefined;
  gridCameraFatigue = 0;
  trackingCameraFatigue = 0;
  cameraFatigueAdjustmentTimeoutMS = 0;

  #targetObject = new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  #targetObject2 = new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );

  #reset() {
    this.u8.clear();
    this.t5.clear();
    this.strategyQueue.length = 0;

    this.lastActiveQuadrantUpdateMS = 0;
    this.lastSecondaryActiveQuadrantUpdateMS = 0;
    this.lastDecayUpdateMS = 0;
    this.lastUnitDestroyedMS = 0;
    this.lastUnitAttackedMS = 0;
    this.lastTimeGameStartedActionMS = 0;
    this.lastTimeGameStartedLullMS = 0;

    this.gridCameraFatigue = 0;
    this.trackingCameraFatigue = 0;

    this.activeQuadrant = undefined;
    this.targetGameSpeed = this.config.minReplaySpeed;
  }

  #maxDistance = 0;

  public async onEnterScene(prevData: PrevSceneData) {
    this.targets = new CameraTargets(this);

    this.targets.moveTarget.copy(prevData.target);
    this.targets.lookAtMoveTarget();

    this.parent.add(this.#targetObject);
    this.parent.add(this.#targetObject2);

    this.#targetObject.visible = this.config.showDebug;
    this.#targetObject2.visible = this.config.showDebug;

    this.u8 = new ScoreManager(QUAD_SIZE, this.map.size);
    this.t5 = new TensionManager(5, this.map.size);

    this.#maxDistance = Math.sqrt(
      Math.pow(this.map.size[0], 2) + Math.pow(this.map.size[1], 2)
    );

    this.#reset();

    await setupViewports(this);

    this.events.on(
      "unit-killed",
      (unit) => {
        //reset adhd if unit is killed
        this.u8.adhd.set(
          this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y),
          0
        );

        this.lastUnitDestroyedMS = this.elapsed;

        this.adjustCameraFatigueBasedOnRecentAction(unit, 20);
      },
      -1
    );

    this.events.on("unit-destroyed", (unit) => {
      this.strategyQueue = this.strategyQueue.filter((u) => u.id !== unit.id);
    });

    this.events.on("unit-created", (unit) => {
      // reset metadata
      (unit as AO_Unit).extras.ao_score = 0;
      (unit as AO_Unit).extras.ao_timeOnStrategyQueueMS = 0;
      

      if (unitOfInterest(unit) && unit.extras.dat.isBuilding) {
        this.strategyQueue.push(unit as AO_Unit);
        (unit as AO_Unit).extras.ao_timeOnStrategyQueueMS =
          this.elapsed;
      }
    });

    this.events.on("unit-updated", (unit: Unit) => {
      // add selectable player owned non-building units to quadtree
      if (unitOfInterest(unit)) {
        // add unit to grid - fyi this grid is cleared every frame
        this.u8.units
          .$get(this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y))
          .value.push(unit as AO_Unit);
      }

      if (unit.extras.recievingDamage) {
        this.u8.adhd.decay(this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y));

        if (!canOnlySelectOne(unit) && this.config.autoSelectUnits) {
          this.selectedUnits.add(unit);
        }

        this.adjustCameraFatigueBasedOnRecentAction(unit, 10);
      } else if (this.config.autoSelectUnits) {
        this.selectedUnits.delete(unit);
      }

      if (unit.isAttacking) {
        this.u8.adhd.decay(this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y));
        this.lastUnitAttackedMS = this.elapsed;
      }
    });

    this.events.on("frame-reset", () => {
      this.#reset();
      this.u8.clear();
    });

    this.events.on("selected-units-changed", (units) => {
      if (!this.config.autoSelectUnits && units.length) {
        // this.gridCameraFatigue += 3000;
        // this.trackingCameraFatigue += 500;
      }
    });
  }

  // adjust (detract) camera fatigue based on recent action
  adjustCameraFatigueBasedOnRecentAction(unit: Unit, distanceFactor: number) {
    if (
      this.elapsed > this.cameraFatigueAdjustmentTimeoutMS + 25 &&
      this.activeQuadrant
    ) {
      // if action is happening across the map, decrease camera fatigue
      const dist = this.pxToWorld
        .xyz(unit.x, unit.y, _a3)
        .distanceTo(this.viewport.orbit.getTarget(_b3));
      let adjustment = -dist * 2;

      const delta =
        this.u8.action.get(
          this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y)
        ) - this.u8.action.get(this.activeQuadrant);
      // we tweak the magnitude by how much there is a score difference
      if (delta > 0) {
        adjustment = -dist * distanceFactor * delta;
      }
      this.gridCameraFatigue += adjustment;
      this.cameraFatigueAdjustmentTimeoutMS = this.elapsed;
    }
  }

  onExitScene() {
    this.events.dispose();
    this.openBW.setGameSpeed(1);

    this.settings.input.dampingFactor.reset();

    if (this.config.autoSelectUnits) {
      this.selectedUnits.clear();
    }

    this.openBW.setGameSpeed(1);

    return {
      target: this.targets.moveTarget.clone(),
      position: this.viewport.orbit.getPosition(_a3).clone(),
    };
  }

  onConfigChanged(oldConfig: Record<string, unknown>): void {
    this.secondViewport.height = this.config.pipSize;
    this.u8.adhd.defaultDecay = this.config.heatMapDecay;
    this.viewport.orbit.minPolarAngle =
      POLAR_MIN + THREE.MathUtils.degToRad(this.config.tilt);

    this.#targetObject.visible = this.config.showDebug;
    this.#targetObject2.visible = this.config.showDebug;
  }

  onTick(delta: number) {
    this.targets.update();

    this.gridCameraFatigue -= delta;
    this.trackingCameraFatigue -= delta;

    if (
      this.elapsed < this.lastUnitAttackedMS + 500 / this.openBW.gameSpeed ||
      this.elapsed < this.lastUnitDestroyedMS + 3_000 / this.openBW.gameSpeed
    ) {
      this.targetGameSpeed = this.config.minReplaySpeed;
      this.lastTimeGameStartedActionMS = this.elapsed;
    } else {
      this.targetGameSpeed = THREE.MathUtils.damp(
        this.targetGameSpeed,
        this.config.maxReplaySpeed,
        0.1,
        delta / 1000
      );
      this.lastTimeGameStartedLullMS = this.elapsed;
    }

    this.secondViewport.enabled =
      this.secondViewport.enabled &&
      !areProximateViewports(this.viewport, this.secondViewport);

    if (
      this.elapsed - this.lastDecayUpdateMS >
      this.config.heatmapUpdateInterval
    ) {
      this.u8.adhd.decayAll();
      this.lastDecayUpdateMS = this.elapsed;
    }
  }

  #updateStrategy() {
    if (this.strategyQueue.length === 0) {
      for (const q of this.u8.units.grid) {
        for (const unit of q.value) {
          if (unit.extras.dat.isBuilding) {
            this.strategyQueue.push(unit as AO_Unit);
            (unit as AO_Unit).extras.ao_timeOnStrategyQueueMS =
              this.elapsed;
          }
        }
      }
    }

    const hasMultipleOwners = this.strategyQueue.some(
      (u) => u.owner !== this.strategyQueue[0].owner
    );

    // 30s lifespan
    this.strategyQueue = this.strategyQueue.filter(
      (u) =>
        this.elapsed -
          (u as AO_Unit).extras.ao_timeOnStrategyQueueMS <
        30_000
    );

    this.strategyQueue.sort((a, b) => {
      // we want to alternate owners
      if (hasMultipleOwners) {
        if (a.owner !== this.lastSelectedStrategyOwner) {
          return -1;
        }
        if (b.owner !== this.lastSelectedStrategyOwner) {
          return 1;
        }
      }

      const tensionA = this.u8.tension.get(
        this.u8.pxGrid.fromWorldToGrid(_a2, a.x, a.y)
      );
      const tensionB = this.u8.tension.get(
        this.u8.pxGrid.fromWorldToGrid(_a2, b.x, b.y)
      );

      if (isTownCenter(a) && isTownCenter(b) && tensionA && tensionB) {
        return tensionB - tensionA;
      }
      if (isTownCenter(a) && tensionA > 0) return -1;
      if (isTownCenter(b) && tensionB > 0) return 1;

      // incomplete buildings take precedence
      if (!unitIsCompleted(a) && unitIsCompleted(b)) return -1;
      if (unitIsCompleted(a) && !unitIsCompleted(b)) return 1;

      // buildings just started or nearing completion
      if (!unitIsCompleted(a) && !unitIsCompleted(b)) {
        // if one near completion, and the other just starting, pick near completion
        if (
          a.remainingBuildTime / a.extras.dat.buildTime < 0.5 &&
          b.remainingBuildTime / b.extras.dat.buildTime > 0.5
        )
          return -1;
        if (
          b.remainingBuildTime / b.extras.dat.buildTime < 0.5 &&
          a.remainingBuildTime / a.extras.dat.buildTime > 0.5
        )
          return 1;
      }

      const biggerElapses = Math.max(
        (a as AO_Unit).extras.ao_timeOnStrategyQueueMS,
        (b as AO_Unit).extras.ao_timeOnStrategyQueueMS
      );
      const elapsedAWeight =
        1 -
        (a as AO_Unit).extras.ao_timeOnStrategyQueueMS /
          biggerElapses;
      const elapsedBWeight =
        1 -
        (b as AO_Unit).extras.ao_timeOnStrategyQueueMS /
          biggerElapses;

      // todo:many buildings that are training (macro)
      return (
        this.unitScore(b) * elapsedBWeight - this.unitScore(a) * elapsedAWeight
      );
    });

    if (this.strategyQueue.length > 10) {
      this.strategyQueue.length = 10;
    }
  }

  #updateScores() {
    let maxScore = 0;

    for (const quadrant of this.u8.units.grid) {
      let sumScore = 0;

      for (const unit of quadrant.value) {
        const unitScore = this.unitScore(unit);
        sumScore += unitScore;

        (unit as AO_Unit).extras.ao_score = unitScore;
      }

      this.u8.action.set(quadrant, sumScore);

      if (sumScore > maxScore) {
        maxScore = sumScore;
      }

      const building = quadrant.value.find((u) =>
        this.strategyQueue.includes(u)
      );
      const buildingQ = building
        ? 1 - this.strategyQueue.indexOf(building) / this.strategyQueue.length
        : 0;
      this.u8.strategy.set(quadrant, buildingQ);
    }

    // normalize scores
    for (const quadrant of this.u8.units.grid) {
      this.u8.action.set(quadrant, maxScore === 0 ? 0 : this.u8.action.get(quadrant) / maxScore);
    }
  }

  #updateTension() {
    for (const quadrant of this.u8.units.grid) {
      const _teams = new Array(8).fill(0);
      for (const unit of quadrant.value) {
        const unitScore = this.unitScore(unit);
        _teams[unit.owner] += unitScore;
      }

      const tension = calcCoeff(_teams.filter((_, i) => this.players.get(i)));
      this.u8.tension.set(quadrant, tension);

      this.t5.world8.fromWorldToGrid(_a2, quadrant.x, quadrant.y);
      this.t5.prevTension.$get(_a2).value.push(tension);

      if (this.t5.prevTension.$get(_a2).value.length > 10) {
        this.t5.prevTension.$get(_a2).value.shift();
      }
    }

    let _tensionI = 0,
      tc = 0;

    for (const g of this.t5.prevTension.grid) {
      const tensionStd = standardDeviation(this.t5.prevTension.get(g));
      this.t5.tension.set(g, tensionStd);

      if (tensionStd === 0) continue;

      this.viewport.orbit.getTarget(_c3);
      this.t5.worldGrid.fromGridToWorld(_a2, g.x, g.y);
      _a3.set(_a2.x, 0, _a2.y);

      const d = normalizeWorldDistance(_a3, _c3, this.#maxDistance / 2);

      _tensionI += tensionStd * d;
      tc++;
    }

    if (tc === 0) return 0;

    return _tensionI / tc;
  }

  #sortedQuadrants = new Array<Quadrant>();

  #calcWeighted(quadrant: Quadrant) {
    const scoreQ = this.u8.action.get(quadrant);
    const adhdQ = 1 - this.u8.adhd.get(quadrant);

    this.t5.world8.fromWorldToGrid(_a2, quadrant.x, quadrant.y);

    const tensionQ = this.t5.tension.get(_a2); //this.u8.tension.get(quadrant) * this.config.weightsTension;
    const buildingQ = this.u8.strategy.get(quadrant);

    const gameLullQ =
      (1 +
        Math.sin(
          (this.lastTimeGameStartedActionMS - this.lastTimeGameStartedLullMS) /
            1000
        )) /
      2;

    // trying adhd against unit score only rn
    const weightedScore =
      scoreQ * gameLullQ * adhdQ + buildingQ * (1 - gameLullQ) + tensionQ;
    this.u8.wScore.set(quadrant, weightedScore);

    return weightedScore;
  }

  #sortQuadrantsByScores() {
    for (let q = 0; q < this.u8.units.grid.length; q++) {
      this.#sortedQuadrants[q] = this.u8.units.grid[q];
    }

    this.#sortedQuadrants.sort((a, b) => {
      if (a.value.length === 0) return 1;
      if (b.value.length === 0) return -1;

      return this.#calcWeighted(b) - this.#calcWeighted(a);
    });
  }

  #tensionI = 0;

  onFrame(frame: number): void {
    if (this.config.showDebug) {
      this.sendUIMessage({
        speed: this.openBW.gameSpeed,
        targetSpeed: this.targetGameSpeed,

        state: {
          cameraFatigue: this.gridCameraFatigue,
          cameraFatigue2: this.trackingCameraFatigue,
          elapsed: this.elapsed,
          frame,
          lastTimeGameStartedLullMS: this.lastTimeGameStartedLullMS,
          lastTimeGameStartedActionMS: this.lastTimeGameStartedActionMS,
        },
        data: {
          size: this.u8.units.size,
          quadrants: this.u8.units.grid.map((q) => {
            return {
              active: q === this.activeQuadrant,
              x: q.x,
              y: q.y,
              score: this.u8.action.get(q),
              units: q.value.length,
              adhd: this.u8.adhd.get(q),
              tension: this.u8.tension.get(q),
              strategy: this.u8.strategy.get(q),
              wScore: this.u8.wScore.get(q),
            };
          }),
        },
      });
    }

    if (this.gridCameraFatigue < 0 || this.trackingCameraFatigue < 0) {
      this.#tensionI = this.#updateTension();

      if (this.gridCameraFatigue) {
        this.gridCameraFatigue -= this.#tensionI * 1000;
      }
    }

    // update to a new grid area of focus, 1 second minimum between updates
    // it should rarely happen that fatigue drops that fast though
    if (
      this.gridCameraFatigue < 0 &&
      this.elapsed > this.lastActiveQuadrantUpdateMS + 1000
    ) {
      // update scores
      this.#updateStrategy();
      this.#updateScores();
      this.#sortQuadrantsByScores();

      const quadrant = this.#sortedQuadrants[0];

      this.viewport.orbit.getTarget(_c3);

      const moveToUnits = quadrant.value.filter(this.uf_NonHarvesting);

      if (moveToUnits.length) {
        const {
          centroids: { a: clA, b: clB },
          clusters: { a: clAUnits, b: clBUnits },
        } = getClusters(this, moveToUnits);

        // if we're far enough away we'll switch focus to the new targets
        // otherwise, let tracking camera continue to handle it
        if (clA.distanceTo(_c3) > 10) {
          // pick higher score cluster
          const scoreA = clAUnits.reduce(lowHealthUnitScoreReducer, 0);
          const scoreB = clBUnits.reduce(lowHealthUnitScoreReducer, 0);

          const cl = scoreA > scoreB ? clA : clB;
          const clU = scoreA > scoreB ? clAUnits : clBUnits;

          const movement = getAverageUnitDirectionAndSpeed(clU);
          moveVectorByAngleAndMagnitude(
            _a3.copy(cl),
            movement.angle,
            movement.speed
          );

          this.targets.moveTarget.copy(_a3.lerp(cl, 0.5));
          this.targets.lookAtMoveTarget();
        }

        if (this.config.showDebug) {
          this.#targetObject.position.copy(clA);
          this.#targetObject2.position.copy(clB);
          this.#targetObject.updateMatrix();
          this.#targetObject.updateMatrixWorld();
          this.#targetObject2.updateMatrix();
          this.#targetObject2.updateMatrixWorld();
        }
      }

      const lowUnitCountPenalty =
        (1 - clamp(quadrant.value.length / 5, 0, 1)) * 4000;

      this.gridCameraFatigue =
        4000 / this.openBW.gameSpeed +
        this.targets.moveTarget.distanceTo(_c3) * 50 -
        lowUnitCountPenalty;
      this.trackingCameraFatigue = 500 / this.openBW.gameSpeed;

      this.targets.adjustDollyToUnitSpread(quadrant.value);

      this.lastActiveQuadrantUpdateMS = this.elapsed;

      this.u8.adhd.set(quadrant, 1);
      this.activeQuadrant = quadrant;

      // strategy buildings that exist in this quadrant
      const buildings = quadrant.value.filter((u) =>
        this.strategyQueue.includes(u)
      );
      if (buildings.length) {
        // remove them from the strategy queue
        this.strategyQueue = this.strategyQueue.filter(
          (u) => !buildings.includes(u)
        );
        this.lastSelectedStrategyOwner = buildings[0].owner ?? -1;
        this.timeSinceLastStrategySelectionMS = this.elapsed;
      }
      // keep moving focus to nearby stuff to keep the camera active
    } else if (this.trackingCameraFatigue < 0) {
      this.viewport.orbit.getTarget(_c3);
      const quadrant = this.u8.worldGrid.fromWorldToGrid(_a2, _c3.x, _c3.z);

      const nearbyUnits = getUnitsNearCluster(
        this,
        this.u8.units.getNearbyList(_unitClusterA, quadrant, 1).flat(),
        _c3,
        10
      ).filter(this.uf_NonHarvesting);

      const moveToUnits = nearbyUnits;
      if (moveToUnits.length) {
        const {
          centroids: { a: clA, b: clB },
          clusters: { a: clAUnits, b: clBUnits },
        } = getClusters(this, moveToUnits);

        const nearA = 1 - normalizeWorldDistance(clA, _c3, 10);
        const nearB = 1 - normalizeWorldDistance(clB, _c3, 10);

        const mvmtA = getAverageUnitDirectionAndSpeed(clAUnits);
        const mvmtB = getAverageUnitDirectionAndSpeed(clBUnits);

        const scoreA = clAUnits.reduce(unitScoreReducer, 0);
        const scoreB = clBUnits.reduce(unitScoreReducer, 0);
        const maxScore = Math.max(scoreA, scoreB);

        const weightA =
          (scoreA / maxScore) * nearA + constrain(mvmtA.speed, 0, 10) * 2;
        const weightB =
          (scoreB / maxScore) * nearB + constrain(mvmtB.speed, 0, 10) * 2;

        const cl = weightA > weightB ? clA : clB;
        const clU = weightA > weightB ? clAUnits : clBUnits;
        const clOther = weightA > weightB ? clB : clA;

        const units = getUnitsFromLargestRepresentedTeam(clU);
        const movement = getAverageUnitDirectionAndSpeed(units);
        moveVectorByAngleAndMagnitude(
          _a3.copy(cl),
          movement.angle,
          movement.speed
        );

        // if there is tension, bias towards inbetween clusters
        _a3.lerp(clOther, this.u8.tension.get(quadrant) * 0.5);

        this.targets.moveTarget.copy(_a3);

        // 1 = low speed, 0 = high speed
        const speedFactor = 1 - clamp(movement.speed, 0, 10) / 10;

        // 1 = far distance, 0 = close distance
        const d = clamp(_a3.distanceTo(_c3), 1, 10) / 10;
        // farther we are from target, the faster we move
        const d2 = 1 + 4 * (1 - d) + speedFactor * 2;
        this.targets.lookAtMoveTarget(d2 / this.openBW.gameSpeed, "smooth");
        // if we are moving quickly, add to main camera so we dont jump cut mid move
        // temper it by tension, higher tension means we don't delay fatigue as much
        this.gridCameraFatigue +=
          (easeIn(d, 3) * 1000 * (1 - this.#tensionI)) / this.openBW.gameSpeed;

        // debug only
        this.#targetObject.position.copy(cl);
        this.#targetObject2.position.copy(_a3);
        this.#targetObject.updateMatrix();
        this.#targetObject.updateMatrixWorld();
        this.#targetObject2.updateMatrix();
        this.#targetObject2.updateMatrixWorld();

        const lowSpeedBoost = speedFactor * 400;

        this.trackingCameraFatigue =
          300 / this.openBW.gameSpeed +
          this.targets.moveTarget.distanceTo(_c3) * 20 +
          lowSpeedBoost;
      }
    }

    if (this.frame < 30 * 24) {
      this.targetGameSpeed = this.config.minReplaySpeed;
    }

    this.u8.units.clear();
  }

  /**
   * Manual user minimap drag
   */
  onMinimapDragUpdate(
    pos: THREE.Vector2,
    isDragStart: boolean,
    mouseButton: number
  ) {
    const viewportsAreProximate = areProximateViewports(
      this.viewport,
      this.secondViewport
    );

    if (mouseButton === 0) {
      this.viewport.orbit.getTarget(_c3);
      const target = _a3.set(pos.x, 0, pos.y).clone();
      this.targets.moveTarget.copy(target);
      this.targets.lookAtMoveTarget(undefined, isDragStart ? "cut" : "smooth");
      this.gridCameraFatigue = 8000;
      this.trackingCameraFatigue = 200;

      this.activeQuadrant = this.u8.units.$get(
        this.u8.worldGrid.fromWorldToGrid(_a2, pos.x, pos.y)
      );

      if (this.secondViewport.enabled) {
        this.secondViewport.enabled = !viewportsAreProximate;
      } else {
        this.secondViewport.orbit.moveTo(-10000, 0, 0, false);
      }
    } else if (mouseButton === 2) {
      _a3.set(pos.x, 0, pos.y);

      const isProximateToPrevious = areProximate(
        _a3,
        groundTarget(this.secondViewport, _b3),
        PIP_PROXIMITY
      );

      if (isDragStart) {
        if (this.secondViewport.enabled) {
          this.secondViewport.enabled =
            !viewportsAreProximate && isProximateToPrevious;
        } else {
          this.secondViewport.enabled = !viewportsAreProximate;
        }
      } else {
        this.secondViewport.enabled =
          !viewportsAreProximate && isProximateToPrevious;
      }

      if (this.secondViewport.enabled) {
        this.secondViewport.orbit.moveTo(pos.x, 0, pos.y, !isDragStart);
      } else {
        this.secondViewport.orbit.moveTo(-10000, 0, 0, false);
      }
    }
  }

  /**
   * Manual user wheel scroll
   */
  onCameraMouseUpdate(_: number, __: number, scrollY: number) {
    if (scrollY) {
      if (scrollY < 0) {
        this.targets.dollyTarget -= 20;
        this.viewport.orbit.dolly(-20, true);
      } else {
        this.targets.dollyTarget += 20;
        this.viewport.orbit.dolly(20, true);
      }
    }
  }

  uf_NonHarvesting = (unit: Unit) => {
    if (unit.extras.dat.isBuilding) {
      return false;
    }
    if (isWorkerUnit(unit) && isHarvesting(unit)) {
      return false;
    }
    return true;
  };

  uf_Building = (unit: Unit) => unit.extras.dat.isBuilding;
}
