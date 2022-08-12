import { useRef } from "react";
import { useMessage } from "titan-reactor-runtime";

//@ts-ignore
registerComponent({ screen: "@replay" }, () => {
  const ref = useRef<HTMLParagraphElement>(null);

  useMessage((fps: number) => {
    if (ref.current) {
      ref.current.textContent = "" + fps;
    }
  });

  return (
    <p
      ref={ref}
      style={{
        color: "white",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    ></p>
  );
});
