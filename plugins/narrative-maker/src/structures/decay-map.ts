import { SimpleHeatmap } from "./heatmap";

export class DecayMap extends SimpleHeatmap {
  defaultDecay = 0.9;

  decayAll(decay = this.defaultDecay) {
    for (const quadrant of this.heatmap) {
      quadrant.value *= decay;
    }
  }

  decay(x: number, y: number, decay = this.defaultDecay) {
    const index = this.getIndex(x, y);
    this.heatmap[index].value *= decay;
    if (this.heatmap[index].value < 0) {
      this.heatmap[index].value = 0;
    } else if (this.heatmap[index].value > 1) {
      this.heatmap[index].value = 1;
    }
  }
}
