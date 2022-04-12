import React, { useState } from "react";
import { useMap } from "titan-reactor";

export default ({ config, time, pct, styles }) => {
  const map = useMap();
  const [showPct, setShowPct] = useState(false);

  return (
    <div style={{ width: "var(--minimap-width)" }} onClick={() => setShowPct(!showPct)}>
      <div
        style={{
          color: config.textColor.value,
          background: styles.bevelGray800,
          fontWeight: "bold",
          fontSize: config.fontSize.value,
          paddingLeft: "0.2rem",
          paddingBottom: "0.2rem",
          width: "100%",
        }}
      >
        <span style={{ display: "inline" }}>{showPct ? pct : time}</span>
      </div>

      <span style={{ display: "flex" }}>
        <span
          style={{
            color: config.textColor2.value,
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
