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
import { calcCoeff } from "./utils/math-utils";
import { SecondView } from "./second-view";
import { buildingUnitRanks, regularOrderRanks, regularUnitRanks } from "./unit-interest/rankings";

import { createNoise2D } from "simplex-noise";
import alea from "alea";
import { ScoreManager } from "./scores";
import { createUnitScoreCalculator } from "./unit-interest/unit-score-calculator";
import { GridValue } from "./structures/grid-values";

const _a3 = new THREE.Vector3(0, 0, 0);
const _b3 = new THREE.Vector3(0, 0, 0);
const _c3 = new THREE.Vector3(0, 0, 0);

const _a2 = new THREE.Vector2(0, 0);
const _b2 = new THREE.Vector2(0, 0);
const _c2 = new THREE.Vector2(0, 0);

export default class PluginAddon extends SceneController {
  viewportsCount = 2;

  u8!: ScoreManager;
  targets!: CameraTargets;
  secondView!: SecondView;
  unitScore = createUnitScoreCalculator({
    unitRanks: regularUnitRanks,
    unitRankCurve: (t) => t,
    orderRanks: regularOrderRanks,
    orderRankCurve: (t) => t,
  });
  buildingScore = createUnitScoreCalculator({
    unitRanks: buildingUnitRanks,
    unitRankCurve: (t) => t,
    orderRanks: regularOrderRanks,
    orderRankCurve: (t) => t,
  });
  strategyFocusNoise2D = createNoise2D(alea("strategy-focus"));
  strategyQueue: Unit[] = [];
  lastSelectedStrategyOwner = -1;
  timeSinceLastStrategySelectionMS = 0;

  lastActiveQuadrantUpdateMS = 0;
  lastSecondaryActiveQuadrantUpdateMS = 0;
  lastSelectionWeight: "unit" | "tension" | "strategy" = "unit";

  lastDecayUpdateMS = 0;
  lastUnitDestroyedMS = 0;
  lastUnitAttackedMS = 0;

  targetGameSpeed = 1;
  gameIsLulled = true;
  lastTimeGameWasLulledMS = 0;
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

  onUIMessage(message: any): void {
    if (message.type === "close-intro") {
      this.saveConfigProperty("showIntro", false);
    }
  }

  #reset() {
    this.secondView.reset();
    this.u8.clear();
    this.strategyQueue.length = 0;

    this.lastActiveQuadrantUpdateMS = 0;
    this.lastSecondaryActiveQuadrantUpdateMS = 0;
    this.lastDecayUpdateMS = 0;
    this.lastUnitDestroyedMS = 0;
    this.lastUnitAttackedMS = 0;

    this.cameraFatigue = 0;
    this.cameraFatigue2 = 0;

    this.activeQuadrant = undefined;
    this.gameIsLulled = true;
    this.targetGameSpeed = 1;

