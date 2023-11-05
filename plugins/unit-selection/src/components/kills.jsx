import React from "react";

const Kills = ({ unit }) => {

  return (
    <p
      style={{
        color: "var(--gray-4)",
      }}
    >
      Kills: {unit.kills}
    </p>
  );
};

export default Kills;
