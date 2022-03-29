import React from "react";
import { registerComponent, useStore } from "titan-reactor";
import ModernClock from "./modern-clock.jsx";
import ClassicClock from "./classic-clock.jsx";

const _selector = (store) => store.frame.time;
registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "left" },
  ({ config }) => {
    const time = useStore(_selector);
    
    const styles = {
      timeLabel: "white",
      bevelGray800Reverse:
        `linear-gradient(135deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 50%, ${config.bgDark.value} 50%, #2d3748 100%)`,
      bevelGray800:
        `linear-gradient(45deg, ${config.bgDark.value} 0%, ${config.bgDark.value} 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 100%)`,
      bgGray700: config.bgLight.value,
      bevelGray700:
        `linear-gradient(45deg, ${config.bgLight.value} 0%, ${config.bgLight.value} 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 100%)`,
    };

    return config.style.value === "modern" ? (
      <ModernClock config={config} time={time} styles={styles} />
    ) : (
      <ClassicClock config={config} time={time} styles={styles} />
    );
  }
);
