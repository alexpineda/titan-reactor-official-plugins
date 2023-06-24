// Seconds per bw game frame (tick)
const SECONDS_PER_FRAME = 42 / 1000;
const MIN_SECONDS = 5;

// we'll use this to write colors and read colors using THREE.Color.getHSL()
const color: THREE.Color = {};

function easeInSine(x) {
    return Math.cos((x * Math.PI) / 2);
}

export default class PluginAddon extends PluginBase {
    private _deadUnits: { obj: any, style: CSSStyleDeclaration, color: THREE.Color, time: number }[];
    private _lastFrameCheck: number;
    private _group: THREE.Group;


    _updateVisibility(updateColors) {
        //as of three 137 css renderer only respects CSS2DObject visible 
        for (const deadUnit of this._deadUnits) {
            deadUnit.obj.visible = this.config.showDeadUnits;
            if (updateColors) {
                this._setStyleFilter(deadUnit);
            }
        }

    }

    _setStyleFilter(deadUnit) {
        if (this.config.usePlayerColors) {
            deadUnit.color.getHSL(color);
            // rotate the color based on the player hue, should approximately get us there
            deadUnit.style.filter = `hue-rotate(${color.h * 320}deg) brightness(5) saturate(1.25) contrast(0.75)`;
        } else {
            // default red with brightness 2
            deadUnit.style.filter = `brightness(2)`;
        }

        deadUnit.style.border = this.config.showBorder ? "3px solid #ff000099" : "none";
        deadUnit.style.borderRadius = "50%";


    }

    init() {
        // the dead units we are tracking
        this._deadUnits = [];
        // the last time we checked if our dead units timed out
        // and need to be flushed from the list
        this._lastFrameCheck = 0;

        this.config.showDeadUnits = false;
        
        // A Group to keep all the dead unit icons in so we the CSSRenderer can display them for us
        this._group = new THREE.Group();
        this.cssScene.add(this._group);

        this.events.on("unit-killed", (unit) => this.#onUnitDestroyed(unit));
        this.events.on("frame-reset", () => this._reset());

    }

    onConfigChanged(oldConfig) {
        this._updateVisibility(this.config.usePlayerColors !== oldConfig.usePlayerColors);
    }

    #onUnitDestroyed(unit) {
        // it's not a human player controlled unit so we don't care
        if (unit.owner > 7) {
            return;
        }
        
        const image = new Image();
        // icons are base64 encoded so we can use them as a data URI
        image.src = this.assets.cmdIcons[unit.typeId];

        // add the HTMLImageElement to a new CSS2DObject which our CSSRenderer can use
        const obj = new STDLIB.CSS2DObject(image);
        // convert px game units to 3d map units
        obj.position.x = this.pxToWorld.x(unit.x);
        obj.position.y = 0;
        obj.position.z = this.pxToWorld.y(unit.y);
        obj.visible = this.config.showDeadUnits;

        // work-around for scale being overwritten css renderer
        obj.onAfterRender = () => image.style.transform += ` scale(${this.config.iconScale})`;

        // add the CSS2DObject to our group and therefore to our scene
        this._group.add(obj)

        // track this unit so we can remove it from the scene when it times out
        const deadUnit = {
            deathFrame: this.getCurrentFrame(),
            obj,
            color: this.getPlayerColor(unit.owner),
            style: image.style,
            image
        };
        this._setStyleFilter(deadUnit);
        this._deadUnits.push(deadUnit);
    }

    /*
     * Every game frame, check if any dead units timed out only every MIN_SECONDS
    */
    onFrame(frame) {
        // avoid unnecessary work, especially in onFrame and onRender callbacks
        if (this._deadUnits.length && (frame - this._lastFrameCheck) * SECONDS_PER_FRAME > MIN_SECONDS) {
            this._lastFrameCheck = frame;
            this._deadUnits = this._deadUnits.filter(deadUnit => {
                if ((frame - deadUnit.deathFrame) * SECONDS_PER_FRAME > this.config.timeFrame) {
                    deadUnit.obj.removeFromParent();
                    return false;
                }
                return true;
            });
        }

        for (const deadUnit of this._deadUnits) {
            deadUnit.style.opacity = easeInSine((frame - deadUnit.deathFrame) * SECONDS_PER_FRAME / this.config.timeFrame);
        }
    },

    _reset() {
        this._lastFrameCheck = 0;
        for (const unit of this._deadUnits) {
            unit.obj.removeFromParent();
        }
        this._deadUnits.length = 0;
    },

    dispose() {
        this._reset();
    }
}