import React from "react";
import EmojiDp from "../ui/EmojiDp";
import { ChatMessage as ChatMessageType } from "../../types/chat";
import MessageTimer from "./MessageTimer";

interface EnhancedChatMessage extends ChatMessageType {
  avatarSeed?: string;
  isAi?: boolean;
}

interface ChatMessageProps {
  message: EnhancedChatMessage;
  timerPercentage: number;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  timerPercentage,
}) => {
  return (
    <div
      className={`py-2 px-3 rounded-md shadow-md relative ${
        message.isAi
          ? "bg-[#1a3836] border-l-2 border-[#4ecdc4]"
          : "bg-[#1a2a36] border-l-2 border-[#78C0A8]"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* EmojiDp avatar */}
        <EmojiDp
          seed={message.avatarSeed || message.id}
          size={32}
          className="flex-shrink-0 mt-1"
        />

        <div className="flex-1">
          <div className="text-sm font-medium text-white">
            {message.content}
            {message.isAi && (
              <span className="ml-1 text-xs text-[#4ecdc4]">• AI</span>
            )}
          </div>
          <div
            className={`text-xs mt-1 ${
              message.isAi ? "text-[#4ecdc4]" : "text-[#78C0A8]"
            }`}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* Timer bar */}
      <MessageTimer
        id={message.id}
        isAi={message.isAi}
        percentage={timerPercentage}
      />
    </div>
  );
};

export default ChatMessage;
