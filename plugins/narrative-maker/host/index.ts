
import * as THREE from "three";
import { BwDAT, GameViewPort, Unit,  } from "@titan-reactor-runtime/host";


const _pos = new THREE.Vector3(0, 0, 0);

const unitTypes = enums.unitTypes;
const orders = enums.orders;
const UnitFlags = enums.UnitFlags;

const workerTypes = [enums.unitTypes.scv, enums.unitTypes.drone, enums.unitTypes.probe];

const DEFAULT_FAR = 256;
const POLAR_MAX = (10 * Math.PI) / 64;
const POLAR_MIN = (2 * Math.PI) / 64;

const PIP_PROXIMITY = 32;

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();

const rankA = [
  unitTypes.ghost, unitTypes.scienceVessel, unitTypes.battleCruiser,
  unitTypes.nuclearMissile, unitTypes.ultralisk, unitTypes.guardian, unitTypes.queen, unitTypes.defiler, unitTypes.infestedTerran,
  unitTypes.darkTemplar, unitTypes.devourer, unitTypes.darkArchon, unitTypes.arbiter, unitTypes.carrier,

  unitTypes.covertOps, unitTypes.physicsLab, unitTypes.infestedCommandCenter, unitTypes.hive, unitTypes.nydusCanal, unitTypes.defilerMound,
  unitTypes.nuclearSilo, unitTypes.greaterSpire, unitTypes.queensNest, unitTypes.ultraliskCavern,

  unitTypes.templarArchives, unitTypes.fleetBeacon, unitTypes.arbitalTribunal, unitTypes.scarab, unitTypes.scannerSweep,

  unitTypes.commandCenter, unitTypes.nexus, unitTypes.hatchery,
];

const rankB = [
  unitTypes.goliath, unitTypes.wraith, unitTypes.siegeTankSiegeMode, unitTypes.broodling, unitTypes.mutalisk, unitTypes.scourge, unitTypes.dropship, unitTypes.valkryie, unitTypes.corsair,
  unitTypes.highTemplar, unitTypes.archon, unitTypes.scout, unitTypes.reaver,

   unitTypes.starport, unitTypes.scienceFacility, unitTypes.engineeringBay, unitTypes.armory,
  unitTypes.bunker,
   unitTypes.lair, unitTypes.spire, unitTypes.darkSwarm,
   unitTypes.cyberneticsCore, unitTypes.stargate, unitTypes.roboticsSupportBay,
];

const rankC = [
  unitTypes.siegeTankTankMode, unitTypes.vulture, unitTypes.firebat, unitTypes.hydralisk, unitTypes.zealot, unitTypes.dragoon, unitTypes.shuttle, unitTypes.lurker,

  unitTypes.barracks, unitTypes.academy, unitTypes.factory, unitTypes.machineShop, unitTypes.missileTurret,
  unitTypes.hydraliskDen,
  unitTypes.gateway, unitTypes.photonCannon, unitTypes.citadelOfAdun, unitTypes.roboticsFacility, unitTypes.observatory,
];

const rankD = [
  unitTypes.marine, unitTypes.medic, unitTypes.zergling, unitTypes.interceptor, unitTypes.lurkerEgg,

  unitTypes.supplyDepot, unitTypes.refinery, unitTypes.controlTower,
  unitTypes.evolutionChamber, unitTypes.spawningPool, unitTypes.pylon,
  unitTypes.forge, unitTypes.shieldBattery
];

const rankE = [
  unitTypes.spiderMine, unitTypes.mutaliskCocoon, unitTypes.observer, unitTypes.disruptionWeb,

  unitTypes.comsatStation, unitTypes.creepColony, unitTypes.sporeColony, unitTypes.sunkenColony,
  unitTypes.extractor,
  unitTypes.assimilator,
];

/*
 unitTypes.overlord,
unitTypes.scv, unitTypes.drone, unitTypes.probe
*/

function easeOutQuint(x: number): number {
  return 1 - Math.pow(1 - x, 5);
}

function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

function distance(point1: { x: number, y: number }, point2: { x: number, y: number }): number {
  const deltaX = point2.x - point1.x;
  const deltaY = point2.y - point1.y;

  return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
}

const unitIsCompleted = (unit: Unit) => {
  return unit.statusFlags & UnitFlags.Completed;
};

