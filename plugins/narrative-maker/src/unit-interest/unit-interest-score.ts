import { getAverage } from "../math-utils";
import { BwDAT, Unit } from "@titan-reactor-runtime/host";

const orders = enums.orders;
const unitTypes = enums.unitTypes;
const UnitFlags = enums.UnitFlags;

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

export type ScoreModifier = (
  unit: Unit,
  orderScore: number,
  unitScore: number
) => number;

/**
 * @public
 */
export class UnitAndOrderScoreCalculator {
  #bwDat: BwDAT;
  scoreModifier: ScoreModifier = (_, orderScore, unitScore) => {
    return orderScore * unitScore;
  }
  #ranks: number[][];

  constructor(bwDat: BwDAT, ranks: number[][], scoreModifier?: ScoreModifier) {
    this.#bwDat = bwDat;
    if (scoreModifier) this.scoreModifier = scoreModifier;
    this.#ranks = ranks;
  }

  getAverageScore(units: Unit[], scoreModifier = this.scoreModifier) {
    return getAverage(units.map((u) => this.unitScore(u, scoreModifier)));
  }

  getMaxScoreUnit(units: Unit[], scoreModifier = this.scoreModifier) {
    return units.reduce((max, unit) => {
      const score = this.unitScore(unit, scoreModifier);
      if (score > this.unitScore(max, scoreModifier)) max = unit;
      return max;
    }, units[0]);
  }

  unitScore(unit: Unit, scoreModifier = this.scoreModifier) {
    return scoreModifier(
      unit,
      this.getOrderScore(unit.order!),
      this.getUnitRankScore(unit)
    );
  }

  getUnitRankScore(unit: Unit): number {
    if (this.#ranks[0].includes(unit.typeId)) {
      return 1;
    } else if (this.#ranks[1].includes(unit.typeId)) {
      return 0.8;
    } else if (this.#ranks[2].includes(unit.typeId)) {
      return 0.7;
    } else if (this.#ranks[3].includes(unit.typeId)) {
      return 0.5;
    } else if (this.#ranks[4].includes(unit.typeId)) {
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

      case orders.repair:
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
    return (
      !unitType.isResourceContainer && unit.owner < 8 && canSelectUnit(unit)
    );
  }
}
