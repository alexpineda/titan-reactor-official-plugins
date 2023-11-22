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
  isHarvesting,
  isTownCenter,
  isWorkerUnit,
  unitIsCompleted,
} from "./utils/unit-helpers";
import { PIP_PROXIMITY, POLAR_MIN, QUAD_SIZE } from "./utils/constants";
import { CameraTargets } from "./camera-targets";
import { calcCoeff, easeInSine } from "./utils/math-utils";
import { buildingUnitRanks, regularOrderRanks, regularUnitRanks } from "./unit-interest/rankings";

import { createNoise2D } from "simplex-noise";
import alea from "alea";
import { ScoreManager } from "./scores";
import { createUnitScoreCalculator } from "./unit-interest/unit-score-calculator";

const _a4 = new THREE.Vector4(0, 0, 0, 0);
const _b4 = new THREE.Vector4(0, 0, 0, 0);

const _a3 = new THREE.Vector3(0, 0, 0);
const _b3 = new THREE.Vector3(0, 0, 0);
const _c3 = new THREE.Vector3(0, 0, 0);

const _a2 = new THREE.Vector2(0, 0);
const _b2 = new THREE.Vector2(0, 0);
const _c2 = new THREE.Vector2(0, 0);

const unitOfInterest = (unit: Unit) => !unit.extras.dat.isResourceContainer &&
unit.owner < 8 &&
canSelectUnit(unit);

export default class PluginAddon extends SceneController {
  viewportsCount = 2;

