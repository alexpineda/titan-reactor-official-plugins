/// <reference types="@titan-reactor-runtime/host" />

const DEFAULT_FAR = 256;
const POLAR_MAX = (10 * Math.PI) / 64;
const POLAR_MIN = (2 * Math.PI) / 64;

// const POV_COMMANDS = [0x0c, 0x14, 0x15, 0x60, 0x61];
const PIP_PROXIMITY = 16;

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();

export default class PluginAddon extends VRSceneController {
  viewerHeight = 10;

  async onEnterScene(prevData) {
    console.log("VR CONTROLLER");
    this.viewport.fullScreen();

    this.viewport.camera.far = DEFAULT_FAR;
    this.viewport.camera.fov = 15;
    this.viewport.camera.updateProjectionMatrix();
    // this.viewport.rotateSprites = true;

    // this.viewport.user.add(this.viewport.camera);
    // this.game.scene.add(this.viewport.user);

    _a.set(prevData.target.x, this.viewerHeight, prevData.target.z);
    this.moveWorld(_a);

    // this.viewport.user.updateMatrix();
    // this.viewport.user.updateMatrixWorld(true);
    this.viewport.rotateSprites = false;

    // controllers

    // function onSelectStart() {

    // 	this.userData.isSelecting = true;

    // }

    // function onSelectEnd() {

    // 	this.userData.isSelecting = false;

    // 	if ( INTERSECTION ) {

    // 		const offsetPosition = { x: - INTERSECTION.x, y: - INTERSECTION.y, z: - INTERSECTION.z, w: 1 };
    // 		const offsetRotation = new THREE.Quaternion();
    // 		const transform = new XRRigidTransform( offsetPosition, offsetRotation );
    // 		const teleportSpaceOffset = baseReferenceSpace.getOffsetReferenceSpace( transform );

    // 		renderer.xr.setReferenceSpace( teleportSpaceOffset );

    // 	}

    // }

    // this.controller1.addEventListener("selectstart", onSelectStart);
    // this.controller1.addEventListener("selectend", onSelectEnd);
    this.controller1.addEventListener(
      "connected",
      function ({ data }: { data: XRInputSource }) {
        console.log("connected1", event);
        // this.add(buildController(event.data));1
      }
    );
    this.controller1.addEventListener("disconnected", function () {
      // this.remove(this.children[0]);
    });

    // this.controller2.addEventListener("selectstart", onSelectStart);
    // this.controller2.addEventListener("selectend", onSelectEnd);
    this.controller2.addEventListener("connected", function (event) {
      console.log("connected2", event);
      // this.add(buildController(event.data));
    });
    this.controller2.addEventListener("disconnected", function () {
      // this.remove(this.children[0]);
    });

    // The XRControllerModelFactory will automatically fetch controller models
    // that match what the user is holding as closely as possible. The models
    // should be attached to the object returned from getControllerGrip in
    // order to match the orientation of the held device.

    // const controllerGrip1 = this.xr.getControllerGrip( 0 );
    // controllerGrip1.add( this.controllerModelFactory.createControllerModel( controllerGrip1 ) );
    // scene.add( controllerGrip1 );

    // const controllerGrip2 = this.xr.getControllerGrip( 1 );
    // controllerGrip2.add( this.controllerModelFactory.createControllerModel( controllerGrip2 ) );
    // scene.add( controllerGrip2 );

    //

    // }

    // function buildController( data ) {

    // 	let geometry, material;

    // 	switch ( data.targetRayMode ) {

    // 		case 'tracked-pointer':

    // 			geometry = new THREE.BufferGeometry();
    // 			geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
    // 			geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

    // 			material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );

    // 			return new THREE.Line( geometry, material );

    // 		case 'gaze':

    // 			geometry = new THREE.RingGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
    // 			material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
    // 			return new THREE.Mesh( geometry, material );

    // 	}

    // }
  }

  onExitScene(currentData: any) {
    return {
      target: _a.set(this.viewerPosition.x, 0, this.viewerPosition.z),
      position: this.viewerPosition.clone(),
    };
  }

  onConfigChanged(oldConfig: any) {}

  override onTick(delta: number) {

    const input1 = this.config.swapControllers ? this.input2 : this.input1;
    const input2 = this.config.swapControllers ? this.input1 : this.input2;

    if (input1 && input1.gamepad) {
      // oculus joystick input
      // [0,0,horizon,vertical]
      //   -1
      // -1   1
      //    1
      const axes = input1!.gamepad!.axes;
      _a.set(0, axes[this.config.upDownID] * delta * this.config.sensitivity, 0);
      this.moveLocal(_a);
    }

    if (input2 && input2.gamepad) {
      // oculus joystick input
      // [0,0,horizon,vertical]
      //   -1
      // -1   1
      //    1
      const axes = input2!.gamepad!.axes;
      _a.set(
        axes[this.config.leftRightID] * delta * this.config.sensitivity,
        0,
        axes[this.config.forwardBackID] * delta * this.config.sensitivity
      );
      this.moveLocal(_a);
    }
  }

  onMinimapDragUpdate(pos, isDragStart, mouseButton) {
    if (mouseButton === 0) {
      // this.viewport.user.position.set(pos.x, 5, pos.y);
    }
  }

  onFrame() {}
}
