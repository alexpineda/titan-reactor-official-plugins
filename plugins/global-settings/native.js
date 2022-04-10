let THREE, stores;

return {
  onInitialized(deps) {
    stores = deps.stores;
  },

  onConfigChanged: function (newConfig, oldConfig) {
    if (
      oldConfig.global.value !== newConfig.global.value ||
      oldConfig.music.value !== newConfig.music.value ||
      oldConfig.sound.value !== newConfig.sound.value || 
      oldConfig.gamma.value !== newConfig.gamma.value
    ) {
      const state = stores.useSettingsStore.getState();
      state.save({
        audio: {
          global: newConfig.global.value,
          music: newConfig.music.value,
          sound: newConfig.sound.value,
          
        },
        graphics: {
          ...state.graphics,
          gamma: newConfig.gamma.value,
        }

      });
    }
  },
};
