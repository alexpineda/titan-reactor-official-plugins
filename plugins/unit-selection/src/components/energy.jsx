import React from "react";
import {   RollingNumber } from "@titan-reactor-runtime/ui";

const Energy = ({ unit }) => {

  return (
    <span style={{ display: "flex", alignItems: "center" }}>

      <div
        style={{
          color: "var(--gray-3)",
        }}
      ><RollingNumber value={Math.floor(unit.energy)} /></div>
    </span>
  );
};
export default Energy;
