return {

  onConfigChanged(newConfig, oldConfig) {
    if (
      oldConfig.global.value !== newConfig.global.value ||
      oldConfig.music.value !== newConfig.music.value ||
      oldConfig.sound.value !== newConfig.sound.value
    ) {

      this.saveAudioSettings({
          global: newConfig.global.value,
          music: newConfig.music.value,
          sound: newConfig.sound.value,
      });
      
    } else if (oldConfig.gamma.value !== newConfig.gamma.value) {

      this.saveGraphicsSettings({
        gamma: newConfig.gamma.value
      });

    }
  }
};
