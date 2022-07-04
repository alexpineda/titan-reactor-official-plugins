import React from "react";
import range from "https://cdn.skypack.dev/lodash.range";
import { enums, usePluginConfig, useSendMessage } from "titan-reactor";
import SmallUnitItem from "./small-unit-item.jsx";

const sumKills = (tkills, { kills }) => tkills + kills;

const UnitsDisplaySmall = ({  units }) => {

  const config = usePluginConfig();
  const sendMessage = useSendMessage();

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
        flexDirection: "column",
        paddingTop: "var(--size-1)",
      }}
    >
      <div
        style={{
          display: config.smallShowKills ? "block" : "none",
          textAlign: "center",
          width: "100%",
          alignSelf: "center",
          padding: "var(--size-1)",
          color: "var(--gray-4)",
        }}
      >
        {getKills()}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 2.5rem)",
          gridTemplateRows: "repeat(6, 2.5rem)",
          gridGap: ".25rem",
        }}
      >
        {range(0, 12).map((i) => (
          <SmallUnitItem
            key={units[i]?.id}
            unit={units[i]}
            owner={units[i]?.owner}
            showLoaded={false}
            onClick={() => {
              units[i] && sendMessage({
                type: "unit-selection-click",
                payload: {
                  unitId: units[i].id,
                },
              });
            }}
          />
        ))}
      </div>
    </div>
  );
};
export default UnitsDisplaySmall;