    this.lastSelectionWeight = "unit";
  }

  public async onEnterScene(prevData: PrevSceneData) {
    this.secondView = new SecondView(this);
    this.targets = new CameraTargets(this);

    this.targets.setMoveTargets([prevData.target]);

    this.parent.add(this.#targetObject);
    this.parent.add(this.#targetObject2);

    this.u8 = new ScoreManager(QUAD_SIZE, this.map.size);

    this.#reset();

    await setupViewports(this);

    /**
     * reset adhd if unit is killed
     */
    this.events.on(
      "unit-killed",
      (unit) => {
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
      this.secondView.onUnitDestroyed(unit);
      this.strategyQueue = this.strategyQueue.filter((u) => u.id !== unit.id);
    });

    this.events.on("unit-created", (unit) => {
      (unit as AO_Unit).extras.autoObserver = {
        score: 0,
        timeOnStrategyQueueMS: 0,
      }

      if (
        !unit.extras.dat.isResourceContainer &&
        unit.owner < 8 &&
        unit.extras.dat.isBuilding
      ) {
        this.strategyQueue.push(unit);
        (unit as AO_Unit).extras.autoObserver.timeOnStrategyQueueMS = this.elapsed;
      }

      
    });

    /**
     * add units to quadtree
     * add units to selected units if taking damage
     * decay adhd if attacking or taking damage
     */
    this.events.on("unit-updated", (unit: Unit) => {
      const unitType = this.assets.bwDat.units[unit.typeId];

      // add selectable player owned non-building units to quadtree
      if (
        !unitType.isResourceContainer &&
        unit.owner < 8 &&
        canSelectUnit(unit)
      ) {
        this.u8.units.$get(
          this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y),
        ).value.push(unit as AO_Unit);
      }
      if (unit.extras.recievingDamage) {
        this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y);
        this.u8.adhd.decay(_a2.x, _a2.y);

        if (!canOnlySelectOne(unit) && this.config.autoSelectUnits) {
          this.selectedUnits.add(unit);
        }

        this.adjustCameraFatigueBasedOnRecentAction(unit, 2, 3);

        // this.cameraFatigue -= dist;
      } else if (this.config.autoSelectUnits) {
        this.selectedUnits.delete(unit);
      }

      if (unit.isAttacking) {
        this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y);
        this.u8.adhd.decay(_a2.x, _a2.y);
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
  }

  onTick(delta: number) {
    this.targets.update();
    this.secondView.onTick();

    this.cameraFatigue -= delta;
    this.cameraFatigue2 -= delta;

    if (
      this.elapsed < this.lastUnitAttackedMS + 500 / this.openBW.gameSpeed ||
      this.elapsed < this.lastUnitDestroyedMS + 3_000 / this.openBW.gameSpeed
    ) {
      this.targetGameSpeed = 1;
      this.gameIsLulled = false;
      this.lastTimeGameWasLulledMS = this.elapsed;
    } else {
      this.targetGameSpeed = THREE.MathUtils.damp(
        this.targetGameSpeed,
        this.config.maxReplaySpeed,
        0.1,
        delta / 1000
      );
      this.gameIsLulled = true;
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

  #updateScores() {
    let maxScore = 0;
    for (const quadrant of this.u8.units.grid) {
      let sumScore = 0;

      // use surrounding quadrants to calculate score
      const _teams = new Array(8).fill(0);
      // for (const unit of quadrant.items) {
      for (const unit of quadrant.value.flat()) {
        //this.u8.units.getNearby( quadrant, 1 )) {
        const unitScore = this.unitScore(unit);
        sumScore += unitScore;

        if (unit.extras.dat.isBuilding) {
          _teams[unit.owner]++;
        }

        (unit as AO_Unit).extras.autoObserver.score = unit.extras.dat.isBuilding ? this.buildingScore(unit) : unitScore;

      }

      const tension = calcCoeff(_teams.filter((_, i) => this.players.get(i)));
      this.u8.action.set(quadrant, sumScore);
      this.u8.tension.set(quadrant, tension);

      if (sumScore > maxScore) {
        maxScore = sumScore;
      }
    }

    // normalize scores
    // for (const quadrant of this.u8.units.quadrants) {
    //   this.u8.action.set(quadrant, this.u8.action.get(quadrant) / maxScore);
    // }
  }

  #updateStrategy() {
    if (this.strategyQueue.length === 0) {
      for (const unit of this.units) {
        if (unit.extras.dat.isBuilding) {
          this.strategyQueue.push(unit);
          (unit as AO_Unit).extras.autoObserver.timeOnStrategyQueueMS = this.elapsed;
        }
      }
    }

    const hasMultipleOwners = this.strategyQueue.some(
      (u) => u.owner !== this.strategyQueue[0].owner
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

      // nexus that has tension
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
      return this.buildingScore(b) * elapsedBWeight - this.buildingScore(a) * elapsedAWeight;
    });
  }

  onFrame(frame: number): void {
    const tensionVsStrategy = this.strategyFocusNoise2D(this.frame / 1000, 0);
    let hottestQuadrant: Quadrant | undefined;
    let secondHottestQuadrant: Quadrant | undefined;
    let selectionWeight = this.lastSelectionWeight;

    if (this.config.showDebug) {
      this.sendUIMessage({
        speed: this.openBW.gameSpeed,
        targetSpeed: this.targetGameSpeed,

        state: {
          cameraFatigue: this.cameraFatigue,
          cameraFatigue2: this.cameraFatigue2,
          elapsed: this.elapsed,
          frame,
          tensionVsStrategy,
          gameIsLulled: this.gameIsLulled,
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
            };
          }),
        },
      });
    }

    if (this.cameraFatigue < 0 || this.cameraFatigue2 < 0) {
      // update scores
      this.#updateScores();
      this.#updateStrategy();

      // calculate hottest quadrant
      const gameLullSufficient =
        this.elapsed >
        this.lastTimeGameWasLulledMS + 5_000 / this.openBW.gameSpeed;
      const haventSeenStrategyInAWhile =
        this.elapsed > this.timeSinceLastStrategySelectionMS + 20_000;

      if (
        this.gameIsLulled &&
        (gameLullSufficient || haventSeenStrategyInAWhile)
      ) {
        const building = this.strategyQueue[0];
        if (building) {
          hottestQuadrant = this.u8.units.$get(
            this.u8.pxGrid.fromWorldToGrid(_a2, building.x, building.y)
          );
          selectionWeight = "strategy";
        }
      } else {
        let hottestScore = 0;

        for (const quadrant of this.u8.units.grid) {
          if (quadrant.value.length === 0) continue;

          const score = this.u8.action.get(quadrant);
          const adhdWeight =
            (1 - this.u8.adhd.get(quadrant)) * this.config.weightsADHD;
          const tensionWeight =
            this.u8.tension.get(quadrant) * this.config.weightsTension;

          const weightedScore = (score + tensionWeight) * adhdWeight; //(unitScore + tensionWeight) * adhdWeight;

          // the or is a special case early game where base strategy scores are even
          // typically however interesting quadrants will be quite varying in score ( not even )
          if (weightedScore > hottestScore) {
            hottestScore = weightedScore;
            secondHottestQuadrant = hottestQuadrant;
            hottestQuadrant = quadrant;
            // todo: base off the above criteria
            selectionWeight = "unit";
            // selectionWeight = this.gameIsLulled ? "strategy" : "unit";
          }
        }
      }
    }

    if (
      hottestQuadrant &&
      hottestQuadrant.value.length &&
      this.cameraFatigue < 0
    ) {
      //todo: change selection to next hottest quadrant
      //with factor such as distance and tension
      if (
        this.frame > 10_000 &&
        this.elapsed - this.lastSecondaryActiveQuadrantUpdateMS > 10_000
      ) {
        // this.secondView.activateIfExists(
        //   secondHottestQuadrant,
        //   hottestQuadrant
        // );
        this.lastSecondaryActiveQuadrantUpdateMS = this.elapsed;
      }

      this.viewport.orbit.getTarget(_c3);

      // activate quadrant
      const moveToUnits = hottestQuadrant.value.filter(
        selectionWeight === "strategy"
          ? this.uf_Building
          : this.uf_NonHarvesting
      );
      // sometimes in strategy moveToUnits is empty, figure out why bruh
      const t = this.targets.moveToUnits(
        moveToUnits.length > 0 ? moveToUnits : hottestQuadrant.value
      );
      // this.units8.getNearby(quadrant.x, quadrant.y, 1, false),

      this.lastSelectionWeight = selectionWeight;

      this.#targetObject.position.copy(t[0]);
      this.#targetObject2.position.copy(t[1]);
      this.#targetObject.updateMatrix();
      this.#targetObject.updateMatrixWorld();
      this.#targetObject2.updateMatrix();
      this.#targetObject2.updateMatrixWorld();

      //todo: bias this by game speed a little?
      this.cameraFatigue =
        4000 / this.openBW.gameSpeed +
        this.targets.moveTarget.distanceTo(_c3) * 50 +
        4_000 * (1 - Math.min(1, frame / 4000));
      this.cameraFatigue2 = 500 / this.openBW.gameSpeed;

      this.targets.adjustDollyToUnitSpread(hottestQuadrant.value);

      this.lastActiveQuadrantUpdateMS = this.elapsed;

      this.u8.adhd.set(hottestQuadrant, 1);
      this.activeQuadrant = hottestQuadrant;

      if (selectionWeight === "strategy") {
        const building = this.strategyQueue.shift();
        this.lastSelectedStrategyOwner = building?.owner ?? -1;
        this.timeSinceLastStrategySelectionMS = this.elapsed;
      }
    } else if (
      this.cameraFatigue2 < 0
    ) {
      // if nearby quadrants are hot, stick around
      // activate quadrant
        this.viewport.orbit.getTarget(_c3);
        this.u8.worldGrid.fromWorldToGrid(_a2, _c3.x, _c3.z);

        const nearbyUnits = this.u8.units.getNearbyList([], _a2, 1).flat();

        // bug: for buildings maxScore is 0 many times when it shouldnt be
        // not such a big deal since this is more important for units anyway
        const maxScore = Math.max(...nearbyUnits.map(unit => unit.extras.autoObserver.score));

        // move to nearby units, focusing on more important ones (usually moving / attacking = greater score)
        const moveToUnits = nearbyUnits.filter(unit => {
          const b = this.lastSelectionWeight === "strategy"
          ? this.uf_Building(unit)
          : this.uf_NonHarvesting(unit);

          return b && (maxScore === 0 ||  unit.extras.autoObserver.score > maxScore * 0.25);
        });
          

        if (moveToUnits.length) {
          const t = this.targets.moveToUnits(
            moveToUnits,
            5,
            "smooth"
          );

          this.#targetObject.position.copy(t[0]);
          this.#targetObject2.position.copy(t[1]);
          this.#targetObject.updateMatrix();
          this.#targetObject.updateMatrixWorld();
          this.#targetObject2.updateMatrix();
          this.#targetObject2.updateMatrixWorld();

          //todo: adjust by delta in movetounits as well
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
      this.lastSelectionWeight = "unit";

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
      this.secondView.followedUnit = null;

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
