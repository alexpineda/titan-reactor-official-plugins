import React from "react";
import {
  registerComponent,
  usePlayers,
  usePlayerFrame,
  assets,
  RollingResource,
} from "titan-reactor";
// export const createAltColors = (color: string): AltColors => {
//   let darken = new Color(0.1, 0.1, 0.1);
//   const test = { h: 0, s: 0, l: 0 };
//   new Color().setStyle(color).getHSL(test);

//   if (test.l > 0.6) {
//     darken = new Color(0.2, 0.2, 0.2);
//   }
//   const darker = `#${new Color().setStyle(color).sub(darken).getHexString()}`;

//   const hueShift = `#${new Color()
//     .setStyle(darker)
//     .offsetHSL(0.01, 0, 0)
//     .getHexString()}66`;
//   const lightShift = `#${new Color()
//     .setStyle(darker)
//     .offsetHSL(0, 0, 0.1)
//     .getHexString()}`;

//   return {
//     darker,
//     hueShift,
//     lightShift,
//   };
// };

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
    const players = usePlayers();
    const getPlayerFrameInfo = usePlayerFrame();

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
            const playerInfo = getPlayerFrameInfo(player.id);
            const vespeneIcon = `vespene${player.race[0].toUpperCase()}${player.race.substring(
              1
            )}`;

            return (
              <tr key={player.id} style={{ color: config.textColor.value }}
                onClick={() => sendMessage({ action: "player-bar-click", playerId: player.id })}
                >
                <td style={{ color: player.color }}>{player.name}</td>
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