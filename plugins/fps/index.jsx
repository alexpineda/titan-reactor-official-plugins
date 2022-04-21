import React, { useRef } from "react";
import { registerComponent, useMessage } from "titan-reactor";

registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready" },
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
        style={{ color: "white", position: "absolute", top: 0, left:0, zIndex: 100 }}
      ></p>
    );
  }
);
