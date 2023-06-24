import React, { useEffect, memo } from "react";
import PlayerResources from "./player-resources";
import shallow from "zustand/shallow";
import {
  useHudStore,
  HudStore,
  useSettingsStore,
  SettingsStore,
} from "../../../stores";
import { incFontSize } from "../../../../common/utils/change-font-size";
import { Player } from "../../../../common/types";

const _playerScoreCache: Record<
  string, // cache key
  Record<string, number | undefined> // player name -> score
> = {};
const hudStoreSelector = (state: HudStore) => state.productionView;
const textSizeSelector = (state: SettingsStore) =>
  state?.data?.esportsHud
    ? incFontSize(state.data.hudFontSize)
    : state?.data?.hudFontSize;
const toggleSelector = (state: SettingsStore) =>
  state?.data?.autoToggleProductionView;

// in gameStore onTogglePlayerPov: state.onTogglePlayerPov,

const settingsSelector = (state: SettingsStore) => ({
  esportsHud: state?.data?.esportsHud,
  enablePlayerScores: state?.data?.enablePlayerScores,
  embedProduction: state?.data?.embedProduction,
});

const setAutoProductionView = useHudStore.getState().setAutoProductionView;

// wrapper for showing all participating player information (scores, names, resources, etc)
const ResourcesBar = ({
  fitToContent,
  className,
  style,
  players,
}: {
  fitToContent: boolean;
  className: string;
  style: React.CSSProperties;
  players: Player[];
}) => {
  const textSize = useSettingsStore(textSizeSelector);
  const autoToggleProductionView = useSettingsStore(toggleSelector) as boolean;
  const productionView = useHudStore(hudStoreSelector);
  const { esportsHud, enablePlayerScores, embedProduction } = useSettingsStore(
    settingsSelector,
    shallow
  );
  const cacheKey = players
    .map(({ name }) => name)
    .sort()
    .join(".");
  if (!_playerScoreCache[cacheKey]) {
    _playerScoreCache[cacheKey] = {};
  }

  useEffect(() => {
    setAutoProductionView(autoToggleProductionView);
  }, []);

  return (
    <div
      className={`resources-parent flex select-none ${className}`}
      style={{ backgroundColor: "rgba(18, 20, 24)", ...style }}
    >
      <table className="table-auto flex-1 ">
        <tbody>
          {players.map((player) => (
            <PlayerResources
              key={player.id}
              id={player.id}
              name={player.name}
              race={player.race}
              color={player.color}
              textSize={textSize}
              fitToContent={fitToContent}
              playerScoreCache={_playerScoreCache[cacheKey]}
              productionView={productionView}
              esportsHud={esportsHud}
              enablePlayerScores={enablePlayerScores}
              embedProduction={embedProduction}
            />
          ))}
        </tbody>
      </table>

      {/* <aside className="flex flex-col justify-around mx-2">
            <i
              onClick={() => onTogglePlayerPov(0)}
              className={`material-icons rounded cursor-pointer hover:text-yellow-500 ${
                players[0].showPov ? "text-yellow-700" : "text-gray-700 "
              }`}
              style={{ fontSize: smallIconFontSize }}
              data-tip={`${players[0].name} First Person`}
            >
              slideshow
            </i>
            <i
              onClick={() => onTogglePlayerPov(1)}
              className={`material-icons hover:text-yellow-500 rounded cursor-pointer ${
                players[1].showPov ? "text-yellow-700" : "text-gray-700 "
              }`}
              style={{ fontSize: smallIconFontSize }}
              data-tip={`${players[1].name} First Person`}
            >
              slideshow
            </i>
          </aside> */}
      {/* <aside className="flex flex-col justify-between ml-2 b">
            <i
              onClick={() => onTogglePlayerActions && onTogglePlayerActions(0)}
              className={`material-icons hover:text-yellow-500 rounded cursor-pointer ${
                players[0].showActions ? "text-yellow-700" : "text-gray-700 "
              }`}
              style={{ fontSize: smallIconFontSize }}
              title="resources"
            >
              room
            </i>

            <i
              onClick={() => onTogglePlayerActions && onTogglePlayerActions(1)}
              className={`material-icons hover:text-yellow-500 rounded cursor-pointer ${
                players[1].showActions ? "text-yellow-700" : "text-gray-700 "
              }`}
              style={{ fontSize: smallIconFontSize }}
              title="resources"
            >
              room
            </i>
          </aside> */}
    </div>
  );
};

ResourcesBar.defaultProps = {
  className: "",
  style: {},
};

export default memo(ResourcesBar);
