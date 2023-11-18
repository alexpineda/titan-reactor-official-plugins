
export type Quadrant<T> = { items: T[], x: number, y: number };

// simple quadrant for items
/**
 * @public
 */
export class SimpleQuadtree<T> {
  #size: number;
  #scale: THREE.Vector2;
  #offset: THREE.Vector2;
  #items: Record<string, T[]> = {};

  #normalized = new THREE.Vector2();
  #radius = new THREE.Vector2();

  #quadrants: Quadrant<T>[] = []

  get quadrants() {
    return this.#quadrants;
  }

  get size() {
    return this.#size;
  }

  constructor(size: number, scale = new THREE.Vector2(1, 1), offset = new THREE.Vector2(0, 0),) {
    this.#size = size;

    for (let y = 0; y < this.#size; y++) {
      for (let x = 0; x < this.#size; x++) {
        const items = this.#items[`${x},${y}`] = [];
        this.#quadrants[y * this.#size + x] = { items, x, y };
      }
    }

    this.#scale = scale;
    this.#offset = offset;

  }

  getQuadrant(x: number, y: number) {
    return this.#quadrants[y * this.#size + x];
  }

  normalize(out: THREE.Vector2, x: number, y: number, useOffset = true) {
    out.set(
      Math.floor(((x + (useOffset ? this.#offset.x : 0)) / this.#scale.x) * this.size), Math.floor(((y + (useOffset ? this.#offset.y : 0)) / this.#scale.y) * this.size));
  }

  denormalize( out: THREE.Vector2, x: number, y: number ) {
    out.set(
      ((x / this.size) * this.#scale.x) - this.#offset.x, ((y / this.size) * this.#scale.y) - this.#offset.y);
  }

  add(x: number, y: number, item: T) {
    this.normalize(this.#normalized, x, y);
    this.#items[`${this.#normalized.x},${this.#normalized.y}`].push(item);
  }

  *getNearby(x: number, y: number, radius = 0, normalize = true) {
    if (normalize) {
      this.normalize(this.#normalized, x, y);
    } else {
      this.#normalized.set(x, y);
    }

    if (radius === 0) {
      return this.#items[`${this.#normalized.x},${this.#normalized.y}`];
    } else {

      this.normalize(this.#radius, radius, radius, false);

      const minX = Math.floor(Math.max(0, this.#normalized.x - this.#radius.x));
      const minY = Math.floor(Math.max(0, this.#normalized.y - this.#radius.y));
      const maxX = Math.floor(Math.min(this.#size - 1, this.#normalized.x + this.#radius.x));
      const maxY = Math.floor(Math.min(this.#size - 1, this.#normalized.y + this.#radius.y));

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