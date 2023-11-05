import React from "react";
import {
  useMessage,
  usePluginConfig
} from "@titan-reactor-runtime/ui";

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm'


registerComponent(
  { screen: "@replay", snap: "right" },
  () => {
    const [speed, setSpeed] = React.useState(1);
    const [targetSpeed, setTargetSpeed] = React.useState(1);

    useMessage(message => {
      setSpeed(message.speed);
      setTargetSpeed(message.targetSpeed);
    });

    return <div style={{ fontSize: "24px", color: "white", display: "flex", alignItems: "center", justifyContent: "end" }}>
      {speed.toFixed(1)} <svg style={{ display: "inline-block", width: "24px" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"  >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
      <p>{targetSpeed}</p>
    </div>
  });

registerComponent(
  { screen: "@replay", snap: "right" },
  () => {
    const [state, setState] = React.useState({});
    const [quadrants, setQuadrants] = React.useState({ size: 0, quadrants: [] });
    const config = usePluginConfig();

    useMessage(message => {
      setState(message.state);
      setQuadrants(message.data);
    })

    const maxScore = Math.max(...quadrants.quadrants.map(q => q.score));
    const colorScale = d3.scaleSequential(d3.interpolateRgb("purple", "orange")) // Start with blue
      .domain([0, maxScore / 2, maxScore]); // Adjust the domain as needed

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        color: "white",
        backgroundColor: "black",
      }}>
        <div>lastHeatMapUpdateFrame: {state.lastHeatMapUpdateFrame}</div>
        <div>lastUpdateFrame: {state.lastUpdateFrame}</div>
        <div>elapsed: {state.elapsed}</div>
        <div>frame: {state.frame}</div>
        <div>score, units, heatmap</div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${quadrants.size}, 1fr)` }}>
          {quadrants.quadrants.map(((q, i) => {

            // Determine the row and column this cell will be in
            const row = Math.floor(i / 4);
            const col = i % 4;
            // Use bitwise XOR to determine the color
            const isGray = (row ^ col) & 1;
            const backgroundColor = colorScale(q.score);; //isGray ? '#ccc' : '#666';

            return <div style={{ display: "flex", flexDirection: "column", backgroundColor }}>
              <div>{q.score.toFixed(3)}, {q.units}, {q.heatmap.toFixed(2)}</div>
            </div>
          }))
          }
        </div>
      </div>
    );
  }
);
