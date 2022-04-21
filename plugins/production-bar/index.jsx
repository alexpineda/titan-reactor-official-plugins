import React from "react";
import {
  registerComponent,
  usePlayers,
  useProduction,
  useStyleSheet,
  usePluginConfig
} from "titan-reactor";
import ProductionItem from "./production-item.jsx";
import { useToggleItems } from "./toggle-items.js";

const ProductionBar = () => {
  const config = usePluginConfig();
  const players = usePlayers();
  const [getUnits, getUpgrades, getResearch] = useProduction();

  useStyleSheet(
    players.reduce((colors, { id, color }) => {
      return `
                ${colors}
                @keyframes glow-${id} {
                    from {
                    box-shadow: 0 0 10px -10px ${color}55;
                    }
                    to {
                    box-shadow: 0 0 10px 10px ${color}55;
                    }
                }
                `;
    }, ""),
    [players]
  );

  const filterUpgrade = (upgrade) => {
    return config.showUpgrades && (upgrade.progress > 0 || config.showCompletedUpgrades && upgrade.progress === 0);
  }

  const filterResearch = (research) => {
    return config.showResearch && (research.progress > 0 || config.showCompletedResearch && research.progress === 0);
  }

  if (config.toggleVisible === false) {
      return null;
  }

  return players.map((player) => {
    const units = getUnits(player.id).slice(-config.maxUnits);
    const upgrades = getUpgrades(player.id).filter(filterUpgrade);
    const research = getResearch(player.id).filter(filterResearch);
    // const items = useToggleItems(config.rotateDisplay, units, upgrades, research);
    const items = [...units, ...upgrades, ...research];

    return (
      <div style={{ display:"flex" , padding: "var(--size-1)", backgroundColor: config.backgroundColor }}>
        {items.slice(0, config.maxTotalItems).map((item, i) => (
          <ProductionItem item={item} color={player.color} isFirst={i === 0} />
        ))}
      </div>
    );
  });
};

registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "top-left" },
  ProductionBar
);
