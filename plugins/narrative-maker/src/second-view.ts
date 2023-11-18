import type { Unit } from "@titan-reactor-runtime/host";
import type PluginAddon from "./index";
import { Quadrant } from "./structures/simple-quadtree";
import { distance } from "./math-utils";

const _pos = new THREE.Vector3();

export class SecondView {
  #plugin: PluginAddon;
  followedUnit: Unit | null = null;

  constructor(plugin: PluginAddon) {
    this.#plugin = plugin;
  }

  #activate(quadrant: Quadrant<Unit>) {
    const plugin = this.#plugin;

    let maxScoreUnit = (this.followedUnit =
      plugin.scoreCalculator.getMaxScoreUnit(quadrant.items));

    const nx = maxScoreUnit.x;
    const ny = maxScoreUnit.y;

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
    hottestScore: number
  ) {
    const plugin = this.#plugin;
    let decayedSecondScore = 0;

    if (secondHottestQuadrant) {
      decayedSecondScore =
        plugin.scores8.action.get(
          secondHottestQuadrant.x,
          secondHottestQuadrant.y
        ) *
        (1 -
          plugin.scores8.adhd.get(
            secondHottestQuadrant.x,
            secondHottestQuadrant.y
          ));
      if (
        decayedSecondScore >
        (hottestScore * distance(hottestQuadrant, secondHottestQuadrant)) / 8
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
