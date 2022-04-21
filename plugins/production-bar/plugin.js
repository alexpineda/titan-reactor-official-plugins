return {
    _registerHotkeys() {
        this.clearHotkeys();
        this.registerHotkey(this.config.toggleVisibleKey, () => {
            this.setConfig("toggleVisible", !this.config.toggleVisible);
        });
    },

    onConfigChanged() {
        this._registerHotkeys();
    },

    onGameReady() {
        this._registerHotkeys();
    }
}