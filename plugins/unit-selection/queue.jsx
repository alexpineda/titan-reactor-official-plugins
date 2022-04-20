import React from "react";
import { enums, assets } from "titan-reactor";

const getResearchIcon = (unit) => {
  return null;
//   if (!unit.owner) return null;

//   const t = tech[unit.owner.id].find(
//     (t) => t && t.unitId === unit.id && !t.timeCompleted
//   );
//   if (t) {
//     return t.icon;
//   }
//   const u = upgrades[unit.owner.id].find(
//     (t) => t && t.unitId === unit.id && !t.timeCompleted
//   );
//   if (u) {
//     return u.icon;
//   }
//   return null;
};

const unitIsComplete = (unit) => {
    return unit.statusFlags & 0x01 === 1;
}

const getUnitIcon = (unit) => {
  if (
    (unit.extras.dat.isBuilding &&
      !unit.extras.dat.isZerg &&
      unitIsComplete(unit) &&
      unit.buildQueue?.length) ||
    (unit.extras.dat.isZerg &&
      !unit.extras.dat.isBuilding &&
      unit.buildQueue?.length)
  ) {
    return unit.buildQueue[0];
  }

  if (unitIsComplete(unit) && unit.remainingTrainTime) {
    if (unit.typeId === enums.unitTypes.reaver) {
      return enums.unitTypes.scarab;
    } else if (unit.typeId === enums.unitTypes.carrier) {
      return enums.unitTypes.interceptor;
    } else if (unit.typeId === enums.unitTypes.nuclearSilo) {
      return enums.unitTypes.nuclearMissile;
    }
  }

  return null;
};

const Queue = ({ unit }) => {
  const cmdIcons = assets.cmdIcons;

  const icon = getUnitIcon(unit) ?? getResearchIcon(unit)
;

  return (
    icon === null ? null : <div style={{
        display:"flex",
    }}>
      <img
        src={cmdIcons[icon]}
        style={{
          border: "var(--border-size-2)",
          borderRadius: "var(--radius-2)",
          width: "48px",
          height: "48px",
          filter: "hue-rotate(69deg) brightness(5)",
          borderColor: "#111",
        }}
      />
    </div>
  );
};
export default Queue;
