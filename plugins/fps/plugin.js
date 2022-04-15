
return {
    onGameReady() {
        this._lastSend = 0;
    },

    onFrame(frame) {
        if (frame - this._lastSend > 100) {
            this._lastSend = frame;
            this.sendUIMessage(this.getFPS());
        }
    }
}