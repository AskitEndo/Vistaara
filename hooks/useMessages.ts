import { useEffect, useState } from "react";
import { Message } from "@/types/chat";

const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (content: string) => {
    const newMessage: Message = { id: Date.now(), content };
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    setTimeout(() => {
      setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newMessage.id));
    }, 30000);
  };

  return { messages, addMessage };
};

export default useMessages;