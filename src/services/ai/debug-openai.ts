import { AI_CONFIG } from '@/config/ai';
import { TOOL_DEFINITIONS } from './tools-definitions';

export async function debugOpenAIRequest() {
  const testMessage = "What information do you have about Ahmed Hassan?";
  
  const requestBody = {
    model: AI_CONFIG.openai.model,
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant. When asked about employee information, you MUST use the search_employees function to get complete details."
      },
      {
        role: "user", 
        content: testMessage
      }
    ],
    max_tokens: AI_CONFIG.maxTokens,
    temperature: AI_CONFIG.temperature,
    tools: TOOL_DEFINITIONS,
    tool_choice: "auto"
  };

  console.log('🔧 Debug OpenAI Request:', {
    model: requestBody.model,
    toolCount: TOOL_DEFINITIONS.length,
    toolNames: TOOL_DEFINITIONS.map(t => t.function.name),
    toolChoice: requestBody.tool_choice,
    hasApiKey: !!AI_CONFIG.openai.apiKey,
    keyPrefix: AI_CONFIG.openai.apiKey?.substring(0, 8)
  });

  try {
    const response = await fetch(`${AI_CONFIG.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ OpenAI Response:', {
      hasChoices: !!data.choices,
      choiceCount: data.choices?.length,
      hasContent: !!data.choices?.[0]?.message?.content,
      hasToolCalls: !!data.choices?.[0]?.message?.tool_calls,
      toolCallCount: data.choices?.[0]?.message?.tool_calls?.length,
      finishReason: data.choices?.[0]?.finish_reason,
      usage: data.usage
    });

    if (data.choices?.[0]?.message?.tool_calls) {
      console.log('🔧 Tool Calls Found:', data.choices[0].message.tool_calls.map(tc => ({
        name: tc.function.name,
        arguments: tc.function.arguments
      })));
    }

    if (data.choices?.[0]?.message?.content) {
      console.log('💬 AI Response Content:', data.choices[0].message.content);
    }

    return data;
  } catch (error) {
    console.error('❌ Request Error:', error);
  }
}