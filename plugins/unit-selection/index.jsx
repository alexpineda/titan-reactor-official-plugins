import React from "react";
import { registerComponent, useSelectedUnits } from "titan-reactor";
import UnitDisplayLarge from "./unit-display-large.jsx";
import UnitsDisplaySmall from "./units-display-small.jsx";


registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "right"},
  ({config}) => {
    const units = useSelectedUnits();

    if (units.length === 1) {
      return <UnitDisplayLarge config={config} unit={units[0]} key={units[0].id} />;
    } else if (units.length > 1) {
      return <UnitsDisplaySmall config={config} units={units} />;
    }
    return null;
  }
);
