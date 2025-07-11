import { AI_CONFIG, isAIProviderConfigured } from '@/config/ai';
import { AIService } from './ai-service';
import { OpenAIService } from './openai-service';
import { AIRequest, AIResponse, PlatformContext } from './types';

interface IAIService {
  processMessage(request: AIRequest, context?: PlatformContext): Promise<AIResponse>;
}

export class AIServiceFactory {
  private static instance: IAIService;

  public static getInstance(): IAIService {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = AIServiceFactory.createService();
    }
    return AIServiceFactory.instance;
  }

  private static createService(): IAIService {
    // Check if the configured provider is available and configured
    if (AI_CONFIG.provider === 'openai' && isAIProviderConfigured()) {
      console.log('Using OpenAI service for AI chat');
      return OpenAIService.getInstance();
    } else if (AI_CONFIG.provider === 'anthropic' && isAIProviderConfigured()) {
      console.log('Anthropic service not yet implemented, falling back to local');
      return AIService.getInstance();
    } else {
      console.log('Using local AI service for chat');
      return AIService.getInstance();
    }
  }

  // Allow manual switching of providers (useful for testing)
  public static switchProvider(provider: 'local' | 'openai' | 'anthropic'): void {
    if (provider === 'local') {
      AIServiceFactory.instance = AIService.getInstance();
    } else if (provider === 'openai') {
      AIServiceFactory.instance = OpenAIService.getInstance();
    } else {
      console.warn('Provider not implemented, using local service');
      AIServiceFactory.instance = AIService.getInstance();
    }
  }

  // Get current provider status
  public static getProviderStatus(): { provider: string; configured: boolean; error?: string } {
    try {
      const configured = isAIProviderConfigured();
      return {
        provider: AI_CONFIG.provider,
        configured,
        error: configured ? undefined : 'API key not configured'
      };
    } catch (error) {
      return {
        provider: AI_CONFIG.provider,
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}