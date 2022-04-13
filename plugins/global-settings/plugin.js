return {

  onConfigChanged(newConfig, oldConfig) {
    if (
      oldConfig.global.value !== newConfig.global.value ||
      oldConfig.music.value !== newConfig.music.value ||
      oldConfig.sound.value !== newConfig.sound.value
    ) {

      this.saveSettings({
        audio: {
          global: newConfig.global.value,
          music: newConfig.music.value,
          sound: newConfig.sound.value,
        }
      });
      
    }
  }
};
