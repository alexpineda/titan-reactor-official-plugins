import React from "react";
import { assets, enums, usePluginConfig } from "@titan-reactor-runtime/ui";

const Resource = ({ unit }) => {
  const config = usePluginConfig();
  const gameIcons = assets.gameIcons;
  const unitTypes = enums.unitTypes;

  let icon = gameIcons.minerals;

  if (
    ![unitTypes.mineral1, unitTypes.mineral2, unitTypes.mineral3].includes(
      unit.extras.dat.index
    )
  ) {
    if (unit.extras.dat.isZerg) {
      icon = gameIcons.vespeneZerg;
    } else if (unit.extras.dat.isProtoss) {
      icon = gameIcons.vespeneProtoss;
    } else {
      icon = gameIcons.vespeneTerran;
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
