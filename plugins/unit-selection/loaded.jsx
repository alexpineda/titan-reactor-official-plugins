import React from "react";
import range from "https://cdn.skypack.dev/lodash.range";
import SmallUnitItem from "./small-unit-item.jsx";

const Loaded = ({ unit, sendMessage }) => {
  return (
    <div
      style={{
        display: "flex",
        paddingLeft: "var(--size-1)",
        paddingTop: "var(--size-1)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 2.5rem)",
          gridTemplateRows: "repeat(2, 2.5rem)",
          gridGap: ".25rem",
        }}
      >
        {range(0, 8).map((i) => (
          <SmallUnitItem
            key={unit?.loaded?.[i]?.id ?? `empty${i}`}
            unit={unit?.loaded?.[i]}
            owner={unit?.owner}
            showLoaded={true}
          />
        ))}
      </div>
    </div>
  );
};
export default Loaded;
