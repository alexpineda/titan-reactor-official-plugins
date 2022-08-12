
return {
    onUIMessage(message) {
        if (message.type === "player-bar-click") {
            if (!this.callCustomHook("onCustomPlayerBarClicked", message.payload)) {
                this.toggleFogOfWarByPlayerId(message.payload.playerId);
            }
        }
    }
}