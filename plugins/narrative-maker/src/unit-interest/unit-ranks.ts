const unitTypes = enums.unitTypes;

/*
 unitTypes.overlord,
unitTypes.scv, unitTypes.drone, unitTypes.probe
*/
const rankA: number[] = [
  unitTypes.ghost,
  unitTypes.scienceVessel,
  unitTypes.battleCruiser,
  unitTypes.nuclearMissile,
  unitTypes.ultralisk,
  unitTypes.guardian,
  unitTypes.queen,
  unitTypes.defiler,
  unitTypes.infestedTerran,
  unitTypes.darkTemplar,
  unitTypes.devourer,
  unitTypes.darkArchon,
  unitTypes.arbiter,
  unitTypes.carrier,

  unitTypes.scarab,
  unitTypes.scannerSweep,
  unitTypes.darkSwarm,


];

const rankB: number[] = [
  unitTypes.goliath,
  unitTypes.wraith,
  unitTypes.siegeTankSiegeMode,
  unitTypes.broodling,
  unitTypes.mutalisk,
  unitTypes.scourge,
  unitTypes.dropship,
  unitTypes.valkryie,
  unitTypes.corsair,
  unitTypes.highTemplar,
  unitTypes.archon,
  unitTypes.scout,
  unitTypes.reaver,
];

const rankC: number[] = [
  unitTypes.siegeTankTankMode,
  unitTypes.vulture,
  unitTypes.firebat,
  unitTypes.hydralisk,
  unitTypes.zealot,
  unitTypes.dragoon,
  unitTypes.shuttle,
  unitTypes.lurker,

];

const rankD: number[] = [
  unitTypes.marine,
  unitTypes.medic,
  unitTypes.zergling,
  unitTypes.interceptor,
  unitTypes.lurkerEgg,
];

const rankE: number[] = [
  unitTypes.spiderMine,
  unitTypes.mutaliskCocoon,
  unitTypes.observer,
  unitTypes.disruptionWeb,
  unitTypes.overlord,
  unitTypes.scv,
  unitTypes.drone,
  unitTypes.probe,
];

export const regularUnitRanks: number[][] = [rankA, rankB, rankC, rankD, rankE];

const buildingRankA: number[] = [
  unitTypes.templarArchives,
  unitTypes.fleetBeacon,
  unitTypes.arbitalTribunal,
  unitTypes.scannerSweep,
];

export const buildingRankB: number[] = [
  unitTypes.starport,
  unitTypes.scienceFacility,
  unitTypes.engineeringBay,
  unitTypes.armory,
  unitTypes.bunker,
  unitTypes.lair,
  unitTypes.spire,
  unitTypes.cyberneticsCore,
  unitTypes.stargate,
  unitTypes.roboticsSupportBay,
];

export const buildingRankC: number[] = [
  unitTypes.barracks,
  unitTypes.academy,
  unitTypes.factory,
  unitTypes.machineShop,
  unitTypes.missileTurret,
  unitTypes.hydraliskDen,
  unitTypes.gateway,
  unitTypes.photonCannon,
  unitTypes.citadelOfAdun,
  unitTypes.roboticsFacility,
  unitTypes.observatory,
];

export const buildingRankD: number[] = [
  unitTypes.supplyDepot,
  unitTypes.refinery,
  unitTypes.controlTower,
  unitTypes.evolutionChamber,
  unitTypes.spawningPool,
  unitTypes.pylon,
  unitTypes.forge,
  unitTypes.shieldBattery,
  unitTypes.sporeColony,
  unitTypes.sunkenColony,
];

export const buildingRankE: number[] = [
  unitTypes.comsatStation,
  unitTypes.creepColony,
  unitTypes.extractor,
  unitTypes.assimilator,
  unitTypes.commandCenter,
  unitTypes.nexus,
  unitTypes.hatchery,
];

export const buildingUnitRanks: number[][] = [
  buildingRankA,
  buildingRankB,
  buildingRankC,
  buildingRankD,
  buildingRankE,
];
