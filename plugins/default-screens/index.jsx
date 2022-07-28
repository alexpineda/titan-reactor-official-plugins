import {
  useReplay,
  useMap,
} from "titan-reactor";
import React from "react";

const LoadingScreen = () => {
  const replay = useReplay();
  const map = useMap();

  return (
    <div
      style={{
        position: "absolute",
        zIndex: "-999",
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%)`,
      }}
    >
      <h1
        style={{
          color: "white",
          animation: "var(--animation-scale-up) forwards var(--ease-squish-2)",
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
  { screen: "@replay/loading" },
  () => <LoadingScreen type="replay" />
);

registerComponent(
  { screen: "@map/loading" },
  () => <LoadingScreen type="map" />
);