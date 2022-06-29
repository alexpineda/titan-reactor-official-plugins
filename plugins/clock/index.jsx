import React from "react";
import { registerComponent, useFrame, usePluginConfig } from "titan-reactor";
import ModernClock from "./modern-clock.jsx";
import ClassicClock from "./classic-clock.jsx";


registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "left", order: -100 },
  () => {
    // we can use the plugin config to determine which clock to show as well as colors and other settings
    const config = usePluginConfig();
    // frame will be updated every game second with useful info like time and frame #.
    const frame = useFrame();

    const pct = `${Math.round((frame.frame / frame.maxFrame) * 100)}%`;
    
    const styles = {
      timeLabel: "white",
      bevelGray800Reverse:
        `linear-gradient(135deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 50%, ${config.bgDark} 50%, ${config.bgDark} 100%)`,
      bevelGray800:
        `linear-gradient(45deg, ${config.bgDark} 0%, ${config.bgDark} 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 100%)`,
      bgGray700: config.bgLight,
      bevelGray700:
        `linear-gradient(45deg, ${config.bgLight} 0%, ${config.bgLight} 50%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 100%)`,
    };

    return config.style === "modern" ? (
      <ModernClock time={frame.time} pct={pct} styles={styles} />
    ) : (
      <ClassicClock time={frame.time} pct={pct} styles={styles} />
    );
  }
);
