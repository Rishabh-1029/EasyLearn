import { useCallback, useEffect, useState } from "react";
import {
  clearConversation as clearStoredConversation,
  readConversation,
  writeConversation,
} from "./conversationStorage.js";

function isRestorableMessage(message) {
  if (message?.sender === "user") return typeof message.text === "string";
  if (message?.sender !== "bot" || message.text === null) return false;

  return typeof message.text === "string"
    || (typeof message.text === "object" && !Array.isArray(message.text));
}

export default function useConversationHistory() {
  const [messages, setMessages] = useState([]);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Restoring conversation…");

  useEffect(() => {
    let isCurrent = true;
    readConversation()
      .then((stored) => {
        if (!isCurrent) return;
        const restoredMessages = Array.isArray(stored?.messages)
          ? stored.messages.filter(isRestorableMessage)
          : [];
        setMessages(restoredMessages);
        setStatus("Saved on this device");
      })
      .catch(() => {
        if (!isCurrent) return;
        setStatus("Local saving is unavailable");
      })
      .finally(() => {
        if (isCurrent) setReady(true);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !messages.length) return undefined;

    let isCurrent = true;
    setStatus("Saving on this device…");
    writeConversation(messages).then(
      () => {
        if (isCurrent) setStatus("Saved on this device");
      },
      () => {
        if (isCurrent) setStatus("Could not save on this device");
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [messages, ready]);

  const clearConversation = useCallback(async () => {
    setMessages([]);
    setStatus("Clearing conversation…");
    try {
      await clearStoredConversation();
      setStatus("Conversation cleared from this device");
    } catch {
      setStatus("Could not clear local conversation");
    }
  }, []);

  return {
    messages,
    setMessages,
    ready,
    status,
    clearConversation,
  };
}
