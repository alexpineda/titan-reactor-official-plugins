import React from "react";
import { assets, RollingNumber } from "@titan-reactor-runtime/ui";

const Energy = ({ unit }) => {
  const gameIcons = assets.gameIcons;

  return (
    <span style={{ display: "flex", alignItems: "center" }}>
      <img
        style={{
          width: "var(--size-4)",
          marginRight: "var(--size-1)",
        }}
        src={gameIcons.energy}
      />
      <div
        style={{
          color: "var(--gray-3)",
        }}
      ><RollingNumber value={Math.floor(unit.energy)} /></div>
    </span>
  );
};
export default Energy;
