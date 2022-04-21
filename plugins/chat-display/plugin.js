const CHAT_COMMAND = 0x5c;

const messages = [];

return {
    onFrame(frame, commands) {

      messages.length = 0;
      for (const command of commands) {
        if (command.id === CHAT_COMMAND) {
          messages.push(command);
        }
      }
      this.sendUIMessage(messages);
    },

    onFrameReset() {
      this.sendUIMessage("reset");
    }
}