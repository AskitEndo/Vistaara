import React from "react";

interface MessageTimerProps {
  id: string;
  isAi?: boolean;
  percentage: number;
}

const MessageTimer: React.FC<MessageTimerProps> = ({
  id,
  isAi,
  percentage,
}) => {
  return (
    <div className="h-1 bg-[#1a2a36] w-full absolute bottom-0 left-0 rounded-b-md overflow-hidden">
      <div
        id={`timer-${id}`}
        className={`h-1 ${isAi ? "bg-[#4ecdc4]" : "bg-[#78C0A8]"}`}
        style={{
          width: `${percentage}%`,
          transition: "width 1s linear",
        }}
      />
    </div>
  );
};

export default MessageTimer;
