import { Message } from "@/types/chat";

let messages: Message[] = [];

export const sendMessage = (content: string) => {
  const newMessage: Message = {
    id: Date.now(),
    content,
    timestamp: new Date(),
  };
  messages.push(newMessage);
  return newMessage;
};

export const getMessages = () => {
  return messages;
};

export const clearMessages = () => {
  messages = [];
};