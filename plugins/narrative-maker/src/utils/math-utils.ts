import { Unit } from "@titan-reactor-runtime/host";
import { QUAD_SIZE } from "./constants";

export const getAverage = (arr: number[]) => {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

export const getMax = (arr: number[]) => {
  return Math.max(...arr);
};

export function easeOut(x: number, e: number): number {
  return 1 - Math.pow(1 - x, e);
}

export function easeIn(x: number, e: number): number {
  return Math.pow(x, e);
}

export function easeInSine(x: number): number {
  return 1 - Math.cos((x * Math.PI) / 2);
}

export const getAngle = ( direction: number ) => {
  direction -= 64;
  if ( direction < 0 ) direction += 256;
  return -( ( direction * Math.PI ) / 128.0 ) + Math.PI / 2.0;
};

export function distance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const deltaX = point2.x - point1.x;
  const deltaY = point2.y - point1.y;

  return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
}

export const getCameraDistance = (units: Unit[], mapSize: number[]) => {
  let meanX = 0;
  let meanY = 0;
  let n = units.length;

  // Calculate mean coordinates
  for (let unit of units) {
    meanX += unit.x;
    meanY += unit.y;
  }
  meanX /= n;
  meanY /= n;

  // Calculate variance for X and Y
  let varianceX = 0;
  let varianceY = 0;
  for (let unit of units) {
    varianceX += Math.pow(unit.x - meanX, 2);
    varianceY += Math.pow(unit.y - meanY, 2);
  }
  varianceX /= n;
  varianceY /= n;

  const normalizedVarianceX =
    varianceX / Math.pow((mapSize[0] * 32) / QUAD_SIZE, 2);
  const normalizedVarianceY =
    varianceY / Math.pow((mapSize[1] * 32) / QUAD_SIZE, 2);

  const cameraDistance = Math.sqrt(normalizedVarianceX + normalizedVarianceY);

  return cameraDistance;
};

const _vals: number[] = [];

export function standardDeviation(values: number[]): number {
  let mean = 0;
  for (const val of values) {
      mean += val / values.length;
  }

  //square diff
  _vals.length = values.length;
  for (let i = 0; i < values.length; i++) {
    _vals[i] = Math.pow(values[i] - mean, 2);
  }

  let avgSquareDiff = 0;
  for (const val of _vals) {
    avgSquareDiff += val / _vals.length;
  }
  return Math.sqrt(avgSquareDiff);
}

export function calcCoeff( values: number[] ) {
  if (values.length === 0) {
      return 0;
  }
  let avg = 0;
  for (const val of values) {
      avg += val / values.length;
  }
  if (avg === 0) {
    return 0;
  }
  const std = standardDeviation(values);
  // coefficient of variation
  const coeff = std / avg;
  return 1 - coeff;
}

  export function calculateMultiplayerClosenessFactor(values : number[]) {
    let sumOfDifferences = 0;
    for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
            sumOfDifferences += Math.abs(values[i] - values[j]);
        }
    }

    return (sumOfDifferences !== 0 ? 1 / sumOfDifferences : 0) / values.length; // Assign a high score for balanced distribution, adjust as needed
  }

export function spreadFactorVariance(units: THREE.Vector2[]): number {
  let meanX = 0;
  let meanY = 0;
  let n = units.length;

  // Calculate mean coordinates
  for (let i = 0; i < n; i++) {
    meanX += units[i].x;
    meanY += units[i].y;
  }
  meanX /= n;
  meanY /= n;

  // Calculate variance for X and Y
  let varianceX = 0;
  let varianceY = 0;
  for (let i = 0; i < n; i++) {
    varianceX += Math.pow(units[i].x - meanX, 2);
    varianceY += Math.pow(units[i].y - meanY, 2);
  }
  varianceX /= n;
  varianceY /= n;

  // Calculate total variance
  let totalVariance = varianceX + varianceY;

  return totalVariance;
}

export function maxTotalVariance(deltaX: number, deltaY: number): number {
  // Calculate variance using the function from before
  // const calculatedVariance = spreadFactorVariance(points);

  // Calculate maximum possible variance within the quartile
  const maxVarianceX = (Math.pow(0 - deltaX, 2) + Math.pow(deltaX - 0, 2)) / 2;
  const maxVarianceY = (Math.pow(0 - deltaY, 2) + Math.pow(deltaY - 0, 2)) / 2;

  // Normalize the variance
  // const normalizedVariance = calculatedVariance / maxTotalVariance;

  return maxVarianceX + maxVarianceY;
}

type GetUnitXY = (unit: Unit) => {x: number, y: number};

export const calculateWeightedCenter = (getUnitXY: GetUnitXY) => (out: THREE.Vector2, units: Unit[], scoreFn: (unit: Unit) => number) => {
  let weightedSumX = 0;
  let weightedSumY = 0;
  let totalWeight = 0;

  let maxScore = 0;
  for (const unit of units) {
    const unitScore = scoreFn(unit);
    if (unitScore > maxScore) {
      maxScore = unitScore;
    }
  }

  for (const unit of units) {
    const unitScore = scoreFn(unit);
    const pos = getUnitXY(unit);
    weightedSumX += (pos.x * unitScore) / maxScore;
    weightedSumY += (pos.y * unitScore) / maxScore;
    totalWeight += unitScore / maxScore;
  }

  return out.set(weightedSumX / totalWeight, weightedSumY / totalWeight);

}

export const calculateMeanCenter = (getUnitXY: GetUnitXY) => (out: THREE.Vector2, units: Unit[]) => {
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (const unit of units) {
    const pos = getUnitXY(unit);
    sumX += pos.x;
    sumY += pos.y;
    count ++;
  }

  // Avoid division by zero in case there are no units
  if (count === 0) {
    return out.set(0, 0);
  }

  return out.set(sumX / count, sumY / count);
}

export const calculateMedianCenter = (getUnitXY: GetUnitXY) => (out: THREE.Vector2, units: Unit[]) => {
  const xValues = units.map(unit => getUnitXY(unit).x).sort((a, b) => a - b);
  const yValues = units.map(unit => getUnitXY(unit).y).sort((a, b) => a - b);

  const medianX = calculateMedian(xValues);
  const medianY = calculateMedian(yValues);

  return out.set(medianX, medianY);
};

function calculateMedian(values: number[]) {
  if (values.length === 0) return 0;
  const middleIndex = Math.floor(values.length / 2);
  if (values.length % 2 === 0) {
    return (values[middleIndex - 1] + values[middleIndex]) / 2;
  } else {
    return values[middleIndex];
  }
}

export function getAverageAngle(angles: number[]): number {
  let sumX = 0;
  let sumY = 0;

  for (const angle of angles) {
      sumX += Math.cos(angle);
      sumY += Math.sin(angle);
  }

  let avgX = sumX / angles.length;
  let avgY = sumY / angles.length;

  return Math.atan2(avgY, avgX);
}

export function moveVectorByAngleAndMagnitude(out: THREE.Vector3, angle: number, mag: number) {
  out.x = out.x + Math.sin(angle) * mag;
  out.z = out.z + Math.cos(angle) * mag;
  return out;
}


export const normalizeWorldDistance = (a: THREE.Vector3, b: THREE.Vector3, maxDistance: number, abs = true) => {
  if (abs) {
    return clamp(Math.abs(a.distanceTo(b)) / maxDistance, 0, 1);
  } else {
    return clamp(a.distanceTo(b) / maxDistance, -1, 1);
  }
}

export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
}

export const constrain = (value: number, min: number, max: number) => {
  return clamp(value, min, max) / (max - min);
}
