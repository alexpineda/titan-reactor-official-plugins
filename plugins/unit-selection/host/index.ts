
export default class Plugin extends PluginBase {
    // onPluginCreated() {
    //     this.registerCustomHook("onCustomUnitSelectionClicked", ["unitId"]);
    // },

    onUIMessage(message) {
        if (message.type === "unit-selection-click") {
            // if (!this.callCustomHook("onCustomUnitSelectionClicked", message)) {
            this.selectUnits([message.payload.unitId]);
            // }
        }
    }
}