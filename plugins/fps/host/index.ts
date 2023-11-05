/**
 * https://github.com/vanruesc/postprocessing/blob/main/manual/js/src/utils/FPSMeter.js
 */
import { FPSMeter } from "./fps";


const fps = new FPSMeter();

export default class PluginAddon extends PluginBase  {

    init() {
        fps.reset();

        this.events.on("frame-reset", () => fps.reset());

    }

    onFrame() {
        this.sendUIMessage(fps.fps);
    }

    onRender(_, elapsed) {
        fps.update(elapsed);
    }

}