import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatMessage, ChatSession } from '@/components/chat/types';
import { AIService } from '@/services/ai';
import { useToast } from '@/hooks/use-toast';
import { useChatContext } from '@/context/ChatContext';
import { ChatStorageService } from '@/services/ai/chat-storage-service';
import { AIAction } from '@/services/ai/types';

// Sequential action execution function
async function executeActionsSequentially(actions: AIAction[], navigate: (path: string) => void) {
  console.log(`🎬 Executing ${actions.length} actions sequentially...`);
  
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    console.log(`🎯 Action ${i + 1}/${actions.length}:`, action.description);
    
    try {
      if (action.type === 'navigate' && action.parameters?.path && typeof action.parameters.path === 'string') {
        console.log('🧭 Navigating to:', action.parameters.path);
        navigate(action.parameters.path);
        // Wait for navigation to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } else if (action.type === 'ui_interaction') {
        console.log('🔄 Executing UI interaction:', action.function);
        
        const { UIInteractionService } = await import('@/services/ai/ui-interaction-service');
        const uiService = UIInteractionService.getInstance();
        
        if (action.function === 'click' && action.parameters?.description) {
          await uiService.clickElement(
            action.parameters.description as string,
            action.parameters.selector as string | undefined
          );
        } else if (action.function === 'fillField' && action.parameters?.fieldDescription && action.parameters?.value) {
          await uiService.fillField(
            action.parameters.fieldDescription as string,
            action.parameters.value as string,
            action.parameters.selector as string | undefined
          );
        } else if (action.function === 'search' && action.parameters?.query) {
          await uiService.performSearch(action.parameters.query as string);
        }
        
        // Wait for UI interaction to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`✅ Action ${i + 1} completed:`, action.description);
      
    } catch (error) {
      console.error(`❌ Action ${i + 1} failed:`, action.description, error);
      // Continue with next action even if one fails
    }
  }
  
  console.log('🎉 All actions completed');
}

export function useAIChat() {
  const { currentSession, setCurrentSession } = useChatContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const aiService = AIService.getInstance();
  const storageService = ChatStorageService.getInstance();

  const createNewSession = useCallback((): ChatSession => {
    return {
      id: Date.now().toString(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }, []);

  const getCurrentSession = useCallback((): ChatSession => {
    if (!currentSession) {
      const newSession = createNewSession();
      setCurrentSession(newSession);
      return newSession;
    }
    return currentSession;
  }, [currentSession, createNewSession]);

  const sendMessage = useCallback(async (content: string) => {
    let session = getCurrentSession();
    
    // Check if approaching message limit and warn user
    if (storageService.isApproachingLimit(session)) {
      const stats = storageService.getStorageStats(session);
      toast({
        title: "Conversation Getting Long",
        description: `You have ${stats.messagesUntilLimit} messages left. Older messages will be summarized to save space.`,
        variant: "default"
      });
    }

    // Clean up old messages if needed
    session = storageService.cleanupOldMessages(session);
    
    setIsLoading(true);
    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    // Add loading message for AI response
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isLoading: true
    };

    const updatedMessages = [...session.messages, userMessage, loadingMessage];
    const updatedSession = {
      ...session,
      messages: updatedMessages,
      updatedAt: new Date()
    };
    
    setCurrentSession(updatedSession);

    try {
      // Get AI response with conversation history
      const conversationHistory = session.messages
        .filter(msg => !msg.isLoading)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const aiResponse = await aiService.processMessage(
        { 
          message: content,
          conversationHistory 
        },
        { currentPage: location.pathname }
      );

      // Replace loading message with AI response
      const aiMessage: ChatMessage = {
        id: loadingMessage.id,
        content: aiResponse.content,
        role: 'assistant',
        timestamp: new Date(),
        isLoading: false
      };

      const finalMessages = updatedMessages.map(msg => 
        msg.id === loadingMessage.id ? aiMessage : msg
      );

      let finalSession = {
        ...updatedSession,
        messages: finalMessages
      };

      // Trim messages if limit exceeded
      if (storageService.hasExceededLimit(finalSession)) {
        finalSession = storageService.trimSessionMessages(finalSession);
        toast({
          title: "Conversation Trimmed",
          description: "Older messages have been summarized to keep the conversation manageable.",
          variant: "default"
        });
      }

      setCurrentSession(finalSession);

      // Handle AI actions sequentially
      if (aiResponse.actions && aiResponse.actions.length > 0) {
        console.log('🎬 Starting action sequence:', aiResponse.actions);
        executeActionsSequentially(aiResponse.actions, navigate);
      }

    } catch (error: unknown) {
      console.error('Error getting AI response:', error);
      const errorText = error instanceof Error ? error.message : 'Failed to get AI response';
      setError(errorText);
      
      // Replace loading message with error message
      const errorMessage: ChatMessage = {
        id: loadingMessage.id,
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date(),
        isLoading: false
      };

      const errorMessages = updatedMessages.map(msg => 
        msg.id === loadingMessage.id ? errorMessage : msg
      );

      setCurrentSession({
        ...updatedSession,
        messages: errorMessages
      });

      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentSession, aiService, location.pathname, navigate, toast]);

  const clearSession = useCallback(() => {
    setCurrentSession(null);
    setError(null);
  }, []);

  const getMessages = useCallback((): ChatMessage[] => {
    return currentSession?.messages || [];
  }, [currentSession]);

  const getStorageStats = useCallback(() => {
    return storageService.getStorageStats(currentSession);
  }, [currentSession, storageService]);

  return {
    messages: getMessages(),
    sendMessage,
    clearSession,
    isLoading,
    error,
    hasMessages: getMessages().length > 0,
    storageStats: getStorageStats()
  };
}