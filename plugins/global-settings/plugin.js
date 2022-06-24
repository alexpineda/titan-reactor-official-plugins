return {
  onConfigChanged(oldConfig) {
    if (
      oldConfig.global !== this.config.global ||
      oldConfig.music !== this.config.music ||
      oldConfig.sound !== this.config.sound
    ) {
      this.saveSettings({
        audio: {
          global: this.config.global,
          music: this.config.music,
          sound: this.config.sound,
        },
      });
    } else if (
      this.config.stopFollowingOnClick !== oldConfig.stopFollowingOnClick
    ) {
      this.saveSettings({
        game: {
          stopFollowingOnClick: this.config.stopFollowingOnClick,
        },
      });
    } else if (
      this.config.sanityCheckReplayCommands !==
      oldConfig.sanityCheckReplayCommands || this.config.debugMode !== oldConfig.debugMode
    ) {
      this.saveSettings({
        util: {
          sanityCheckReplayCommands: this.config.sanityCheckReplayCommands,
          debugMode: this.config.debugMode,
        },
      });
    } else if (
      this.config.terrainChunky !== oldConfig.terrainChunky ||
      this.config.terrainShadows !== oldConfig.terrainShadows || 
      this.config.pixelRatio !== oldConfig.pixelRatio
    ) {
      this.saveSettings({
        graphics: {
          terrainChunky: this.config.terrainChunky,
          terrainShadows: this.config.terrainShadows,
          pixelRatio: this.config.pixelRatio,
        },
      });
    }
  },
};
