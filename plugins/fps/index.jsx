import React, { useRef } from "react";
import { registerComponent, useMessage } from "titan-reactor";

registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "top" },
  () => {
    const ref = useRef();

    useMessage(fps => {
      if (ref.current) {
        ref.current.textContent = fps;
      }
    });

    return (
      <p
        ref={ref}
        style={{ color: "white" }}
      ></p>
    );
  }
);
