import React from "react";
import { assets } from "@titan-reactor-runtime/ui";

const Queue = ({ units }) => {
  const cmdIcons = assets.cmdIcons;

  return <div style={{
    display: "flex",
    alignSelf: "center"
  }}>{units.map(unit => 
    <img
        src={cmdIcons[unit]}
        style={{
          width: "var(--size-5)",
          height: "var(--size-5)",
          filter: "hue-rotate(69deg) brightness(1.5)",
        }}
      />)}</div>;
};
export default Queue;
