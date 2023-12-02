export interface ConfigSchema2_1_0 {
controlScheme: {
label: string;
options: string[];
value: string;
};
sensitivity: {
label: string;
min: number;
max: number;
value: number;
};
fov: {
folder: string;
label: string;
step: number;
min: number;
max: number;
value: number;
};
rotateSpeed: {
folder: string;
label: string;
step: number;
min: number;
max: number;
value: number;
};
elevateAmount: {
folder: string;
label: string;
step: number;
min: number;
max: number;
value: number;
};
rotateAzimuthStart: {
folder: string;
label: string;
step: number;
max: number;
value: number;
};
rotatePolarStart: {
folder: string;
label: string;
step: number;
max: number;
value: number;
};
defaultDistance: {
folder: string;
label: string;
step: number;
min: number;
max: number;
value: number;
};
keyboardSpeed: {
folder: string;
label: string;
step: number;
max: number;
value: number;
};
keyboardAccel: {
folder: string;
label: string;
step: number;
max: number;
value: number;
};
keyboardAccelMax: {
folder: string;
label: string;
step: number;
max: number;
value: number;
};
}
export interface Config2_1_0 {
controlScheme: string;
sensitivity: number;
fov: number;
rotateSpeed: number;
elevateAmount: number;
rotateAzimuthStart: number;
rotatePolarStart: number;
defaultDistance: number;
keyboardSpeed: number;
keyboardAccel: number;
keyboardAccelMax: number;
}
