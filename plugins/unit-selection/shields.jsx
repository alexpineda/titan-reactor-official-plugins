import React from "react";
import { RollingNumber } from "titan-reactor";

const Shields = ({ unit }) => {
  const shields = Math.floor(unit.shields);

  const msPerShield = (unit.extras.dat.buildTime * 42) / unit.extras.dat.shields;

  return (
    <p
      style={{
        color: "var(--gray-4)",
      }}
    >
      <RollingNumber value={shields} upSpeed={msPerShield}/>/{unit.extras.dat.shields}
    </p>
  );
};
export default Shields;
