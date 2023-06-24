import React from "react";
import { enums, usePluginConfig, assets, getUnitIcon } from "@titan-reactor-runtime/ui";

import Health from "./health.jsx";
import Shields from "./shields.jsx";
import Resource from "./resource.jsx";
import Energy from "./energy.jsx";
import Kills from "./kills.jsx";
import Wireframe from "./wireframe.jsx";
import Progress from "./progress.jsx";
import Name from "./name.jsx";
import Queue from "./queue.jsx";
import Loaded from "./loaded.jsx";
// import Upgrades from "./upgrades";

const UnitDisplayLarge = ({ unit }) => {
  const config = usePluginConfig();
  const cmdIcons = assets.cmdIcons;

  const icon = getUnitIcon(unit);

  const showHp = !(unit.extras.dat.isResourceContainer && unit.owner > 7);
  const showShields = unit.extras.dat.shieldsEnabled;
  const showEnergy = unit.extras.dat.isSpellcaster;
  const showKillsExtraUnits = [
    enums.unitTypes.carrier,
    enums.unitTypes.reaver,
    enums.unitTypes.siegeTankTankMode,
    enums.unitTypes.siegeTankSiegeMode,
  ];

  const showKills =
    //TODO: improve this. we're testing for comsat station here because it is a "spell caster"
    unit.typeId !== enums.unitTypes.comsatStation &&
    (!(
      !unit.extras.dat.isSpellcaster &&
      unit.extras.dat.groundWeapon === 130 &&
      unit.extras.dat.airWeapon === 130
    ) || showKillsExtraUnits.includes(unit.typeId));

  const showResourceAmount = unit.resourceAmount > 0;
  const showBuildQueue = !unit.extras.dat.isZerg && unit.buildQueue?.length > 1;

  return (
    <div>
      <div>
        {config.largeShowUnitName && <Name unit={unit} />}
        {/* <Upgrades unit={unit} /> */}
      </div>
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            padding: "var(--size-1)",
          }}
        >
          <Wireframe unit={unit} size="md" />

          <div
            style={{
              marginLeft: "var(--size-1)",
              flexBasis: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "end",
              fontSize: config.bodyFontSize
            }}
          >
            {showShields && <Shields unit={unit} />}
            {showHp && <Health unit={unit} />}
            {showResourceAmount && <Resource unit={unit} />}
            {showEnergy && <Energy unit={unit} />}
            {showKills && <Kills unit={unit} />}
            {showBuildQueue && (
              <Queue
                units={unit.buildQueue.slice(1)}
              />
            )}
          </div>
        </div>
        {unit.loaded?.length && <Loaded unit={unit} />}
        {icon === null ? null : (
          <img
            src={cmdIcons[icon]}
            style={{
              marginTop: "-46px",
              marginLeft: "46px",
              border: "var(--border-size-2)",
              borderRadius: "var(--radius-2)",
              width: "var(--size-8)",
              height: "var(--size-8)",
              filter: "sepia(1) brightness(1.1)",
              background: "#111",
              border: "1px solid #555",
            }}
          />
        )}
        {!unit.loaded && <Progress unit={unit} />}
      </div>
    </div>
  );
};
export default UnitDisplayLarge;
