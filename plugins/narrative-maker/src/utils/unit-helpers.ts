import { BwDAT, Unit } from "@titan-reactor-runtime/host";
import { GridItem } from "../structures/grid-item";
import { getAverageAngle, getAngle } from "./math-utils";
import PluginAddon from "..";

export const unitTypes = enums.unitTypes;
const UnitFlags = enums.UnitFlags;
const orders = enums.orders;

export const workerTypes = [
    enums.unitTypes.scv,
    enums.unitTypes.drone,
    enums.unitTypes.probe,
];

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
  
export const canOnlySelectOne = (unit: Unit) =>
_canOnlySelectOne.includes(unit.typeId);

export const isArmyUnit = (unit: Unit, bwDat: BwDAT) => bwDat.units[unit.typeId].supplyRequired > 0 &&
!workerTypes.includes(unit.typeId)

export const isWorkerUnit = (unit: Unit) => workerTypes.includes(unit.typeId)

const harvestOrders = [
  enums.orders.harvest1,
  enums.orders.harvest2,
  enums.orders.moveToGas,
  enums.orders.waitForGas,
  enums.orders.harvestGas,
  enums.orders.returnGas,
  enums.orders.moveToMinerals,
  enums.orders.waitForMinerals,
  enums.orders.miningMinerals,
  enums.orders.harvest3,
  enums.orders.harvest4,
  enums.orders.returnMinerals,
]

export const isHarvesting = (unit: Unit) => harvestOrders.includes(unit.order);

export const unitIsCompleted = (unit: Unit) => {
  return unit.statusFlags & UnitFlags.Completed;
};

export const canSelectUnit = (unit: Unit | undefined) => {
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

export const isTownCenter = (unit: Unit) => {
  return unit.typeId === unitTypes.commandCenter ||
    unit.typeId === unitTypes.nexus ||
    unit.typeId === unitTypes.hatchery;
}

// #calculateUnitPosWeightedCenter = calculateMedianCenter(unit => unit)
// #calculateUnitHeadingWeightedCenter = calculateMedianCenter(unit => {
//   const plugin = this.#plugin;
//   if (plugin.assets.bwDat.units[unit.typeId].isBuilding) { 
//     return unit;
//   }
//   const angle = getAngle(unit.currentVelocityDirection);
//   _a2.x = unit.x + Math.cos(angle) * unit.currentSpeed * 64;
//   _a2.y = unit.y + Math.sin(angle) * unit.currentSpeed * 64;
//   return _a2;
// })

// calculateMoveTargetsFromUnits(units: Unit[]) {
//   const plugin = this.#plugin;
//   const center = this.#calculateUnitPosWeightedCenter(
//     _a2,
//     units,
//   );

//   // group by speed, pick biggest speed, if tied, pick biggest speed
//   const moveCenter = this.#calculateUnitHeadingWeightedCenter(
//     _b2,
//     units,
//   );

//   plugin.pxToWorld.xyz(center.x, center.y, _ma);
//   plugin.pxToWorld.xyz(moveCenter.x, moveCenter.y, _mb);

//   return _ml;

// }

export interface AO_Unit extends Unit {
  extras: Unit["extras"] & {
    ao_score: number;
    ao_timeOnStrategyQueueMS: number;
  }
}

export type Quadrant = GridItem<AO_Unit[]>;

let _angles: number[] = [];
let _avgResult = {
  angle: 0,
  speed: 0,
}
export const getAverageUnitDirectionAndSpeed = (units: AO_Unit[]) => {
  if (units.length === 0) {
    _avgResult.angle = 0;
    _avgResult.speed = 0;
    return _avgResult;
  }

  _angles.length = 0;
  let _speed = 0;
  for (const unit of units) {
    _angles.push(getAngle(unit.direction));
    _speed += unit.currentSpeed;
  }
  
  _avgResult.angle = getAverageAngle(_angles);
  _avgResult.speed = _speed / units.length;

  return _avgResult;
}

export const getUnitDirectionAndSpeed = (unit: AO_Unit) => {
  _avgResult.angle = getAngle(unit.direction);
  _avgResult.speed = unit.currentSpeed;
  return _avgResult;
}

export const getUnitsFromLargestRepresentedTeam = (units: AO_Unit[]) => {

  let _teams: AO_Unit[][] = [];

  // find largest representative team via unit.owner
  for (const unit of units) {
    _teams[unit.owner] = _teams[unit.owner] || [];
    _teams[unit.owner].push(unit);
  }

  // gaps in team owner ids will be undefined, so filter them out
  const largestTeam = _teams.filter(x => x).reduce((a, b) => a.length > b.length ? a : b, []);

  return largestTeam;

}