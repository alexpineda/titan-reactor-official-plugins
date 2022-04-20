import React from "react";
import { assets, RollingNumber } from "titan-reactor";

const Energy = ({ unit }) => {
  const gameIcons = assets.gameIcons;

  return (
    <span style={{ display: "flex", alignItems: "center" }}>
      <img
        style={{
          width: "var(--size-4)",
          marginRight: "var(--size-1)",
        }}
        src={gameIcons?.energy}
      />
      <p
        style={{
          color: "var(--gray-3)",
        }}
      ><RollingNumber value={energy} /></p>
    </span>
  );
};
export default Energy;