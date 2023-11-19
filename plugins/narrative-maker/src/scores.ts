import { Unit } from "@titan-reactor-runtime/host";
import { ArrayGrid } from "./structures/array-grid";
import { DecayMap } from "./structures/decay-map";
import { ValueGrid } from "./structures/value-grid";
import { GridTransform } from "./structures/grid-transform";
import { AO_Unit } from "./utils/unit-helpers";

export class ScoreManager {

  size: number;

  /**
   * Units by quadrant
   */
  units: ArrayGrid<AO_Unit>;
  /**
   * 0 = pay attention
   * 1 = ignore
   */
  adhd: DecayMap;
  /**
   * Unit score averages by quadrant
   */
  action: ValueGrid;

  /**
   * The differences in owners of units
   */
  tension: ValueGrid;

  worldGrid: GridTransform;
  pxGrid: GridTransform;

  constructor(size: number, mapSize: number[]) {
    this.size = size;
    this.units = new ArrayGrid<AO_Unit>( size );
    this.adhd = new DecayMap(size);
    this.action = new ValueGrid(size);
    this.tension = new ValueGrid(size);

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