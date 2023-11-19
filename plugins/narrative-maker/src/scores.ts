import { DecayMap } from "./structures/decay-map";
import { ValueGrid } from "./structures/value-grid";
import { GridTransform } from "./structures/grid-transform";
import { AO_Unit } from "./utils/unit-helpers";
import { ArrayGridValue, NumericGridValue } from "./structures/grid-values";

export class ScoreManager {

  size: number;

  /**
   * Units by quadrant
   */
  units: ValueGrid<AO_Unit[]>;
  /**
   * 0 = pay attention
   * 1 = ignore
   */
  adhd: DecayMap;
  /**
   * Unit score averages by quadrant
   */
  action: ValueGrid<number>;

  /**
   * The differences in owners of units
   */
  tension: ValueGrid<number>;

  worldGrid: GridTransform;
  pxGrid: GridTransform;

  constructor(size: number, mapSize: number[]) {
    this.size = size;
    this.units = new ValueGrid<AO_Unit[]>(size, ArrayGridValue); // new ArrayGrid<AO_Unit>( size );
    this.adhd = new DecayMap(size, NumericGridValue);
    this.action = new ValueGrid(size, NumericGridValue);
    this.tension = new ValueGrid(size, NumericGridValue);

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
  }
  
}