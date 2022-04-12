
return {

    onUIMessage(message) {
        if (message.action === "player-bar-click") {
            this.toggleFogOfWarByPlayerId(message.playerId);
        }
    }
}