
export default class PluginAddon extends PluginBase {
    onUIMessage(message) {
        if (message.type === "player-bar-click") {
            this.toggleFogOfWarByPlayerId(message.payload.playerId);
        }
    }
}