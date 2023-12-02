

import { GameViewPort } from "@titan-reactor-runtime/host";
import { controlScheme1 } from "./control-scheme-1";
import { controlScheme2 } from "./control-scheme-2";
import { Config2_1_0 } from "./types/config-2.1.0";

const BATTLE_FAR = 128;

export default class PluginAddon extends SceneController<Config2_1_0> {

    #controlScheme: ReturnType<typeof controlScheme1>;
  
    async onEnterScene(prevData) {

        this.viewport.fullScreen();

        if (prevData?.target?.isVector3) {
            this.viewport.orbit.setTarget(prevData.target.x, 0, prevData.target.z, false);
        } else {
            this.viewport.orbit.setTarget(0, 0, 0, false);
        }

        this.viewport.orbit.rotateAzimuthTo((this.config.rotateAzimuthStart - 1) * (Math.PI / 3), false);
        this.viewport.orbit.rotatePolarTo((this.config.rotatePolarStart - 1) * (Math.PI / 3), false);

        this.viewport.orbit.rotateAzimuthTo((this.config.rotateAzimuthStart - 1) * (Math.PI / 4), true);
        this.viewport.orbit.rotatePolarTo((this.config.rotatePolarStart - 1) * (Math.PI / 4), true);

        this.viewport.camera.far = BATTLE_FAR;
        this.viewport.camera.fov = this.config.fov;
        this.viewport.camera.updateProjectionMatrix();

        Object.assign(this.viewport.orbit, {
            dollyToCursor: false,
            maxDistance: Math.max(this.scene.mapWidth, this.scene.mapHeight) * 10,
            minDistance: 3,
            maxZoom: 10,
            minZoom: 0.3,
            maxPolarAngle: Math.PI * 0.4,
            minPolarAngle: -Infinity,
            maxAzimuthAngle: Infinity,
            minAzimuthAngle: -Infinity,
        })

        this.viewport.orbit.dollyTo(this.config.defaultDistance, false);
        this.viewport.orbit.zoomTo(1, false);

        this.viewport.rotateSprites = true;

        this.surface!.togglePointerLock(true);

        this.viewport.audioType = "3d";
        this.#controlScheme = this.config.controlScheme === "mouse" ? controlScheme1(this) : controlScheme2(this);

        this.settings.input.unitSelection.set(false);
        this.settings.input.cursorVisible.set(false);

    }

    onConfigChanged(oldConfig) {

        if (this.config.fov !== oldConfig.fov) {
            this.viewport.camera.fov = this.config.fov;
            this.viewport.camera.updateProjectionMatrix();
        }

        if (this.config.defaultDistance !== oldConfig.defaultDistance) {
            this.viewport.orbit.dollyTo(this.config.defaultDistance, true);
        }

        if (this.config.rotateAzimuthStart !== oldConfig.rotateAzimuthStart) {
            this.viewport.orbit.rotateAzimuthTo((this.config.rotateAzimuthStart - 1) * (Math.PI / 4), true);
        }

        if (this.config.rotatePolarStart !== oldConfig.rotatePolarStart) {
            this.viewport.orbit.rotatePolarTo((this.config.rotatePolarStart - 1) * (Math.PI / 4), true);
        }

        if (this.config.controlScheme !== oldConfig.controlScheme) {
         this.#controlScheme = this.config.controlScheme === "mouse" ? controlScheme1(this) : controlScheme2(this);
        }
    }

    onExitScene({ target, position }) {

        this.settings.input.unitSelection.set(true);
        this.settings.input.cursorVisible.set(true);

        return {
            target,
            position
        }

    }

    onCameraMouseUpdate(delta, elapsed, scrollY, screenDrag, lookAt, mouse, clientX, clientY, clicked) {

        this.#controlScheme.onCameraMouseUpdate(delta, elapsed, scrollY, screenDrag, lookAt, mouse, clientX, clientY, clicked);
    }

    onCameraKeyboardUpdate(delta, elapsed, move) {

        this.#controlScheme.onCameraKeyboardUpdate(delta, elapsed, move);
    }

    _groundTarget(viewport: GameViewPort, t: THREE.Vector3) {
        return viewport.orbit.getTarget(t).setY(0);
    }

    onShouldHideUnit(unit) {

        return unit.extras.dat.isAddon;

    }

    

    onFrame() {

        if (this.followedUnits.size) {
      
            const pos = this.getFollowedUnitsCenterPosition();
      
            if (pos) {
      
              this.viewport.orbit.moveTo(pos.x, pos.y, pos.z, true);
      
            }
      
          }
    
    }

}