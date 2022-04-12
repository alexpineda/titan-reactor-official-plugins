const { THREE, stores } = arguments[0];

/**
 * https://github.com/vanruesc/postprocessing/blob/main/manual/js/src/utils/FPSMeter.js
 */

 class FPSMeter {

    fps = "0";
    timestamp = 0;
    acc = 0;
    frames = 0;
  
    update(timestamp) {
  
        this.acc += timestamp - this.timestamp;
        this.timestamp = timestamp;
  
        if (this.acc >= 1e3) {
  
            this.fps = this.frames.toFixed(0);
            this.acc = 0.0;
            this.frames = 0;
  
        } else {
  
            ++this.frames;
  
        }
  
    }
  
  }


return {
    onGameReady() {
        this._fps = new FPSMeter();
        this._lastSend = 0;
    },

    onRender(delta, elapsed) {
        this._fps.update(elapsed);
        if (elapsed > this._lastSend) {
            this._lastSend = elapsed + 2000;
            this.sendUIMessage(this._fps.fps);
        }   
    }
}