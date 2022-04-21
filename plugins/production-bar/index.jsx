import React from "react";
import {
  registerComponent,
  usePlayers,
  useProduction,
  useStyleSheet,
  usePluginConfig,
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
    return (
      config.showUpgrades &&
      (upgrade.progress > 0 ||
        (config.showCompletedUpgrades && upgrade.progress === 0))
    );
  };

  const filterResearch = (research) => {
    return (
      config.showResearch &&
      (research.progress > 0 ||
        (config.showCompletedResearch && research.progress === 0))
    );
  };

  if (config.toggleVisible === false) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: config.orientation === "horizontal" ? "column" : "row",
        padding: "var(--size-2)",
        borderRadius: "var(--radius-2)",
        backgroundColor: config.backgroundColor,
      }}
    >
      {players.map((player) => {
        const units = getUnits(player.id)
          .slice(-config.maxUnits)
          .sort((a, b) => a.count - b.count)
          .sort((a, b) => a.typeId - b.typeId);
        const tech = [...getUpgrades(player.id).filter(filterUpgrade), ...getResearch(player.id).filter(filterResearch)].sort((a, b) => b.progress - a.progress);
        // const items = useToggleItems(config.rotateDisplay, units, upgrades, research);
        const items = config.unitsFirst ? [...units, ...tech] : [...tech, ...units];

        return (
          <div
            style={{
              display: "flex",
              flexDirection:
                config.orientation === "horizontal" ? "row" : "column",
              padding: "var(--size-2)",
              borderRadius: "var(--radius-2)",
              backgroundColor: config.backgroundColor,
            }}
          >
            {items.slice(0, config.maxTotalItems).map((item, i) => (
              <ProductionItem
                item={item}
                color={player.color}
                isFirst={i === 0}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "top-left" },
  ProductionBar
);
