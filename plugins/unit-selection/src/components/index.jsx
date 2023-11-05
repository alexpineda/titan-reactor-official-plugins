import React from "react";
import { useSelectedUnits } from "@titan-reactor-runtime/ui";
import UnitDisplayLarge from "./unit-display-large.jsx";
import UnitsDisplaySmall from "./units-display-small.jsx";

registerComponent(
  { screen: "@replay", snap: "right" },
  () => {
    const units = useSelectedUnits();

    if (units.length === 0) {
      return null;
    }

    return (
      <div
        style={{
          padding: "var(--size-3)",
          background: "#00000099",
          borderRadius: "var(--radius-2)",
          minWidth: units.length === 1 ? "var(--size-13)" : "0",
        }}
      >
        {units.length === 1 ? (
          <UnitDisplayLarge
            unit={units[0]}
            key={units[0].id}
          />
        ) : (
          <UnitsDisplaySmall
            units={units}
          />
        )}
      </div>
    );
  }
);
