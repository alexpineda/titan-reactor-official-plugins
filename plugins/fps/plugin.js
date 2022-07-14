
return {
    onFrame() {
        this.sendUIMessage(this.getFPS());
    }
}