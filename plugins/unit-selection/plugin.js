
return {
    onPluginCreated() {
        this.registerCustomHook("onCustomUnitSelectionClicked", ["unitId"]);
    },

    onUIMessage(message) {
        debugger;
        if (message.type === "unit-selection-click") {
            if (!this.callCustomHook("onCustomUnitSelectionClicked", message)) {
                this.selectUnits([ message.payload.unitId ])
            }
        }
    }
}