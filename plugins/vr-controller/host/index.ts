const DEFAULT_FAR = 256;
const POLAR_MAX = (10 * Math.PI) / 64;
const POLAR_MIN = (2 * Math.PI) / 64;

// const POV_COMMANDS = [0x0c, 0x14, 0x15, 0x60, 0x61];
const PIP_PROXIMITY = 16;

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();

export default class PluginAddon extends SceneController  {
  // #pip: GameViewPort;
  isWebXR = true;

  async onEnterScene(prevData) {

    console.log("onEnterScene", prevData);

    this.viewport.fullScreen();

    this.viewport.camera.far = DEFAULT_FAR;
    this.viewport.camera.fov = 15;
    this.viewport.camera.updateProjectionMatrix();
    // this.viewport.rotateSprites = true;

    this.viewport.user.add(this.viewport.camera);
    this.scene.add(this.viewport.user);

    if (typeof prevData?.target?.x === "number" && typeof prevData?.target?.z === "number") {
      this.viewport.user.position.set(prevData.target.x, 5, prevData.target.z);
    } else {
      this.viewport.user.position.set(0, 5, 0);
    }

    this.viewport.user.updateMatrix();
    this.viewport.user.updateMatrixWorld(true);
    this.viewport.rotateSprites = true;
  
  }

  onConfigChanged(oldConfig) {

  }

  onCameraKeyboardUpdate(delta, elapsed, move) {
    const _delta = delta * this.config.sensitivity;

    if (move.x !== 0) {
      this.viewport.user.position.x += move.x * _delta * this.settings.input.movementSpeed();
    }

    if (move.y !== 0) {
      this.viewport.user.position.z -= move.y * _delta * this.settings.input.movementSpeed();
    }

    this.viewport.user.updateMatrix();
    this.viewport.user.updateMatrixWorld(true);

  }

  _groundTarget(viewport, t) {
    return viewport.orbit.getTarget(t).setY(0);
  }

  _areProximate(a, b) {
    return a.distanceTo(b) < PIP_PROXIMITY;
  }

  _areProximateViewports(a, b) {
    return this._areProximate(
      this._groundTarget(a, _a),
      this._groundTarget(b, _b)
    );
  }

  onMinimapDragUpdate(pos, isDragStart, mouseButton) {

    if (mouseButton === 0) {
      this.viewport.user.position.set(pos.x, 5, pos.y);
    }

  }

  onFrame() {
    
    if (this.followedUnits.size) {
      
      const pos = this.getFollowedUnitsCenterPosition();

      if (pos) {

        this.viewport.user.position.copy(pos).setY(20);
        this.viewport.user.updateMatrix();
        this.viewport.user.updateMatrixWorld(true);

      }

    }

  }

  onUpdateAudioMixerLocation(_, position) {
      return this.viewport.user.position;
  }


};
