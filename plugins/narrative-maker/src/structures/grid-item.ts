
export interface GridItem<T, U = any> { value: T, x: number, y: number, clear(): void, copy(v: T): void, userData: U };

export class GridItemGeneric<T, U = any> {
  value: T;
  x: number;
  y: number;
  userData: U;
  #genDefault: () => T;

  constructor(x: number, y: number, genDefault: () => T) {
    this.x = x;
    this.y = y;
    this.userData = {} as U;
    this.value = genDefault();
    this.#genDefault = genDefault;
  }

  clear() {
    this.value = this.#genDefault();
  }

  copy(v: T) {
    this.value = v;
  }

}

export class NumericGridItem<U = any> extends GridItemGeneric<number, U> {
  constructor(x: number, y: number) {
    super(x, y, () => 0);
  }
}

export class ArrayGridItem<T, U = any> extends GridItemGeneric<T[], U> {
  constructor(x: number, y: number) {
    super(x, y, () => []);
  }

  override clear() {
    this.value.length = 0;
  }

  override copy(v: T[]) {
    this.value.length = 0;
    this.value.push(...v);
  }
}