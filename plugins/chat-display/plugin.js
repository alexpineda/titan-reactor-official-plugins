const CHAT_COMMAND = 0x5c;

const messages = [];

return {
    onFrame(frame, commands) {

      // reusing the same array for efficiency, it's especially important since onFrame is called very often
      messages.length = 0;
      for (const command of commands) {
        if (command.id === CHAT_COMMAND) {
          messages.push(command);
        }
      }
      // the React component will handle all state, we're just forwarding the chat messages to it
      this.sendUIMessage(messages);
    },

    onFrameReset() {
      // if the user has seeked somewhere on the replay then we need to reset the messages
      this.sendUIMessage("reset");
    }
}