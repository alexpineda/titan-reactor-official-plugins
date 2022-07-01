import React, { useRef, useEffect } from "react";
import { assets, enums } from "titan-reactor";

const unitIsComplete = (unit) => {
  return unit.statusFlags & enums.UnitFlags.Completed === 1;
}

const styles =  {
  label: {
    color: "var(--gray-5)"
  },
  wrapper: {
    position: "relative",
    marginTop: "var(--size-3)",
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

const Progress = ({ unit }) => {
  const bwDat = assets.bwDat;
  const progressRef = useRef(null);
  const wrapperRef = useRef(null);

  const researchSelector = (unit) => {
    if (unit.owner > 7) return 0;
  
    if (unit.upgrade) {
      return unit.upgrade.time / (bwDat.upgrades[unit.upgrade.id].researchTimeBase + bwDat.upgrades[unit.upgrade.id].researchTimeFactor * unit.upgrade.level);
    } else if (unit.research) {
      return unit.research.time / bwDat.tech[unit.research.id].researchTime;
    } 

    return 0;
  };

  const researchIconSelector = (unit) => {
    if (unit.owner > 7) return null;

    if (unit.upgrade) {
      return bwDat.upgrades[unit.upgrade.id].icon;
    } else if (unit.research) {
      return bwDat.tech[unit.research.id].icon;
    } else if (
      unit.extras.dat.isBuilding &&
      unit.remainingTrainTime &&
      unit.extras.dat.isTerran &&
      !unit.buildQueue?.length &&
      !unit.extras.dat.isAddon
    ) {
      return null;
    }

    return null;
  }

  const queuedZergType =
    unit.extras.dat.isZerg && unit.buildQueue?.length
      ? bwDat.units[unit.buildQueue[0]]
      : null;
      
  const progressSelector = (unit) => {
    //tank uses build time for siege transition?
    const isCompletedTank = (unit.typeId === enums.unitTypes.siegeTankSiegeMode ||
        unit.typeId === enums.unitTypes.siegeTankTankMode) &&
      unitIsComplete(unit);

    if (!isCompletedTank && unit.remainingBuildTime > 0 && unit.owner < 8) {
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
    if (!progressRef.current || !wrapperRef.current)
      return;

    const progress = progressSelector(unit) || researchSelector(unit);

    if (progress > 0 && progress <= 1) {
      progressRef.current.style.transformOrigin = "top right";
      progressRef.current.style.transform = `scaleX(${progress})`;
      progressRef.current.style.transition = "transform 1s";

      wrapperRef.current.style.visibility = "visible";
    } else {
      wrapperRef.current.style.visibility = "hidden";
    }
    return () => {
      progressRef.current.style.transition = "transform 0s";
    }
  }, [unit]);

  const techIcon = researchIconSelector(unit);

  return (
    <>
      {techIcon === null ? null : <img
        src={assets.cmdIcons[techIcon]}
        style={{
          marginTop: "-46px",
          marginLeft: "46px",
          border: "var(--border-size-2)",
          borderRadius: "var(--radius-2)",
          width: "var(--size-8)",
          height: "var(--size-8)",
          filter: "hue-rotate(69deg) brightness(9)",
          background: "black",
          border: "1px solid #aaaaaa22",
        }}
      />}
    <div>
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
    </>
  );
};
export default Progress;
