import React from "react";
import { registerComponent, useSelectedUnits } from "titan-reactor";
import UnitDisplayLarge from "./unit-display-large.jsx";


registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "left"},
  ({config}) => {
    const units = useSelectedUnits();

    if (units.length === 1) {
      return <UnitDisplayLarge config={config} unit={units[0]} key={units[0].id} />;
    }
    return null;
  }
);
