import { Grid } from "./grid";

export class DecayGrid extends Grid<number> {
  defaultDecay = 0.9;

  decayAll(decay = this.defaultDecay) {
    for (const quadrant of this.grid) {
      quadrant.value *= decay;
    }
  }

  decay(xy: {x: number, y: number}, decay = this.defaultDecay) {
    const index = this.getIndex(xy.x, xy.y);
    this.grid[index].value *= decay;
    if (this.grid[index].value < 0) {
      this.grid[index].value = 0;
    } else if (this.grid[index].value > 1) {
      this.grid[index].value = 1;
    }
  }
}
