function standardDeviation(values )  {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }


const _vals = [];

 function standardDeviation2(values ) {
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

function calculateMultiplayerClosenessFactor(values) {
    let sumOfDifferences = 0;
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
            sumOfDifferences += Math.abs(values[i] - values[j]);
        }
    }

    return 1 - ((sumOfDifferences !== 0 ? 1 / sumOfDifferences : 0) / values.length); // Assign a high score for balanced distribution, adjust as needed
}

function calculateInterestFactor(values , activePlayersCount )  {
    if (activePlayersCount < 2) {
        return 0; // Return a low score if less than 2 active players to reflect lack of competition
    }

    let sumOfDifferences = 0;
    for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
            // Calculate differences only if both players are active
            if (values[i] > 0 && values[j] > 0) {
                sumOfDifferences += Math.abs(values[i] - values[j]);
            }
        }
    }

    return sumOfDifferences !== 0 ? 1 / sumOfDifferences : 0; // Adjust the high score as needed
}

function calcCoeff(values, activePlayersCount) {
    let avg = 0;
    for (const val of values) {
        avg += val /values.length;
    }
    const std = standardDeviation(values);
    // coefficient of variation
    const coeff = std / avg;
    return 1 - coeff;
}

function getAverageAngle(angles ) {
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

  let anglesInRadians = [0, Math.PI, Math.PI];
  let averageDirection = getAverageAngle(anglesInRadians);
  console.log(averageDirection, Math.PI/2); // Outputs the average angle in radians

  let testA = [0, 1];
  testA[3] = 2;

  for (const t of testA) {
      console.log(t);
  }
// console.log(calculateMultiplayerClosenessFactor([0,0,0,0,0,0,0,0]));
// console.log(calculateMultiplayerClosenessFactor([10,0,0,0,0,0,0,0]));
// console.log(calculateMultiplayerClosenessFactor([0,10,0,0,0,0,0,0]));
// console.log(calculateMultiplayerClosenessFactor([10,10,0,0,0,0,0,0]));

// console.log(calcCoeff([0,5], 2));
// console.log(calcCoeff([10,5], 2));
// console.log(calcCoeff([0,10], 2));
// console.log(calcCoeff([10,10], 2));

// console.log(standardDeviation([0,5]));
// console.log(standardDeviation([10,5]));
// console.log(standardDeviation([0,10]));
// console.log(standardDeviation([10,10]));

// console.log(standardDeviation2([0,5]));
// console.log(standardDeviation2([10,5]));
// console.log(standardDeviation2([0,10]));
// console.log(standardDeviation2([10,10]));