  u8!: ScoreManager;
  targets!: CameraTargets;
  unitScore = createUnitScoreCalculator({
    unitRanks: [buildingUnitRanks.flat(), ...regularUnitRanks],
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
  cameraFatigue = 0;
  cameraFatigue2 = 0;
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
    this.strategyQueue.length = 0;

    this.lastActiveQuadrantUpdateMS = 0;
    this.lastSecondaryActiveQuadrantUpdateMS = 0;
    this.lastDecayUpdateMS = 0;
    this.lastUnitDestroyedMS = 0;
    this.lastUnitAttackedMS = 0;
    this.lastTimeGameStartedActionMS = 0;
    this.lastTimeGameStartedLullMS = 0;

    this.cameraFatigue = 0;
    this.cameraFatigue2 = 0;

    this.activeQuadrant = undefined;
    this.targetGameSpeed = 1;

  }

  public async onEnterScene(prevData: PrevSceneData) {
    this.targets = new CameraTargets(this);

    this.targets.setMoveTargets([prevData.target]);

    this.parent.add(this.#targetObject);
    this.parent.add(this.#targetObject2);

    this.u8 = new ScoreManager(QUAD_SIZE, this.map.size);

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

        this.adjustCameraFatigueBasedOnRecentAction(unit, 2, 3);
      },
      -1
    );

    this.events.on("unit-destroyed", (unit) => {
      this.strategyQueue = this.strategyQueue.filter((u) => u.id !== unit.id);
    });

    this.events.on("unit-created", (unit) => {
      // reset metadata
      (unit as AO_Unit).extras.autoObserver = {
        score: 0,
        timeOnStrategyQueueMS: 0,
      }

      if (
        unitOfInterest(unit) &&
        unit.extras.dat.isBuilding
      ) {
        this.strategyQueue.push(unit as AO_Unit);
        (unit as AO_Unit).extras.autoObserver.timeOnStrategyQueueMS = this.elapsed;
      }

      
    });


    this.events.on("unit-updated", (unit: Unit) => {
      // add selectable player owned non-building units to quadtree
      if (
        unitOfInterest(unit)
      ) {
        // add unit to grid - fyi this grid is cleared every frame
        this.u8.units.$get(
          this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y),
        ).value.push(unit as AO_Unit);
      }

      if (unit.extras.recievingDamage) {
        this.u8.adhd.decay(this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y));

        if (!canOnlySelectOne(unit) && this.config.autoSelectUnits) {
          this.selectedUnits.add(unit);
        }

        this.adjustCameraFatigueBasedOnRecentAction(unit, 2, 3);

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
        this.cameraFatigue += 3000;
        this.cameraFatigue2 += 500;
      }
    });

  }

  // adjust (detract) camera fatigue based on recent action
  adjustCameraFatigueBasedOnRecentAction(unit: Unit, f1: number, f2: number) {
    if (
      this.elapsed > this.cameraFatigueAdjustmentTimeoutMS + 100 &&
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
        adjustment = -dist * (f1 + delta * f2);
      }
      this.cameraFatigue += adjustment;
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

    this.cameraFatigue -= delta;
    this.cameraFatigue2 -= delta;

    if (
      this.elapsed < this.lastUnitAttackedMS + 500 / this.openBW.gameSpeed ||
      this.elapsed < this.lastUnitDestroyedMS + 3_000 / this.openBW.gameSpeed
    ) {
      this.targetGameSpeed = 1;
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
      for (const unit of this.units) {
        if (unit.extras.dat.isBuilding) {
          this.strategyQueue.push(unit as AO_Unit);
          (unit as AO_Unit).extras.autoObserver.timeOnStrategyQueueMS = this.elapsed;
        }
      }
    }

    const hasMultipleOwners = this.strategyQueue.some(
      (u) => u.owner !== this.strategyQueue[0].owner
    );

    // 30s lifespan
    this.strategyQueue = this.strategyQueue.filter((u) => this.elapsed - (u as AO_Unit).extras.autoObserver.timeOnStrategyQueueMS < 30_000);

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

      const biggerElapses = Math.max((a as AO_Unit).extras.autoObserver.timeOnStrategyQueueMS, (b as AO_Unit).extras.autoObserver.timeOnStrategyQueueMS);
      const elapsedAWeight = 1 - (a as AO_Unit).extras.autoObserver.timeOnStrategyQueueMS / biggerElapses;
      const elapsedBWeight = 1 - (b as AO_Unit).extras.autoObserver.timeOnStrategyQueueMS / biggerElapses;

      // todo:many buildings that are training (macro)
      return this.unitScore(b) * elapsedBWeight - this.unitScore(a) * elapsedAWeight;
    });

    if (this.strategyQueue.length > 10) {
      this.strategyQueue.length = 10;
    }
  }

  #updateScores() {
    let maxScore = 0;

    for (const quadrant of this.u8.units.grid) {
      let sumScore = 0;

      const _teams = new Array(8).fill(0);

      for (const unit of quadrant.value) {
        const unitScore = this.unitScore(unit);
        sumScore += unitScore;

        //todo: if nexus and tension, make it 10
        _teams[unit.owner] += unitScore;

        (unit as AO_Unit).extras.autoObserver.score = unitScore;

      }

      const tension = calcCoeff(_teams.filter((_, i) => this.players.get(i)));
      this.u8.action.set(quadrant, sumScore);
      this.u8.tension.set(quadrant, tension);

      if (sumScore > maxScore) {
        maxScore = sumScore;
      }

      const building = quadrant.value.find(u => this.strategyQueue.includes(u));
      const buildingQ = building ?  1 - this.strategyQueue.indexOf(building) / this.strategyQueue.length : 0;
      this.u8.strategy.set(quadrant, buildingQ);
    }

    // normalize scores
    for (const quadrant of this.u8.units.grid) {
      this.u8.action.set(quadrant, this.u8.action.get(quadrant) / maxScore);
    }
  }

  #sortedQuadrants = new Array<Quadrant>();

  #calcWeighted( quadrant: Quadrant ) {
    const scoreQ = this.u8.action.get(quadrant);
    const adhdQ = (1 - this.u8.adhd.get(quadrant)) * this.config.weightsADHD;
    const tensionQ = this.u8.tension.get(quadrant) * this.config.weightsTension;
    const buildingQ = this.u8.strategy.get(quadrant) * this.config.weightsStrategy

    const gameLullQ = (1 + Math.sin((this.lastTimeGameStartedActionMS - this.lastTimeGameStartedLullMS) / 1000)) / 2;

    // trying adhd against unit score only rn
    const weightedScore = (scoreQ * gameLullQ * adhdQ + buildingQ * ( 1 - gameLullQ ) + tensionQ);
    this.u8.wScore.set(quadrant, weightedScore)
    return weightedScore;

  }

  #sortQuadrantsByScores() {

    for (let q = 0; q < this.u8.units.grid.length; q++) {
      this.#sortedQuadrants[q] = this.u8.units.grid[q];
    }

    this.#sortedQuadrants.sort((a, b) => {
      if (a.value.length === 0) return 1;
      if (b.value.length === 0) return -1;

      return this.#calcWeighted( b ) - this.#calcWeighted( a );

    });

  }

  onFrame(frame: number): void {

    if (this.config.showDebug) {
      this.sendUIMessage({
        speed: this.openBW.gameSpeed,
        targetSpeed: this.targetGameSpeed,

        state: {
          cameraFatigue: this.cameraFatigue,
          cameraFatigue2: this.cameraFatigue2,
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

    if (
      this.cameraFatigue < 0
    ) {
      // update scores
      this.#updateStrategy();
      this.#updateScores();
      this.#sortQuadrantsByScores();
      
      const quadrant = this.#sortedQuadrants[0];

      this.viewport.orbit.getTarget(_c3);

      // activate quadrant
      const moveToUnits = quadrant.value.filter(this.uf_NonHarvesting);
      // sometimes in strategy moveToUnits is empty, figure out why bruh
      const t = this.targets.moveToUnits(
        moveToUnits.length > 0 ? moveToUnits : quadrant.value
      );

      this.#targetObject.position.copy(t[0]);
      this.#targetObject2.position.copy(t[1]);
      this.#targetObject.updateMatrix();
      this.#targetObject.updateMatrixWorld();
      this.#targetObject2.updateMatrix();
      this.#targetObject2.updateMatrixWorld();

      this.cameraFatigue =
        4000 / this.openBW.gameSpeed +
        this.targets.moveTarget.distanceTo(_c3) * 50 +
        4_000 * (1 - Math.min(1, frame / 4000));
      this.cameraFatigue2 = 500 / this.openBW.gameSpeed;

      this.targets.adjustDollyToUnitSpread(quadrant.value);

      this.lastActiveQuadrantUpdateMS = this.elapsed;

      this.u8.adhd.set(quadrant, 1);
      this.activeQuadrant = quadrant;

      // strategy buildings that exist in this quadrant
      const buildings = quadrant.value.filter(u => this.strategyQueue.includes(u));
      if (buildings.length) {
        // remove them from the strategy queue
        this.strategyQueue = this.strategyQueue.filter(u => !buildings.includes(u));
        this.lastSelectedStrategyOwner = buildings[0].owner ?? -1;
        this.timeSinceLastStrategySelectionMS = this.elapsed;
      }

    } else if (
      this.cameraFatigue2 < 0
    ) {
        // keep moving focus to nearby stuff to keep the camera active
        this.viewport.orbit.getTarget(_c3);
        this.u8.worldGrid.fromWorldToGrid(_a2, _c3.x, _c3.z);

        const nearbyUnits = this.u8.units.getNearbyList([], _a2, 1).flat();

        // this observer has a different set of requirements
        // we are more interested in moving units if there are any
        // however if we are looking at a base, we should be more interested in buildings

        // bug: for buildings maxScore is 0 many times when it shouldnt be
        // not such a big deal since this is more important for units anyway
        const maxScore = Math.max(...nearbyUnits.map(unit => unit.extras.autoObserver.score));

        // move to nearby units, focusing on more important ones (usually moving / attacking = greater score)
        const moveToUnits = nearbyUnits.filter(unit => {
          return this.uf_NonHarvesting(unit) && (maxScore === 0 ||  unit.extras.autoObserver.score > maxScore * 0.25);
        });
          

        if (moveToUnits.length) {
          const t = this.targets.moveToUnits(
            moveToUnits,
            5,
            "smooth"
          );

          if (this.config.showDebug) {
            // this.#targetObject.position.copy(t[0]);
            // this.#targetObject2.position.copy(t[1]);
            // this.#targetObject.updateMatrix();
            // this.#targetObject.updateMatrixWorld();
            // this.#targetObject2.updateMatrix();
            // this.#targetObject2.updateMatrixWorld();
          }

          this.cameraFatigue2 =
            300 / this.openBW.gameSpeed +
            this.targets.moveTarget.distanceTo(_c3) * 20;
        }
    }

    if (this.frame < 30 * 24) {
      this.targetGameSpeed = 1;
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
      this.targets.setMoveTargets(
        [target, target],
        undefined,
        isDragStart ? "cut" : "smooth"
      );
      this.cameraFatigue = 8000;
      this.cameraFatigue2 = 200;

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
