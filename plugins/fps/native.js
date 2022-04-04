let config, THREE, stores, fps, sendUIMessage;
let _lastSend = 0;

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
    onInitialized(_config, deps) {
        config = _config;
        THREE = deps.THREE;
        stores = deps.stores;
        sendUIMessage = deps.sendUIMessage;

        fps = new FPSMeter();
      },

    onConfigChanged: function(_config) {
        config = _config;
    },

    onGameStart: function() {
        fps = new FPSMeter();
        _lastSend = 0;
    },

    onRender: function(delta, elapsed) {
        fps.update(elapsed);
        if (elapsed > _lastSend) {
            _lastSend = elapsed + 2000;
            sendUIMessage(fps.fps);
        }   
    }
}