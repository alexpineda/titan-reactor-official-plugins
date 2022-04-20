import React from "react";
import {
  registerComponent,
  usePlayers,
  usePlayerFrame,
  assets,
  RollingNumber,
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
//   assets.(
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
      background: config.transparentBackground ? "transparent" : config.backgroundColor,
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
              <tr key={player.id} style={{ color: config.textColor }}
                onClick={(e) => sendMessage({ type: "player-bar-click", payload: {
                  playerId: player.id }, button: e.button })}
                >
                <td style={{ color: player.color }}>{player.name}</td>
                <td>
                  <div style={_divStyle}>
                    <img style={_imgStyle} src={assets.gameIcons.minerals} />
                    <RollingNumber value={playerInfo.minerals} />
                  </div>
                </td>
                <td>
                  <div style={_divStyle}>
                    <img
                      style={_imgStyle}
                      src={assets.gameIcons[vespeneIcon]}
                    />
                    <RollingNumber value={playerInfo.vespeneGas} />
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
                {config.showWorkers && (
                  <div style={_divStyle}>
                    <img
                      style={_imgStyle}
                      src={assets.workerIcons[player.race]}
                    />
                    {playerInfo.workerSupply}
                  </div>
                )}
                {config.showApm && (
                  <td>
                    <div style={_divStyle}>
                      <img style={_imgStyle} src={assets.workerIcons.apm} />
                      <RollingNumber value={playerInfo.apm} />
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
