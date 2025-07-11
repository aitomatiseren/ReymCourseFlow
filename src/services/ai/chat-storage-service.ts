import { ChatSession, ChatMessage } from '@/components/chat/types';

export interface ChatLimits {
  maxMessagesPerSession: number;
  maxSessionsPerUser: number;
  sessionExpiryDays: number;
}

export class ChatStorageService {
  private static instance: ChatStorageService;
  
  private limits: ChatLimits = {
    maxMessagesPerSession: 50,
    maxSessionsPerUser: 10,
    sessionExpiryDays: 30
  };

  public static getInstance(): ChatStorageService {
    if (!ChatStorageService.instance) {
      ChatStorageService.instance = new ChatStorageService();
    }
    return ChatStorageService.instance;
  }

  /**
   * Check if session is approaching message limit
   */
  isApproachingLimit(session: ChatSession): boolean {
    return session.messages.length >= this.limits.maxMessagesPerSession - 5;
  }

  /**
   * Check if session has exceeded message limit
   */
  hasExceededLimit(session: ChatSession): boolean {
    return session.messages.length >= this.limits.maxMessagesPerSession;
  }

  /**
   * Trim session messages when limit is reached
   */
  trimSessionMessages(session: ChatSession): ChatSession {
    if (!this.hasExceededLimit(session)) {
      return session;
    }

    console.log(`Trimming session ${session.id} - ${session.messages.length} messages`);

    // Keep first 5 messages and last 35 messages, remove middle
    const firstMessages = session.messages.slice(0, 5);
    const lastMessages = session.messages.slice(-35);
    
    // Add a summary message to indicate trimming
    const summaryMessage: ChatMessage = {
      id: `summary-${Date.now()}`,
      content: "📝 *Previous conversation history has been summarized to save space. This conversation continues with the most recent context.*",
      role: 'assistant',
      timestamp: new Date(),
      isLoading: false
    };

    const trimmedMessages = [
      ...firstMessages,
      summaryMessage,
      ...lastMessages
    ];

    return {
      ...session,
      messages: trimmedMessages,
      updatedAt: new Date()
    };
  }

  /**
   * Create conversation summary for context preservation
   */
  createConversationSummary(messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user').slice(0, 10);
    const assistantMessages = messages.filter(m => m.role === 'assistant').slice(0, 10);
    
    let summary = "Previous conversation summary:\n";
    
    if (userMessages.length > 0) {
      summary += "\nUser asked about: ";
      summary += userMessages.map(m => m.content.substring(0, 50)).join(", ");
    }
    
    if (assistantMessages.length > 0) {
      summary += "\nAssistant helped with: ";
      summary += assistantMessages.map(m => m.content.substring(0, 50)).join(", ");
    }
    
    return summary + "\n\nContinuing conversation with current context...";
  }

  /**
   * Clean up session by removing very old messages
   */
  cleanupOldMessages(session: ChatSession): ChatSession {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Keep messages from the last 24 hours + always keep at least 10 recent messages
    const recentMessages = session.messages.filter((msg, index) => 
      msg.timestamp > oneDayAgo || index >= session.messages.length - 10
    );

    if (recentMessages.length < session.messages.length) {
      console.log(`Cleaned up session ${session.id}: ${session.messages.length} -> ${recentMessages.length} messages`);
      
      return {
        ...session,
        messages: recentMessages,
        updatedAt: new Date()
      };
    }

    return session;
  }

  /**
   * Get storage statistics
   */
  getStorageStats(session: ChatSession | null): {
    messageCount: number;
    isNearLimit: boolean;
    isAtLimit: boolean;
    messagesUntilLimit: number;
  } {
    if (!session) {
      return {
        messageCount: 0,
        isNearLimit: false,
        isAtLimit: false,
        messagesUntilLimit: this.limits.maxMessagesPerSession
      };
    }

    const messageCount = session.messages.length;
    const messagesUntilLimit = Math.max(0, this.limits.maxMessagesPerSession - messageCount);
    
    return {
      messageCount,
      isNearLimit: this.isApproachingLimit(session),
      isAtLimit: this.hasExceededLimit(session),
      messagesUntilLimit
    };
  }

  /**
   * Update limits configuration
   */
  updateLimits(newLimits: Partial<ChatLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
    console.log('Updated chat limits:', this.limits);
  }

  /**
   * Get current limits
   */
  getLimits(): ChatLimits {
    return { ...this.limits };
  }
}