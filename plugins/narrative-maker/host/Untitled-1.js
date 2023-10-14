
import * as THREE from "three";
import {  Player, Unit, UnitStruct } from "@titan-reactor-runtime/host";


const _pos = new THREE.Vector3(0, 0, 0);

const workerTypes = [enums.unitTypes.scv, enums.unitTypes.drone, enums.unitTypes.probe];

const DEFAULT_FAR = 256;
const POLAR_MAX = (10 * Math.PI) / 64;
const POLAR_MIN = (2 * Math.PI) / 64;

export default class PluginAddon extends SceneController {
    #combatAcc = 0;
    private watchScoutWorkerUntil = 7500;
    private lastMovedTime = this.elapsed;
    private lastMovedPriority = 0;
    private lastMovedPosition = new THREE.Vector3(0, 0, 0);
    private cameraFocusPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    private cameraFocusUnit: UnitStruct | null = null;
    private lastUnitDestroyedFrame = 0; //2 * 60 * 24;

    init() {
        this.events.on("pre-run:frame", () => {
            console.log("frame")
        });

        this.events.on("pre-run:complete", () => {
            console.log("complete") 
        });
    }

    #reset() {
        this.cameraFocusUnit = null;
        this.lastMovedTime = this.elapsed;
        this.lastMovedPriority = 0;
        this.lastMovedPosition = this.cameraFocusPosition;
        this.lastUnitDestroyedFrame = this.frame;
        this.#combatAcc = 0;
    }
    
    async #setupCamera() {
        const orbit = this.viewport.orbit;

        orbit.camera.far = DEFAULT_FAR;
        orbit.camera.fov = 15;
        orbit.camera.updateProjectionMatrix();
    
        orbit.dollyToCursor = true;
        orbit.verticalDragToForward = true;
    
        orbit.maxDistance = 128;
        orbit.minDistance = 20;
    
        orbit.maxPolarAngle = POLAR_MAX;
        orbit.minPolarAngle = POLAR_MIN + THREE.MathUtils.degToRad(this.config.tilt);
        orbit.maxAzimuthAngle = 0;
        orbit.minAzimuthAngle = 0;
    
        await orbit.rotatePolarTo(POLAR_MAX, false);
        await orbit.rotateAzimuthTo(0, false);
        await orbit.zoomTo(1, false);
        await orbit.dollyTo(55, false);
    }

    public async onEnterScene(prevData) {
        this.viewport.fullScreen();

        // this.cameraFocusPosition.copy(this.getInitialStartLocation());
        // this.viewport.orbit.getPosition(this.cameraFocusPosition);
        this.pxToWorld.xyz(0, 0, this.cameraFocusPosition);

        this.viewport.orbit.setLookAt(this.cameraFocusPosition.x, 50, this.cameraFocusPosition.z,this.cameraFocusPosition.x, this.cameraFocusPosition.y, this.cameraFocusPosition.z, false);

        this.events.on("unit-completed", this.#moveCameraUnitCreated.bind(this));

        this.events.on("unit-destroyed", (unit) => {
            this.lastUnitDestroyedFrame = this.frame;

            if (this.cameraFocusUnit?.id === unit.id) {
                this.cameraFocusUnit = null;
                this.lastMovedPriority = 0;
            }
        });

        this.events.on("frame-reset", () => {
            this.#reset();
        })

      

        this.#reset();

        this.#setupCamera();

    }

    onFrame(frame: number): void {
        if (this.#combatAcc > 0) this.#combatAcc--;

        this.slowDownOnCombat();
        this.moveCameraFallingNuke();
        this.moveCameraIsAttacking();
        if (frame <= this.watchScoutWorkerUntil) {
            this.moveCameraScoutWorker();
        }
        this.moveCameraArmy();
        // this.moveCameraDrop();

        this.#updateCameraPosition();
        this.updateGameSpeed();
        this.updateVision();

        this.sendUIMessage({
            watchScoutWorkerUntil: this.watchScoutWorkerUntil,
            lastMoved: this.lastMovedTime,
            lastMovedPriority: this.lastMovedPriority,
            lastMovedPosition: this.lastMovedPosition.toArray(),
            lastUnitDestroyedFrame: this.lastUnitDestroyedFrame,
            combatAcc: this.#combatAcc,
            cameraFocusPosition: this.cameraFocusPosition.toArray(),
            cameraFocusUnit: this.cameraFocusUnit?.typeId
        })
    }

    #isNearStartLocation(player: Player | undefined, pos: THREE.Vector3): boolean {

        const distance = 32;
        for (const p of this.players) {
            if (p.startLocation) {
                if (!this.#isNearOwnStartLocation(player, p.startLocation) && p.startLocation.distanceTo(pos) <= distance) {
                    return true;
                }
            }
        }
        return false;
    }

    #isNearOwnStartLocation(player: Player | undefined, pos: THREE.Vector3): boolean {
        if (player == undefined || player.startLocation === undefined) return false;

        const distance = 10 * 32
        return (player.startLocation.distanceTo(pos) <= distance);
    }


    #isArmyUnit(unit: UnitStruct): boolean {
        return !!this.#getUnitPlayer(unit) && this.assets.bwDat.units[unit.typeId].supplyRequired > 0 && !this.#isWorker(unit.typeId);
    }

    #shouldMoveCamera(priority: number): boolean {
        const delta = this.elapsed - this.lastMovedTime;
        const isTimeToMove = delta >= this.config.cameraMoveTime;
        const isTimeToMoveIfHigherPrio = delta >= this.config.cameraMoveTimeMin;
        const isHigherPrio = this.lastMovedPriority < priority;
        return isTimeToMove || (isHigherPrio && isTimeToMoveIfHigherPrio);
    }

    #updateCameraPosition(): void {

        if (this.cameraFocusUnit) {
            this.pxToWorld.xyz(this.cameraFocusUnit!.x, this.cameraFocusUnit!.y, this.cameraFocusPosition);
        }
        this.viewport.orbit.moveTo(this.cameraFocusPosition.x, this.cameraFocusPosition.y, this.cameraFocusPosition.z);
        
    }

    private slowDownOnCombat(): void {
        for (let unit of this.units) {
            if (unit.isAttacking) {
                this.#combatAcc += 2;
                if (this.#combatAcc >= 24 * 5) {
                    this.#combatAcc = 24 * 13;
                }
                return;
            }
        }
    }


    private moveCameraIsAttacking(): void {
        const prio = 3;
        if (!this.#shouldMoveCamera(prio)) return;

        for (let unit of this.units) {
            if (unit.isAttacking) {
                this.simpleMessage("is attacking");
                console.log(enums.unitTypes[unit.typeId], unit.owner);
                this.updateVisionForPlayer(this.#getUnitPlayer(unit)!, prio);
                this.moveCameraToUnit(unit, prio);
                return;
            }
        }
    }

    private moveCameraFallingNuke(): void {
        const prio = 5;
        if (!this.#shouldMoveCamera(prio)) return;

        for (let unit of this.units) {
            if (unit.typeId === enums.unitTypes.nuclearMissile && unit.currentSpeed > 0) {
                this.moveCameraToUnit(unit, prio);
                return;
            }
        }
    }

    private moveCameraScoutWorker(): void {
        const highPrio = 2;
        const lowPrio = 0;
        if (!this.#shouldMoveCamera(lowPrio)) return;

        for (let unit of this.units) {
            if (!this.#isWorker(unit.typeId)) continue;
            if (this.#isNearStartLocation(this.players.get(unit.owner), this.pxToWorld.xyz(unit.x, unit.y, _pos))) {
                this.updateVisionForPlayer(this.#getUnitPlayer(unit)!, highPrio);
                this.moveCameraToUnit(unit, highPrio);
                this.simpleMessage("scout worker");
                return;
            }
            else if (!this.#isNearOwnStartLocation(this.players.get(unit.owner), this.pxToWorld.xyz(unit.x, unit.y, _pos))) {
                this.updateVisionForPlayer(this.#getUnitPlayer(unit)!, lowPrio);
                this.moveCameraToUnit(unit, lowPrio);
                this.simpleMessage("scout worker");
            }
        }
    }

    // private moveCameraNukeDetect(target: THREE.Vector3): void {
    //     const prio = 4;
    //     if (!this.#shouldMoveCamera(prio)) return;
    //     this.moveCamera(target, prio);
    // }


    // private moveCameraDrop(): void {
    //     const prio = 2;
    //     if (!this.#shouldMoveCamera(prio)) return;


    //     for (let unit of this.units) {


    //         if (
    //             (unit.typeId === enums.unitTypes.overlord ||
    //                 unit.typeId === enums.unitTypes.dropship ||
    //                 unit.typeId === enums.unitTypes.shuttle) &&
    //             this.#isNearStartLocation(this.#getUnitPlayer(unit), this.pxToWorld.xyz(unit.x, unit.y, _pos)) &&
    //             unit.getLoadedUnits().length > 0
    //         ) {
    //             this.updateVision(unit, prio);
    //             this.moveCameraToUnit(unit, prio);
    //             return;
    //         }
    //     }
    // }

    private moveCameraArmy(): void {
        const prio = 1;
        if (!this.#shouldMoveCamera(prio)) return;

        const radius = 48;
        let bestPos = new THREE.Vector3(0, 0, 0);
        let bestPosUnit: Unit | null = null;
        let mostUnitsNearby = 0;

        for (let unit1 of this.units) {
            if (!this.#isArmyUnit(unit1)) continue;

            this.pxToWorld.xyz(unit1.x, unit1.y, _pos);
            let nrUnitsNearby = 0;

            for (let unit2 of this.unitQuadtree.getNearby(_pos.x, _pos.z, radius)) {
                if (!this.#isArmyUnit(unit2)) continue;
                nrUnitsNearby++;
            }

            if (nrUnitsNearby > mostUnitsNearby) {
                mostUnitsNearby = nrUnitsNearby;
                bestPos.copy(_pos);
                bestPosUnit = unit1;
            }
        }

        if (mostUnitsNearby > 1 && bestPosUnit) {
            this.updateVisionForPlayer(this.#getUnitPlayer(bestPosUnit)!, prio);
            this.moveCameraToUnit(bestPosUnit, prio);
            this.simpleMessage("army");
        }
    }

    #moveCameraUnitCreated(unit: Unit): void {
        const prio = 1;
        if (!this.#shouldMoveCamera(prio)) return;

        // todo: should we choose a protagonist?
        // if (unit.getPlayer() === OpenBW.self() && !this.#isWorker(unit.typeId)) {
        if (unit.owner < 8 &&  !this.#isWorker(unit.typeId)) {
            this.simpleMessage("created");
            this.moveCameraToUnit(unit, prio);
        }
    }

    // private moveCamera(pos: THREE.Vector3, priority: number): void {
    //     if (!this.#shouldMoveCamera(priority)) return;

    //     if (this.cameraFocusPosition.distanceTo(pos) < 32) return;

    //     this.cameraFocusPosition.copy(pos)
    //     this.lastMovedPosition = this.cameraFocusPosition;
    //     this.lastMoved = this.elapsed;
    //     this.lastMovedPriority = priority;
    //     this.cameraFocusUnit = null;
    // }

    private moveCameraToUnit(unit: Unit, priority: number): void {
        if (!this.#shouldMoveCamera(priority)) return;
        if (this.cameraFocusUnit === unit) return;

        this.cameraFocusUnit = unit;
        this.pxToWorld.xyz(unit.x, unit.y, this.lastMovedPosition);
        this.lastMovedTime = this.elapsed;
        this.lastMovedPriority = priority;

        this.selectedUnits.set([unit]);
    }


    #isWorker(unitTypeId) {
        return workerTypes.includes(unitTypeId);
    }

    #getUnitPlayer(unit: UnitStruct): Player | undefined {
        return this.players.get(unit.owner);
    }

    #setGameSpeed(speed: number) {
        
        this.openBW.setGameSpeed(speed * this.config.speedScale);

    }

    private updateGameSpeed(): void {
        if (this.frame < 30 * 24 || this.frame > this.lastUnitDestroyedFrame + 5 * 60 * 24)
            this.#setGameSpeed(2);
        else if (this.lastMovedPriority === 0 || this.#combatAcc <= 24 * 3)
            this.#setGameSpeed(6);
        else if (this.lastMovedPriority === 1)
            this.#setGameSpeed(12);
        else if (this.lastMovedPriority === 2)
            this.#setGameSpeed(16);
        else if (this.lastMovedPriority === 5)
            this.#setGameSpeed(32);
        else
            this.#setGameSpeed(42);

    }

    private updateVisionForPlayer(player: Player, priority: number): void {
        if (!this.#shouldMoveCamera(priority)) return;

        for (let _player of this.players) {
            _player.vision = _player.id === player.id ? true : false;
        }
    }

    public updateVision(): void {
        if (this.#shouldMoveCamera(0)) {

            for (let player of this.players) {
                player.vision = true;
            }
        }

    }



}