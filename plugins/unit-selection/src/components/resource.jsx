import React from "react";
import { assets, enums  } from "@titan-reactor-runtime/ui";

const Resource = ({ unit }) => {
  const gameIcons = assets.gameIcons;
  const unitTypes = enums.unitTypes;

  let icon = assets.imagesUrl + "icon_minerals.png";

  if (
    ![unitTypes.mineral1, unitTypes.mineral2, unitTypes.mineral3].includes(
      unit.extras.dat.index
    )
  ) {
    if (unit.extras.dat.isZerg) {
      icon = assets.imagesUrl + `icon_gas_zerg.png`;
    } else if (unit.extras.dat.isProtoss) {
      icon = assets.imagesUrl + `icon_gas_protoss.png`;
    } else {
      icon = assets.imagesUrl + `icon_gas_terran.png`;
    }
  }

  return (
    <span style={{ display: "flex", alignItems: "center" }}>
      <img
        style={{
          width: "var(--size-4)",
          marginRight: "var(--size-1)",
        }}
        src={icon}
      />
      <div
        style={{
          color: "var(--gray-4)"
        }}
      >
        {unit.resourceAmount}
      </div>
    </span>
  );
};

export default Resource;
