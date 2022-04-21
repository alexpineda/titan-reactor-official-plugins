import React from "react";
import { assets, getUnitIcon } from "titan-reactor";

const Queue = ({ unit }) => {
  const cmdIcons = assets.cmdIcons;

  const icon = getUnitIcon(unit);
;

  if (icon === null) {
    return null;
  }

  return (
    <div style={{
        display:"flex",
        justifyContent: "center"
    }}>
      <img
        src={cmdIcons[icon]}
        style={{
          border: "var(--border-size-2)",
          borderRadius: "var(--radius-2)",
          width: "48px",
          height: "48px",
          filter: "hue-rotate(69deg) brightness(5)",
          borderColor: "#111",
        }}
      />
    </div>
  );
};
export default Queue;
