// frontend/src/types/chat.ts

export type MessageRole = "user" | "ai";

export interface Message {
  id: number;
  role: MessageRole;
  content: string;
  timestamp: string;
  sources?: string[];
}

export type DocStatus = "indexed" | "processing" | "error";

export interface DocumentItem {
  id: number;
  name: string;
  status: DocStatus;
}

export interface ChatSession {
  id: number;
  created_at: string;
  title: string;
}