import React from "react";

interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  loading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  setInputValue,
  handleSendMessage,
  handleKeyPress,
  loading,
}) => {
  return (
    <div className="border border-[#428a97] rounded-md p-1 flex bg-[#1a2a36]">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type here..."
        className="flex-1 p-2 text-sm bg-transparent text-white placeholder-gray-400 focus:outline-none"
        disabled={loading}
      />
      <button
        onClick={handleSendMessage}
        disabled={loading}
        className="bg-[#78C0A8] hover:bg-[#428a97] text-[#1a2a36] text-sm px-3 py-1 rounded transition font-medium"
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
