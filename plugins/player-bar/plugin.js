
return {
    onPluginCreated() {
        this.registerCustomHook("onCustomPlayerBarClicked", ["playerId"])
    },

    onUIMessage(message) {
        if (message.type === "player-bar-click") {
            if (!this.callCustomHook("onCustomPlayerBarClicked", message)) {
                this.toggleFogOfWarByPlayerId(message.payload.playerId);
            }
        }
    }
}