const { THREE, stores } = arguments[0];
let originalColors = null;

const updateColors = (config, isEnabled) => {
  const replay = stores.useWorldStore.getState().replay;

  if (!originalColors) {
    originalColors = replay.header.players.map(player => player.color);
  }

  if (replay) {
      replay.header.players.forEach((player, i) => {
        player.color = (config.enabled.value && isEnabled) ? config[`player_${i+1}`].value : originalColors[i];
      });
      stores.useWorldStore.setState({replay: {...replay} })
  }
  
}

return {
    onGameReady() {
      updateColors(this.config, this.isEnabled);
    },

    onConfigChanged() {
      updateColors(this.config, this.isEnabled);
    },

    onDisabled() {
      updateColors(this.config, this.isEnabled);
    }
}