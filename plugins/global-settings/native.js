let config, THREE, stores;

return {
  onInitialized(_config, deps) {
    config = _config;
    stores = deps.stores;
  },

  onConfigChanged: function (_config) {
    if (
      _config.global.value !== config.global.value ||
      _config.music.value !== config.music.value ||
      _config.sound.value !== config.sound.value || 
      _config.gamma.value !== config.gamma.value
    ) {
      const state = stores.useSettingsStore.getState();
      state.save({
        audio: {
          global: _config.global.value,
          music: _config.music.value,
          sound: _config.sound.value,
          
        },
        graphics: {
          ...state.graphics,
          gamma: _config.gamma.value,
        }

      });
    }

    config = _config;
  },
};
