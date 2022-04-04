import React from "react";
import { registerComponent } from "titan-reactor";

registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "top" },
  ({ useMessage }) => {
    const fps = useMessage();

    return (
      <p
        style={{ color: "white" }}
      >{fps}</p>
    );
  }
);
