export interface ChatMessage {
  id: string;
  content: string;
  timestamp: number;
}

export interface EnhancedChatMessage extends ChatMessage {
  avatarSeed?: string;
  isAi?: boolean;
}
