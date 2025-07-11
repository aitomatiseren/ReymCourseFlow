export interface AIProvider {
  name: string;
  apiKey: string;
  baseUrl?: string;
}

export interface AIRequest {
  message: string;
  context?: string;
  userId?: string;
  sessionId?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface AIResponse {
  content: string;
  actions?: AIAction[];
  suggestions?: string[];
  confidence?: number;
}

export interface AIAction {
  type: 'navigate' | 'create' | 'update' | 'delete' | 'query' | 'ui_interaction';
  description: string;
  function: string;
  parameters?: Record<string, unknown>;
  requiresConfirmation: boolean;
}

export interface PlatformContext {
  currentPage?: string;
  userRole?: string;
  availableActions?: string[];
  recentActivity?: Record<string, unknown>[];
}