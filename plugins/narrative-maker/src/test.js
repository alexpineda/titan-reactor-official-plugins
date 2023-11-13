function standardDeviation(values )  {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }
function calculateMultiplayerClosenessFactor(values) {
    let sumOfDifferences = 0;
    for (let i = 0; i < values.length; i++) {
        for (let j = i + 1; j < values.length; j++) {
            sumOfDifferences += Math.abs(values[i] - values[j]);
        }
    }

    return (sumOfDifferences !== 0 ? 1 / sumOfDifferences : 100) / 2; // Assign a high score for balanced distribution, adjust as needed
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

    return sumOfDifferences !== 0 ? 1 / sumOfDifferences : 100; // Adjust the high score as needed
}

// console.log(calculateMultiplayerClosenessFactor([0,0,0,0,0,0,0,0]));
// console.log(calculateMultiplayerClosenessFactor([10,0,0,0,0,0,0,0]));
// console.log(calculateMultiplayerClosenessFactor([0,10,0,0,0,0,0,0]));
// console.log(calculateMultiplayerClosenessFactor([10,10,0,0,0,0,0,0]));

console.log(calculateInterestFactor([0,0,0,0,0,0,0,0], 2));
console.log(calculateInterestFactor([10,0,0,0,0,0,0,0], 2));
console.log(calculateInterestFactor([0,10,0,0,0,0,0,0], 2));
console.log(calculateInterestFactor([10,10,0,0,0,0,0,0], 2));