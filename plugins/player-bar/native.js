
let _players, _fogOfWar;

return {
    onGameReady({ players, fogOfWar }) {
        _players = players;
        _fogOfWar = fogOfWar;
    },

    onUIMessage(message) {
        if (message.action === "toggle-fog") {
            const player = _players.find(p => p.id === message.playerId);
            if (player) {
                player.vision = !player.vision;
                _fogOfWar.playerVisionWasToggled = true;
            }
        }
    }
}