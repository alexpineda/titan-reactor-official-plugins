import React, { useState, useEffect } from "react";
import { registerComponent, usePlayer } from "titan-reactor"

let _chatIndex = 0;

registerComponent(
    { pluginId: "_plugin_id_", screen: "@replay/ready", snap: "left" },
    ({ config, useMessage }) => {

        const getPlayer = usePlayer();
        const [chat, setChat] = useState([]);
        const [lastChatAdd, setLastChatAdd] = useState(Date.now());

        useMessage((msg) => {
            
            setLastChatAdd(Date.now());

            if (msg === "reset") {
                setChat([]);
            } else {
                setChat(chat => {
                    let newChat = [...chat, { ...msg, key: _chatIndex++ }];
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