import React, { useState } from "react";
import { useMap, usePluginConfig } from "@titan-reactor-runtime/ui";

export default ({ time, pct, speed, styles }) => {
  const config = usePluginConfig();
  const map = useMap();
  const [showPct, setShowPct] = useState(false);

  const Speed = () => (
    <span>
      {speed.toFixed(1)}{" "}
      <svg
        style={{ display: "inline-block", width: "12px" }}
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
    </span>
  );

  return (
    <div
      style={{ width: "var(--minimap-width)" }}
      onClick={() => setShowPct(!showPct)}
    >
      <div
        style={{
          color: config.textColor,
          background: styles.bevelGray800,
          fontWeight: "bold",
          fontSize: config.fontSize,
          paddingLeft: "0.2rem",
          paddingBottom: "0.2rem",
          width: "100%",
        }}
      >
        <span style={{ display: "inline" }}>
          {time}
          {config.showPct && <span> - {pct}</span>}
          {config.showSpeed && <span> <Speed /></span>}
        </span>
      </div>

      <span style={{ display: "flex" }}>
        <span
          style={{
            color: config.textColor2,
            background: styles.bgGray700,
            paddingLeft: "0.2rem",
            paddingRight: "0.2rem",
            textTransform: "uppercase",
            textOverflow: "ellipsis",
            flexGrow: 1,
          }}
        >
          <p
            style={{
              opacity: 0.8,
              whiteSpace: "nowrap",
              maxWidth: "calc(var(--minimap-width) - 30px)",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            {map?.title}
          </p>
        </span>
        <span
          style={{
            background: styles.bevelGray700,
            width: "100%",
            alignSelf: "stretch",
          }}
        ></span>
      </span>
    </div>
  );
};
