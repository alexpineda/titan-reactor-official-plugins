import { BwDAT, Unit } from "@titan-reactor-runtime/host";

export const unitTypes = enums.unitTypes;

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