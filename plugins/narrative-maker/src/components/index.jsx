import React from "react";
import { useMessage, usePluginConfig } from "@titan-reactor-runtime/ui";

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm";

 
// heat map - debug
registerComponent({ screen: "@replay", snap: "right" }, () => {
  const [state, setState] = React.useState({});
  const [quadrants, setQuadrants] = React.useState({ size: 0, quadrants: [] });
  const config = usePluginConfig();

  useMessage((message) => {
    setState(message.state);
    setQuadrants(message.data);
  });

  if (!config.showDebug) {
    return null;
  }

  quadrants.quadrants.forEach((q, i) => {
    const adhdWeight = (1 - q.adhd);
    const tensionWeight = q.tension;

    q.adhdWeight = adhdWeight;
    q.tensionWeight = tensionWeight;
  });

  const maxScore = Math.max(...quadrants.quadrants.map((q) => q.wScore));
  const colorScale = d3
    .scaleSequential(d3.interpolateRgb("purple", "blue")) // Start with blue
    .domain([0, maxScore / 2, maxScore]); // Adjust the domain as needed

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        color: "white",
        backgroundColor: "rgba(0,0,0,0.3)",
        opacity: 0.5,
        fontSize: "11px"
      }}
    >
      <div>frame: {state.frame}</div>
      <div>cameraFatigue: {state.cameraFatigue}</div>
      <div>cameraFatigue2: {state.cameraFatigue2}</div>
      <div>elapsed: {state.elapsed}</div>
      <div>lastTimeGameStartedLullMS: {state.lastTimeGameStartedLullMS}</div>
      <div>lastTimeGameStartedActionMS: {state.lastTimeGameStartedActionMS}</div>
      <div>units, score, adhd, tension, strat, wScore</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${quadrants.size}, 1fr)`,
          gap: "4px",
        }}
      >
        {quadrants.quadrants.map((q, i) => {
          const backgroundColor = q.active ? "red" : colorScale(q.tensionWeight); //isGray ? 

          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor,
              }}
            >
              <div>
              {q.units}, {Math.floor(q.score * 100)}, {Math.floor(q.adhd * 100)}, {Math.floor(q.tension * 100)}, {Math.floor(q.strategy * 100)}, {Math.floor(q.wScore * 100)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
