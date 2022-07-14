
return {
    _registerHotkeys() {
        this.clearHotkeys();
        this.registerHotkey(this.config.pause, () => {
            this.togglePause();
            this.sendUIMessage("⏯️");
        });

        this.registerHotkey(this.config.speedUp, () => {
            const speed = this.speedUp() ?? this.getSpeed(); // support old version
            this.sendUIMessage(`🔼 ${speed}x`);
        });

        this.registerHotkey(this.config.speedDown, () => {
            const speed = this.speedDown() ?? this.getSpeed(); // support old version
           this.sendUIMessage(`🔽 ${speed}x`);
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
    },

    onGameDisposed() {
        this.clearHotkeys();
    }
}