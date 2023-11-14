import { Unit } from "@titan-reactor-runtime/host";
import { QUAD_SIZE } from "./constants";

export const getAverage = (arr: number[]) => {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

export const getMax = (arr: number[]) => {
  return Math.max(...arr);
};

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export function easeInQuad(x: number): number {
  return x * x;
}

export function easeInCubic(x: number): number {
  return x * x * x;
}

export function easeInQuart(x: number): number {
  return x * x * x * x;
}

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

  // Optional: Normalize the variance by the dimensions of the map
  const normalizedVarianceX =
    varianceX / Math.pow((mapSize[0] * 32) / QUAD_SIZE, 2);
  const normalizedVarianceY =
    varianceY / Math.pow((mapSize[1] * 32) / QUAD_SIZE, 2);

  // Adjust camera distance. This can be a function of normalized variance.
  // For this example, let's say we linearly scale camera distance
  const cameraDistance = Math.sqrt(normalizedVarianceX + normalizedVarianceY);

  return cameraDistance;
};

export function standardDeviation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
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


export const calculateWeightedCenter = (out: THREE.Vector2, units: Unit[], xKey: keyof Unit, yKey: keyof Unit, scoreFn: (unit: Unit) => number) => {
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
    weightedSumX += ((unit[xKey] as number) * unitScore) / maxScore;
    weightedSumY += ((unit[yKey] as number) * unitScore) / maxScore;
    totalWeight += unitScore / maxScore;
  }

  return out.set(weightedSumX / totalWeight, weightedSumY / totalWeight);

}