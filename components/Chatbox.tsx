import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChatMessage } from "../types/chat";
import MessageList from "./chat/MessageList";
import ChatInput from "./chat/ChatInput";
import { useAiMessages } from "../hooks/useAiMessages";
import { useMessageTimers } from "../hooks/useMessageTimers";

const STORAGE_KEY = "temporary_chat_messages";

interface EnhancedChatMessage extends ChatMessage {
  avatarSeed?: string;
  isAi?: boolean;
}

interface LocationData {
  lat: number;
  lng: number;
}

// Use a global variable to store location data from Leaflet
declare global {
  interface Window {
    leafletUserLocation?: LocationData;
  }
}

const Chatbox = () => {
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  // Use custom hooks for AI messages and timers
  const { sendAiMessage, respondToAiQuery } = useAiMessages(
    messages,
    setMessages,
    setLoading
  );
  const { timersRef, cleanupMessages } = useMessageTimers(
    messages,
    setMessages,
    STORAGE_KEY
  );

  // Load messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        const now = Date.now();
        // Filter out expired messages
        const validMessages = parsedMessages.filter(
          (msg: EnhancedChatMessage) => now - msg.timestamp < 30000
        );
        setMessages(validMessages);

        // Initialize timers for existing messages
        validMessages.forEach((msg: EnhancedChatMessage) => {
          const elapsedTime = now - msg.timestamp;
          const remainingPercentage = Math.max(
            0,
            100 - (elapsedTime / 30000) * 100
          );
          timersRef.current[msg.id] = remainingPercentage;
        });
      } catch (error) {
        console.error("Failed to parse saved messages:", error);
      }
    }
  }, []);

  const handleSendMessage = useCallback(() => {
    if (inputValue.trim()) {
      // Check if the message starts with @
      const isAiQuery = inputValue.trim().startsWith("@");
      const messageContent = isAiQuery
        ? inputValue.trim().substring(1) // Remove @ symbol
        : inputValue.trim();

      // Create new message with random avatar seed
      const newMessage: EnhancedChatMessage = {
        id: Date.now().toString(),
        content: messageContent,
        timestamp: Date.now(),
        avatarSeed: Math.random().toString(), // Random seed for avatar
      };

      setMessages((prev) => {
        const updatedMessages = [...prev, newMessage];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
        } catch (err) {
          console.warn("Error saving to localStorage:", err);
        }
        return updatedMessages;
      });

      // Set initial timer for new message
      timersRef.current[newMessage.id] = 100;

      // If message starts with @, send to AI for response
      if (isAiQuery) {
        respondToAiQuery(messageContent);
      }

      setInputValue("");
    }
  }, [inputValue, respondToAiQuery, timersRef]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  return (
    <div className="flex flex-col h-full w-full">
      <MessageList messages={messages} timersRef={timersRef} />
      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSendMessage={handleSendMessage}
        handleKeyPress={handleKeyPress}
        loading={loading}
      />
    </div>
  );
};

export default Chatbox;
