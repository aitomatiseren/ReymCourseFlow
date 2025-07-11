export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIResponse {
  content: string;
  actions?: AIAction[];
  suggestions?: string[];
}

export interface AIAction {
  type: 'navigate' | 'create' | 'update' | 'delete' | 'query';
  description: string;
  data?: Record<string, unknown>;
  requiresConfirmation?: boolean;
}

export interface ChatState {
  isOpen: boolean;
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
}