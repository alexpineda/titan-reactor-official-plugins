import React, { useState, useEffect } from "react";
import { usePlayer, usePluginConfig, useMessage } from "@titan-reactor-runtime/ui"

let _chatIndex = 0;

registerComponent(
    { screen: "@replay", snap: "left" },
    () => {
        const config = usePluginConfig();
        // we'll need player information for coloring the text and assigning the correct messages
        const getPlayer = usePlayer();
        const [chat, setChat] = useState([]);
        const [lastChatAdd, setLastChatAdd] = useState(Date.now());

        // receive messages from our plugin.js, which has access to the game state that we don't
        useMessage((message) => {
            
            setLastChatAdd(Date.now());

            if (message === "reset") {
                setChat([]);
            } else {
                setChat(chat => {
                    let newChat = [...chat, ...message.map(content => ({ ...content, key: _chatIndex++ }))];
                    if (newChat.length > 10) {
                        newChat = newChat.slice(1);
                    }
                    return newChat;
                });
            }
            
        });

        const removeFromChat = () => {
            if (Date.now() - lastChatAdd < config.hideTime || chat.length === 0) {
                return;
            }
            setChat(chat => chat.slice(1));
        }
        
        useEffect(() => {
            // remove messages from the chat log on a regular interval
            const _interval = window.setInterval(() => {
                removeFromChat()
            }, config.hideTime);
            return () => {
                window.clearInterval(_interval);
            }
        }, [config]);

      return <div style={{listStyleType: "none", "padding": "1rem 0"}}>
        {chat.map(({ key, message, senderSlot }) => (
            <div key={key} style={{color: getPlayer(senderSlot).color}}>{getPlayer(senderSlot).name} - {message}</div>))}
      </div>
    }
)  ;