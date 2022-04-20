import React, { useEffect, useRef } from "react";
import { assets, usePlayer } from "titan-reactor";

const filters = [
  "grayscale(1) brightness(2)",
  "brightness(2)",
  "hue-rotate(50deg)   brightness(3)",
  "hue-rotate(66deg)   brightness(5)",
  "hue-rotate(91deg)   brightness(4)",
];

const calcStep = (unit, maxHp) => unit ? Math.ceil(Math.min(1, unit.hp / (maxHp * 0.8)) * 3) : 0;

const SmallUnitItem = ({ unit, owner, showLoaded, onClick }) => {
  const cmdIcons = assets.cmdIcons;
  const bwDat = assets.bwDat;

  const isFirstRun = useRef(true);
  const imgRef = useRef(null);
  const borderRef = useRef(null);

  const getPlayer = usePlayer();

  useEffect(() => {
    if (!imgRef.current || !borderRef.current) {
      return;
    }

    const unitType = bwDat.units[unit?.typeId];
    const step = calcStep(unit, unitType?.hp);

    const trans = "filter 1s linear";

    if (unit) {
      imgRef.current.src = cmdIcons[unit.typeId];
      imgRef.current.style.display = "block";
      imgRef.current.style.filter = filters[step];
      if (!isFirstRun.current) {
        imgRef.current.style.transition = trans;
      }
      isFirstRun.current = false;

      if (owner !== undefined && owner < 8) {
        borderRef.current.style.borderColor = getPlayer(owner).color;
      } else {
        borderRef.current.style.borderColor = "";
      }
      if (showLoaded && unitType.spaceRequired > 1) {
        // imgRef.current.classList.add("h-16");
        if (unitType.spaceRequired === 2) {
          borderRef.current.style.gridRowStart = "span 2";
          borderRef.current.style.gridColumnStart = "auto";
        } else if (unitType.spaceRequired === 4) {
          borderRef.current.style.gridRowStart = "span 2";
          borderRef.current.style.gridColumnStart = "span 2";
        }
      } else {
        borderRef.current.style.gridRowStart = "auto";
        borderRef.current.style.gridColumnStart = "auto";
        // imgRef.current.classList.remove("h-16");
      }
    } else if (!unit && !showLoaded) {
      borderRef.current.style.borderColor = "";
    } else {
      imgRef.current.style.display = "none";
      borderRef.current.style.borderColor = showLoaded ? "transparent" : "";
    }
  }, [unit]);

  return (
    <div
      ref={borderRef}
      onClick={onClick}
      style={{
        position: "relative",
        border: "1px solid var(--gray-7)",
        borderRadius: "var(--radius-2)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "border 300ms linear",
      }}
    >
      <img ref={imgRef} />
    </div>
  );
};
export default SmallUnitItem;
