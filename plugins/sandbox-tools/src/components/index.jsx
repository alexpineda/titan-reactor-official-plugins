import React from "react";
import {
  usePluginConfig,
  useSendMessage,
  usePlayers,
  assets,
} from "@titan-reactor-runtime/ui";

registerComponent(
  { screen: "@map", snap: "right" },
  () => {
    const config = usePluginConfig();
    const sendMessage = useSendMessage();
    const players = usePlayers();


  // const cmdIcons = assets.cmdIcons;
  console.log(assets.bwDat.units);

    const clearUnits = () => sendMessage({type:"clear-units"});
 
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
      }}>
        
        
          <div>General Commands</div>
          <ul>
          <li onClick={clearUnits}>Clear Units</li>
          <li>Move Camera</li>
          <li>Camera Look At Unit</li>
          <li>Camera Look At Location</li>
          <li>Run Macro At Location</li>
          <li>Delay</li>
          </ul>

          <div>Player Commands</div>
          <div style={{display: "flex", flexDirection: "row"}}>
          {players.map((player) => {
            return (
              <div key={player.id} style={{ color: config.textColor, fontSize: config.fontSize }}
                onClick={(e) => sendMessage({ type: "select-player", payload: {
                  playerId: player.id, button: e.button} })}
                >
                <p style={{ color: player.color }}>{player.name} - {player.id}</p>
              </div>
            );
          })}
        </div>
          <ul>
          <li>Create Unit</li>
            <ul>
              <li onClick={() => sendMessage({type:"spawn-unit", payload: {
                unitType: 7,
                x: 0,
                y: 0
              }})}>Marine</li>
              <li onClick={() => sendMessage({type:"spawn-unit", payload: {
                unitType: 0,
                x: 0,
                y: 0
              }})}>SCV</li>
            </ul>
          <li>Kill Unit</li>
          <li>Remove Unit</li>
          <li>Order Unit Attack Move</li>
          <li>Order Unit Attack Unit</li>
          <li>Order Unit Move</li>
          <li>Order Unit Build</li>
          <li>Order Unit Train</li>
          <li>Order Unit Right Click</li>
          </ul>
        </div>
      
    );
  }
);
