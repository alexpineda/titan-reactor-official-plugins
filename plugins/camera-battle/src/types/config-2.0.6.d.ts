export interface ConfigSchema2_0_6 {
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
}
export interface Config2_0_6 {
  sensitivity: number;
  fov: number;
  rotateSpeed: number;
  elevateAmount: number;
  rotateAzimuthStart: number;
  rotatePolarStart: number;
  defaultDistance: number;
}

