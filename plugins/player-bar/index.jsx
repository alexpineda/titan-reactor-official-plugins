import React from "react";
import {
  registerComponent,
  useStore,
  getPlayerInfo,
  assets,
  RollingResource,
} from "titan-reactor";

// const injectColorsCss = (colors) => {
//   setStyleSheet(
//     "player-colors-glow",
//     colors.reduce((css: string, color) => {
//       return `
//     ${css}
//     @keyframes glow-${color.playerId} {
//       from {
//         box-shadow: 0 0 10px -10px ${color.hex}55;
//       }
//       to {
//         box-shadow: 0 0 10px 10px ${color.hex}55;
//       }
//     }
//     `;
//     }, "")
//   );
// };

const _divStyle = {
  display: "flex",
  alignItems: "center",
  minWidth: "var(--size-10)",
};

const _imgStyle = {
  blockSize: "var(--font-size-4)",
  display: "inline-block",
  marginRight: "var(--size-1)",
};



registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "top-right" },
  ({ config, sendMessage }) => {
    const players = useStore((state) =>
      state.world?.replay?.header?.players ?? []
    );
    const playerData = useStore((state) => state.frame.playerData);

    if (!assets.ready) {
      return null;
    }

    const _tableStyle = {
      background: config.backgroundColor.value,
      borderRadius: "var(--radius-2)",
      padding: "var(--size-2)",
    };
    
    return (
      <table style={_tableStyle}>
        <tbody>
          {players.map((player) => {
            const playerInfo = getPlayerInfo(player.id, playerData);
            const vespeneIcon = `vespene${player.race[0].toUpperCase()}${player.race.substring(
              1
            )}`;

            return (
              <tr key={player.id} style={{ color: config.textColor.value }}
                onClick={() => sendMessage({ action: "toggle-fog", playerId: player.id })}
                >
                <td style={{ color: player.color.hex }}>{player.name}</td>
                <td>
                  <div style={_divStyle}>
                    <img style={_imgStyle} src={assets.gameIcons.minerals} />
                    <RollingResource value={playerInfo.minerals} />
                  </div>
                </td>
                <td>
                  <div style={_divStyle}>
                    <img
                      style={_imgStyle}
                      src={assets.gameIcons[vespeneIcon]}
                    />
                    <RollingResource value={playerInfo.vespeneGas} />
                  </div>
                </td>
                <td>
                  <div style={_divStyle}>
                    <img
                      style={_imgStyle}
                      src={assets.gameIcons[player.race]}
                    />
                    {playerInfo.supply}/{playerInfo.supplyMax}
                  </div>
                </td>
                {config.showWorkers.value && (
                  <div style={_divStyle}>
                    <img
                      style={_imgStyle}
                      src={assets.workerIcons[player.race]}
                    />
                    {playerInfo.workerSupply}
                  </div>
                )}
                {config.showApm.value && (
                  <td>
                    <div style={_divStyle}>
                      <img style={_imgStyle} src={assets.workerIcons.apm} />
                      <RollingResource value={playerInfo.apm} />
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
);
