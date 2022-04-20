import React from "react";
import range from "https://cdn.skypack.dev/lodash.range";
import { enums } from "titan-reactor";
import SmallUnitItem from "./small-unit-item.jsx";

const sumKills = (tkills, { kills }) => tkills + kills;

const UnitsDisplaySmall = ({ units }) => {
  const showKillsExtraUnits = [
    enums.unitTypes.carrier,
    enums.unitTypes.reaver,
    enums.unitTypes.siegeTankTankMode,
    enums.unitTypes.siegeTankSiegeMode,
  ];

  const hasNonAttackers = (unit) =>
    !unit.extras.dat.isSpellcaster &&
    unit.extras.dat.groundWeapon === 130 &&
    unit.extras.dat.airWeapon === 130 &&
    !showKillsExtraUnits.includes(unit.typeId);

  const getKills = () => {
    if (units.some(hasNonAttackers)) {
      return "";
    } else {
      return `Kills: ${units.reduce(sumKills, 0)}`;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        paddingLeft: "var(--size-1)",
        paddingTop: "var(--size-1)",
        flex: "1",
        minHeight: "2.75rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 2.5rem)",
          gridTemplateRows: "repeat(2, 2.5rem)",
          gridGap: ".25rem",
        }}
      >
        {range(0, 12).map((i) => (
          <SmallUnitItem key={i} index={i} unit={units[i]} units={units} showLoaded={false} />
        ))}
      </div>

      <div
        style={{
          textAlign: "center",
          width: "100%",
          alignSelf: "center",
          padding: "var(--size-1)",
          color: "var(--gray-4)",
        }}
      >
        {getKills()}
      </div>
    </div>
  );
};
export default UnitsDisplaySmall;
