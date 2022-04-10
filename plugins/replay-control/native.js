
return {

    onGameReady() {
        console.log("ON GAME READY")
        this.clearHotkeys();
        this.registerHotkey(this.config.pause.value, () => {
            this.togglePause();
        });

        this.registerHotkey(this.config.speedUp.value, () => {
            this.speedUp();
        });

        this.registerHotkey(this.config.speedDown.value, () => {
           this.speedDown();
        });

        this.registerHotkey(this.config.skipForwards.value, () => {
           this.skipForward();
        });

        this.registerHotkey(this.config.skipBackwards.value, () => {
            this.skipBackward();
        });
    }
}