import React, { useEffect, useRef } from "react";
import { easePolyOut } from 'https://cdn.skypack.dev/d3-ease';
import { assets, usePluginConfig } from "titan-reactor";

const poly = easePolyOut.exponent(0.5);

// an instance of a production item, either unit, research or upgrade
const ProductionItem = ({ item, color }) => {
  const config = usePluginConfig();
  const cmdIcons = assets.cmdIcons;

  const wrapperRef = useRef(null);
  const imgRef = useRef(null);
  const progressRef = useRef(null);
  const outlineRef = useRef(null);
  const countRef = useRef(null);

  useEffect(() => {
    if (
        !wrapperRef.current ||
        !imgRef.current ||
        !countRef.current ||
        !progressRef.current ||
        !outlineRef.current
      )
        return;
  
      if (item) {
        wrapperRef.current.style.display = "block";
  
        if (item.count > 1) {
          countRef.current.textContent = item.count;
          countRef.current.style.display = "block";
        } else {
          countRef.current.style.display = "none";
        }
  
        imgRef.current.src = cmdIcons[item.icon];
        const pct = poly(1 - item.progress) * 100;
        progressRef.current.style.backgroundImage = `linear-gradient(90deg, ${color}ee 0%, ${color}aa ${pct}%, rgba(0,0,0,0.5) ${pct}%)`;
  
        if ((item.isUpgrade || item.isResearch) && item.progress === 0) {
          outlineRef.current.style.outline = `2px groove ${color}aa`;
          // using a property as state to determine whether to add glow (only once)
          // if (Date.now() - item.timeCompleted < 4000) {
          //   outlineRef.current.style.animation = `glow-${item.owner} 0.4s 10 alternate`;
          // } else {
          //   outlineRef.current.style.animation = "";
          // }
        } else {
          outlineRef.current.style.animation = "";
          outlineRef.current.style.outline = "";
        }
      } else {
        wrapperRef.current.style.display = "none";
      }

  }, [item, color]);

  return (
    <div ref={wrapperRef} style={{
      position: "relative",
      width: `${config.iconSize}px`,
      height: `${config.iconSize}px`
    }}>
      <img
        ref={imgRef}
        style={{
          filter: "hue-rotate(64deg) brightness(10) contrast(0.8) grayscale(1)",
        }}
      />
      <div
        ref={progressRef}
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          right: 0,
          height: "4px",
        }}
      ></div>
      <div
        ref={outlineRef}
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          right: 0,
          top: 0
        }}
      ></div>
      <p
        ref={countRef}
        style={{
          color: "white",
          fontSize: "var(--font-size-1)",
          paddingInline: "var(--size-1)",
          borderRadius: "var(--radius-2)",
          bottom: 0,
          right: 0,
          zIndex: 20,
          position: "absolute",
          opacity: "0.9",
          fontFamily: "conthrax",
          fontWeight: "900",
          textShadow: "-2px -2px 2px black",
        }}
      ></p>
    </div>
  );
};

export default ProductionItem;
