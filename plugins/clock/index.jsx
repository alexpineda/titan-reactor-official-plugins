import React from "react";
import { registerComponent, useFrame } from "titan-reactor";
import ModernClock from "./modern-clock.jsx";
import ClassicClock from "./classic-clock.jsx";


registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "left", order: -100 },
  ({ config }) => {
    const frame = useFrame();

    const pct = `${Math.round((frame.frame / frame.maxFrame) * 100)}%`;
    
    const styles = {
      timeLabel: "white",
      bevelGray800Reverse:
        `linear-gradient(135deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 50%, ${config.bgDark} 50%, #2d3748 100%)`,
      bevelGray800:
        `linear-gradient(45deg, ${config.bgDark} 0%, ${config.bgDark} 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 100%)`,
      bgGray700: config.bgLight,
      bevelGray700:
        `linear-gradient(45deg, ${config.bgLight} 0%, ${config.bgLight} 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 100%)`,
    };

    return config.style === "modern" ? (
      <ModernClock config={config} time={frame.time} pct={pct} styles={styles} />
    ) : (
      <ClassicClock config={config} time={frame.time} pct={pct} styles={styles} />
    );
  }
);
