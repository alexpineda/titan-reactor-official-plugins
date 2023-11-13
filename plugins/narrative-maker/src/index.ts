import { Unit } from "@titan-reactor-runtime/host";
import { Quadrant, SimpleQuadtree } from "./simple-quadtree";
import { SimpleHeatmap } from "./heatmap/heatmap";
import { ScoreModifier, UnitAndOrderScoreCalculator } from "./unit-interest/unit-interest-score";
import { areProximateViewports, setupViewports } from "./camera-utils";
import { canOnlySelectOne } from "./unit-helpers";
import { POLAR_MIN, QUAD_SIZE } from "./constants";
import { CameraTargets } from "./camera-targets";
import { calculateWeightedCenter, easeOutCubic, calculateMultiplayerClosenessFactor } from "./math-utils";
import { SecondView } from "./second-view";
import { DecayMap } from "./heatmap/decay-map";
import { buildingUnitRanks, regularUnitRanks } from "./unit-interest/unit-ranks";

const _pos = new THREE.Vector3(0, 0, 0);
const _pos2 = new THREE.Vector3(0, 0, 0);
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

  lastUpdateFrame = 0;
  lastHeatMapUpdateFrame = 0;
  lastUnitDestroyedFrame = 0;
  lastUnitAttackedFrame = 0;
  targets = new CameraTargets(this);
  secondView = new SecondView(this);

  #quadPos: THREE.Vector2 = new THREE.Vector2();

  targetGameSpeed = 1;
  lastSelectedQuadrant: Quadrant<Unit> | undefined;
  cameraFatigue = 0;

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

    this.lastUpdateFrame = 0;
    this.lastHeatMapUpdateFrame = 0;
    this.lastUnitDestroyedFrame = 0;
    this.lastUnitAttackedFrame = 0;
 
  }

  public async onEnterScene(prevData) {
    this.secondView = new SecondView(this);
    this.targets = new CameraTargets(this);
    this.targets.moveTarget.copy(prevData.target);

    this.defaultScoreModifier = (
      unit: Unit,
      orderScore: number,
      unitScore: number
    ) => {
      // const unitType = this.assets.bwDat.units[unit.typeId];

      // if (
      //   unitType.isBuilding &&
      //   this.frame - this.lastUnitAttackedFrame > 1000
      // ) {
      //   return orderScore * unitScore * 10;
      // }

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
        this.lastUnitDestroyedFrame = this.frame;
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
        if (!canOnlySelectOne(unit)) {
          this.selectedUnits.add(unit);
        }
      } else {
        this.selectedUnits.delete(unit);
      }

      if (unit.isAttacking) {
        this.adhd_uq8.decay(mX, mY);
        this.lastUnitAttackedFrame = this.frame;
      }
    });

    this.events.on("frame-reset", () => {
      this.#reset();
      this.adhd_uq8.clear();
    });
  }

  onExitScene() {
    this.events.dispose();
    this.selectedUnits.clear();
    this.openBW.setGameSpeed(1);
  }

  onConfigChanged(oldConfig: Record<string, unknown>): void {
    this.secondViewport.height = this.config.pipSize;
    this.adhd_uq8.defaultDecay = this.config.heatMapDecay;
    this.viewport.orbit.minPolarAngle =
      POLAR_MIN + THREE.MathUtils.degToRad(this.config.tilt);
  }

  onTick() {
    this.targets.update();
    this.secondView.onTick();
  }

  onFrame(frame: number): void {

    this.sendUIMessage({
      speed: this.openBW.gameSpeed,
      targetSpeed: this.targetGameSpeed,

      state: {
        lastHeatMapUpdateFrame: this.lastHeatMapUpdateFrame,
        lastUpdateFrame: this.lastUpdateFrame,
        elapsed: this.elapsed,
        frame,
      },
      data: {
        size: this.units8.size,
        quadrants: this.units8.quadrants.map((q) => {
          return {
            active: q === this.lastSelectedQuadrant,
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

    let _totalUnits = 0;
    for (const quadrant of this.units8.quadrants) {
      _totalUnits += quadrant.items.length;
    }
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

        _teams[unit.owner]++;
      }
      ;
      const tension = calculateMultiplayerClosenessFactor(_teams.filter((_,i) => this.players.get(i)));
      this.scores_uq8.set(quadrant.x, quadrant.y, sumScore);
      this.tension_uq8.set(quadrant.x, quadrant.y, tension /_totalUnits);
      this.strategy_uq8.set(quadrant.x, quadrant.y, sumBuildingScore);
      
    }

    // decay all
    if (
      this.elapsed - this.lastHeatMapUpdateFrame >
      this.config.heatmapUpdateInterval
    ) {
      this.adhd_uq8.decayAll();
      this.lastHeatMapUpdateFrame = this.elapsed;
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
      const strategyWeight = (this.strategy_uq8.get(quadrant.x, quadrant.y) * this.config.weightsStrategy);

      weightedScore = score * adhdWeight + tensionWeight + strategyWeight;

      if (weightedScore > hottestScore) {
        hottestScore = weightedScore;
        secondHottestQuadrant = hottestQuadrant;
        hottestQuadrant = quadrant;
      }
    }

    // this.cameraFatigue--;
    this.cameraFatigue--;

    if (
      hottestQuadrant &&
      this.cameraFatigue < 0
    ) {
      this.secondView.activateIfExists(secondHottestQuadrant, hottestQuadrant, hottestScore);

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

      // this.cameraFatigue +=
      //   (this.config.cameraMoveTime / 24) * (1 - nearbySum / 4); // + (10_000 *  (1 - Math.min(1,(frame/5000))));

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

      // activate quadrant
      const center = calculateWeightedCenter(
        _a2,
        this.units8.getNearby(hottestQuadrant.x, hottestQuadrant.y, 1, false),
        "x",
        "y",
        this.scoreCalculator.unitScore.bind(this.scoreCalculator)
      );
      const moveCenter = calculateWeightedCenter(
        _b2,
        this.units8.getNearby(hottestQuadrant.x, hottestQuadrant.y, 1, false),
        "moveTargetX",
        "moveTargetY",
        this.scoreCalculator.unitScore.bind(this.scoreCalculator)
      );
      center.lerp(moveCenter, 0.5);
      this.pxToWorld.xyz(center.x, center.y, _pos);

      this.viewport.orbit.getTarget(_pos2);
      
      this.cameraFatigue = _pos.distanceTo(_pos2) * 3;

      this.targets.moveTarget.copy(_pos);
      this.targets.adjustToUnits(hottestQuadrant.items);

      this.lastUpdateFrame = this.elapsed;

      this.adhd_uq8.set(hottestQuadrant.x, hottestQuadrant.y, 1);
      this.lastSelectedQuadrant = hottestQuadrant;
      // }
      // v1- calculated speed on winning quadrant only, obv not great, lets try adding a nearby quadrant too
      const speedLerpX = easeOutCubic(nearbySum);

      this.targetGameSpeed = THREE.MathUtils.lerp(
        this.config.maxReplaySpeed,
        1,
        speedLerpX
      );
    }

    if (
      this.frame < 30 * 24 ||
      this.frame > this.lastUnitAttackedFrame + 4 * 60 * 24 ||
      this.frame > this.lastUnitDestroyedFrame + 8 * 60 * 24
    ) {
      this.targetGameSpeed = 1;
    }

    this.units8.clear();

    this.secondViewport.enabled =
      this.secondViewport.enabled &&
      !areProximateViewports(this.viewport, this.secondViewport);
  }
}
