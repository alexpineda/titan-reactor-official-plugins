/// <reference types="@titan-reactor-runtime/host" />

export default class PluginAddon extends PluginBase {
    onFrame() {
        this.sendUIMessage(this.openBW.gameSpeed);
    }
}