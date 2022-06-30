import React from "react";
import { assets } from "titan-reactor";

const Queue = ({ units }) => {
  const cmdIcons = assets.cmdIcons;

  return <div style={{
    display: "flex",
  }}>{units.map(unit => 
    <img
        src={cmdIcons[unit]}
        style={{
          width: "var(--size-5)",
          height: "var(--size-5)",
          filter: "hue-rotate(69deg) brightness(20)",
        }}
      />)}</div>;
};
export default Queue;
