import React from "react";
import { AnimatedList } from "../ui/animated-list";
import ChatMessage from "./ChatMessage";
import { ChatMessage as ChatMessageType } from "../../types/chat";

interface EnhancedChatMessage extends ChatMessageType {
  avatarSeed?: string;
  isAi?: boolean;
}

interface MessageListProps {
  messages: EnhancedChatMessage[];
  timersRef: React.MutableRefObject<Record<string, number>>;
}

const MessageList: React.FC<MessageListProps> = ({ messages, timersRef }) => {
  return (
    <div className="flex-1 overflow-hidden mb-3">
      <AnimatedList className="flex flex-col-reverse space-y-reverse space-y-2">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            timerPercentage={timersRef.current[msg.id] || 0}
          />
        ))}
      </AnimatedList>
    </div>
  );
};

export default MessageList;
