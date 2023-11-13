/// <reference types="@titan-reactor-runtime/host" />

export class PluginAddon extends PluginBase {
    onFrame() {
        this.sendUIMessage(this.gameSpeed);
    }
}