const canSelectUnit = (unit: Unit | undefined) => {
  if (!unit) return null;

  return unit.typeId !== unitTypes.darkSwarm &&
    unit.typeId !== unitTypes.disruptionWeb &&
    unit.order !== orders.die &&
    !unit.extras.dat.isTurret &&
    (unit.statusFlags & UnitFlags.Loaded) === 0 &&
    (unit.statusFlags & UnitFlags.InBunker) === 0 &&
    unit.order !== orders.harvestGas &&
    unit.typeId !== unitTypes.spiderMine &&
    (unitIsCompleted(unit) || unit.extras.dat.isZerg || unit.extras.dat.isBuilding)
    ? unit
    : null;
};

const _canOnlySelectOne = [
  unitTypes.larva,
  unitTypes.zergEgg,
  unitTypes.vespeneGeyser,
  unitTypes.mineral1,
  unitTypes.mineral2,
  unitTypes.mineral3,
  unitTypes.mutaliskCocoon,
  unitTypes.lurkerEgg,
];

const canOnlySelectOne = (unit: Unit) =>
  _canOnlySelectOne.includes(unit.typeId);

type Quadrant<T> = { items: T[], x: number, y: number };

// simple quadrant for items
/**
 * @public
 */
class SimpleQuadtree<T> {
  #size: number;
  #scale: THREE.Vector2;
  #offset: THREE.Vector2;
  #items: Record<string, T[]> = {};

  #normalized = new THREE.Vector2();
  #radius = new THREE.Vector2();

  #quadrants: Quadrant<T>[] = []

  get quadrants() {
    return this.#quadrants;
  }

  get size() {
    return this.#size;
  }

  constructor(size: number, scale = new THREE.Vector2(1, 1), offset = new THREE.Vector2(0, 0),) {
    this.#size = size;

    for (let y = 0; y < this.#size; y++) {
      for (let x = 0; x < this.#size; x++) {
        const items = this.#items[`${x},${y}`] = [];
        this.#quadrants[y * this.#size + x] = { items, x, y };
      }
    }

    this.#scale = scale;
    this.#offset = offset;

  }

