let THREE, stores, originalColors;

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
    onInitialized(deps) {
        THREE = deps.THREE;
        stores = deps.stores;
      },

    onGameReady: function() {
      updateColors(this.config, this.isEnabled);
    },

    onConfigChanged: function() {
      updateColors(this.config, this.isEnabled);
    },

    onDisabled: function() {
      updateColors(this.config, this.isEnabled);
    }
}