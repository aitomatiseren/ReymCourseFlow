import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OpenAIService } from "@/services/ai";
import { logger } from "@/utils/logger";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface InteractivePlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanningUpdate: (newRequest: string) => void;
  onPlanningModifications?: (modifications: any) => void;
  currentPlanningRequest: string;
  aiPlanningResult: {
    groups?: Array<{
      employees?: Array<{ length?: number }>;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  } | null;
  expiryData: Array<{
    employee_id: string;
    first_name: string;
    last_name: string;
    [key: string]: unknown;
  }>;
  selectedLicenseId: string;
  licenses: Array<{
    id: string;
    name: string;
    [key: string]: unknown;
  }>;
  providers: Array<{
    id: string;
    name: string;
    [key: string]: unknown;
  }>;
  // Enhanced context for comprehensive AI assistance
  existingTrainings?: Array<{
    id: string;
    title: string;
    date: string;
    participantCount: number;
    maxParticipants: number;
    [key: string]: unknown;
  }>;
  certificateProviders?: Array<{
    id: string;
    name: string;
    course_provider_courses?: Array<{
      price: number;
      max_participants: number;
      number_of_sessions: number;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }>;
  providerPreferences?: Record<string, {
    providers: Array<{
      priority_rank: number;
      quality_rating: number;
      distance_from_hub_km: number;
      [key: string]: unknown;
    }>;
  }>;
  employeeAvailability?: Record<string, {
    employee: { first_name: string; last_name: string };
    availabilities: Array<{
      status: string;
      availability_type: string;
      start_date: string;
      end_date?: string;
      reason?: string;
    }>;
  }>;
}

export function InteractivePlanningDialog({
  open,
  onOpenChange,
  onPlanningUpdate,
  onPlanningModifications,
  currentPlanningRequest,
  aiPlanningResult,
  expiryData,
  selectedLicenseId,
  licenses,
  providers,
  existingTrainings = [],
  certificateProviders = [],
  providerPreferences = {},
  employeeAvailability = {}
}: InteractivePlanningDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isProcessing) {
      scrollToBottom();
    }
  }, [isProcessing]);

  // Initialize conversation when dialog opens
  useEffect(() => {
    if (open && messages.length === 0) {
      const initialMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I'm here to help you refine the training group planning. 

**Current Planning Request:**
"${currentPlanningRequest}"

**Current Results:**
${aiPlanningResult ? `- ${aiPlanningResult.groups?.length || 0} groups suggested
- ${aiPlanningResult.groups?.reduce((sum: number, group: { employees?: Array<{ length?: number }>; [key: string]: unknown }) => sum + (group.employees?.length || 0), 0) || 0} total employees involved` : 'No planning results yet'}

**What would you like to modify?** I can help with:
- Adjusting group sizes or composition
- Changing scheduling preferences
- Modifying department groupings
- Adding specific constraints or requirements
- Clarifying any ambiguous requirements

Please tell me what changes you'd like to make, and I'll ask follow-up questions if needed to ensure we get the planning exactly right.`,
        timestamp: new Date(),
        status: 'sent'
      };
      setMessages([initialMessage]);
    }
  }, [open, currentPlanningRequest, aiPlanningResult, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, { ...userMessage, status: 'sent' }]);
    setInputMessage("");
    setIsProcessing(true);

    // Focus the input field after clearing it
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    try {
      // Use real OpenAI API for contextual response
      const aiResponse = await generateAIResponse(userMessage.content, messages, {
        currentPlanningRequest,
        aiPlanningResult,
        expiryData,
        selectedLicenseId,
        licenses,
        providers,
        existingTrainings,
        certificateProviders,
        providerPreferences,
        employeeAvailability
      });

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        status: 'sent'
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If AI suggests an updated planning request, handle it
      if (aiResponse.updatedPlanningRequest) {
        setTimeout(() => {
          onPlanningUpdate(aiResponse.updatedPlanningRequest);
          onOpenChange(false);
          toast({
            title: "Planning Request Updated",
            description: "The planning request has been updated based on our conversation.",
          });
        }, 1000);
      }

      // If AI suggests direct planning modifications, apply them
      if (aiResponse.planningModifications && onPlanningModifications) {
        logger.debug('AI provided planning modifications', { modifications: aiResponse.planningModifications });
        setTimeout(() => {
          onPlanningModifications(aiResponse.planningModifications);
          onOpenChange(false);
          toast({
            title: "Planning Modified",
            description: "The existing planning has been updated with your requested changes.",
          });
        }, 1000);
      }

    } catch (error) {
      logger.error('Error processing message', error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.

Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        status: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      // Re-focus the input after processing completes
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Interactive Planning Assistant
          </DialogTitle>
          <DialogDescription>
            Have a conversation with the AI to refine your training group planning. 
            Ask questions, request changes, and get clarifications.
          </DialogDescription>
        </DialogHeader>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto border rounded-md bg-gray-50 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[85%] ${message.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      {message.role === 'assistant' ? (
                        <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                      ) : (
                        <User className="h-4 w-4 mt-0.5 text-green-600" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {message.status === 'sending' && (
                            <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                          )}
                          {message.status === 'sent' && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                          {message.status === 'error' && (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <Card className="max-w-[85%] bg-gray-50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t pt-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask questions or request changes to the planning..."
                className="min-h-[60px] resize-none"
                disabled={isProcessing}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isProcessing}
              size="sm"
              className="h-[60px]"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              Press Enter to send, Shift+Enter for new line
            </Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Generate AI response using OpenAI API with contextual awareness
async function generateAIResponse(
  userMessage: string, 
  conversationHistory: ChatMessage[],
  context: {
    currentPlanningRequest: string;
    aiPlanningResult: {
      groups?: Array<{
        employees?: Array<{ length?: number }>;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    } | null;
    expiryData: Array<{
      employee_id: string;
      first_name: string;
      last_name: string;
      [key: string]: unknown;
    }>;
    selectedLicenseId: string;
    licenses: Array<{
      id: string;
      name: string;
      [key: string]: unknown;
    }>;
    providers: Array<{
      id: string;
      name: string;
      [key: string]: unknown;
    }>;
    existingTrainings?: Array<{
      id: string;
      title: string;
      date: string;
      participantCount: number;
      maxParticipants: number;
      [key: string]: unknown;
    }>;
    certificateProviders?: Array<{
      id: string;
      name: string;
      course_provider_courses?: Array<{
        price: number;
        max_participants: number;
        number_of_sessions: number;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    }>;
    providerPreferences?: Record<string, {
      providers: Array<{
        priority_rank: number;
        quality_rating: number;
        distance_from_hub_km: number;
        [key: string]: unknown;
      }>;
    }>;
    employeeAvailability?: Record<string, {
      employee: { first_name: string; last_name: string };
      availabilities: Array<{
        status: string;
        availability_type: string;
        start_date: string;
        end_date?: string;
        reason?: string;
      }>;
    }>;
  }
): Promise<{ content: string; updatedPlanningRequest?: string; planningModifications?: any }> {
  // Check if OpenAI is available
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!openaiKey) {
    return {
      content: "I apologize, but the OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your environment variables to enable AI-powered planning assistance."
    };
  }

  const selectedLicense = context.licenses.find(l => l.id === context.selectedLicenseId);
  const conversationSummary = conversationHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');
  const certificateProviders = context.certificateProviders || [];
  const existingTrainings = context.existingTrainings || [];
  const providerPreferences = context.providerPreferences || {};
  const employeeAvailability = context.employeeAvailability || {};
  
  // Build comprehensive provider information
  const relevantProviders = certificateProviders.length > 0 ? certificateProviders : context.providers;
  const coursePreferences = providerPreferences[context.selectedLicenseId] || { providers: [] };
  
  const providerSummary = relevantProviders.map(provider => {
    const relevantCourses = provider.course_provider_courses || [];
    const preferences = coursePreferences.providers?.find((pref: any) => pref.provider_id === provider.id);
    
    if (relevantCourses.length === 0) {
      return `${provider.name}: Contact provider for details, Priority: ${preferences?.priority_rank || 99}, Quality: ${preferences?.quality_rating || 'Not rated'}/10`;
    }
    
    return relevantCourses.map((cpc: any) => 
      `${provider.name}: Max ${cpc.max_participants || 'N/A'} participants, ${cpc.number_of_sessions || 1} sessions, €${cpc.price || 'N/A'}/person, Priority: ${preferences?.priority_rank || 99}, Quality: ${preferences?.quality_rating || 'Not rated'}/10, Distance: ${preferences?.distance_from_hub_km || 'Unknown'}km`
    ).join('\n');
  }).join('\n');

  // Build availability conflicts summary
  const availabilityConflicts = Object.entries(employeeAvailability).map(([employeeId, data]: [string, any]) => {
    const employee = data.employee;
    const conflicts = data.availabilities.filter((av: any) => av.status === 'active');
    if (conflicts.length === 0) return null;
    
    return `${employee.first_name} ${employee.last_name}: ${conflicts.map((c: any) => 
      `${c.availability_type} (${c.start_date} to ${c.end_date || 'ongoing'}) - ${c.reason || 'No reason specified'}`
    ).join(', ')}`;
  }).filter(Boolean);

  // Build existing training summary
  const existingTrainingsSummary = existingTrainings.length > 0 ? 
    existingTrainings.map(training => {
      const availableSpots = training.maxParticipants - training.participantCount;
      const date = new Date(training.date).toLocaleDateString();
      return `${date}: ${training.title} (${availableSpots} spots available, ${training.participantCount}/${training.maxParticipants} enrolled)`;
    }).join('\n') : 'No existing trainings with available capacity';

  const systemPrompt = `You are a training planning assistant helping to refine employee training group planning. You have access to the SAME COMPREHENSIVE INFORMATION as the main planning AI.

**CONTEXT:**
- Planning for: ${selectedLicense?.name || 'Unknown Certificate'}
- Current planning request: "${context.currentPlanningRequest}"
- ${context.expiryData.length} employees to consider
- ${context.aiPlanningResult?.groups?.length || 0} groups currently suggested

**EMPLOYEES AVAILABLE FOR GROUPING (${context.expiryData.length} total):**
${context.expiryData.map(emp => {
  const status = emp.employee_status || 'unknown';
  const daysUntilExpiry = emp.days_until_expiry || 'N/A';
  const statusDescription = status === 'expired' ? '⚠️ EXPIRED' : 
                          status === 'renewal_due' ? '🔴 RENEWAL DUE' :
                          status === 'renewal_approaching' ? '🟠 RENEWAL APPROACHING' :
                          status === 'new' ? '🆕 NEW EMPLOYEE' : 
                          '✅ VALID';
  
  return `• ${emp.first_name} ${emp.last_name} (${emp.department || 'Unknown'}, ${emp.work_location || 'Unknown Location'}) - Status: ${statusDescription} - Expires in: ${daysUntilExpiry === 'N/A' ? 'New' : daysUntilExpiry + ' days'}`;
}).join('\n')}

**CERTIFICATE EXPIRY PRIORITIZATION:**
- CRITICAL: Expired certificates (immediate training required) - ALWAYS SCHEDULE FIRST
- HIGH: Renewal due within 30 days - SCHEDULE BEFORE OTHER GROUPS  
- MEDIUM: Renewal due within 90 days - SCHEDULE AFTER HIGH PRIORITY
- LOW: New employees or long-term renewals - SCHEDULE LAST

**CRITICAL EMPLOYEE STATUS ANALYSIS:**
${context.expiryData.filter(emp => emp.employee_status === 'expired').length > 0 ? 
  `⚠️ URGENT EXPIRED EMPLOYEES (immediate action required):\n${context.expiryData.filter(emp => emp.employee_status === 'expired').map(emp => 
    `• ${emp.first_name} ${emp.last_name} - ${emp.license_name || 'Unknown'} EXPIRED ${emp.days_until_expiry || 'N/A'} days ago`
  ).join('\n')}` : 'No expired certificates'
}

**PROVIDER CONSTRAINTS AND PRICING:**
${providerSummary}

**EXISTING TRAININGS WITH AVAILABLE CAPACITY:**
${existingTrainingsSummary}

**EMPLOYEE AVAILABILITY CONFLICTS:**
${availabilityConflicts.length > 0 ? availabilityConflicts.join('\n') : 'No active availability conflicts'}

**CURRENT PLANNING RESULTS:**
${context.aiPlanningResult ? JSON.stringify(context.aiPlanningResult, null, 2) : 'No current planning results'}

**CONVERSATION HISTORY:**
${conversationSummary || 'This is the first message in the conversation.'}

**YOUR ROLE:**
- Help refine and clarify the training planning requirements through conversation
- Ask follow-up questions when the user's request needs clarification
- Suggest improvements to the EXISTING planning results shown above
- When the user is ready to apply changes, provide TARGETED MODIFICATIONS to the existing plan

**IMPORTANT CONVERSATION FLOW:**
- This is a CONVERSATION, not a single Q&A
- Build on previous messages in this chat
- Reference what we've discussed earlier
- Don't repeat the initial context - assume the user remembers it
- Keep responses conversational and focused on the current topic

**MODIFICATION APPROACH:**
- Look at the CURRENT PLANNING RESULTS above
- Identify what specific changes need to be made
- Preserve the parts of the existing plan that are working well
- Only modify the specific aspects that need to change
- For example: If John Doe needs to be rescheduled, move him to a different group but keep other employees in their current groups

**GUIDELINES:**
- Be conversational and helpful
- Ask specific questions to clarify ambiguous requests
- Provide actionable suggestions based on the current planning results
- When user says they want to "apply", "update", or "use" changes, return targeted modifications
- Focus on practical training planning considerations like group sizes, timing, costs, and employee needs

**RESPONSE FORMAT:**
- For clarification questions: Ask specific questions about the planning requirements
- For suggestions: Provide concrete recommendations with reasoning based on current results
- For targeted updates: When user wants to apply changes, end with "PLANNING_MODIFICATIONS:" followed by specific changes to make to the existing plan

**PLANNING_MODIFICATIONS FORMAT:**
When providing modifications, specify exactly what to change using these EXACT modification types:

**SUPPORTED MODIFICATION TYPES (use these exact strings):**
- **move_employee**: Move an employee from one group to another
- **add_employee**: Add an employee to an existing group
- **dissolve_group**: Remove/delete a group entirely
- **reschedule_group**: Change the date/timing of a group
- **update_group_details**: Update the employee list of a group
- **update_cost_analysis**: Update cost information for a group
- **provider_adjustment**: Change the training provider for a group
- **combine_groups**: Combine multiple groups into one new group
- **merge_groups**: Merge all existing groups into new groups (complete restructure)

PLANNING_MODIFICATIONS:
{
  "action": "modify_existing_plan",
  "changes": [
    {
      "type": "move_employee",
      "employee": "John Doe",
      "from_group": "Group 1",
      "to_group": "Group 3",
      "reason": "Employee availability constraint"
    },
    {
      "type": "combine_groups",
      "new_group_name": "Combined Group A",
      "employees": ["John Doe", "Jane Smith", "Bob Wilson"],
      "reason": "Combine departments for efficiency"
    },
    {
      "type": "merge_groups",
      "new_groups": [
        {
          "name": "Group 1 - Administration",
          "employees": ["Emma Berg", "Maria Santos"],
          "reasoning": "Administrative staff grouped together"
        },
        {
          "name": "Group 2 - Operations", 
          "employees": ["John Doe", "Robert Smit"],
          "reasoning": "Operations staff grouped together"
        }
      ]
    }
  ]
}

**AVOID:**
- Don't restate the initial context unless specifically asked
- Don't repeat what you've already said in this conversation
- Don't start over - continue the conversation naturally
- Don't suggest recreating the entire plan - make targeted modifications only`;

  try {
    const openaiService = new OpenAIService();
    
    // Build a single prompt with system instructions and conversation history
    const conversationContext = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
    
    const fullPrompt = `${systemPrompt}

${conversationContext ? `**Previous Conversation:**\n${conversationContext}\n\n` : ''}**Current User Message:**
${userMessage}

**Instructions for Response:**
- Remember the full conversation context above
- Reference previous messages if relevant
- Be consistent with previous suggestions and clarifications
- Build upon the discussion history
- DO NOT repeat the initial greeting or context - continue the conversation naturally
- Focus on the current user message and how it relates to our ongoing discussion

**Your Response:**`;

    const response = await openaiService.processTextRequest(fullPrompt);

    const aiContent = response.content || 'I apologize, but I encountered an error generating a response.';
    
    logger.ai('Response content received', { contentPreview: aiContent.substring(0, 200) });
    
    // Check if the AI provided targeted planning modifications
    const modificationsMatch = aiContent.match(/PLANNING_MODIFICATIONS:\s*```json\s*(\{[\s\S]*?\})\s*```/s) || 
                              aiContent.match(/PLANNING_MODIFICATIONS:\s*(\{[\s\S]*?\})/s);
    if (modificationsMatch) {
      try {
        logger.debug('Found modifications match', { rawMatch: modificationsMatch[1] });
        const modifications = JSON.parse(modificationsMatch[1]);
        logger.debug('Parsed modifications successfully', { modifications });
        return {
          content: aiContent.replace(/PLANNING_MODIFICATIONS:[\s\S]*?(\}|\}\s*```)/s, '').trim(),
          planningModifications: modifications
        };
      } catch (error) {
        logger.error('Error parsing planning modifications', error, { rawText: modificationsMatch[1] });
      }
    }
    
    // Check if the AI provided an updated planning request (fallback)
    const updatedRequestMatch = aiContent.match(/UPDATED_PLANNING_REQUEST:\s*(.*)/s);
    if (updatedRequestMatch) {
      return {
        content: aiContent.replace(/UPDATED_PLANNING_REQUEST:\s*.*$/s, '').trim(),
        updatedPlanningRequest: updatedRequestMatch[1].trim()
      };
    }

    return { content: aiContent };
  } catch (error) {
    logger.error('Error calling OpenAI API', error);
    return {
      content: `I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }

  // Fallback to simplified logic if OpenAI fails
  const lowerMessage = userMessage.toLowerCase();
  
  // Handle common modification requests
  if (lowerMessage.includes('smaller group') || lowerMessage.includes('reduce group size')) {
    return {
      content: `I understand you want smaller groups. 

**Questions to clarify:**
1. What maximum group size would you prefer? (currently suggests groups of up to 15)
2. Should I prioritize keeping departments together even if it means slightly larger groups?
3. Are there any specific groups from the current suggestion that are too large?

Once you clarify these details, I can update the planning request to specify smaller group sizes.`,
    };
  }

  if (lowerMessage.includes('different month') || lowerMessage.includes('timing') || lowerMessage.includes('schedule')) {
    return {
      content: `I can help adjust the timing for the training groups.

**Questions about scheduling:**
1. Which specific months would you prefer for the training?
2. Are there any months to avoid? (holidays, busy periods, etc.)
3. Should different types of groups (new employees vs renewals) be scheduled differently?
4. Do you need the training to be completed by a specific deadline?

Please let me know your preferences and I'll adjust the planning accordingly.`,
    };
  }

  if (lowerMessage.includes('department') || lowerMessage.includes('team')) {
    return {
      content: `I can modify how employees are grouped by department.

**Department grouping options:**
1. **Keep departments together** - Each group contains only employees from the same department
2. **Mix departments** - Create groups with employees from different departments for cross-team interaction
3. **Prioritize by department** - Some departments get priority scheduling

Which approach would you prefer? Also, are there specific departments that should be kept together or separated?`,
    };
  }

  if (lowerMessage.includes('priority') || lowerMessage.includes('urgent') || lowerMessage.includes('expired')) {
    return {
      content: `I can adjust the priority handling for the groups.

**Current priority logic:**
- Expired certificates get highest priority
- Certificates expiring within 30 days get high priority
- New employees get medium priority

**Questions:**
1. Should we create separate "urgent" groups for expired/expiring certificates?
2. What's the maximum acceptable time before certificate expiry for training?
3. Should certain departments get priority regardless of certificate status?

Let me know how you'd like to adjust the prioritization.`,
    };
  }

  if (lowerMessage.includes('provider') || lowerMessage.includes('location') || lowerMessage.includes('cost')) {
    const availableProviders = context.providers.map(p => p.name).join(', ');
    return {
      content: `I can help optimize provider selection and costs.

**Available providers:** ${availableProviders}

**Questions about providers:**
1. Do you have preferred providers you'd like to prioritize?
2. Should I prioritize cost savings over convenience (location/timing)?
3. Are there any providers to avoid for this planning?
4. What's the maximum acceptable cost per participant?

Please specify your preferences and I'll update the provider selection criteria.`,
    };
  }

  // Handle requests for plan updates
  if (lowerMessage.includes('update') || lowerMessage.includes('apply') || lowerMessage.includes('use this')) {
    const updatedRequest = `${context.currentPlanningRequest}

MODIFICATIONS FROM CONVERSATION:
${conversationHistory.filter(msg => msg.role === 'user').map(msg => `- ${msg.content}`).join('\n')}`;

    return {
      content: `Perfect! I'll update the planning request with our discussion points and re-run the planning.

**Updated request will include:**
${conversationHistory.filter(msg => msg.role === 'user').map(msg => `- ${msg.content}`).join('\n')}

The dialog will close and the planning will be re-executed with these modifications.`,
      updatedPlanningRequest: updatedRequest
    };
  }

  // Default response for clarification
  return {
    content: `I understand you want to modify the planning. To help you better, could you be more specific about what you'd like to change?

**Current situation:**
- Planning for: ${context.licenses.find(l => l.id === context.selectedLicenseId)?.name || 'Certificate'}
- ${context.expiryData.length} employees to consider
- ${context.aiPlanningResult?.groups?.length || 0} groups currently suggested

**I can help with:**
- **Group sizes** - Make groups larger or smaller
- **Timing** - Change when training should be scheduled  
- **Department grouping** - Keep teams together or mix them
- **Provider preferences** - Choose specific providers or locations
- **Priority handling** - Adjust how urgent cases are handled
- **Specific constraints** - Add employee availability or other restrictions

What specific aspect would you like to modify?`,
  };
}