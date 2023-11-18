
export type Quadrant<T> = { items: T[], x: number, y: number };

// simple quadrant for items
/**
 * @public
 */
export class ArrayGrid<T> {
  #size: number;
  #items: Record<string, T[]> = {};
  #quadrants: Quadrant<T>[] = []

  get quadrants() {
    return this.#quadrants;
  }

  get size() {
    return this.#size;
  }

  constructor( size: number ) {
    this.#size = size;

    for (let y = 0; y < this.#size; y++) {
      for (let x = 0; x < this.#size; x++) {
        const items = this.#items[`${x},${y}`] = [];
        this.#quadrants[y * this.#size + x] = { items, x, y };
      }
    }

  }

  getQuadrant(x: number, y: number) {
    return this.#quadrants[y * this.#size + x];
  }

  add(x: number, y: number, item: T) {
    this.#items[`${x},${y}`].push(item);
  }

  *getNearby(x: number, y: number, radius = 0) {
    if (radius === 0) {
      return this.#items[`${x},${y}`];
    } else {
      const minX = Math.floor(Math.max(0, x - radius));
      const minY = Math.floor(Math.max(0, y - radius));
      const maxX = Math.floor(Math.min(this.#size - 1, x + radius));
      const maxY = Math.floor(Math.min(this.#size - 1, y + radius));

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          for (const item of this.#items[`${x},${y}`]) {
            yield item;
          }
        }
      }
    }
  }

  clear() {
    for (let i = 0; i < this.#size; i++) {
      for (let j = 0; j < this.#size; j++) {
        this.#items[`${i},${j}`].length = 0;
      }
    }
  }
}