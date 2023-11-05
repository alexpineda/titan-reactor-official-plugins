import React from "react";
import { RollingNumber } from "@titan-reactor-runtime/ui";

const healthColorRed = "#d60000";
const healthColorYellow = "#aaaa00";
const healthColorGreen = "#00cc00";

const Health = ({ unit }) => {
  const hp = Math.floor(unit.hp);
  
  const healthPct = hp / unit.extras.dat.hp;
  let color = healthColorRed;

  if (healthPct > 0.66) {
    color = healthColorGreen;
  } else if (healthPct > 0.33) {
    color = healthColorYellow;
  }

  const msPerHP = (unit.extras.dat.buildTime * 42) / unit.extras.dat.hp;
  
  return (
    <div
      style={{
        color,
        transition: "color 4s linear",
        fontSize: "120%"
      }}
    >
      <RollingNumber value={hp} upSpeed={msPerHP} />/{unit.extras.dat.hp}
    </div>
  );
};
export default Health;
