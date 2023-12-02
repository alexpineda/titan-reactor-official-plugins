export interface ConfigSchema0_0_1 {
_visible: {
folder: string;
label: string;
value: boolean;
};
showDebug: {
label: string;
value: boolean;
};
tilt: {
folder: string;
label: string;
step: number;
max: number;
value: number;
};
baseDistance: {
folder: string;
label: string;
step: number;
min: number;
max: number;
value: number;
};
distanceVariance: {
folder: string;
label: string;
step: number;
max: number;
value: number;
};
azimuthVariance: {
folder: string;
label: string;
step: number;
max: number;
value: number;
};
polarVariance: {
folder: string;
label: string;
step: number;
max: number;
value: number;
};
heatMapDecay: {
label: string;
step: number;
min: number;
max: number;
value: number;
};
heatmapUpdateInterval: {
label: string;
step: number;
min: number;
max: number;
value: number;
};
pipSize: {
folder: string;
label: string;
step: number;
min: number;
max: number;
value: number;
};
minReplaySpeed: {
label: string;
step: number;
min: number;
max: number;
value: number;
};
maxReplaySpeed: {
label: string;
step: number;
min: number;
max: number;
value: number;
};
autoSelectUnits: {
label: string;
value: boolean;
};
}
export interface Config0_0_1 {
_visible: boolean;
showDebug: boolean;
tilt: number;
baseDistance: number;
distanceVariance: number;
azimuthVariance: number;
polarVariance: number;
heatMapDecay: number;
heatmapUpdateInterval: number;
pipSize: number;
minReplaySpeed: number;
maxReplaySpeed: number;
autoSelectUnits: boolean;
}
