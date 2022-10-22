import range from 'https://cdn.skypack.dev/lodash.range';
import React, { useEffect, useRef } from "react";
import { assets } from "titan-reactor/runtime";

let stepLayers = range(0, 4).map(() => 0);

function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
  return array;
}

const findRandomIndex = (list, pred) => {
  const eligible = shuffle(range(0, list.length));

  while (eligible.length) {
    const idx = eligible.shift();
    if (pred(list[idx])) {
      return idx;
    }
  }
};

const steps = range(0, 8).map(() => {
  const idx = findRandomIndex(stepLayers, (layer) => layer < 120);
  stepLayers[idx] = stepLayers[idx] + 60;
  return [...stepLayers];
});

const zergSteps = range(0, 6).map((step) => {
  const layers = range(0, 4);

  //best guesses for zerg layer colors
  switch (step) {
    case 0:
      layers[0] = "hue-rotate(267deg) brightness(177%) saturate(0.4)";
      layers[1] = "hue-rotate(225deg) brightness(80%) saturate(0.6)";
      layers[2] = "hue-rotate(242deg) brightness(50%) saturate(0.6)";
      layers[3] = "hue-rotate(235deg) brightness(60%) saturate(0.6)";
      break;
    case 1:
      layers[0] = "hue-rotate(35deg) brightness(200%) saturate(0.8)";
      layers[1] = "hue-rotate(0deg) brightness(77%) saturate(0.7)";
      layers[2] = "hue-rotate(0deg) brightness(68%) saturate(0.6)";
      layers[3] = "hue-rotate(225deg) brightness(81%) saturate(0.7)";
      break;
    case 2:
      layers[0] = "hue-rotate(33deg) brightness(265%) saturate(0.8)";
      layers[1] = "hue-rotate(1deg) brightness(73%) saturate(0.9)";
      layers[2] = "hue-rotate(18deg) brightness(122%) saturate(0.7)";
      layers[3] = "hue-rotate(280deg) brightness(134%) saturate(0.3)";
      break;
    case 3:
      layers[0] = "hue-rotate(88deg) brightness(266%) saturate(0.6)";
      layers[1] = "hue-rotate(35deg) brightness(454%) saturate(0.9)";
      layers[2] = "hue-rotate(45deg) brightness(155%) saturate(0.5)";
      layers[3] = "hue-rotate(289deg) brightness(100%) saturate(0.3)";
      break;
    case 4:
      layers[0] = "hue-rotate(99deg) brightness(224%) saturate(0.8)";
      layers[1] = "hue-rotate(43deg) brightness(337%) saturate(0.9)";
      layers[2] = "hue-rotate(42deg) brightness(143%) saturate(0.6)";
      layers[3] = "hue-rotate(8deg) brightness(80%) saturate(0.7)";
      break;
    case 5: //
      layers[0] = "hue-rotate(45deg) brightness(437%) saturate(1)";
      layers[1] = "hue-rotate(113deg) brightness(262%) saturate(0.8)";
      layers[2] = "hue-rotate(37deg) brightness(341%) saturate(0.8)";
      layers[3] = "hue-rotate(0deg) brightness(90%) saturate(0.7)";
  }

  return layers;
});

const getFilter = (unit, step, layerIndex) => {
  let effectiveStep = steps[step][layerIndex];

  if (unit.extras.dat.isZerg || (unit.extras.dat.isResourceContainer && unit.owner > 7)) {
    return zergSteps[step][layerIndex];
  } else {
    let degree;
    let brightness;
    if (unit.extras.dat.isTerran) {
      brightness = "brightness(400%)";
      degree = effectiveStep;
      //protoss yellow needs some different settings
    } else if (effectiveStep === 60) {
      brightness = "brightness(425%)";
      degree = 70;
      //protoss brightness lower than terran
    } else {
      brightness = "brightness(250%)";
      degree = effectiveStep;
    }

    return `hue-rotate(${degree}deg) ${effectiveStep > 0 ? brightness : ""}`;
  }
};

const calcStepZerg = (unit) =>
  unit.extras.dat.isResourceContainer ? 5 : Math.floor((unit.hp / unit.extras.dat.hp) * 5);

const calcStepTerranProtoss = (unit) =>
  unit.hp === unit.extras.dat.hp
    ? 7
    : Math.floor(Math.min(1, unit.hp / (unit.extras.dat.hp * 0.77)) * 6);

const calcStep = (unit) =>
  unit.extras.dat.isZerg || (unit.extras.dat.isResourceContainer && unit.owner > 7)
    ? calcStepZerg(unit)
    : calcStepTerranProtoss(unit);

const calcTypeId = (unit) =>
  unit.extras.dat.isZerg &&
  unit.extras.dat.isBuilding &&
  unit.buildQueue?.length
    ? unit.buildQueue[0]
    : unit.typeId;




const refLayer = (ref) => ({ ref, filter: "", backgroundImage: "", step: 0 });

const shieldStyle = { filter: "hue-rotate(200deg)" };

const Wireframe = ({ unit, size = "lg" }) => {
  const wireframeIcons = assets.wireframeIcons;
  const layerRefs = range(0, 4).map(() => refLayer(useRef()));
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (layerRefs.some(({ ref: { current } }) => !current)) {
        return;
    }

    const typeId = calcTypeId(unit);
    const step = calcStep(unit);
    const trans =  (unit.extras.dat.isBuilding ? "filter 4s linear" : "filter 1s linear");

    for (let i = 0; i < 4; i++) {
      const filter = getFilter(unit, step, i);

      if (!isFirstRun.current) {
        layerRefs[i].ref.current.style.transition = trans;
      }

      if (layerRefs[i].filter !== filter) {
        layerRefs[i].ref.current.style.filter = filter;
        layerRefs[i].filter = filter;
      }

      const backgroundImage = `url(${wireframeIcons[typeId]})`;
      if (layerRefs[i].backgroundImage !== backgroundImage) {
        layerRefs[i].ref.current.style.backgroundImage = backgroundImage;
        layerRefs[i].backgroundImage = backgroundImage;
      }
    }

    isFirstRun.current = false;

  }, [unit]);

  let style = { width: "128px", height: "128px", position: "relative"  }
  const layerStyle = {
    width: "128px",
    height: "128px",
    position: "absolute",
  };

  if (size === "md") {
    style = { width: "64px", height: "64px", position: "relative" };
    layerStyle.transform = "translate(-32px, -32px) scale(0.5)";
  } else if (size === "sm") {
    style = { width: "32px", height: "32px", position: "relative" };
    layerStyle.transform = "translate(-16px, -16px) scale(0.25)";
  }

  return (
    <div style={style}>
      {layerRefs.map(({ ref }, i) => {
        return (
          <div
            key={i}
            ref={ref}
            style={{
              ...layerStyle,
              backgroundPositionX: `-${i * 128}px`,
            }}
          ></div>
        );
      })}

      {unit.shields > 0 && (
        <>
          <div
            style={{
              ...layerStyle,
              ...shieldStyle,
              backgroundPositionX: "-512px",
            }}
          ></div>
          {unit.shields === unit.extras.dat.shields && (
            <div
              style={{
                ...layerStyle,
                ...shieldStyle,
                backgroundPositionX: "-640px",
              }}
            ></div>
          )}
        </>
      )}
    </div>
  );
};
export default Wireframe;