  #normalize(out: THREE.Vector2, x: number, y: number, useOffset = true) {
    out.set(
      Math.floor(((x + (useOffset ? this.#offset.x : 0)) / this.#scale.x) * this.size), Math.floor(((y + (useOffset ? this.#offset.y : 0)) / this.#scale.y) * this.size));
  }

  add(x: number, y: number, item: T) {
    this.#normalize(this.#normalized, x, y);
    this.#items[`${this.#normalized.x},${this.#normalized.y}`].push(item);
  }

  getNearby(x: number, y: number, radius = 0) {
    this.#normalize(this.#normalized, x, y);

    if (radius === 0) {
      return this.#items[`${this.#normalized.x},${this.#normalized.y}`];f
    } else {
      const items: T[] = [];

      this.#normalize(this.#radius, radius, radius, false);

      const minX = Math.floor(Math.max(0, this.#normalized.x - this.#radius.x));
      const minY = Math.floor(Math.max(0, this.#normalized.y - this.#radius.y));
      const maxX = Math.floor(Math.min(this.#size - 1, this.#normalized.x + this.#radius.x));
      const maxY = Math.floor(Math.min(this.#size - 1, this.#normalized.y + this.#radius.y));

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          items.push(...this.#items[`${x},${y}`]);
        }
      }

      return items;
    }
  }

  clear() {
    for (let i = 0; i < this.#size; i++) {
      for (let j = 0; j < this.#size; j++) {
        this.#items[`${i},${j}`].length = 0;
      }
    }
  }
}

type HeatmapValue = { value: number, x: number, y: number };

class SimpleHeatmap {
  #heatmap: HeatmapValue[] = [];
  #size: number;
  defaultDecay = 0.9;

  constructor(size: number) {
    this.#size = size;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        this.#heatmap.push({ value: 0, x, y });
      }
    }
  }

  getIndex(x: number, y: number) {
    const idx = y * this.#size + x;
    if (this.#heatmap[idx] === undefined) {
      debugger
    }
    return idx;
  }

  decayAll(decay = this.defaultDecay) {
    for (const quadrant of this.#heatmap) {
      quadrant.value *= decay;
    }
  }

  decay(x: number, y: number, decay = this.defaultDecay) {
    const index = this.getIndex(x, y);
    this.#heatmap[index].value *= decay;
  }

  get(x: number, y: number) {
    const index = this.getIndex(x, y);
    return this.#heatmap[index].value;
  }

  set(x: number, y: number, value: number | undefined = 1) {
    const index = this.getIndex(x, y);
    this.#heatmap[index].value = value;
  }
  
  clear() {
    for (const quadrant of this.#heatmap) {
      quadrant.value = 0;
    }
  }

  getNearby(x: number, y: number, radius = 0) {
    const items: HeatmapValue[] = [];

    const minX = Math.floor(Math.max(0, x - radius));
    const minY = Math.floor(Math.max(0, y - radius));
    const maxX = Math.floor(Math.min(this.#size - 1, x + radius));
    const maxY = Math.floor(Math.min(this.#size - 1, y + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const index = this.getIndex(x, y);
        items.push(this.#heatmap[index]);
      }
    }

    return items;
  }
}
 

const getAverage = (arr: number[]) => { 
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

const getMax = (arr: number[]) => {
  return Math.max(...arr);
}

type ScoreCalculator = (unit: Unit, orderScore: number, unitScore: number) => number;

/**
 * @public
 */
class UnitInterestScore {
  #bwDat: BwDAT;

  constructor(bwDat: BwDAT) {
    this.#bwDat = bwDat;
  }

  getAverageScore(units: Unit[], scoreModifier: ScoreCalculator) {
    return getAverage(units.map(u => this.unitScore(u, scoreModifier)));
  }

  getMaxScoreUnit(units: Unit[], scoreModifier: ScoreCalculator) {
    return units.reduce((max, unit) => {
      const score = this.unitScore(unit, scoreModifier);
      if (score > this.unitScore(max, scoreModifier)) max = unit;
      return max
    }, units[0]);
  }

  unitScore(unit: Unit, scoreModifier: ScoreCalculator) {
    return scoreModifier(unit, this.getOrderScore(unit.order!), this.getUnitRankScore(unit));
  }

  getUnitRankScore(unit: Unit): number {
    if (rankA.includes(unit.typeId)) {
      return 1;
    } else if (rankB.includes(unit.typeId)) {
      return 0.8;
    } else if (rankC.includes(unit.typeId)) {
      return 0.7;
    } else if (rankD.includes(unit.typeId)) {
      return 0.5;
    } else if (rankE.includes(unit.typeId)) {
      return 0.3;
    }
    return 0.1;
  }

  getOrderScore(order: number) {
    switch (order) {

      // case orders.harvest1:
      // case orders.harvest2:
      // case orders.moveToGas:
      // case orders.waitForGas:
      // case orders.harvestGas:
      // case orders.returnGas:
      // case orders.moveToMinerals:
      // case orders.waitForMinerals:
      // case orders.miningMinerals:
      // case orders.harvest3:
      // case orders.harvest4:
      // case orders.returnMinerals:
      //   return 0.01;

      case orders.gaurd:
      case orders.playerGaurd:
      case orders.turretGaurd:
      case orders.bunkerGaurd:
      case orders.placeBuilding:
      case orders.placeProtossBuilding:
      case orders.createProtossBuilding:
      case orders.constructingBuilding:
      case orders.buildingLand:
      case orders.buildingLiftOff:

        return 0.1;
      case orders.holdPosition:
      case orders.trainFighter:
      case orders.repair:
      case orders.move:
      case orders.researchTech:
      case orders.upgrade:
      case orders.attackMove:
      case orders.attackFixedRange:
        
        return 0.3;
      case orders.unburrowing:
      case orders.medicHeal:
      case orders.train:
      case orders.placeAddOn:
      case orders.buildAddOn:
        return 0.5;

      case orders.attackUnit:

        return 0.8;
      case orders.castConsume:
      case orders.castDarkSwarm:
      case orders.castDefensiveMatrix:
      case orders.castDisruptionWeb:
      case orders.castEmpShockwave:
      case orders.castEnsnare:
      case orders.castFeedback:
      case orders.castHallucination:
      case orders.castInfestation:
      case orders.castIrradiate:
      case orders.castLockdown:
      case orders.castMaelstrom:
      case orders.castMindControl:
      case orders.castNuclearStrike:
      case orders.castOpticalFlare:
      case orders.castParasite:
      case orders.castPlague:
      case orders.castPsionicStorm:
      case orders.castRecall:
      case orders.castRestoration:
      case orders.castSpawnBroodlings:
      case orders.castStasisField:

      case orders.scarabAttack:
      case orders.die:
      case orders.interceptorAttack:
      case orders.unload:
      case orders.moveUnload:
      case orders.enterTransport:
      case orders.sieging:
      case orders.castScannerSweep:
      case orders.burrowing:

        return 1;

      default:
        return 0.01;
    }
  }

  unitOfInterestFilter(unit: Unit) {
    const unitType = this.#bwDat.units[unit.typeId];
    return !unitType.isResourceContainer && unit.owner < 8 && canSelectUnit(unit);
  }

}

function spreadFactorVariance(units: THREE.Vector2[]): number {
  let meanX = 0;
  let meanY = 0;
  let n = units.length;

  // Calculate mean coordinates
  for (let i = 0; i < n; i++) {
    meanX += units[i].x;
    meanY += units[i].y;
  }
  meanX /= n;
  meanY /= n;

  // Calculate variance for X and Y
  let varianceX = 0;
  let varianceY = 0;
  for (let i = 0; i < n; i++) {
    varianceX += Math.pow(units[i].x - meanX, 2);
    varianceY += Math.pow(units[i].y - meanY, 2);
  }
  varianceX /= n;
  varianceY /= n;

  // Calculate total variance
  let totalVariance = varianceX + varianceY;

  return totalVariance;
}

function maxTotalVariance(deltaX: number, deltaY: number): number {
  // Calculate variance using the function from before
  // const calculatedVariance = spreadFactorVariance(points);

  // Calculate maximum possible variance within the quartile
  const maxVarianceX = (Math.pow(0 - deltaX, 2) + Math.pow(deltaX - 0, 2)) / 2;
  const maxVarianceY = (Math.pow(0 - deltaY, 2) + Math.pow(deltaY - 0, 2)) / 2;

  // Normalize the variance
  // const normalizedVariance = calculatedVariance / maxTotalVariance;

  return maxVarianceX + maxVarianceY;;
}

const getCameraDistance = (units: Unit[], mapSize: number[]) => {
  let meanX = 0;
  let meanY = 0;
  let n = units.length;

  // Calculate mean coordinates
  for (let unit of units) {
    meanX += unit.x;
    meanY += unit.y;
  }
  meanX /= n;
  meanY /= n;

  // Calculate variance for X and Y
  let varianceX = 0;
  let varianceY = 0;
  for (let unit of units) {
    varianceX += Math.pow(unit.x - meanX, 2);
    varianceY += Math.pow(unit.y - meanY, 2);
  }
  varianceX /= n;
  varianceY /= n;

  // Optional: Normalize the variance by the dimensions of the map
  const normalizedVarianceX = varianceX / Math.pow(mapSize[0] * 32 / QUAD_SIZE, 2);
  const normalizedVarianceY = varianceY / Math.pow(mapSize[1] * 32 / QUAD_SIZE, 2);

  // Adjust camera distance. This can be a function of normalized variance.
  // For this example, let's say we linearly scale camera distance
  const cameraDistance = Math.sqrt(normalizedVarianceX + normalizedVarianceY);

  return cameraDistance;
}

const QUAD_SIZE = 8;


export default class PluginAddon extends SceneController {

  #unitWorkerScore: UnitInterestScore;
  #units: SimpleQuadtree<Unit>;
  #adhd_uq8: SimpleHeatmap;
  #scores_uq8: SimpleHeatmap;
  #redBlueScore: SimpleHeatmap;

  #lastUpdateFrame = 0;
  #lastHeatMapUpdateFrame = 0;
  #lastUnitDestroyedFrame = 0;
  #lastUnitAttackedFrame = 0;
  #defaultScoreCalculator: ScoreCalculator;

  #quadPos: THREE.Vector2 = new THREE.Vector2();

  #getUQ8(unit: Unit) {
    // because we are using round we need to clamp to QUAD-1
    this.#quadPos.x = THREE.MathUtils.clamp(Math.round(unit.x / (this.map.size[0] * 32) * QUAD_SIZE), 0, QUAD_SIZE - 1);
    this.#quadPos.y =  THREE.MathUtils.clamp(Math.round(unit.y / (this.map.size[1] * 32) * QUAD_SIZE), 0, QUAD_SIZE - 1);
    return this.#quadPos;
  }

  init() {

    this.#unitWorkerScore = new UnitInterestScore(this.assets.bwDat);

    this.#units = new SimpleQuadtree<Unit>(QUAD_SIZE, new THREE.Vector2(this.map.size[0] * 32, this.map.size[1] * 32), new THREE.Vector2(0, 0));
    this.#adhd_uq8 = new SimpleHeatmap(QUAD_SIZE);
    this.#scores_uq8 = new SimpleHeatmap(QUAD_SIZE);

    // this.events.on("pre-run:frame", () => {
    //     for (const u of this.openBW.iterators.units) {
    //         if (this.#isArmyUnit(u)) {
    //             this.#units.insert(u);
    //         }
    //     }
    //     console.log("frame" , this.openBW.getOriginal().getCurrentFrame());
    // });

    this.events.on("pre-run:complete", () => {
      console.log("complete")
    });


    this.events.on("unit-completed", () => {

    });

    this.events.on("unit-killed", (unit) => {
      this.#adhd_uq8.set(this.#getUQ8(unit).x, this.#getUQ8(unit).y, 0);
      this.#lastUnitDestroyedFrame = this.frame;
      if (this.followedUnits.has(unit)) {
          // the unit we were following was killed
          // we need to update the viewport
          this.#lastUpdateFrame = 0;
      }
    }, -1);

    this.events.on("unit-destroyed", (unit) => {
      if (this.#secondFollowedUnit?.id === unit.id) {
        this.#secondFollowedUnit = undefined;
      }
    });

    this.events.on("unit-updated", (unit) => {
      const { x: mX, y: mY } = this.#getUQ8(unit);

      if (this.#unitWorkerScore.unitOfInterestFilter(unit)) {
        this.#units.add(unit.x, unit.y, unit);
      }
      if (unit.extras.recievingDamage) {
        this.#adhd_uq8.decay(mX, mY);
        if (!canOnlySelectOne(unit)) {
          this.selectedUnits.add(unit);
        }
      } else {
        this.selectedUnits.delete(unit);
      }

      if (unit.isAttacking) {
        this.#adhd_uq8.decay(mX, mY);
        this.#lastUnitAttackedFrame = this.frame;
      }
    });

    this.events.on("frame-reset", () => {
      this.#reset();
      this.#adhd_uq8.clear();
    })

    this.#defaultScoreCalculator = (unit: Unit, orderScore: number, unitScore: number) => {
      const result = this.#defaultScoreCalculatorUnbound(unit, orderScore, unitScore);
      return result;
    }

  }

  #reset() {
    this.#secondFollowedUnit = undefined;
    this.followedUnits.clear();
    this.#units.clear();
  }

  async #setupCamera(viewport: GameViewPort) {
    const orbit = viewport.orbit;

    orbit.camera.far = DEFAULT_FAR;
    orbit.camera.fov = 15;
    orbit.camera.updateProjectionMatrix();

    orbit.dollyToCursor = true;
    orbit.verticalDragToForward = true;

    orbit.maxDistance = 128;
    orbit.minDistance = 20;

    orbit.maxPolarAngle = POLAR_MAX;
    orbit.minPolarAngle = POLAR_MIN + THREE.MathUtils.degToRad(this.config.tilt);
    orbit.maxAzimuthAngle = THREE.MathUtils.degToRad(45);
    orbit.minAzimuthAngle = -THREE.MathUtils.degToRad(45);

    await orbit.rotatePolarTo(POLAR_MAX, false);
    await orbit.rotateAzimuthTo(0, false);
    await orbit.zoomTo(1, false);
    await orbit.dollyTo(55, false);
  }

  

  public async onEnterScene(prevData) {
    this.viewport.fullScreen();
    this.viewport.rotateSprites = true;

    this.#reset();

    await this.#setupCamera(this.viewport);
    await this.#setupCamera(this.secondViewport);

    this.secondViewport.name = "pip";
    this.secondViewport.height = this.config.pipSize;
    this.secondViewport.right = 0.05;
    this.secondViewport.bottom = 0.05;

    this.settings.input.unitSelection.set(false);
    this.settings.input.cursorVisible.set(false);

    this.viewport.cameraShake.enabled = true;
    this.viewport.cameraShake.maxShakeDistance = 100;
    this.viewport.orbit.dampingFactor = 0.000001;

    this.viewport.orbit.dollySpeed = 0.01;
    this.viewport.orbit.truckSpeed = 0.01;

    this.#adhd_uq8.defaultDecay = this.config.heatMapDecay;

    this.#polarTarget = POLAR_MAX;
    this.#azimuthTarget = 0;

  }

  onConfigChanged(oldConfig: Record<string, unknown>): void {
    console.log(this.config)
    this.secondViewport.height = this.config.pipSize;
    this.#adhd_uq8.defaultDecay = this.config.heatMapDecay;
  }

  #secondFollowedUnit: Unit | undefined;

  #defaultScoreCalculatorUnbound: ScoreCalculator = (unit: Unit, orderScore: number, unitScore: number) => {
    const unitType = this.assets.bwDat.units[unit.typeId];

    if (unitType.isBuilding) {
      if (Math.sin(this.elapsed / 20000 * Math.PI * 2) > 0) {
        return orderScore * unitScore * 2;
      }
    }

    return orderScore * unitScore;
  }


  #activateSecondQuadrant(quadrant: Quadrant<Unit>) {
    let maxScoreUnit = this.#secondFollowedUnit = this.#unitWorkerScore.getMaxScoreUnit(quadrant.items, this.#defaultScoreCalculator);

    const nx = maxScoreUnit.x;// quadrant.x / this.#units.size * 32 * this.map.size[0] + 16 * 32;
    const ny = maxScoreUnit.y;//quadrant.y / this.#units.size * 32 * this.map.size[1] + 16 * 32;

    this.pxToWorld.xyz(nx, ny, _pos);

    this.secondViewport.orbit.moveTo(
      _pos.x,
      _pos.y,
      _pos.z,
      true
    );
    this.secondViewport.orbit.dollyTo(this.config.baseDistance * 3 / 4, true)

    // this.secondViewport.orbit.rotatePolarTo(this.secondViewport.orbit.minPolarAngle + Math.random() * THREE.MathUtils.degToRad(this.config.polarVariance), true);
    // this.secondViewport.orbit.rotateAzimuthTo((-0.5 + Math.random()) * THREE.MathUtils.degToRad(this.config.azimuthVariance), true);

  }

  #polarTarget = 0;
  #azimuthTarget = 0;

  #activateQuadrant(quadrant: Quadrant<Unit>) {
    this.followedUnits.clear();

    //todo change to top 3 units?
    let maxScoreUnit = this.#unitWorkerScore.getMaxScoreUnit(quadrant.items, this.#defaultScoreCalculator);

    const nx = maxScoreUnit.x;// quadrant.x / this.#units.size * 32 * this.map.size[0] + 16 * 32;
    const ny = maxScoreUnit.y;//quadrant.y / this.#units.size * 32 * this.map.size[1] + 16 * 32;

    // let x = nx, y = ny;
    // for (const unit of quadrant.items) {
    //     x = x * (1 - this.#unitWorkerScore.unitScore(unit) / maxScore) + unit.x * (this.#unitWorkerScore.unitScore(unit) / maxScore);
    //     y = y * (1 - this.#unitWorkerScore.unitScore(unit) / maxScore) + unit.y * (this.#unitWorkerScore.unitScore(unit) / maxScore);
    // }

    this.pxToWorld.xyz(nx, ny, _pos);

    this.viewport.orbit.getTarget(_a);
    
    this.viewport.orbit.moveTo(
      _pos.x,
      _pos.y,
      _pos.z,
      this.#areProximate(_pos, _a)
    );

    const cameraAdjustment = getCameraDistance(quadrant.items, this.map.size);
    // const spread = spreadFactorVariance(quadrant.items) / this.#maxTotalSpreadVariance;
    // console.log("SPREAD", cameraAdjustment, easeOutCubic(cameraAdjustment));
    // 1 is zoom all the way out
    const lerpedBaseDistance = THREE.MathUtils.lerp(this.config.baseDistance, this.config.baseDistance + this.config.distanceVariance, easeOutCubic(cameraAdjustment));

    this.viewport.orbit.dollyTo(lerpedBaseDistance, true)
    // this.viewport.orbit.dollyTo(this.config.baseDistance - (this.config.distanceVariance / 2) + Math.random() * this.config.distanceVariance, true)

    console.log(this.viewport.orbit.minPolarAngle, THREE.MathUtils.degToRad(this.config.polarVariance));

    this.#polarTarget = this.viewport.orbit.minPolarAngle + Math.random() * THREE.MathUtils.degToRad(this.config.polarVariance);
    this.#azimuthTarget = (-0.5 + Math.random()) * THREE.MathUtils.degToRad(this.config.azimuthVariance);

   

    this.followedUnits.set([maxScoreUnit])

    this.#lastUpdateFrame = this.elapsed;
  }

  #groundTarget(viewport, t) {
    return viewport.orbit.getTarget(t).setY(0);
  }

  #areProximate(a, b) {
    return a.distanceTo(b) < PIP_PROXIMITY;
  }

  #areProximateViewports(a, b) {
    return this.#areProximate(
      this.#groundTarget(a, _a),
      this.#groundTarget(b, _b)
    );
  }

  onMinimapDragUpdate(pos, isDragStart, mouseButton) {

    if (mouseButton === 0) {
      _c.set(pos.x, 0, pos.y);

      if (isDragStart) {
        this.secondViewport.enabled = true;
      }

      this.secondViewport.orbit.moveTo(pos.x, 0, pos.y, !isDragStart);

    }

  }

  #isArmyUnit(unit: Unit): boolean {
      return this.assets.bwDat.units[unit.typeId].supplyRequired > 0 && !this.#isWorker(unit.typeId);
  }

  #isWorker(unitTypeId) {
      return workerTypes.includes(unitTypeId);
  }

