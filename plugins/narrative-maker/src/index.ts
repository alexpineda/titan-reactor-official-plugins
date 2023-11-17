import { Unit } from "@titan-reactor-runtime/host";
import { Quadrant, SimpleQuadtree } from "./simple-quadtree";
import { SimpleHeatmap } from "./heatmap/heatmap";
import { ScoreModifier, UnitAndOrderScoreCalculator } from "./unit-interest/unit-interest-score";
import { areProximate, areProximateViewports, groundTarget, setupViewports } from "./camera-utils";
import { canOnlySelectOne  } from "./unit-helpers";
import { PIP_PROXIMITY, POLAR_MIN, QUAD_SIZE } from "./constants";
import { CameraTargets } from "./camera-targets";
import {   calcCoeff  } from "./math-utils";
import { SecondView } from "./second-view";
import { DecayMap } from "./heatmap/decay-map";
import { buildingUnitRanks, regularUnitRanks } from "./unit-interest/unit-ranks";

import { createNoise2D } from "simplex-noise"
import alea from 'alea';

const _pos = new THREE.Vector3(0, 0, 0);
const _pos2 = new THREE.Vector3(0, 0, 0);
const _pos3 = new THREE.Vector3(0, 0, 0);


export default class PluginAddon extends SceneController {
  viewportsCount = 2;

  /**
   * score calculator for units
   */
  scoreCalculator: UnitAndOrderScoreCalculator;

  /**
   * score calculator for units
   */
  strategyBuildingCalculator: UnitAndOrderScoreCalculator;
  strategyFocusNoise2D = createNoise2D(alea("strategy-focus"));

  /**
   * Default score modifier (unit x order score)
   */
  defaultScoreModifier: ScoreModifier;
  buildingScoreModifier: ScoreModifier;

  /**
   * Units by quadrant
   */
  units8: SimpleQuadtree<Unit>;
  /**
   * 0 = pay attention
   * 1 = ignore
   */
  adhd_uq8: DecayMap;
  /**
   * Unit score averages by quadrant
   */
  scores_uq8: SimpleHeatmap;

  /**
   * The differences in owners of units
   */
  tension_uq8: SimpleHeatmap;

  /**
   * Strategic buildings score
   */
  strategy_uq8: SimpleHeatmap;

  lastActiveQuadrantUpdateMS = 0;
  lastSecondaryActiveQuadrantUpdateMS = 0;

  lastDecayUpdateMS = 0;
  lastUnitDestroyedMS = 0;
  lastUnitAttackedMS = 0;
  targets: CameraTargets;
  secondView: SecondView;

  #quadPos: THREE.Vector2 = new THREE.Vector2();

  targetGameSpeed = 1;
  gameIsLulled = true;
  activeQuadrant: Quadrant<Unit> | undefined;
  cameraFatigue = 0;
  cameraFatigue2 = 0;
  #targetObject = new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  )
  #targetObject2 = new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  )

  getUQ8(unit: Unit) {
    this.units8.normalize(this.#quadPos, unit.x, unit.y);
    return this.#quadPos;
  }

  onUIMessage(message: any): void {
    if (message.type === "close-intro") {
      this.saveConfigProperty("showIntro", false);
    }
  }

  #reset() {
    this.secondView.reset();
    this.units8.clear();
    this.adhd_uq8.clear();
    this.scores_uq8.clear();
    this.tension_uq8.clear();
    this.strategy_uq8.clear();

    this.lastActiveQuadrantUpdateMS = 0;
    this.lastDecayUpdateMS = 0;
    this.lastUnitDestroyedMS = 0;
    this.lastUnitAttackedMS = 0;
 
  }

