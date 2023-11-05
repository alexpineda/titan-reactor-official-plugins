function shuffle(array: any[]) {
  array.sort(() => Math.random() - 0.5);
  return array;
}

const randomized = shuffle(new Array(8).fill(0).map((_, i) => i));

// 8 (high) to 4 (med high)
export default class Plugin extends PluginBase {
  #updateColors() {
    const colors = [];

    // load a list of colors from the config player_0, player_1 etc.
    for (let i = 0; i < 8; i++) {
      if (this.config.randomized) {
        colors[i] = this.config[`player_${randomized[i]}`];
      } else {
        colors[i] = this.config[`player_${i}`];
      }
    }

    if (this.config.enabled) {
      this.players.setColors(colors);
    } else {
      this.players.resetColors();
    }
  }

  init() {
    this.#updateColors();
  }

  /*
  * When the game is ready to start but before it has been drawn. 
  */

  /*
   * If this plugins config has changed, let's update any colors that we have set.
   */
  onConfigChanged() {
    this.#updateColors();
  }
}