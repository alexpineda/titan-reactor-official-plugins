import {
  registerComponent,
  usePluginConfig,
  useReplay,
  useMap,
  useStore
} from "titan-reactor";
import React from "react";

const _updateAvailable = (store) => store.updateAvailable;

const LoadingScreen = ({ type }) => {
  const config = usePluginConfig();
  const replay = useReplay();
  const map = useMap();

  return (
    <div
      style={{
        display: config[type] ? "block" : "none",
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
  { pluginId: "_plugin_id_", screen: "@replay/loading" },
  ({ config }) => <LoadingScreen config={config} type="replay" />
);

registerComponent(
  { pluginId: "_plugin_id_", screen: "@map/loading" },
  ({ config }) => <LoadingScreen config={config} type="map" />
);


registerComponent({ pluginId: "_plugin_id_", screen: "@home/ready", snap: "center" }, () => {
  const config = usePluginConfig();
  const updateAvailable = useStore(_updateAvailable);

  if (!config.homePage) {
    return null;
  }

  return (
    <div>
      <h1
        style={{
          fontFamily: "Conthrax",
          color: "var(--orange-5)",
          animation:
            "var(--animation-slide-in-down) forwards, var(--animation-fade-in)",
          animationDuration: "5s",
        }}
      >
        Titan Reactor
      </h1>
      <p
        style={{
          marginTop: "var(--size-2)",
          textAlign: "center",
          color: "var(--gray-4)",
        }}
      >
        Menu: ALT, Fullscreen: F11, Plugins: F10
      </p>
      {updateAvailable && (
        <div
          style={{
            color: "var(--green-5)",
            textAlign: "center",
            textDecoration: "underline",
            cursor: "pointer",
          }}
          onClick={() =>
            window.parent.postMessage("system:download-update", "*")
          }
        >
          Download New Version {updateAvailable.version} Now!
        </div>
      )}
    </div>
  );
});
