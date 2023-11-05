import React from "react";
import { assets, usePluginConfig } from "@titan-reactor-runtime/ui";

const removeRacePrefix = (name) => name.replace(/^(Terran|Zerg|Protoss)/, "").trim();

const getZergBuildingTypeName = (unit, units) => {
    const queuedZergType =
      unit.extras.dat.isZerg && unit.buildQueue?.length
        ? units[unit.buildQueue[0]]
        : null;
    return queuedZergType && unit.extras.dat.isBuilding ? queuedZergType.name : null;
  };

const Name = ({ unit, className = "" }) => {
  const bwDat = assets.bwDat;
  const name = getZergBuildingTypeName(unit, bwDat.units) ?? unit.extras.dat.name;
  const config = usePluginConfig();

  return <p 
  style={{
    color: "var(--gray-4)",
    textTransform: "uppercase",
    textAlign: "center",
    fontFamily: 'Inter',
    width: "100%",
    marginBottom: "var(--size-2)",
    fontSize: config.unitNameFontSize
  }}
  className={className}>{removeRacePrefix(name)}</p>;
};
export default Name;
