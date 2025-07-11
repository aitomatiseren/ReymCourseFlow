// AI Service Configuration
export const AI_CONFIG = {
  // For future integration with external AI services
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1'
  },
  anthropic: {
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
    model: 'claude-3-sonnet-20240229',
    baseUrl: 'https://api.anthropic.com/v1'
  },
  // Current configuration - set to openai for GPT integration
  provider: 'openai' as 'local' | 'openai' | 'anthropic',
  
  // Chat settings
  maxMessages: 50,
  maxTokens: 4000,
  temperature: 0.7,
  
  // Features
  enableNavigation: true,
  enableActions: true,
  enableContextAwareness: true
};

export const isAIProviderConfigured = (): boolean => {
  if (AI_CONFIG.provider === 'local') return true;
  if (AI_CONFIG.provider === 'openai') return !!AI_CONFIG.openai.apiKey;
  if (AI_CONFIG.provider === 'anthropic') return !!AI_CONFIG.anthropic.apiKey;
  return false;
};