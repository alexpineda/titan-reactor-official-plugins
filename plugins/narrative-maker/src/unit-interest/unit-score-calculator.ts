import { Unit } from "@titan-reactor-runtime/host";

export type ScoreCombiner = (
  unit: Unit,
  orderScore: number,
  unitScore: number
) => number;

type UnitScoreCalculatorParams = {
  unitRanks: number[][];
  orderRanks: number[][];
  scoreCombiner?: ScoreCombiner;
  unitRankCurve: (t: number) => number;
  orderRankCurve: (t: number) => number;
}

export type UnitScoreCalculator = ReturnType<typeof createUnitScoreCalculator>;
let _defaultCombiner = ((_: Unit, unitScore: number, orderScore: number) => orderScore * unitScore);
export const createUnitScoreCalculator = ({ unitRanks, unitRankCurve, orderRanks, orderRankCurve, scoreCombiner }: UnitScoreCalculatorParams) => {
  // ranks that are not present are 0
  const max = unitRanks.length + 1;

  const getScore = (needle: number, ranks: number[][], curve: (t: number) => number) => {
    const i = ranks.findIndex(r => r.includes(needle));
    return curve((i + 1) / max);
  }

  const _combiner = scoreCombiner ?? _defaultCombiner;

  return (unit: Unit, combiner = _combiner) => combiner(unit, getScore(unit.typeId, unitRanks, unitRankCurve), getScore(unit.order!, orderRanks, orderRankCurve))
}

let _unitOnlyCombiner: ScoreCombiner = (_, unitScore) => unitScore;
export const maxScoreUnit = (units: Unit[], calcScore: UnitScoreCalculator) => {
  return units.reduce((max, unit) => {
    const score = calcScore(unit, _unitOnlyCombiner);
    if (score > calcScore(max, _unitOnlyCombiner)) max = unit;
    return max;
  }, units[0]);
}