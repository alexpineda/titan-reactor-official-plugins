import { PluginBase } from "titan-reactor/host";

function sample(array) {
    const length = array == null ? 0 : array.length
    return length ? array[Math.floor(Math.random() * length)] : undefined
}

// 8 (high) to 4 (med high)
export default class Plugin extends PluginBase {
    _lastUnitId = -1;
    _clickCount = 0;

    _getSound(unit) {
        if (this.config.onlyBuildings && !unit.extras.dat.isBuilding) {
            return;
        }

        if (this._lastUnitId === unit.id) {
            this._clickCount++;
        } else {
            this._clickCount = 0;
            this._lastUnitId = unit.id;
        }

        if (unit.extras.dat.isBuilding) {
            return unit.extras.dat.whatSound[0];
        } else {
            if (this._clickCount < 6) {
                return sample(unit.extras.dat.whatSound);
            } else {
                return sample(unit.extras.dat.pissSound);
            }
        }
    }

    _playSelected(units) {
        if (units.length === 0) return;

        const unitTypes = new Set();
        for (const unit of units) {
            if (unitTypes.has(unit.typeId)) {
                continue;
            }
            unitTypes.add(unit.typeId);
            const sound = this._getSound(unit);
            if (sound !== undefined) {
                this.playSound(sound, unit.x, unit.y, unit.typeId);
            }
        }

    }

    onUnitsSelected(units) {
        this._playSelected(units);
    }

    onMacroPlaySelected() {
        this._playSelected(this.selectedUnits);
    }
}