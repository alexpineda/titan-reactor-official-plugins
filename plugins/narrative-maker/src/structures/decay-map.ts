import { ValueGrid } from "./value-grid";

export class DecayMap extends ValueGrid<number> {
  defaultDecay = 0.9;

  decayAll(decay = this.defaultDecay) {
    for (const quadrant of this.grid) {
      quadrant.value *= decay;
    }
  }

  decay(x: number, y: number, decay = this.defaultDecay) {
    const index = this.getIndex(x, y);
    this.grid[index].value *= decay;
    if (this.grid[index].value < 0) {
      this.grid[index].value = 0;
    } else if (this.grid[index].value > 1) {
      this.grid[index].value = 1;
    }
  }
}
