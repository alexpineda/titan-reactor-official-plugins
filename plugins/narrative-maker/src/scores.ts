import { Unit } from "@titan-reactor-runtime/host";
import { SimpleQuadtree } from "./structures/simple-quadtree";
import { DecayMap } from "./structures/decay-map";
import { SimpleHeatmap } from "./structures/heatmap";

class GridTransform {
    scale: THREE.Vector2;
    offset: THREE.Vector2;
    size: THREE.Vector2;

    constructor(size: THREE.Vector2, scale: THREE.Vector2, offset: THREE.Vector2) {
        this.scale = scale;
        this.offset = offset;
        this.size = size;
    }

    fromWorldToGrid(out: THREE.Vector2, x: number, y: number) {
        return out.set(
            Math.floor(((x + this.offset.x) / this.scale.x) * this.size.x), Math.floor(((y + this.offset.y) / this.scale.y) * this.size.y));
    }
    
    fromGridToWorld( out: THREE.Vector2, gridX: number, gridY: number ) {
        return out.set(
            ((gridX / this.size.x) * this.scale.x) - this.offset.x, ((gridY / this.size.y) * this.scale.y) - this.offset.y);
    }
}

export class ScoreManager {

  size: number;

  /**
   * Units by quadrant
   */
  units: SimpleQuadtree<Unit>;
  /**
   * 0 = pay attention
   * 1 = ignore
   */
  adhd: DecayMap;
  /**
   * Unit score averages by quadrant
   */
  action: SimpleHeatmap;

  /**
   * The differences in owners of units
   */
  tension: SimpleHeatmap;

  /**
   * Strategic buildings score
   */
  strategy: SimpleHeatmap;

  worldGrid: GridTransform;
  pxGrid: GridTransform;

  constructor(size: number, mapSize: number[]) {
    this.size = size;
    this.units = new SimpleQuadtree<Unit>(
        size,
        new THREE.Vector2(mapSize[0] * 32, mapSize[1] * 32),
        new THREE.Vector2(0, 0)
    );
    this.adhd = new DecayMap(size);
    this.action = new SimpleHeatmap(size);
    this.tension = new SimpleHeatmap(size);
    this.strategy = new SimpleHeatmap(size);

    this.worldGrid = new GridTransform(
        new THREE.Vector2(size, size),
        new THREE.Vector2(mapSize[0], mapSize[1]),
        new THREE.Vector2(-mapSize[0] / 2, -mapSize[1] / 2),
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