const CHAT_COMMAND = 0x5c;

return {
    onFrame(frame, commands) {
      for (const command of commands) {
        if (command.id === CHAT_COMMAND) {
          this.sendUIMessage(command);
        }
      }
    },

    onFrameReset() {
      this.sendUIMessage("reset");
    }
}