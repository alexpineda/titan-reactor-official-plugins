enum Tool {
    Select = "select",
    Create = "create",
    Delete = "delete",
    Move = "move",
    Attack = "attack",
}

export default class PluginAddon extends PluginBase {
  #selectedPlayerId = null;
  #units = [];
  #tool = Tool.Create;
  #activeMapLocation = null;

  onSceneReady(): void {
    this.#selectedPlayerId = this.getPlayers()[0].id;
    this.events.on("unit-destroyed", (unitId) => {
        this.#units = this.#units.filter((id) => id !== unitId);
    });

    this.events.on("mouse-click", evt =>{
        const intersection = ProjectedCameraView.mouseOnWorldPlane(
            mouse.move,
            selectionBox.camera
        ); /// RaycastHelper.intersectObject(scene.terrain, true, selectionBox.camera, mouse.move);

    })
  }

  onSceneDisposed(): void {
  }
  

  onUIMessage(message) {
    switch (message.type) {
      case "select-player":
        console.log("selecting player", message.payload.playerId);
        this.#selectedPlayerId = message.payload.playerId;
        break;
      case "clear-units":
        console.log("clearing units");
        for (const unitId of this.#units) {
          this.sandboxApi.removeUnit(unitId);
        }
        break;
      case "spawn-unit": {
        console.log("spawning unit", message.payload);
        const unit = this.sandboxApi.createUnit(
          message.payload.unitType,
          this.#selectedPlayerId,
          message.payload.x,
          message.payload.y,
        );
        if (unit) {
            this.#units.push(unit.id);
        } else {
            console.error("failed to spawn unit");
        }
        break;
      }

        // message.payload.playerId
    }
  }
}
