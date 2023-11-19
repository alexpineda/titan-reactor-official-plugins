import type { Unit } from "@titan-reactor-runtime/host";
import type PluginAddon from "./index";
import { Quadrant } from "./structures/array-grid";
import { distance } from "./utils/math-utils";
import { maxScoreUnit } from "./unit-interest/unit-score-calculator";

const _pos = new THREE.Vector3();

export class SecondView {
  #plugin: PluginAddon;
  followedUnit: Unit | null = null;

  constructor(plugin: PluginAddon) {
    this.#plugin = plugin;
  }

  
  #activate(quadrant: Quadrant<Unit>) {
    const plugin = this.#plugin;

    let _maxScoreUnit = (this.followedUnit =
      maxScoreUnit(quadrant.items, plugin.scoreCalculator));

    const nx = _maxScoreUnit.x;
    const ny = _maxScoreUnit.y;

    plugin.pxToWorld.xyz(nx, ny, _pos);

    plugin.secondViewport.orbit.moveTo(_pos.x, _pos.y, _pos.z, true);
    plugin.secondViewport.orbit.dollyTo(
      (plugin.config.baseDistance * 3) / 4,
      true
    );
  }

  activateIfExists(
    secondHottestQuadrant: Quadrant<Unit> | undefined,
    hottestQuadrant: Quadrant<Unit>,
  ) {
    const plugin = this.#plugin;

    if (secondHottestQuadrant && secondHottestQuadrant.items.length > 0) {
      if (
         distance(hottestQuadrant, secondHottestQuadrant) > 4
      ) {
        this.#activate(secondHottestQuadrant);
        plugin.secondViewport.enabled = true;
      } else {
        plugin.secondViewport.enabled = false;
      }
    } else {
      plugin.secondViewport.enabled = false;
    }
  }

  onUnitDestroyed(unit: Unit) {
    if (this.followedUnit?.id === unit.id) {
      this.followedUnit = null;
    }
  }

  onTick() {
    const plugin = this.#plugin;
    if (this.followedUnit) {
      plugin.pxToWorld.xyz(this.followedUnit.x, this.followedUnit.y, _pos);
      plugin.secondViewport.orbit.moveTo(_pos.x, _pos.y, _pos.z, true);
    }
  }

  reset() {
    this.followedUnit = null;
  }
}
