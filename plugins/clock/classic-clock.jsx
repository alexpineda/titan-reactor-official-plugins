import React, { useState } from "react";
export default ({ time, pct, styles, config }) => {
  const [showPct, setShowPct] = useState(false);

  return (
    <div
      style={{
        color: config.textColor,
        fontWeight: "bold",
        fontSize: config.fontSize,
        textAlign: "center",
        position: "relative",
        width: "var(--minimap-width)",
        lineHeight: "1.2rem",
      }}
      onClick={() => setShowPct(!showPct)}
    >
      <div
        style={{
          background: styles.bevelGray800Reverse,
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "50%",
          zIndex: -1,
        }}
      >
        &nbsp;
      </div>
      <div
        style={{
          background: styles.bevelGray800,
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "50%",
          zIndex: -1,
        }}
      >
        &nbsp;
      </div>
      <p>{showPct ? pct : time}</p>
    </div>
  );
};
