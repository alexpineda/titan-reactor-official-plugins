import React, { useRef, useEffect, forwardRef } from "react";
import { assets } from "titan-reactor";

const unitIsComplete = (unit) => {
  return unit.statusFlags & 0x01 === 1;
}

const getDisplayText = (unit) => {
  if (unit.owner > 7 || !unit.extras.dat.isBuilding) {
    return "";
  }
  if (unitIsComplete(unit) || unit.remainingTrainTime) {
    if (
      unit.remainingTrainTime &&
      unit.extras.dat.isTerran &&
      !unit.buildQueue?.length &&
      !unit.extras.dat.isAddon
    ) {
      return "Adding On";
    }
    return "";
  }
  if (unit.extras.dat.isTerran) {
    return "Constructing";
  } else if (unit.extras.dat.isZerg) {
    return "Mutating";
  } else {
    return "Warping";
  }
};

const displayTextSelector = (unit) => {
  if (!unit) return "";
  return getDisplayText(unit);
};

const researchSelector = (unit) => {
  if (unit.owner > 7) return 0;

  const { tech, upgrades } = useProductionStore.getState();
  const t = tech[unit.owner].find(
    (t) => t && t.unitId === unit.id && !t.timeCompleted
  );
  if (t) {
    return t.remainingBuildTime / t.buildTime;
  }
  const u = upgrades[unit.owner].find(
    (t) => t && t.unitId === unit.id && !t.timeCompleted
  );
  if (u) {
    return u.remainingBuildTime / u.buildTime;
  }
  return 0;
};

const styles =  {
  label: {
    color: "var(--gray-5)"
  },
  wrapper: {
    position: "relative",
    marginTop: "var(--size-3)",
    width: "128px",
    height: "0.875rem",
    visibility: "hidden",
  },
  pattern: {
    position: "absolute",
    top: "0",
    left: "0",
    bottom: "0",
    right: "0",
    borderRadius: "var(--radius-2)",
    border: "var(--border-size-2) solid",
    borderColor: "#00ee00",
    backgroundImage:
      "linear-gradient(to right, #000000, #000000 2px, #00ee00 2px, #00ee00 )",
    backgroundSize: "7px 100%",
    backgroundRepeatX: "repeat"
  },
  innerBorder: {
    borderRadius: "var(--radius-3)",
    border: "var(--border-size-2) solid black",
    position: "absolute",
    zIndex: "10",
    left: "2px",
    top: "2px",
    right: "2px",
    bottom: "2px",
  },
  progress: {
    backgroundColor: "black",
    borderRadius: "var(--radius-3)",
    position: "absolute",
    zIndex: "20",
    left: "2px",
    top: "2px",
    right: "2px",
    bottom: "2px",
    transition: "transform 1s",
  }
}

const Progress = forwardRef(({ unit }, ref) => {
  const bwDat = assets.bwDat;
  const progressRef = useRef(null);
  const wrapperRef = useRef(null);
  const displayTextRef = useRef(null);

  const queuedZergType =
    unit.extras.dat.isZerg && unit.buildQueue?.length
      ? bwDat.units[unit.buildQueue[0]]
      : null;

  const progressSelector = (unit) => {
    if (unit.remainingBuildTime > 0 && unit.owner < 8) {
      return (
        unit.remainingBuildTime /
        (queuedZergType ? queuedZergType.buildTime : unit.extras.dat.buildTime)
      );
    } else if (unit.remainingTrainTime > 0) {
      return unit.remainingTrainTime;
    } else {
      return 0;
    }
  };

  useEffect(() => {
    if (!progressRef.current || !wrapperRef.current || !displayTextRef.current)
      return;

    const progress = progressSelector(unit);// || researchSelector(unit);
    const text = displayTextSelector(unit);

    if (progress > 0 && progress <= 1) {
      progressRef.current.style.transformOrigin = "top right";
      progressRef.current.style.transform = `scaleX(${progress})`;
      progressRef.current.style.transition = "transform 1s";

      wrapperRef.current.style.visibility = "visible";
      displayTextRef.current.textContent = text;
    } else {
      displayTextRef.current.textContent = "";
      wrapperRef.current.style.visibility = "hidden";
    }
    return () => {
      progressRef.current.style.transition = "transform 0s";
    }
  }, [unit]);

  return (
    <div ref={ref}>
      <p ref={displayTextRef} style={styles.label}></p>
      <div
        ref={wrapperRef}
        style={styles.wrapper}
      >
        <div
          style={styles.pattern}
        ></div>
        <div
          style={styles.innerBorder}
        ></div>
        <div
          ref={progressRef}
          style={styles.progress}
        ></div>
      </div>
    </div>
  );
});
export default Progress;
