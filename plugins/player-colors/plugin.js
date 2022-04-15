const { THREE } = arguments[0];

const colors = [];

return {
    _updateColors() {
      for (let i = 0; i < 8; i++) {
        colors[i] = this.config[`player_${i}`];
      }

      if (this.config.enabled && this.isEnabled) {
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

    onDisabled() {
      this._updateColors();
    }
}