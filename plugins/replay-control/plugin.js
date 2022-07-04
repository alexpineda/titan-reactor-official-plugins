
return {
    _registerHotkeys() {
        this.clearHotkeys();
        this.registerHotkey(this.config.pause, () => {
            this.togglePause();
            this.sendUIMessage("⏯️");
        });

        this.registerHotkey(this.config.speedUp, () => {
            this.speedUp();
            this.sendUIMessage("🔼");
        });

        this.registerHotkey(this.config.speedDown, () => {
           this.speedDown();
           this.sendUIMessage("🔽");
        });

        this.registerHotkey(this.config.skipForwards, () => {
           this.skipForward();
           this.sendUIMessage("⏩");
        });

        this.registerHotkey(this.config.skipBackwards, () => {
            this.skipBackward();
            this.sendUIMessage("⏪");
        });
    },

    onConfigChanged() {
        this._registerHotkeys();
    },

    onGameReady() {
        this._registerHotkeys();
    }
}