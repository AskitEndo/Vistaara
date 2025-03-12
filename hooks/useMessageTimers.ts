import { useRef, useEffect } from "react";
import { ChatMessage } from "../types/chat";

interface EnhancedChatMessage extends ChatMessage {
  avatarSeed?: string;
  isAi?: boolean;
}

type SetMessagesType = React.Dispatch<
  React.SetStateAction<EnhancedChatMessage[]>
>;

export const useMessageTimers = (
  messages: EnhancedChatMessage[],
  setMessages: SetMessagesType,
  storageKey: string
) => {
  const timersRef = useRef<Record<string, number>>({});
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set up timer and cleanup intervals
  useEffect(() => {
    if (messages.length === 0) return;

    // Clean up previous intervals
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (cleanupIntervalRef.current) clearInterval(cleanupIntervalRef.current);

    // Update DOM directly for timer bars
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      let needsCleanup = false;

      messages.forEach((msg) => {
        const elapsedTime = now - msg.timestamp;
        if (elapsedTime >= 30000) {
          needsCleanup = true;
          return;
        }

        const remainingPercentage = Math.max(
          0,
          100 - (elapsedTime / 30000) * 100
        );
        const roundedPercentage = Math.round(remainingPercentage);

        timersRef.current[msg.id] = roundedPercentage;

        const timerBar = document.getElementById(`timer-${msg.id}`);
        if (timerBar) {
          timerBar.style.width = `${roundedPercentage}%`;
        }
      });

      if (needsCleanup) {
        cleanupMessages();
      }
    }, 1000);

    cleanupIntervalRef.current = setInterval(cleanupMessages, 5000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (cleanupIntervalRef.current) clearInterval(cleanupIntervalRef.current);
    };
  }, [messages.length]);

  // Clean up messages helper function
  const cleanupMessages = () => {
    setMessages((prevMessages) => {
      const now = Date.now();
      const updatedMessages = prevMessages.filter(
        (msg) => now - msg.timestamp < 30000
      );

      if (updatedMessages.length !== prevMessages.length) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
        } catch (err) {
          console.warn("Error saving to localStorage:", err);
        }
      }

      return updatedMessages;
    });
  };

  return { timersRef, cleanupMessages };
};
