import React from "react";
import { useMessage, usePluginConfig } from "@titan-reactor-runtime/ui";

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm";
 
// speed
registerComponent({ screen: "@replay", snap: "right" }, () => {
  const [speed, setSpeed] = React.useState(1);
  const [targetSpeed, setTargetSpeed] = React.useState(1);

  useMessage((message) => {
    setSpeed(message.speed);
    setTargetSpeed(message.targetSpeed);
  });

  return (
    <div
      style={{
        fontSize: "24px",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "end",
      }}
    >
      {speed.toFixed(1)}{" "}
      <svg
        style={{ display: "inline-block", width: "24px" }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
      <p>{targetSpeed}</p>
    </div>
  );
});

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
    const strategyWeight = q.strategy * config.weightsStrategy;
    const weightedScore = q.score * adhdWeight + tensionWeight + strategyWeight;

    q.adhdWeight = adhdWeight;
    q.tensionWeight = tensionWeight;
    q.strategyWeight = strategyWeight;
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
      <div>lastHeatMapUpdateFrame: {state.lastHeatMapUpdateFrame}</div>
      <div>lastUpdateFrame: {state.lastUpdateFrame}</div>
      <div>lastUnitDestroyedFrame: {state.lastUnitDestroyedFrame}</div>
      <div>lastUnitAttackedFrame: {state.lastUnitAttackedFrame}</div>
      <div>cameraFatigue: {state.cameraFatigue}</div>
      <div>elapsed: {state.elapsed}</div>
      <div>frame: {state.frame}</div>
      <div>units, score, adhd, tension, strategy</div>
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
              {q.units}, {q.score.toFixed(3)}, {q.adhd.toFixed(2)}, {q.tension.toFixed(2)}, {q.strategy.toFixed(2)}
              </div>
              <div>
              {q.units}, {q.weightedScore.toFixed(3)}, {q.adhdWeight.toFixed(2)}, {q.tensionWeight.toFixed(2)}, {q.strategyWeight.toFixed(2)}
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
