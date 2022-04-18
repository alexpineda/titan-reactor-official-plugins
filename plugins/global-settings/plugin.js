return {
  onConfigChanged(newConfig, oldConfig) {
    if (
      oldConfig.global !== newConfig.global ||
      oldConfig.music !== newConfig.music ||
      oldConfig.sound !== newConfig.sound
    ) {

      this.saveSettings({
        audio: {
          global: newConfig.global,
          music: newConfig.music,
          sound: newConfig.sound,
        }
      });
      
    } else  if (newConfig.stopFollowingOnClick !== oldConfig.stopFollowingOnClick) {
      this.saveSettings({
        game: {
          stopFollowingOnClick: newConfig.stopFollowingOnClick
        }
      });
    }
  }
};
