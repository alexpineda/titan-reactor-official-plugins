import PluginAddon from ".";
const deltaYP = new THREE.Vector3();
export const controlScheme2 = (plugin: PluginAddon) => {
let keyboardSpeed = plugin.config.keyboardSpeed;

  return {
    init() {
      plugin.viewport.orbit.dollyToCursor = true;
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
      if (clicked) {
        if (plugin.surface?.isPointerLockLost()) {
          plugin.surface.togglePointerLock(true);
        } else {
          plugin.viewport.orbit.zoomTo(
            plugin.viewport.camera.zoom * (clicked.z === 0 ? 2 : 1 / 2),
            false
          );
        }
      }

      // rotate according to mouse direction (pointer lock)
      if (lookAt.x || lookAt.y) {
        plugin.viewport.orbit.rotate(
          (-lookAt.x / 1000) * plugin.config.rotateSpeed,
          (-lookAt.y / 1000) * plugin.config.rotateSpeed,
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
      if (move.x !== 0) {
        plugin.viewport.orbit.truck(
          move.x * delta * keyboardSpeed,
          0,
          true
        );
      }

      if (move.y !== 0) {
        plugin.viewport.orbit.forward(move.y * delta * keyboardSpeed, true);
      }

      if (move.y === 0 && move.x === 0) {
        keyboardSpeed = plugin.config.keyboardSpeed;
      } else {
        keyboardSpeed = Math.min(
          plugin.config.keyboardAccelMax,
          keyboardSpeed * (1 + plugin.config.keyboardAccel)
        );
      }
    },
  };
};
