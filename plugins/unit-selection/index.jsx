import React from "react";
import { registerComponent, useSelectedUnits } from "titan-reactor";
import UnitDisplayLarge from "./unit-display-large.jsx";
import UnitsDisplaySmall from "./units-display-small.jsx";

registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "right" },
  ({ config, sendMessage }) => {
    const units = useSelectedUnits();

    if (units.length === 0) {
      return null;
    }

    return (
      <div
        style={{
          padding: "var(--size-2)",
          background: "#00000099",
          borderRadius: "var(--radius-2)",
        }}
      >
        {units.length === 1 ? (
          <UnitDisplayLarge
            config={config}
            unit={units[0]}
            key={units[0].id}
            sendMessage={sendMessage}
          />
        ) : (
          <UnitsDisplaySmall
            config={config}
            units={units}
            sendMessage={sendMessage}
          />
        )}
      </div>
    );
  }
);
