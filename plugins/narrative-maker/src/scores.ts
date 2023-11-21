import { DecayGrid } from "./structures/decay-grid";
import { Grid } from "./structures/grid";
import { GridTransform } from "./structures/grid-transform";
import { AO_Unit, QuadrantUserData } from "./utils/unit-helpers";
import { ArrayGridItem, NumericGridItem } from "./structures/grid-item";
export class ScoreManager {

  size: number;

  units: Grid<AO_Unit[], QuadrantUserData>;
  adhd: DecayGrid;
  action: Grid<number>;
  tension: Grid<number>;
  strategy: Grid<number>;
  wScore: Grid<number>;

  prevActions: Grid<number>[] = [];
  deltaAction: Grid<number>;

  worldGrid: GridTransform;
  pxGrid: GridTransform;

  constructor(size: number, mapSize: number[]) {
    this.size = size;
    this.units = new Grid<AO_Unit[], QuadrantUserData>(size, ArrayGridItem);
    for (const unit of this.units.grid) {
      unit.userData = {
        active: {
          score: 0,
          action: 0,
          adhd: 0,
          tension: 0,
          strategy: 0,
        },
        lastUsed: {
          score: 0,
          action: 0,
          adhd: 0,
          tension: 0,
          strategy: 0,
        }
      };
    }
    this.adhd = new DecayGrid(size, NumericGridItem);
    this.action = new Grid(size, NumericGridItem);
    this.tension = new Grid(size, NumericGridItem);
    this.strategy = new Grid(size, NumericGridItem);
    this.wScore = new Grid(size, NumericGridItem);

    this.deltaAction = new Grid(size, NumericGridItem);
    this.prevActions = new Array(10).fill(0).map(() => new Grid(size, NumericGridItem));

    this.worldGrid = new GridTransform(
        new THREE.Vector2(size, size),
        new THREE.Vector2(mapSize[0], mapSize[1]),
        new THREE.Vector2(mapSize[0] / 2, mapSize[1] / 2),
    );

    this.pxGrid = new GridTransform(
        new THREE.Vector2(size, size),
        new THREE.Vector2(mapSize[0] * 32, mapSize[1] * 32),
        new THREE.Vector2(0, 0),
    );
  }

  clear() {
    this.units.clear();
    this.adhd.clear();
    this.action.clear();
    this.tension.clear();
    this.strategy.clear();
  }
  
}