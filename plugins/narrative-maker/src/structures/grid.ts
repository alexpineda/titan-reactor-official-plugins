import { clamp } from "../utils/math-utils";
import { GridItem } from "./grid-item";


export class Grid<T, U = any> {
  grid: GridItem<T, U>[] = [];
  size: number;

  constructor(size: number, Constructor: new (x: number, y:number) => GridItem<T, U>) {
    this.size = size;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        this.grid.push(new Constructor(x, y));
      }
    }
  }

  getIndex(x: number, y: number) {
    const _x = clamp(x, 0, this.size - 1);
    const _y = clamp(y, 0, this.size - 1);

    if (x !== _x || y !== _y) {
      console.warn(`Grid index out of bounds: (${x}, ${y})`);
    }
    return _y * this.size + _x
  }
  
  /**
   * Get the grid value
   */
  get(xy: {x: number, y: number}) {
    const index = this.getIndex(xy.x, xy.y);
    return this.grid[index].value;
  }

  /**
   * Get the grid item
   */
  $get(xy: {x: number, y: number}) {
    const index = this.getIndex(xy.x, xy.y);
    return this.grid[index];
  }

  set(xy: {x: number, y: number}, value: T) {
    const index = this.getIndex(xy.x, xy.y);
    this.grid[index].value = value;
  }
  
  clear() {
    for (const quadrant of this.grid) {
      quadrant.clear();
    }
  }

  getNearbyList(arr: T[], xy: {x: number, y: number}, radius = 0) {
    arr.length = 0;
    for (const item of this.getNearby(xy, radius)) {
      arr.push(item.value);
    }
    return arr;
  }


  *getNearby(xy: {x: number, y: number}, radius = 0) {

    const minX = Math.floor(Math.max(0, xy.x - radius));
    const minY = Math.floor(Math.max(0, xy.y - radius));
    const maxX = Math.floor(Math.min(this.size - 1, xy.x + radius));
    const maxY = Math.floor(Math.min(this.size - 1, xy.y + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const index = this.getIndex(x, y);
        yield this.grid[index];
      }
    }
  }
}