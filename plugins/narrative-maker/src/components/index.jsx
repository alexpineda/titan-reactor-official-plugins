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
    const adhdWeight = (1 - q.adhd) * config.weightsADHD;
    const tensionWeight = q.tension * config.weightsTension;
    const weightedScore = (q.score + tensionWeight) * adhdWeight;

    q.adhdWeight = adhdWeight;
    q.tensionWeight = tensionWeight;
    q.weightedScore = weightedScore;
  });

  const maxScore = Math.max(...quadrants.quadrants.map((q) => q.weightedScore));
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
        opacity: 0.5
      }}
    >
      <div>cameraFatigue: {state.cameraFatigue}</div>
      <div>cameraFatigue2: {state.cameraFatigue2}</div>
      <div>tensionVsStrategy: {state.tensionVsStrategy}</div>
      <div>gameIsLulled: {state.gameIsLulled ? "true" : "false"}</div>
      <div>units, score, adhd, tension</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${quadrants.size}, 1fr)`,
        }}
      >
        {quadrants.quadrants.map((q, i) => {
          const backgroundColor = q.active ? "red" : colorScale(q.weightedScore); //isGray ? 

          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor,
              }}
            >
              <div>
              {q.units}, {q.score.toFixed(3)}, {q.adhd.toFixed(2)}, {q.tension.toFixed(2)}
              </div>
              <div>
              {q.units}, {q.weightedScore.toFixed(3)}, {q.adhdWeight.toFixed(2)}, {q.tensionWeight.toFixed(2)}
              </div>
              <div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
