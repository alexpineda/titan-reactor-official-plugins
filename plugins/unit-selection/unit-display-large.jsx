import React, { useEffect, useRef } from "react";
import { enums } from "titan-reactor";

import Health from "./health.jsx";
import Shields from "./shields.jsx";
import Resource from "./resource.jsx";
import Energy from "./energy.jsx";
import Kills from "./kills.jsx";
import Wireframe from "./wireframe.jsx";
import Progress from "./progress.jsx";
import Name from "./name.jsx";
// import Queue from "./queue";
// import Loaded from "./loaded";
// import Upgrades from "./upgrades";

const UnitDisplayLarge = ({ config, unit }) => {

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
    !(
      !unit.extras.dat.isSpellcaster &&
      unit.extras.dat.groundWeapon === 130 &&
      unit.extras.dat.airWeapon === 130
    ) || showKillsExtraUnits.includes(unit.typeId);

  const showResourceAmount = unit.resourceAmount > 0;

  const loadedRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    if (!loadedRef.current || !progressRef.current) return;

    //TOOD: add unit.loaded to unit.extras.dat
    loadedRef.current.style.display = unit.loaded ? "flex" : "none";
    progressRef.current.style.display = unit.loaded ? "none" : "block";
  }, [unit]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingTop: "var(--size-1)",
          paddingLeft: "var(--size-3)",
        }}
      >
        {config.largeShowUnitName && <Name unit={unit} />}
        {/* <Upgrades unit={unit} /> */}
      </div>
      <div
        style={{
          display: "flex",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "50%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Wireframe unit={unit} size="md" />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            {showHp && <Health unit={unit} />}
            {showShields && <Shields unit={unit} />}
            {showResourceAmount && <Resource unit={unit} />}
            {showEnergy && <Energy unit={unit} />}
            {showKills && <Kills unit={unit} />}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* <Loaded unit={unit} ref={loadedRef} /> */}
          {/* <Queue unit={unit} /> */}
          {/* <Progress unit={unit} ref={progressRef} /> */}
        </div>
      </div>
    </div>
  );
};
export default UnitDisplayLarge;
