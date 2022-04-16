import React from "react";
import { RollingNumber } from "titan-reactor";

const Shields = ({ unit }) => {
  const shields = Math.floor(unit.shields);


  return (
    <p
      style={{
        color: "var(--gray-4)",
      }}
    >
      <RollingNumber value={shields} upSpeed={160}/>/{unit.extras.dat.shields}
    </p>
  );
};
export default Shields;
