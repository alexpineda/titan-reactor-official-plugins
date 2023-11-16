import { Unit } from "@titan-reactor-runtime/host";
import { Quadrant, SimpleQuadtree } from "./simple-quadtree";
import { SimpleHeatmap } from "./heatmap/heatmap";
import { ScoreModifier, UnitAndOrderScoreCalculator } from "./unit-interest/unit-interest-score";
import { areProximateViewports, setupViewports } from "./camera-utils";
import { canOnlySelectOne } from "./unit-helpers";
import { POLAR_MIN, QUAD_SIZE } from "./constants";
import { CameraTargets } from "./camera-targets";
import { calculateWeightedCenter, calcCoeff } from "./math-utils";
import { SecondView } from "./second-view";
import { DecayMap } from "./heatmap/decay-map";
import { buildingUnitRanks, regularUnitRanks } from "./unit-interest/unit-ranks";

import { createNoise2D } from "simplex-noise"

const _pos = new THREE.Vector3(0, 0, 0);
const _pos2 = new THREE.Vector3(0, 0, 0);
const _pos3 = new THREE.Vector3(0, 0, 0);
const _a2 = new THREE.Vector2(0, 0 );
const _b2 = new THREE.Vector2(0, 0 );

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
  strategyFocusNoise2D = createNoise2D();

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
  activeQuadrant: Quadrant<Unit> | undefined;
  cameraFatigue = 0;
  cameraFatigue2 = 0;

  getUQ8(unit: Unit) {
    this.units8.normalize(this.#quadPos, unit.x, unit.y);
    // because we are using round we need to clamp to QUAD-1
    // this.#quadPos.x = THREE.MathUtils.clamp(
    //   Math.round((unit.x / (this.map.size[0] * 32)) * QUAD_SIZE),
    //   0,
    //   QUAD_SIZE - 1
    // );
    // this.#quadPos.y = THREE.MathUtils.clamp(
    //   Math.round((unit.y / (this.map.size[1] * 32)) * QUAD_SIZE),
    //   0,
    //   QUAD_SIZE - 1
    // );
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
        this.adhd_uq8.set(this.getUQ8(unit).x, this.getUQ8(unit).y, 0);
        this.lastUnitDestroyedMS = this.elapsed;
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
  }

  onExitScene() {
    this.events.dispose();
    this.openBW.setGameSpeed(1);

    this.settings.input.dampingFactor.reset();

    if (this.config.autoSelectUnits) {
      this.selectedUnits.clear();
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
    } else {

      this.targetGameSpeed = THREE.MathUtils.damp(
        this.targetGameSpeed,
        this.config.maxReplaySpeed,
        0.1,
        delta / 1000
      )
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

  #generateMoveTargets(quadrant: Quadrant<Unit>) {
    const center = calculateWeightedCenter(
      _a2,
      this.units8.getNearby(quadrant.x, quadrant.y, 1, false),
      "x",
      "y",
      this.scoreCalculator.unitScore.bind(this.scoreCalculator)
    );
    const moveCenter = calculateWeightedCenter(
      _b2,
      this.units8.getNearby(quadrant.x, quadrant.y, 1, false),
      "nextMovementWaypointX",
      "nextMovementWaypointY",
      this.scoreCalculator.unitScore.bind(this.scoreCalculator)
    );
    this.pxToWorld.xyz(center.x, center.y, _pos);
    this.pxToWorld.xyz(moveCenter.x, moveCenter.y, _pos2);

    return [ _pos.clone(), _pos2.clone() ];
  }

  onFrame(frame: number): void {

    this.sendUIMessage({
      speed: this.openBW.gameSpeed,
      targetSpeed: this.targetGameSpeed,

      state: {
        lastHeatMapUpdateFrame: this.lastDecayUpdateMS,
        lastUpdateFrame: this.lastActiveQuadrantUpdateMS,
        lastUnitDestroyedFrame: this.lastUnitDestroyedMS,
        lastUnitAttackedFrame: this.lastUnitAttackedMS,
        cameraFatigue: this.cameraFatigue,
        elapsed: this.elapsed,
        frame,
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
      let sumScore = 0,
        avgScore = 0, sumBuildingScore = 0, avgBuildingScore =0;

      // use surrounding quadrants to calculate score
      const _teams = new Array(8).fill(0);
      // for (const unit of quadrant.items) {
      for (const unit of this.units8.getNearby( quadrant.x, quadrant.y, 1, false )) {
        const unitScore = this.scoreCalculator.unitScore(unit);
        sumScore += unitScore;
        avgScore = sumScore / (quadrant.items.length || 1);

        const buildingScore = this.strategyBuildingCalculator.unitScore(unit);
        sumBuildingScore += buildingScore;
        avgBuildingScore = sumBuildingScore / (quadrant.items.length || 1);

        if (!this.assets.bwDat.units[unit.typeId].isBuilding) {
          _teams[unit.owner]++;
        }
      }
      ;
      const tension = calcCoeff(_teams.filter((_,i) => this.players.get(i)));
      this.scores_uq8.set(quadrant.x, quadrant.y, sumScore);
      this.tension_uq8.set(quadrant.x, quadrant.y, tension / (quadrant.items.length || 1));
      this.strategy_uq8.set(quadrant.x, quadrant.y, sumBuildingScore);
      
    }
    
    // calculate hottest quadrant

    let hottestScore = 0;
    let hottestQuadrant: Quadrant<Unit> | undefined;
    let secondHottestQuadrant: Quadrant<Unit> | undefined;

    let weightedScore = 0;

    for (const quadrant of this.units8.quadrants) {

      const score = this.scores_uq8.get(quadrant.x, quadrant.y);
      const adhdWeight = (1 - this.adhd_uq8.get(quadrant.x, quadrant.y)) * this.config.weightsADHD;
      const tensionWeight = (this.tension_uq8.get(quadrant.x, quadrant.y) * this.config.weightsTension);
      const strategyWeight = (this.strategy_uq8.get(quadrant.x, quadrant.y) * this.config.weightsStrategy) + this.strategyFocusNoise2D(this.elapsed, 0);

      weightedScore = (score + tensionWeight) * adhdWeight + strategyWeight;

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

      const nearbyHeat = this.scores_uq8.getNearby(
        hottestQuadrant.x,
        hottestQuadrant.y,
        1
      );
      let nearbySum = 0;
      for (const h of nearbyHeat) {
        nearbySum += h.value; // * (1 -0 this.#adhd.get(h.x, h.y));
        // this.adhd_uq8.decay(h.x, h.y, 1 - h.value);
      }
 
      // let nearbyAttacking = 0,
      //   armyTotal = 1;

      // for (const unit of hottestQuadrant.items) {
      //   if (this.#isArmyUnit(unit)) {
      //     armyTotal++;
      //     if (unit.isAttacking) {
      //       nearbyAttacking++;
      //     }
      //   }
      // }

      this.viewport.orbit.getTarget(_pos3);

      // activate quadrant
      this.targets.setMoveTargets(this.#generateMoveTargets(hottestQuadrant));

      
      //todo: bias this by game speed a little?
      this.cameraFatigue = 2000 + this.targets.moveTarget.distanceTo(_pos3) * 100 + (10_000 *  (1 - Math.min(1,(frame/5000))));
      this.cameraFatigue2 = 500;

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
        this.targets.setMoveTargets(this.#generateMoveTargets(hottestQuadrant), 5, true);

        this.cameraFatigue2 = 200 + this.targets.moveTarget.distanceTo(_pos3) * 50;
      }
    }

    if (
      this.frame < 30 * 24  
    ) {
      this.targetGameSpeed = 1;
    }

    this.units8.clear();
  }
}