  public async onEnterScene(prevData) {
    this.secondView = new SecondView(this);
    this.targets = new CameraTargets(this);

    this.targets.setMoveTargets([prevData.target]);

    this.parent.add(this.#targetObject);
    this.parent.add(this.#targetObject2);

    this.defaultScoreModifier = (
      unit: Unit,
      orderScore: number,
      unitScore: number
    ) => {
      return orderScore * unitScore;
    };

    this.buildingScoreModifier = (
      unit: Unit,
      orderScore: number,
      unitScore: number
    ) => {
      if (unit.remainingBuildTime) {
        return unitScore * (1 - unit.remainingBuildTime);
      }
      return orderScore * unitScore;
    };
    this.scoreCalculator = new UnitAndOrderScoreCalculator(
      this.assets.bwDat,
      regularUnitRanks,
      this.defaultScoreModifier.bind(this)
    );

    this.strategyBuildingCalculator = new UnitAndOrderScoreCalculator(
      this.assets.bwDat,
      buildingUnitRanks,
      this.defaultScoreModifier.bind(this)
    );

    this.units8 = new SimpleQuadtree<Unit>(
      QUAD_SIZE,
      new THREE.Vector2(this.map.size[0] * 32, this.map.size[1] * 32),
      new THREE.Vector2(0, 0)
    );
    this.adhd_uq8 = new DecayMap(QUAD_SIZE);
    this.scores_uq8 = new SimpleHeatmap(QUAD_SIZE);
    this.tension_uq8 = new SimpleHeatmap(QUAD_SIZE);
    this.strategy_uq8 = new SimpleHeatmap(QUAD_SIZE);

    this.#reset();

    await setupViewports(this);

    /**
     * reset adhd if unit is killed
     */
    this.events.on(
      "unit-killed",
      (unit) => {
        const pos8 = this.getUQ8(unit);
        this.adhd_uq8.set(pos8.x, pos8.y, 0);
        this.lastUnitDestroyedMS = this.elapsed;
        
        // if action is happening across the map, decrease camera fatigue
        this.pxToWorld.xyz(unit.x, unit.y, _pos);
        const dist = _pos.distanceTo(this.viewport.orbit.getTarget(_pos2));
        let adjustment = -dist * 2;
        // todo: grade this by how much action is NOT happening at camera
        const delta = this.scores_uq8.get(pos8.x, pos8.y) - this.scores_uq8.get(this.activeQuadrant?.x || 0, this.activeQuadrant?.y || 0)
        // we tweak the magnitude by how much there is a score difference
        if (delta > 0 ) {
          adjustment = -dist * (4 + delta * 5);
        }
        this.cameraFatigue += adjustment;
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
      const { x: mX, y: mY } = this.getUQ8(unit);

      if (this.scoreCalculator.unitOfInterestFilter(unit)) {
        this.units8.add(unit.x, unit.y, unit);
      }
      if (unit.extras.recievingDamage) {
        this.adhd_uq8.decay(mX, mY);
        if (!canOnlySelectOne(unit) && this.config.autoSelectUnits) {
          this.selectedUnits.add(unit);
        }

        // if action is happening across the map, decrease camera fatigue
        // todo: grade this by how much action is NOT happening at camera
        this.pxToWorld.xyz(unit.x, unit.y, _pos);
        const dist = _pos.distanceTo(this.viewport.orbit.getTarget(_pos2));
        let adjustment = -dist * 2;
        // todo: grade this by how much action is NOT happening at camera
        const delta = this.scores_uq8.get(mX, mY) - this.scores_uq8.get(this.activeQuadrant?.x || 0, this.activeQuadrant?.y || 0)
        // we tweak the magnitude by how much there is a score difference
        if (delta > 0 ) {
          adjustment = -dist * (2 + delta * 5);
        }
        this.cameraFatigue += adjustment;
        // this.cameraFatigue -= dist;
      } else if (this.config.autoSelectUnits) {
        this.selectedUnits.delete(unit);
      }

      if (unit.isAttacking) {
        this.adhd_uq8.decay(mX, mY);
        this.lastUnitAttackedMS = this.elapsed;
      }
    });

    this.events.on("frame-reset", () => {
      this.#reset();
      this.adhd_uq8.clear();
    });

    this.events.on("selected-units-changed", (units) => {
      if (this.config.autoSelectUnits && units.length) {
        this.cameraFatigue += 3000;
        this.cameraFatigue2 += 500;
      }
    })

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
      position: this.viewport.orbit.getPosition(_pos).clone(),
    }
  }

  onConfigChanged(oldConfig: Record<string, unknown>): void {
    this.secondViewport.height = this.config.pipSize;
    this.adhd_uq8.defaultDecay = this.config.heatMapDecay;
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
      this.gameIsLulled = true;
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
      this.adhd_uq8.decayAll();
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
        tensionVsStrategy
      },
      data: {
        size: this.units8.size,
        quadrants: this.units8.quadrants.map((q) => {
          return {
            active: q === this.activeQuadrant,
            x: q.x,
            y: q.y,
            score: this.scores_uq8.get(q.x, q.y),
            units: q.items.length,
            adhd: this.adhd_uq8.get(q.x, q.y),
            tension: this.tension_uq8.get(q.x, q.y),
            strategy: this.strategy_uq8.get(q.x, q.y),
          };
        }),
      },
    });

    // update scores
    for (const quadrant of this.units8.quadrants) {
      let sumScore = 0, sumBuildingScore = 0;

      // use surrounding quadrants to calculate score
      const _teams = new Array(8).fill(0);
      // for (const unit of quadrant.items) {
      for (const unit of this.units8.getNearby( quadrant.x, quadrant.y, 1, false )) {
        const unitScore = this.scoreCalculator.unitScore(unit);
        sumScore += unitScore;

        const buildingScore = this.strategyBuildingCalculator.unitScore(unit);
        sumBuildingScore += buildingScore;

        if (!this.assets.bwDat.units[unit.typeId].isBuilding) {
          _teams[unit.owner]++;
        }
      }

      const tension = calcCoeff(_teams.filter((_,i) => this.players.get(i)));
      this.scores_uq8.set(quadrant.x, quadrant.y, sumScore);
      this.tension_uq8.set(quadrant.x, quadrant.y, tension);
      this.strategy_uq8.set(quadrant.x, quadrant.y, sumBuildingScore);
      
    }
    
    // calculate hottest quadrant
    let hottestScore = 0;
    let hottestQuadrant: Quadrant<Unit> | undefined;
    let secondHottestQuadrant: Quadrant<Unit> | undefined;

    for (const quadrant of this.units8.quadrants) {

      const score = this.scores_uq8.get(quadrant.x, quadrant.y);
      const adhdWeight = (1 - this.adhd_uq8.get(quadrant.x, quadrant.y)) * this.config.weightsADHD;
      const tensionWeight = (this.tension_uq8.get(quadrant.x, quadrant.y) * this.config.weightsTension);
      const strategyWeight = (this.strategy_uq8.get(quadrant.x, quadrant.y) * this.config.weightsStrategy);

      const tensionVsStrategyWeight = tensionVsStrategy > 0 ? tensionVsStrategy * tensionWeight : -tensionVsStrategy * strategyWeight;

      const weightedScore = (score + tensionVsStrategyWeight) * adhdWeight;

      if (weightedScore > hottestScore) {
        hottestScore = weightedScore;
        secondHottestQuadrant = hottestQuadrant;
        hottestQuadrant = quadrant;
      }
    }

    if (
      hottestQuadrant &&
      this.cameraFatigue < 0
    ) {
      //todo: change selection to next hottest quadrant
      //with factor such as distance and tension
      if (this.frame > 10_000 && this.elapsed - this.lastSecondaryActiveQuadrantUpdateMS > 20_000) {
        this.secondView.activateIfExists(secondHottestQuadrant, hottestQuadrant, hottestScore);
        this.lastSecondaryActiveQuadrantUpdateMS = this.elapsed;
      }

      this.viewport.orbit.getTarget(_pos3);

      // activate quadrant
      const t = this.targets.setTargetsFromQuadrant(hottestQuadrant);

      this.#targetObject.position.copy(t[0]);
      this.#targetObject2.position.copy(t[1]);
      this.#targetObject.updateMatrix();
      this.#targetObject.updateMatrixWorld();
      this.#targetObject2.updateMatrix();
      this.#targetObject2.updateMatrixWorld();

      //todo: bias this by game speed a little?
      this.cameraFatigue = 2000 / this.openBW.gameSpeed + this.targets.moveTarget.distanceTo(_pos3) * 100 + (5_000 *  (1 - Math.min(1,(frame/5000))));
      this.cameraFatigue2 = 500 / this.openBW.gameSpeed;

      this.targets.adjustDollyToUnitSpread(hottestQuadrant.items);

      this.lastActiveQuadrantUpdateMS = this.elapsed;

      this.adhd_uq8.set(hottestQuadrant.x, hottestQuadrant.y, 1);
      this.activeQuadrant = hottestQuadrant;

     
    } else if (hottestQuadrant && this.activeQuadrant && this.cameraFatigue2 < 0) {
      // if nearby quadrants are hot, stick around
      // activate quadrant
      if (Math.abs(hottestQuadrant.x - this.activeQuadrant.x) < 2 &&
        Math.abs(hottestQuadrant.y - this.activeQuadrant.y) < 2 ) {
        this.viewport.orbit.getTarget(_pos3);

        // activate quadrant
        const t = this.targets.setTargetsFromQuadrant(hottestQuadrant, 5, "smooth");

        this.#targetObject.position.copy(t[0]);
        this.#targetObject2.position.copy(t[1]);
        this.#targetObject.updateMatrix();
        this.#targetObject.updateMatrixWorld();
        this.#targetObject2.updateMatrix();
        this.#targetObject2.updateMatrixWorld();

        this.cameraFatigue2 = 200 / this.openBW.gameSpeed + this.targets.moveTarget.distanceTo(_pos3) * 50;
      }
    }

    if (
      this.frame < 30 * 24  
    ) {
      this.targetGameSpeed = 1;
    }

    this.units8.clear();
  }

  onMinimapDragUpdate(pos, isDragStart, mouseButton) {

    const viewportsAreProximate = areProximateViewports(
      this.viewport,
      this.secondViewport
    );

    if (mouseButton === 0) {
      this.viewport.orbit.getTarget(_pos3);
      const target = _pos.set(pos.x, 0, pos.y).clone();
      this.targets.setMoveTargets([ target, target ], undefined, isDragStart ? "cut" : "smooth");
      this.cameraFatigue = 5000;
      this.cameraFatigue2 = 200;

      this.units8.normalize(this.#quadPos,Math.floor((pos.x + this.map.size[0] / 2) * 32)  , Math.floor((pos.y + this.map.size[1] / 2) * 32));
      this.activeQuadrant = this.units8.getQuadrant(this.#quadPos.x, this.#quadPos.y);

      if (this.secondViewport.enabled) {
        this.secondViewport.enabled = !viewportsAreProximate;
      } else {
        this.secondViewport.orbit.moveTo(-10000, 0, 0, false);
      }
    }
    else if (mouseButton === 2) {
        _pos.set(pos.x, 0, pos.y);
  
        const isProximateToPrevious = areProximate(_pos, groundTarget(this.secondViewport, _pos2), PIP_PROXIMITY);
  
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
    _,
    __,
    scrollY,
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
}
