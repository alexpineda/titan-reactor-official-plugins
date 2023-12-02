import PluginAddon from ".";
const deltaYP = new THREE.Vector3();
export const controlScheme1 = (plugin: PluginAddon) => {
  return {
    init() {
      plugin.viewport.orbit.dollyToCursor = false;
    },
    onCameraMouseUpdate(
      delta,
      elapsed,
      scrollY,
      screenDrag,
      lookAt,
      mouse,
      clientX,
      clientY,
      clicked
    ) {
      const _delta = delta * plugin.config.sensitivity;

      if (clicked) {
        if (plugin.surface?.isPointerLockLost()) {
          plugin.surface.togglePointerLock(true);
        }
      }

      if (mouse.z === 0) {
        plugin.viewport.orbit.rotate(
          -lookAt.x * _delta * plugin.settings.input.rotateSpeed(),
          -lookAt.y * _delta * plugin.settings.input.rotateSpeed(),
          true
        );
      }

      if (lookAt.x !== 0 && mouse.z === -1) {
        plugin.viewport.orbit.truck(
          lookAt.x * _delta * plugin.settings.input.movementSpeed(),
          0,
          true
        );
      }

      if (lookAt.y !== 0 && mouse.z === -1) {
        plugin.viewport.orbit.forward(
          -lookAt.y * _delta * plugin.settings.input.movementSpeed(),
          true
        );
      }

      // elevate the y position if mouse scroll is used
      if (scrollY) {
        plugin.viewport.orbit.getPosition(deltaYP);

        if (scrollY < 0) {
          plugin.viewport.orbit.setPosition(
            deltaYP.x,
            deltaYP.y - plugin.config.elevateAmount,
            deltaYP.z,
            true
          );
        } else {
          plugin.viewport.orbit.setPosition(
            deltaYP.x,
            deltaYP.y + plugin.config.elevateAmount,
            deltaYP.z,
            true
          );
        }
      }
    },

    onCameraKeyboardUpdate(delta, elapsed, move) {
      const _delta = delta * plugin.config.sensitivity;

      if (move.x !== 0) {
        plugin.viewport.orbit.truck(
          move.x * _delta * plugin.settings.input.movementSpeed(),
          0,
          true
        );
      }

      if (move.y !== 0) {
        plugin.viewport.orbit.forward(
          move.y * _delta * plugin.settings.input.movementSpeed(),
          true
        );
      }
    },
  };
};
