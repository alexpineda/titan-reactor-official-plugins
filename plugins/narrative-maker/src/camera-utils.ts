import { GameViewPort } from "@titan-reactor-runtime/host";
import { DEFAULT_FAR, PIP_PROXIMITY, POLAR_MAX, POLAR_MIN } from "./constants";
import type PluginAddon from "./index";

const setupCamera = async (plugin: PluginAddon, viewport: GameViewPort) => {
  const orbit = viewport.orbit;

  orbit.camera.far = DEFAULT_FAR;
  orbit.camera.fov = 15;
  orbit.camera.updateProjectionMatrix();

  orbit.dollyToCursor = true;
  orbit.verticalDragToForward = true;

  orbit.maxDistance = 128;
  orbit.minDistance = 20;

  orbit.maxPolarAngle = POLAR_MAX;
  orbit.minPolarAngle = POLAR_MIN;
  orbit.maxAzimuthAngle = THREE.MathUtils.degToRad(45);
  orbit.minAzimuthAngle = -THREE.MathUtils.degToRad(45);

  await orbit.rotatePolarTo(POLAR_MIN + plugin.config.polarVariance / 2, false);
  await orbit.rotateAzimuthTo(0, false);
  await orbit.zoomTo(1, false);
  await orbit.dollyTo(55, false);
};

export const setupViewports = async (plugin: PluginAddon) => {
  plugin.viewport.fullScreen();
  plugin.viewport.rotateSprites = true;

  await setupCamera(plugin, plugin.viewport);
  await setupCamera(plugin, plugin.secondViewport);

  plugin.secondViewport.height = plugin.config.pipSize;
  plugin.secondViewport.right = 0.05;
  plugin.secondViewport.bottom = 0.05;
  plugin.secondViewport.orbit.rotatePolarTo(
    THREE.MathUtils.degToRad(45),
    false
  );
  plugin.secondViewport.orbit.dollyTo(45, false);

  // plugin.settings.input.unitSelection.set(false);
  // plugin.settings.input.cursorVisible.set(false);

  plugin.viewport.cameraShake.enabled = true;
  plugin.viewport.cameraShake.maxShakeDistance = 100;
  plugin.viewport.orbit.dampingFactor = 0.000001;

  plugin.viewport.orbit.dollySpeed = 0.01;
  plugin.viewport.orbit.truckSpeed = 0.01;

  plugin.adhd_uq8.defaultDecay = plugin.config.heatMapDecay;

  plugin.targets.polarTarget = POLAR_MAX;
  plugin.targets.azimuthTarget = 0;
};

export const groundTarget = (viewport: GameViewPort, t: THREE.Vector3) => {
  return viewport.orbit.getTarget(t).setY(0);
};

export const areProximate = (
  a: THREE.Vector3,
  b: THREE.Vector3,
  distance = PIP_PROXIMITY
) => {
  return a.distanceTo(b) < distance;
};

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

export const areProximateViewports = (a: GameViewPort, b: GameViewPort) => {
  return areProximate(groundTarget(a, _a), groundTarget(b, _b));
};
