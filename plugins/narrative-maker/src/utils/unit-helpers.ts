import { BwDAT, Unit } from "@titan-reactor-runtime/host";
import { GridItem } from "../structures/grid-item";

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

export interface AO_Unit extends Unit {
  extras: Unit["extras"] & {
    autoObserver: {
      score: number;
      timeOnStrategyQueueMS: number;
    };
  }
}

export type Quadrant = GridItem<AO_Unit[], QuadrantUserData>;

export type QuadrantUserData = {
  active: {
    score:number,
    action:number,
    adhd: number, 
    tension: number, 
    strategy: number,
  },
  lastUsed: {
    score:number,
    action:number,
    adhd: number, 
    tension: number, 
    strategy: number,
  }
  
}