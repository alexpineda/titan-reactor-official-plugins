import { PrevSceneData, Unit } from "@titan-reactor-runtime/host";
import { Quadrant, ArrayGrid } from "./structures/array-grid";
import { ValueGrid } from "./structures/value-grid";
import { ScoreModifier, UnitAndOrderScoreCalculator } from "./unit-interest/unit-interest-score";
import { areProximate, areProximateViewports, groundTarget, setupViewports } from "./camera-utils";
import { canOnlySelectOne, isHarvesting, isWorkerUnit, unitIsRelevant  } from "./unit-helpers";
import { PIP_PROXIMITY, POLAR_MIN, QUAD_SIZE } from "./constants";
import { CameraTargets } from "./camera-targets";
import {   calcCoeff  } from "./math-utils";
import { SecondView } from "./second-view";
import { DecayMap } from "./structures/decay-map";
import { buildingUnitRanks, regularUnitRanks } from "./unit-interest/unit-ranks";

import { createNoise2D } from "simplex-noise"
import alea from 'alea';
import { ScoreManager } from "./scores";

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
  scoreCalculator!: UnitAndOrderScoreCalculator;
  strategyBuildingCalculator!: UnitAndOrderScoreCalculator;
  strategyFocusNoise2D = createNoise2D(alea("strategy-focus"));

  lastActiveQuadrantUpdateMS = 0;
  lastSecondaryActiveQuadrantUpdateMS = 0;
  lastSelectionWeight: "unit" | "tension" | "strategy" = "unit"

  lastDecayUpdateMS = 0;
  lastUnitDestroyedMS = 0;
  lastUnitAttackedMS = 0;

  targetGameSpeed = 1;
  gameIsLulled = true;
  activeQuadrant: Quadrant<Unit> | undefined;
  cameraFatigue = 0;
  cameraFatigue2 = 0;
  cameraFatigueAdjustmentTimeoutMS = 0;

  #targetObject = new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  )
  #targetObject2 = new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  )


  onUIMessage(message: any): void {
    if (message.type === "close-intro") {
      this.saveConfigProperty("showIntro", false);
    }
  }

  #reset() {
    this.secondView.reset();
    this.u8.clear();

    this.lastActiveQuadrantUpdateMS = 0;
    this.lastDecayUpdateMS = 0;
    this.lastUnitDestroyedMS = 0;
    this.lastUnitAttackedMS = 0;
 
  }

  public async onEnterScene(prevData: PrevSceneData) {
    this.secondView = new SecondView(this);
    this.targets = new CameraTargets(this);

    this.targets.setMoveTargets([prevData.target]);

    this.parent.add(this.#targetObject);
    this.parent.add(this.#targetObject2);


    // this.buildingScoreModifier = (
    //   unit: Unit,
    //   orderScore: number,
    //   unitScore: number
    // ) => {
    //   if (unit.remainingBuildTime) {
    //     return unitScore * (1 - unit.remainingBuildTime);
    //   }
    //   return orderScore * unitScore;
    // };
    this.scoreCalculator = new UnitAndOrderScoreCalculator(
      regularUnitRanks,
    );

    this.strategyBuildingCalculator = new UnitAndOrderScoreCalculator(
      buildingUnitRanks,
    );

    this.u8 = new ScoreManager(QUAD_SIZE, this.map.size);

    this.#reset();

    await setupViewports(this);

    /**
     * reset adhd if unit is killed
     */
    this.events.on(
      "unit-killed",
      (unit) => {
        const pos8 = this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y);
        this.u8.adhd.set(pos8.x, pos8.y, 0);

        this.lastUnitDestroyedMS = this.elapsed;
        
        this.adjustCameraFatigueBasedOnRecentAction(unit, 2, 3);

      },
      -1
    );

    this.events.on("unit-destroyed", (unit) => {
      this.secondView.onUnitDestroyed(unit);
    });

    /**
     * add units to quadtree
     * add units to selected units if taking damage
     * decay adhd if attacking or taking damage
     */
    this.events.on("unit-updated", (unit: Unit) => {

      if (unitIsRelevant(unit, this.assets.bwDat)) {
        const pos8 = this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y);
        this.u8.units.add(pos8.x, pos8.y, unit);
      }
      if (unit.extras.recievingDamage) {
        const pos8 = this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y);
        this.u8.adhd.decay(pos8.x, pos8.y);
        if (!canOnlySelectOne(unit) && this.config.autoSelectUnits) {
          this.selectedUnits.add(unit);
        }

        this.adjustCameraFatigueBasedOnRecentAction(unit, 2, 3);

        // this.cameraFatigue -= dist;
      } else if (this.config.autoSelectUnits) {
        this.selectedUnits.delete(unit);
      }

      if (unit.isAttacking) {
        const pos8 = this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y);
        this.u8.adhd.decay(pos8.x, pos8.y);
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
    })

  }

  adjustCameraFatigueBasedOnRecentAction(unit: Unit, f1: number, f2: number) {
    if (this.elapsed > this.cameraFatigueAdjustmentTimeoutMS + 500) {
      // if action is happening across the map, decrease camera fatigue
      const pos8 = this.u8.pxGrid.fromWorldToGrid(_a2, unit.x, unit.y);
      this.pxToWorld.xyz(unit.x, unit.y, _a3);
      const dist = _a3.distanceTo(this.viewport.orbit.getTarget(_b3));
      let adjustment = -dist * 2;
      // todo: grade this by how much action is NOT happening at camera

      const delta = this.u8.action.get(pos8.x, pos8.y) - this.u8.action.get(this.activeQuadrant?.x || 0, this.activeQuadrant?.y || 0)
      // we tweak the magnitude by how much there is a score difference
      if (delta > 0 ) {
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
    }
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
      this.elapsed < this.lastUnitAttackedMS + 200 ||
      this.elapsed < this.lastUnitDestroyedMS + 2_000
    ) {
      this.targetGameSpeed = 1;
      this.gameIsLulled = false;
    } else {

      this.targetGameSpeed = THREE.MathUtils.damp(
        this.targetGameSpeed,
        this.config.maxReplaySpeed,
        0.1,
        delta / 1000
      )
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


  onFrame(frame: number): void {

    if (Number.isNaN(this.cameraFatigue)) {
      this.cameraFatigue = 0;
    }

    const tensionVsStrategy = this.strategyFocusNoise2D(this.frame / 1000, 0);

    this.sendUIMessage({
      speed: this.openBW.gameSpeed,
      targetSpeed: this.targetGameSpeed,

      state: {
        cameraFatigue: this.cameraFatigue,
        cameraFatigue2: this.cameraFatigue2,
        elapsed: this.elapsed,
        frame,
        tensionVsStrategy,
        gameIsLulled: this.gameIsLulled
      },
      data: {
        size: this.u8.units.size,
        quadrants: this.u8.units.quadrants.map((q) => {
          return {
            active: q === this.activeQuadrant,
            x: q.x,
            y: q.y,
            score: this.u8.action.get(q.x, q.y),
            units: q.items.length,
            adhd: this.u8.adhd.get(q.x, q.y),
            tension: this.u8.tension.get(q.x, q.y),
            strategy: this.u8.strategy.get(q.x, q.y),
          };
        }),
      },
    });

    // update scores
    for (const quadrant of this.u8.units.quadrants) {
      let sumScore = 0, sumBuildingScore = 0;

      // use surrounding quadrants to calculate score
      const _teams = new Array(8).fill(0);
      // for (const unit of quadrant.items) {
      for (const unit of this.u8.units.getNearby( quadrant.x, quadrant.y, 1 )) {
        const unitScore = this.scoreCalculator.unitScore(unit);
        sumScore += unitScore;

        const buildingScore = this.strategyBuildingCalculator.unitScore(unit);
        sumBuildingScore += buildingScore;

        if (!this.assets.bwDat.units[unit.typeId].isBuilding) {
          _teams[unit.owner]++;
        }
      }

      const tension = calcCoeff(_teams.filter((_,i) => this.players.get(i)));
      this.u8.action.set(quadrant.x, quadrant.y, sumScore);
      this.u8.tension.set(quadrant.x, quadrant.y, tension);
      this.u8.strategy.set(quadrant.x, quadrant.y, sumBuildingScore);
      
    }
    
    // calculate hottest quadrant
    let hottestScore = 0;
    let hottestQuadrant: Quadrant<Unit> | undefined;
    let secondHottestQuadrant: Quadrant<Unit> | undefined;
    let selectionWeight = this.lastSelectionWeight;

    for (const quadrant of this.u8.units.quadrants) {

      const score = this.u8.action.get(quadrant.x, quadrant.y);
      const adhdWeight = (1 - this.u8.adhd.get(quadrant.x, quadrant.y)) * this.config.weightsADHD;
      const tensionWeight = (this.u8.tension.get(quadrant.x, quadrant.y) * this.config.weightsTension);
      const strategyWeight = (this.u8.strategy.get(quadrant.x, quadrant.y) * this.config.weightsStrategy);

      const unitScore = this.gameIsLulled ? strategyWeight : score;

      const weightedScore = unitScore * adhdWeight//(unitScore + tensionWeight) * adhdWeight;

      // the or is a special case early game where base strategy scores are even
      // typically however interesting quadrants will be quite varying in score ( not even )
      if (weightedScore > hottestScore) {
        hottestScore = weightedScore;
        secondHottestQuadrant = hottestQuadrant;
        hottestQuadrant = quadrant;
        // todo: base off the above criteria
        selectionWeight = this.gameIsLulled ? "strategy" : "unit";
      }
    }

    if (
      hottestQuadrant &&
      hottestQuadrant.items.length &&
      this.cameraFatigue < 0
    ) {
      //todo: change selection to next hottest quadrant
      //with factor such as distance and tension
      if (this.frame > 10_000 && this.elapsed - this.lastSecondaryActiveQuadrantUpdateMS > 20_000) {
        this.secondView.activateIfExists(secondHottestQuadrant, hottestQuadrant, hottestScore);
        this.lastSecondaryActiveQuadrantUpdateMS = this.elapsed;
      }

      this.viewport.orbit.getTarget(_c3);

      // activate quadrant
      const moveToUnits = hottestQuadrant.items.filter(selectionWeight === "strategy" ? this.uf_Building : this.uf_NonHarvesting);
      // sometimes in strategy moveToUnits is empty, figure out why bruh
      const t = this.targets.moveToUnits( moveToUnits.length > 0 ? moveToUnits : hottestQuadrant.items );
      // this.units8.getNearby(quadrant.x, quadrant.y, 1, false),

      this.lastSelectionWeight = selectionWeight;

      this.#targetObject.position.copy(t[0]);
      this.#targetObject2.position.copy(t[1]);
      this.#targetObject.updateMatrix();
      this.#targetObject.updateMatrixWorld();
      this.#targetObject2.updateMatrix();
      this.#targetObject2.updateMatrixWorld();

      //todo: bias this by game speed a little?
      this.cameraFatigue = 2000 / this.openBW.gameSpeed + this.targets.moveTarget.distanceTo(_c3) * 80 + (4_000 *  (1 - Math.min(1,(frame/4000))));
      this.cameraFatigue2 = 500 / this.openBW.gameSpeed;

      this.targets.adjustDollyToUnitSpread(hottestQuadrant.items);

      this.lastActiveQuadrantUpdateMS = this.elapsed;

      this.u8.adhd.set(hottestQuadrant.x, hottestQuadrant.y, 1);
      this.activeQuadrant = hottestQuadrant;

     
    } else if (hottestQuadrant && hottestQuadrant.items.length && this.activeQuadrant && this.cameraFatigue2 < 0) {
      // if nearby quadrants are hot, stick around
      // activate quadrant
      if (Math.abs(hottestQuadrant.x - this.activeQuadrant.x) < 2 &&
        Math.abs(hottestQuadrant.y - this.activeQuadrant.y) < 2 ) {
        this.viewport.orbit.getTarget(_c3);

        // activate quadrant
        const moveToUnits = hottestQuadrant.items.filter(selectionWeight === "strategy" ? this.uf_Building : this.uf_NonHarvesting);
        const t = this.targets.moveToUnits( moveToUnits.length > 0 ? moveToUnits : hottestQuadrant.items, 5, "smooth" );

        this.#targetObject.position.copy(t[0]);
        this.#targetObject2.position.copy(t[1]);
        this.#targetObject.updateMatrix();
        this.#targetObject.updateMatrixWorld();
        this.#targetObject2.updateMatrix();
        this.#targetObject2.updateMatrixWorld();

        this.cameraFatigue2 = 200 / this.openBW.gameSpeed + this.targets.moveTarget.distanceTo(_c3) * 50;
      }
    }

    if (
      this.frame < 30 * 24  
    ) {
      this.targetGameSpeed = 1;
    }

    this.u8.units.clear();
  }

  onMinimapDragUpdate(pos: THREE.Vector2, isDragStart: boolean, mouseButton: number) {

    const viewportsAreProximate = areProximateViewports(
      this.viewport,
      this.secondViewport
    );

    if (mouseButton === 0) {
      this.viewport.orbit.getTarget(_c3);
      const target = _a3.set(pos.x, 0, pos.y).clone();
      this.targets.setMoveTargets([ target, target ], undefined, isDragStart ? "cut" : "smooth");
      this.cameraFatigue = 5000;
      this.cameraFatigue2 = 200;

      this.u8.worldGrid.fromWorldToGrid(_a2, pos.x, pos.y);
      this.activeQuadrant = this.u8.units.getQuadrant(_a2.x, _a2.y);
      this.lastSelectionWeight = "unit";

      if (this.secondViewport.enabled) {
        this.secondViewport.enabled = !viewportsAreProximate;
      } else {
        this.secondViewport.orbit.moveTo(-10000, 0, 0, false);
      }
    }
    else if (mouseButton === 2) {
        _a3.set(pos.x, 0, pos.y);
  
        const isProximateToPrevious = areProximate(_a3, groundTarget(this.secondViewport, _b3), PIP_PROXIMITY);
  
        if (isDragStart) {
          if (this.secondViewport.enabled) {
            this.secondViewport.enabled =
              !viewportsAreProximate && isProximateToPrevious;
          } else {
            this.secondViewport.enabled = !viewportsAreProximate;
          }
        } else {
          this.secondViewport.enabled =
            !viewportsAreProximate &&
            isProximateToPrevious;
        }
  
        if (this.secondViewport.enabled) {
          this.secondViewport.orbit.moveTo(pos.x, 0, pos.y, !isDragStart);
        } else {
          this.secondViewport.orbit.moveTo(-10000, 0, 0, false);
        }
      }
  

  }

  onCameraMouseUpdate(
    _: number,
    __: number,
    scrollY: number,
  ) {
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
    if (this.assets.bwDat.units[unit.typeId].isBuilding) {
      return false;
    }
    if (isWorkerUnit(unit) && isHarvesting(unit)) {
      return false;
    }
    return true;
  }

  uf_Building = (unit: Unit) => this.assets.bwDat.units[unit.typeId].isBuilding
}
