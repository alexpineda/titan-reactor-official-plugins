export class GridTransform {
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