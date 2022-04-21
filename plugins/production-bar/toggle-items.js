import { useState, useEffect } from "react";

const _minCycleTime = 10000;

// let productionView = 0;

// export const toggleProductionView = (val) => {
//     if (val) {
//       productionView = val;
//     } else {
//       productionView = (productionView + 1) % views.length;
//     }
//   };

// export const setAutoProductionView = (enabled) => {
//     if (enabled) {
//         startTogglingProduction();
//     } else {
//         stopTogglingProduction();
//     }
//     return enabled;
// };

// export const onTechNearComplete = () => {
//     // only do this if we have auto toggling on
//     if (!_productionInterval || _cycleTime > _minCycleTime) return;

//     productionView = TechProductionView;
//     _cycleTime = _minCycleTime * 1.25;
//     startTogglingProduction();
// };

// export const onUpgradeNearComplete = () => {
//     // only do this if we have auto toggling on and we're not already doing this
//     if (!_productionInterval || _cycleTime > _minCycleTime) return;
//     productionView = UpgradesProductionView;
//     startTogglingProduction();
//     _cycleTime = _minCycleTime * 1.25;
// };

// export const startTogglingProduction = (hasUpgrades, hasTech) => {
//     clearTimeout(_productionInterval);
//     const fn = () => {
//       clearTimeout(_productionInterval);

//       let nextProductionView = productionView + 1;
//       if (nextProductionView === TechProductionView && !hasTech()) {
//         nextProductionView++;
//       }
//       if (nextProductionView === UpgradesProductionView && !hasUpgrades()) {
//         nextProductionView++;
//       }
//       nextProductionView = nextProductionView % views.length;

//       let timeModifier = 1;
//       if (nextProductionView === UnitProductionView) {
//         timeModifier = 3 / 5;
//       } else if (
//         nextProductionView === UpgradesProductionView ||
//         nextProductionView === TechProductionView
//       ) {
//         timeModifier = 1 / 2;
//       }

//       productionView = nextProductionView;
//       if (_cycleTime > _minCycleTime) {
//         _cycleTime = _minCycleTime;
//       }
//       _productionInterval = setTimeout(fn, _cycleTime * timeModifier);
//     };
//     _productionInterval = setTimeout(fn, _cycleTime);
// };

// const stopTogglingProduction = () => {
//     clearTimeout(_productionInterval);
//     _productionInterval = null;
// }

export const useToggleItems = (enabled, ...args) => {
    const [mode, setMode] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => {
            setMode((mode + 1) % args.length);
        }, _minCycleTime * (args[mode].length/10))

        return () => clearTimeout(t);
    });

    if (!enabled) {
        return args.flat();
    } else {
        return args[mode];
    }
}