  #targetGameSpeed = 1;
  #lastSelectedQuadrant: Quadrant<Unit> | undefined;

  onFrame(frame: number, commands: any[]): void {


    const dampSpeed = this.#targetGameSpeed > 1 ? 0.5 : 1;
    this.openBW.setGameSpeed(THREE.MathUtils.damp(this.openBW.gameSpeed, THREE.MathUtils.clamp(this.#targetGameSpeed, 1, this.config.maxReplaySpeed), dampSpeed, this.delta / 1000));

    this.viewport.orbit.rotatePolarTo(THREE.MathUtils.damp(this.viewport.orbit.polarAngle, this.#polarTarget, 0.5, this.delta / 1000), true);
    this.viewport.orbit.rotateAzimuthTo(THREE.MathUtils.damp(this.viewport.orbit.azimuthAngle, this.#azimuthTarget, 0.5, this.delta / 1000), true);

    for (const quadrant of this.#units.quadrants) {
      let sumScore = 0, avgScore = 0;

      //todo weighted positions
      for (const unit of quadrant.items) {
        const unitScore = this.#unitWorkerScore.unitScore(unit, this.#defaultScoreCalculator);
        if (isNaN(unitScore)) {
          debugger;
        }
        sumScore += unitScore;
      }
      avgScore = sumScore / (quadrant.items.length || 1);
      // todo remove avg since we already know
      this.#scores_uq8.set(quadrant.x, quadrant.y, avgScore);
    }
    
    this.sendUIMessage({
      speed: this.openBW.gameSpeed,
      targetSpeed: this.#targetGameSpeed,

      state: {
        lastHeatMapUpdateFrame: this.#lastHeatMapUpdateFrame,
        lastUpdateFrame: this.#lastUpdateFrame,
        elapsed: this.elapsed,
        frame,
      },
      data: {
        size: this.#units.size,
        quadrants: this.#units.quadrants.map((q) => {
          return {
            x: q.x,
            y: q.y,
            score: this.#scores_uq8.get(q.x, q.y),
            units: q.items.length,
            heatmap: this.#adhd_uq8.get(q.x, q.y),
          }
        })
      }
    })

    if (this.elapsed - this.#lastHeatMapUpdateFrame > this.config.heatmapUpdateInterval) {
      this.#adhd_uq8.decayAll();
      this.#lastHeatMapUpdateFrame = this.elapsed;
    }

    if (this.elapsed - this.#lastUpdateFrame > this.config.cameraMoveTime) {

      let hottestScore = 0;
      let hottestQuadrant: Quadrant<Unit> | undefined;
      let secondHottestQuadrant: Quadrant<Unit> | undefined;

      let decayedScore = 0, decayedSecondScore = 0;


      //TODO; if a quadrants score doubles from last frame, it should be prioritized
      for (const quadrant of this.#units.quadrants) {
        decayedScore = this.#scores_uq8.get(quadrant.x, quadrant.y) * (1 - this.#adhd_uq8.get(quadrant.x, quadrant.y));
        
        if (decayedScore > hottestScore) {
            hottestScore = decayedScore;
            secondHottestQuadrant = hottestQuadrant;
            hottestQuadrant = quadrant;
        }
      }

      if (hottestQuadrant && hottestQuadrant.items.length > 0) {

        this.#activateQuadrant(hottestQuadrant);
        this.#adhd_uq8.set(hottestQuadrant.x, hottestQuadrant.y, 1);
        this.#lastSelectedQuadrant = hottestQuadrant;

        if (secondHottestQuadrant) {
          decayedSecondScore =this.#scores_uq8.get(secondHottestQuadrant.x, secondHottestQuadrant.y) * (1 - this.#adhd_uq8.get(secondHottestQuadrant.x, secondHottestQuadrant.y));
          if (decayedSecondScore > hottestScore * distance(hottestQuadrant, secondHottestQuadrant)/8) {
            this.#activateSecondQuadrant(secondHottestQuadrant);
            this.secondViewport.enabled = true;
          } else {
            this.secondViewport.enabled = false;
          }
        } else {
          this.secondViewport.enabled = false;
        }

        const nearbyHeat = this.#scores_uq8.getNearby(hottestQuadrant.x, hottestQuadrant.y, 1);
        let nearbySum = 0;
        for (const h of nearbyHeat) {
          nearbySum += h.value// * (1 -0 this.#adhd.get(h.x, h.y));
        }

        let nearbyAttacking = 0, armyTotal = 1;

        for (const unit of hottestQuadrant.items) {
          if (this.#isArmyUnit(unit)) {
            armyTotal++;
            if (unit.isAttacking) {
              nearbyAttacking++;
            }
          }
        }
        // v1- calculated speed on winning quadrant only, obv not great, lets try adding a nearby quadrant too
        const speedLerpX =  easeOutCubic(nearbySum);
        
        this.#targetGameSpeed = THREE.MathUtils.lerp(this.config.maxReplaySpeed, 1, speedLerpX);

      }

    }

    if (this.frame < 30 * 24 || this.frame > this.#lastUnitAttackedFrame + 4 * 60 * 24 || this.frame > this.#lastUnitDestroyedFrame + 8 * 60 * 24) {
          this.#targetGameSpeed = 1;
    }

    this.#units.clear();

    if (this.followedUnits.size) {

      const pos = this.getFollowedUnitsCenterPosition();

      if (pos) {

        this.viewport.orbit.moveTo(pos.x, pos.y, pos.z, true);

      }

    }

    if (this.#secondFollowedUnit) {
      this.pxToWorld.xyz(this.#secondFollowedUnit.x, this.#secondFollowedUnit.y, _pos);
      this.secondViewport.orbit.moveTo(_pos.x, _pos.y, _pos.z, true);
    }

    this.secondViewport.enabled = this.secondViewport.enabled && !this.#areProximateViewports(this.viewport, this.secondViewport);
  }

  // #isNearStartLocation(player: Player | undefined, pos: THREE.Vector3): boolean {

  //   const distance = 32;
  //   for (const p of this.players) {
  //     if (p.startLocation) {
  //       if (!this.#isNearOwnStartLocation(player, p.startLocation) && p.startLocation.distanceTo(pos) <= distance) {
  //         return true;
  //       }
  //     }
  //   }
  //   return false;
  // }

  // #isNearOwnStartLocation(player: Player | undefined, pos: THREE.Vector3): boolean {
  //   if (player == undefined || player.startLocation === undefined) return false;

  //   const distance = 10 * 32
  //   return (player.startLocation.distanceTo(pos) <= distance);
  // }


}
