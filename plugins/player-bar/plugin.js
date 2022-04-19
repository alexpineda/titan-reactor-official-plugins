
return {
    onPluginCreated() {
        this.registerCustomHook("onCustomPlayerBarClicked", ["playerId"])
    },

    onUIMessage(message) {
        if (message.action === "player-bar-click") {
            if (!this.callCustomHook("onCustomPlayerBarClicked", message)) {
                this.toggleFogOfWarByPlayerId(message.playerId);
            }
        }
    }
}