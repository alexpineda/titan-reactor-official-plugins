import React from "react";
import {
  usePlayers,
  useProduction,
  useStyleSheet,
  usePluginConfig,
} from "@titan-reactor-runtime/ui";
import ProductionItem from "./production-item.jsx";

// Scanner Sweep
// Defensive Matrix
// Infestation 
// Dark Swarm
// Parasite 
// Archon Warp 
// Dark Archon Meld 
// Feedback 
// Unknown 33
// Healing 
const initialResearch = [4, 6, 12, 14, 18, 23, 28, 29, 33, 34];

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
      (!config.hideInitialResearch || (!initialResearch.includes(research.typeId))) &&
      (research.progress > 0 ||
        (config.showCompletedResearch && research.progress === 0))
    );
  };

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

        const color = config.useCustomProgressColor ? config.customProgressColor : player.color;

        return (
          <div
            style={{
              display: "flex",
              flexDirection:
                config.orientation === "horizontal" ? "row" : "column",
                borderLeft: config.orientation === "horizontal" ? `3px solid ${player.color}` : "none",
                borderTop: config.orientation === "vertical" ? `3px solid ${player.color}` : "none",
            }}
          >
            {items.slice(0, config.maxTotalItems).map((item, i) => (
              <ProductionItem
                item={item}
                color={color}
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
  { screen: "@replay", snap: "top-left" },
  ProductionBar
);
