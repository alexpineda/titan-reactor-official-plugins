import React, { useState, useRef } from "react";
import { registerComponent, useMessage, usePluginConfig } from "titan-reactor";


registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "bottom" },
  () => {
    const [state, setState] = useState(null);
    const timeoutHandle = useRef(null);

    const config = usePluginConfig();

    useMessage((message) => {
        setState(message);

        if (timeoutHandle.current) {
            clearTimeout(timeoutHandle.current);
        }

        timeoutHandle.current = setTimeout(() => {
            setState(null);
        }, 1500);
        
    });

    return (state && config.showIndicator) ? (<div style={{fontSize:"var(--font-size-4)", color: "white"}}>{state}</div>) : null;
  }
);
