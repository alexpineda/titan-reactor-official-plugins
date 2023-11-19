
export interface GridValue<T> { value: T, x: number, y: number, clear(): void };

export class NumericGridValue implements GridValue<number> {
  value = 0;
  x = 0;
  y = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  clear() {
    this.value = 0;
  }
}

export class ArrayGridValue<T> implements GridValue<T[]> {
  value: T[] = [];
  x = 0;
  y = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  clear() {
    this.value.length = 0;
  }
}