import React from "react";
import { assets } from "@titan-reactor-runtime/ui";

const Queue = ({ units }) => {

  return <div style={{
    display: "flex",
    alignSelf: "center"
  }}>{units.map(unit => 
    <img
        src={assets.imagesUrl + `cmdicons.${unit}.png`}
        style={{
          width: "var(--size-5)",
          height: "var(--size-5)",
          filter: "hue-rotate(69deg) brightness(1.5)",
        }}
      />)}</div>;
};
export default Queue;
