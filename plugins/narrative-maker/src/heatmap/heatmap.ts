
export type HeatmapValue = { value: number, x: number, y: number };

export class SimpleHeatmap {
  protected heatmap: HeatmapValue[] = [];
  protected size: number;

  constructor(size: number) {
    this.size = size;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        this.heatmap.push({ value: 0, x, y });
      }
    }
  }

  getIndex(x: number, y: number) {
    const idx = y * this.size + x;
    if (this.heatmap[idx] === undefined) {
      debugger
    }
    return idx;
  }
  
  get(x: number, y: number) {
    const index = this.getIndex(x, y);
    return this.heatmap[index].value;
  }

  set(x: number, y: number, value: number | undefined = 1) {
    const index = this.getIndex(x, y);
    this.heatmap[index].value = value;
  }
  
  clear() {
    for (const quadrant of this.heatmap) {
      quadrant.value = 0;
    }
  }

  getNearby(x: number, y: number, radius = 0) {
    const items: HeatmapValue[] = [];

    const minX = Math.floor(Math.max(0, x - radius));
    const minY = Math.floor(Math.max(0, y - radius));
    const maxX = Math.floor(Math.min(this.size - 1, x + radius));
    const maxY = Math.floor(Math.min(this.size - 1, y + radius));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const index = this.getIndex(x, y);
        items.push(this.heatmap[index]);
      }
    }

    return items;
  }
}