const { THREE } = arguments[0];

const colors = [];

return {
    _updateColors(forceDisable) {
      for (let i = 0; i < 8; i++) {
        colors[i] = this.config[`player_${i}`];
      }

      if (this.config.enabled && !forceDisable) {
        this.setPlayerColors(colors);
      } else {
        this.setPlayerColors(this.getOriginalColors());
      }
    },

    onGameReady() {
      this._updateColors();
    },

    onConfigChanged() {
      this._updateColors();
    },

    onPluginDispose() {
      this._updateColors(true);
    }
}