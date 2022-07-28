import React, { useRef } from "react";
import { useMessage } from "titan-reactor";

registerComponent(
  { screen: "@replay/ready" },
  () => {
    const ref = useRef();

    useMessage(fps => {
      if (ref.current) {
        ref.current.textContent = fps;
      }
    });

    return (
      <p
        ref={ref}
        style={{ color: "white", position: "absolute", top: 0, left:0, zIndex: 100 }}
      ></p>
    );
  }
);
