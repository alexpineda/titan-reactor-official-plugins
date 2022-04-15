const { THREE, STDLIB } = arguments[0];

const SECONDS_PER_FRAME = 42 / 1000;
const MIN_SECONDS = 5;
const color = {};

return {
    _updateVisibility() {
        const visible = this.getConfig("toggleVisible");

        //as of three 137 css renderer only respects CSS2DObject visible 
        for (const unit of this._units) {
            unit.obj.visible = visible;
        }
    },

    onGameReady() {
        this._units = [];
        this._lastFrameCheck = 0;
        
        this._group = new THREE.Group();
        this.cssScene.add(this._group);
        this.registerHotkey(this.getConfig("toggleVisibleHotKey"), () => {
            this.setConfig("toggleVisible", !this.getConfig("toggleVisible"));
        });
    },

    onConfigChanged() {
        this._updateVisibility();
    },

    onUnitKilled(unit) {
        if (unit.extras.player === undefined) {
            return;
        }
        

        const image = new Image();
        image.src = this.assets.cmdIcons[unit.typeId];

        if (this.getConfig("usePlayerColors")) {
            unit.extras.player.color.getHSL(color);
            image.style.filter = `hue-rotate(${color.h * 320}deg) brightness(4) saturate(1.25) contrast(0.75)`;
        }

        const obj = new STDLIB.CSS2DObject(image);
        obj.position.x = this.pxToGameUnit.x(unit.x);
        obj.position.y = 0;
        obj.position.z = this.pxToGameUnit.y(unit.y);
        obj.visible = this.getConfig("toggleVisible");
        obj.onAfterRender = () => image.style.transform += ` scale(${this.getConfig("iconScale")})`;

        this._group.add(obj)

        const deadUnit = {
            deathFrame: this.getFrame(),
            obj
        };
        this._units.push(deadUnit);
    },

    onFrame(frame) {
        // avoid unnecessary work, especially in onFrame and onRender callbacks
        if (this._units.length && (frame - this._lastFrameCheck) * SECONDS_PER_FRAME > MIN_SECONDS) {
            this._lastFrameCheck = frame;
            this._units = this._units.filter(unit => {
                if ((frame - unit.deathFrame) * SECONDS_PER_FRAME > this.getConfig("timeFrame")) {
                    unit.obj.removeFromParent();
                    return false;
                }
                return true;
            });
        }
    },

    /**
     * When a user seeks to a different location in the replay
     */
    onFrameReset() {
        this._lastFrameCheck = 0;
        for (const unit of this._units) {
            unit.obj.removeFromParent();
        }
        this._units.length = 0;
    }
}