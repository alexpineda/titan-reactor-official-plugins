let config, THREE, stores, originalColors;

const updateColors = (enabled) => {
  const replay = stores.useWorldStore.getState().replay;

  if (!originalColors) {
    originalColors = replay.header.players.map(player => player.color.hex);
  }

  if (replay) {
      replay.header.players.forEach((player, i) => {
        player.color.hex = enabled ? config[`player_${i+1}`].value : originalColors[i];
      });
      stores.useWorldStore.setState({replay: {...replay} })
  }
  
}

return {
    onInitialized(_config, deps) {
        config = _config;
        THREE = deps.THREE;
        stores = deps.stores;
      },

    onGameReady: function() {
      updateColors(config.enabled.value);
    },

    onConfigChanged: function(_config) {
        config = _config;
        updateColors(config.enabled.value);
    },

    onDisabled: function() {
      updateColors(false);
    }
}