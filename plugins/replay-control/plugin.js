
return {
    _registerHotkeys() {
        this.clearHotkeys();
        this.registerHotkey(this.config.pause, () => {
            this.togglePause();
        });

        this.registerHotkey(this.config.speedUp, () => {
            this.speedUp();
        });

        this.registerHotkey(this.config.speedDown, () => {
           this.speedDown();
        });

        this.registerHotkey(this.config.skipForwards, () => {
           this.skipForward();
        });

        this.registerHotkey(this.config.skipBackwards, () => {
            this.skipBackward();
        });
    },

    onConfigChanged() {
        this._registerHotkeys();
    },

    onGameReady() {
        this._registerHotkeys();
    }
}