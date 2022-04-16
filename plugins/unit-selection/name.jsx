import React from "react";
import { assets } from "titan-reactor";

const removeRacePrefix = (name) => name.replace(/^(Terran|Zerg|Protoss)/, "").trim();

const getZergBuildingTypeName = (unit, units) => {
    const queuedZergType =
      unit.extras.dat.isZerg && unit.queue?.units?.length
        ? units[unit.queue.units[0]]
        : null;
    return queuedZergType && unit.extras.dat.isBuilding ? queuedZergType.name : null;
  };

const Name = ({ unit, className = "" }) => {
  const bwDat = assets.bwDat;
  const name = getZergBuildingTypeName(unit, bwDat.units) ?? unit.extras.dat.name;

  return <p 
  style={{
    color: "white",
    textTransform: "uppercase",
  }}
  className={className}>{removeRacePrefix(name)}</p>;
};
export default Name;
