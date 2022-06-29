return {
    _updateColors() {
      const colors = [];

      // load a list of colors from the config player_0, player_1 etc.
      for (let i = 0; i < 8; i++) {
        colors[i] = this.config[`player_${i}`];
      }

      if (this.config.enabled) {
        this.setPlayerColors(colors);
      } else {
        this.setPlayerColors(this.getOriginalColors());
      }
    },

    /*
    * When the game is ready to start but before it has been drawn. 
    */
    onGameReady() {
      this._updateColors();
    },

    /*
     * If this plugins config has changed, let's update any colors that we have set.
     */
    onConfigChanged() {
      this._updateColors();
    }
}