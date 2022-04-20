import { registerComponent, useReplay, useMap } from "titan-reactor";
import React, { useState, useEffect } from "react";

const LoadingScreen = ({ config, type }) => {
  const replay = useReplay();
  const map = useMap();

  return (
    <div  style={{
      display: config[type] ? "block" : "none",
      position: "absolute",
      zIndex: "-999",
      left: "50%",
      top: "50%",
      transform: `translate(-50%, -50%)`,
    }}>
    <h1
      style={{
        color: "white",
        animation: "var(--animation-scale-up) forwards var(--ease-squish-2)"
      }}
    >
      <p>{map?.title}</p>
      {replay?.players.map((player) => (
        <p key={player.id}>{player.name}</p>
      ))}
    </h1>
    </div>
  );
};

registerComponent(
  { pluginId: "_plugin_id_", screen: "@replay/loading" },
  ({ config }) => <LoadingScreen config={config} type="replay" />
);

registerComponent(
  { pluginId: "_plugin_id_", screen: "@map/loading" },
  ({ config }) => <LoadingScreen config={config} type="map" />
);