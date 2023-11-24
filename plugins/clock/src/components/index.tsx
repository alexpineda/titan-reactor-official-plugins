import React, { useState } from "react";
import { useFrame, usePluginConfig, useReplay, getFriendlyTime, useMessage } from "@titan-reactor-runtime/ui";
import ModernClock from "./modern-clock.jsx";

registerComponent(
  { screen: "@replay", snap: "left", order: -100 },
  () => {
    // we can use the plugin config to determine which clock to show as well as colors and other settings
    const config = usePluginConfig();
    // frame will be updated every game second with useful info like time and frame #.
    const frame = useFrame() ?? 0;

    const replay = useReplay();

    const [speed, setSpeed] = useState(1);

    useMessage(cb => {
      setSpeed(cb ?? 1);
    })

    if (!replay) {
      return null;
    }
    
    const pct = `${Math.round((frame / replay.frameCount) * 100)}%`;
    const time = getFriendlyTime(frame);
    
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

    return  <ModernClock time={time} pct={pct} speed={speed} styles={styles} />
  }
);
