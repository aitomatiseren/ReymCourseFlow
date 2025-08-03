import { AIRequest, AIResponse, PlatformContext } from './types';
import { PLATFORM_KNOWLEDGE } from './knowledge-base';
import { AI_CONFIG } from '@/config/ai';
import { DatabaseService, DatabaseContext } from './database-service';
import { EnhancedDatabaseService } from './enhanced-database-service';
import { UIInteractionService } from './ui-interaction-service';
import { SecureDatabaseService } from './secure-database-service';
import { TOOL_DEFINITIONS } from './tools-definitions';
import { logger } from '@/utils/logger';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      function_call?: {
        name: string;
        arguments: string;
      };
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
  }>;
}

export class OpenAIService {
  private static instance: OpenAIService;
  private dbService: DatabaseService;
  private enhancedDbService: EnhancedDatabaseService;
  private uiService: UIInteractionService;
  private secureDbService: SecureDatabaseService;
  
  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  constructor() {
    this.dbService = DatabaseService.getInstance();
    this.enhancedDbService = EnhancedDatabaseService.getInstance();
    this.uiService = UIInteractionService.getInstance();
    this.secureDbService = SecureDatabaseService.getInstance();
  }

  async processMessage(request: AIRequest, context?: PlatformContext): Promise<AIResponse> {
    if (!AI_CONFIG.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get fresh database context
    logger.ai('Getting database context...');
    const dbContext = await this.dbService.getPlatformContext();
    
    logger.ai('Database context summary', {
      employeeCount: dbContext.employees?.length || 0,
      courseCount: dbContext.courses?.length || 0,
      trainingCount: dbContext.trainings?.length || 0
    });
    
    const systemPrompt = this.buildSystemPrompt(context, dbContext);
    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history if available
    if (request.conversationHistory) {
      request.conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add current user message
    messages.push({ role: 'user', content: request.message });

    try {
      const response = await fetch(`${AI_CONFIG.openai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`
        },
        body: JSON.stringify({
          model: AI_CONFIG.openai.model,
          messages,
          max_tokens: AI_CONFIG.maxTokens,
          temperature: AI_CONFIG.temperature,
          tools: this.getToolDefinitions(),
          tool_choice: 'auto'
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data: OpenAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI');
      }

      const message = data.choices[0].message;

      logger.ai('AI Response', {
        hasContent: !!message.content,
        hasFunctionCall: !!message.function_call,
        hasToolCalls: !!message.tool_calls,
        functionName: message.function_call?.name || message.tool_calls?.[0]?.function?.name
      });

      // Handle tool calls (new format)
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        return await this.handleFunctionCall({
          name: toolCall.function.name,
          arguments: toolCall.function.arguments
        }, message.content);
      }

      // Handle function calls (legacy format)
      if (message.function_call) {
        return await this.handleFunctionCall(message.function_call, message.content);
      }

      return {
        content: message.content,
        suggestions: this.generateSuggestions(request.message)
      };

    } catch (error) {
      logger.error('OpenAI Service Error:', error);
      throw error;
    }
  }

  private buildSystemPrompt(context?: PlatformContext, dbContext?: DatabaseContext): string {
    const currentPage = context?.currentPage || 'unknown';
    
    return `You are a helpful AI assistant for a Training and Certification Management System. You help users navigate the platform, answer questions, and perform tasks.

**CRITICAL RULES:**
1. For ANY request to modify employee data (change, update, modify, set, edit), you MUST use the update_employee_by_name function. Do NOT respond with text about what you'll do - actually call the function!
2. For ANY request asking for detailed employee information (what info do you have, show me details, tell me about), you MUST use the search_employees function to get complete information. Do NOT use the limited context data provided!
3. When users ask about specific employees by name, ALWAYS use search_employees to get their full profile before responding.
4. When users want to view an employee's profile or card, use navigate_to_employee with their name/email/employee number to navigate to their profile page.

**Current Context:**
- User is currently on: ${currentPage}
- Available actions: ${context?.availableActions?.join(', ') || 'navigate, query'}

**Current Platform Data:**
${this.formatDatabaseContext(dbContext)}

**Platform Knowledge:**
${JSON.stringify(PLATFORM_KNOWLEDGE, null, 2)}

**Instructions:**
1. Always be helpful and concise
2. Use the navigation function to help users go to specific pages
3. Provide step-by-step guidance for complex tasks
4. Reference REAL platform data when answering questions about employees, courses, trainings, etc.
5. If you suggest navigation, use the exact routes provided in the navigation object
6. For training scheduling, guide users to /scheduling
7. For employee management, guide users to /participants
8. For course management, guide users to /courses
9. For certificate definitions, guide users to /certificate-definitions
10. For certificate expiry tracking, guide users to /certificate-expiry
11. Remember previous conversation context and refer to it naturally
12. When asked about specific data (employees, courses, trainings), use the real data provided
13. If asked about counts or statistics, calculate from the real data

**Enhanced Capabilities:**
- Use find_newest_hires() for questions about newest employees, recent hires, or who was hired recently
- Use search_employees() for specific employee searches with name, department, or role
- Use smart_search() for complex queries across multiple data types
- Use analyze_employee_data() for data analysis requests about workforce patterns
- ALL employee data is now accessible including hire_date, salary, addresses, emergency contacts, etc.
- The system can now understand and respond to complex questions about employee tenure, hierarchy, and demographics

**Secure Database Operations (INSTANT & RELIABLE):**
- Use update_employee_by_name() to instantly update employee data by name/email (PREFERRED)
- Use update_employee_data() to directly modify employee information with ID
- Use create_training_secure() to instantly create new trainings with validation
- Use update_training_secure() to instantly modify existing training details
- Use add_training_participant() to instantly enroll employees in trainings
- Use update_employee_certificate() to instantly manage employee certificates and licenses
- ALL database operations respect user permissions and session authentication
- Operations include comprehensive validation, audit logging, and error handling
- You inherit the user's access level - no elevated privileges

**Security & Permissions:**
- All operations use the current user's authentication session
- Supabase Row Level Security (RLS) policies are enforced
- Permission checking occurs before any database modifications
- Comprehensive audit logging tracks all AI operations
- Input validation prevents invalid or malicious data
- Users can only perform actions they have permission for

**CRITICAL INSTRUCTION - EMPLOYEE UPDATES:**
When a user asks to update/change/modify ANY employee information:
- ALWAYS use update_employee_by_name() function
- This is the ONLY function to use for employee modifications by name
- Do NOT use UI automation or any other functions
- Example: "change Ahmed's roepnaam to Ahmed" → use update_employee_by_name(searchTerm: "Ahmed", updates: {roepnaam: "Ahmed"})

**Direct Database Workflow:**
When users request data modifications:
1. Use search_employees() to find the target employee/record if needed
2. Use update_employee_by_name() for employee modifications (PREFERRED)
3. The system handles all validation, permissions, and database operations automatically
4. No UI navigation required - operations are instant and reliable

**IMPORTANT RULES:**
- NEVER use UI automation for data modifications
- ALWAYS prefer database functions over UI functions
- Database operations are faster, more reliable, and more secure

**Response Format:**
- Speak naturally like a helpful colleague, not a robot
- Be concise and direct - get things done without unnecessary explanations
- Say things like "Done!", "Got it!", "Sure thing!" instead of formal confirmations
- Use casual language: "I'll update that for you" instead of "I will proceed to modify the database record"
- Reference people by their first names when appropriate
- Keep it conversational and friendly`;
  }

  private formatDatabaseContext(dbContext?: DatabaseContext): string {
    if (!dbContext) return 'No current data available';

    return `
**Current Employees (${dbContext.employees.length} active):**
${dbContext.employees.slice(0, 10).map(emp => 
  `- ${emp.name} (${emp.employee_number || 'No #'}) - ${emp.department || 'No dept'} - ${emp.job_title || 'No title'}${emp.hire_date ? ` - Hired: ${emp.hire_date}` : ''}`
).join('\n')}
${dbContext.employees.length > 10 ? `... and ${dbContext.employees.length - 10} more employees` : ''}

**Available Courses (${dbContext.courses.length} active):**
${dbContext.courses.slice(0, 8).map(course => 
  `- "${course.title}" (${course.duration_hours || 'Unknown'} hours)${course.code95_points ? ` - ${course.code95_points} Code 95 points` : ''}`
).join('\n')}
${dbContext.courses.length > 8 ? `... and ${dbContext.courses.length - 8} more courses` : ''}

**Upcoming Trainings (${dbContext.trainings.length}):**
${dbContext.trainings.slice(0, 8).map(training => 
  `- "${training.course_title}" on ${training.start_date} (${training.participant_count} participants) - ${training.status}`
).join('\n')}
${dbContext.trainings.length > 8 ? `... and ${dbContext.trainings.length - 8} more trainings` : ''}

**Expiring Certificates (${dbContext.expiringCertificates.length}):**
${dbContext.expiringCertificates.slice(0, 5).map(cert => 
  `- ${cert.employee_name}: ${cert.license_type} expires in ${cert.days_until_expiry} days (${cert.expiry_date})`
).join('\n')}
${dbContext.expiringCertificates.length > 5 ? `... and ${dbContext.expiringCertificates.length - 5} more expiring certificates` : ''}

**Recent Activity:**
${dbContext.recentActivity.slice(0, 3).map(activity => 
  `- ${activity.description} (${activity.timestamp})`
).join('\n')}
`;
  }

  private getToolDefinitions() {
    return TOOL_DEFINITIONS;
  }

  private async handleFunctionCall(functionCall: { name: string; arguments: string }, content: string): Promise<AIResponse> {
    try {
      logger.ai('Function Call', {
        functionName: functionCall.name,
        arguments: functionCall.arguments
      });
      
      const args = JSON.parse(functionCall.arguments);
      
      switch (functionCall.name) {
        case 'navigate_to_page':
          return {
            content: content || `I'll take you to ${args.reason || 'the requested page'}.`,
            actions: [{
              type: 'navigate',
              description: args.reason || 'Navigate to page',
              function: 'navigate',
              parameters: { path: args.path },
              requiresConfirmation: false
            }]
          };

        case 'update_employee_by_name':
          try {
            logger.ai('Processing update_employee_by_name', {
              searchTerm: args.searchTerm,
              updates: args.updates
            });
            
            // First find the employee by search term
            const employeeMatch = await this.secureDbService.findEmployeeId(args.searchTerm);
            
            if (!employeeMatch) {
              return {
                content: `I couldn't find an employee matching "${args.searchTerm}". Please check the name, email, or employee number and try again.`,
                suggestions: ["Try different search term", "Check spelling", "Search all employees"]
              };
            }

            // Now update the employee
            const result = await this.secureDbService.updateEmployee(employeeMatch.id, args.updates);
            
            if (result.success) {
              // Extract the field name that was updated for a more natural response
              const updatedFields = Object.keys(args.updates).join(', ');
              const fieldValues = Object.entries(args.updates)
                .map(([field, value]) => `${field} to "${value}"`)
                .join(', ');
              
              return {
                content: `Done! I've updated ${employeeMatch.name}'s ${fieldValues}. The changes have been saved to the database.`,
                suggestions: ["Show me their updated profile", "Make another change", "Update someone else"]
              };
            } else {
              return {
                content: `Hmm, I ran into an issue updating ${employeeMatch.name}'s information. ${result.message}. Would you like me to try a different approach?`,
                suggestions: ["Let me check their current details", "Try again", "Update a different field"]
              };
            }
          } catch (error) {
            logger.error('Error updating employee by name:', error);
            return {
              content: "I encountered an error while updating the employee data.",
              suggestions: ["Try again", "Check permissions", "Contact administrator"]
            };
          }

        case 'create_training_secure':
          try {
            const result = await this.secureDbService.createTraining({
              course_id: args.course_id,
              start_date: args.start_date,
              end_date: args.end_date,
              instructor: args.instructor,
              location: args.location,
              max_participants: args.max_participants,
              notes: args.notes
            });
            
            if (result.success) {
              return {
                content: `Great! I've created the training for ${args.instructor ? `instructor ${args.instructor}` : 'the course'}. The training is scheduled for ${args.start_date}.`,
                suggestions: ["Add participants", "View training details", "Create another training"]
              };
            } else {
              return {
                content: `I had trouble creating the training: ${result.message}`,
                suggestions: ["Check course ID", "Verify permissions", "Try again"]
              };
            }
          } catch (error) {
            logger.error('Error creating training:', error);
            return {
              content: "I encountered an error while creating the training.",
              suggestions: ["Try again", "Check permissions", "Contact administrator"]
            };
          }

        case 'add_training_participant':
          try {
            const result = await this.secureDbService.addTrainingParticipant(args.trainingId, args.employeeId);
            
            if (result.success) {
              return {
                content: `Perfect! I've added the employee to the training. They're now enrolled.`,
                suggestions: ["View training roster", "Add another participant", "Check training details"]
              };
            } else {
              return {
                content: `I couldn't add the participant: ${result.message}`,
                suggestions: ["Check employee ID", "Verify training ID", "Try again"]
              };
            }
          } catch (error) {
            logger.error('Error adding training participant:', error);
            return {
              content: "I encountered an error while adding the participant.",
              suggestions: ["Try again", "Check permissions", "Contact administrator"]
            };
          }

        case 'update_employee_certificate':
          try {
            const result = await this.secureDbService.updateEmployeeCertificate(args.employeeId, args.certificateData);
            
            if (result.success) {
              return {
                content: `Done! I've updated the certificate information for the employee.`,
                suggestions: ["View certificate details", "Add another certificate", "Check expiry dates"]
              };
            } else {
              return {
                content: `I had trouble updating the certificate: ${result.message}`,
                suggestions: ["Check employee ID", "Verify certificate data", "Try again"]
              };
            }
          } catch (error) {
            logger.error('Error updating certificate:', error);
            return {
              content: "I encountered an error while updating the certificate.",
              suggestions: ["Try again", "Check permissions", "Contact administrator"]
            };
          }

        case 'search_employees':
          try {
            logger.ai('Processing search_employees', args);
            
            // Use the enhanced database service to search employees
            const searchResults = await this.enhancedDbService.searchEmployees(args.query, args.filters || {});
            
            if (!searchResults || searchResults.length === 0) {
              return {
                content: `I couldn't find any employees matching "${args.query}". Please try a different search term.`,
                suggestions: ["Search all employees", "Try different spelling", "Search by department"]
              };
            }

            // Format detailed employee information
            const employeeDetails = searchResults.map(emp => {
              const details = [
                `**${emp.first_name} ${emp.tussenvoegsel || ''} ${emp.last_name}`.trim(),
                emp.roepnaam ? `(Known as: ${emp.roepnaam})` : '',
                `Employee #: ${emp.employee_number || 'Not assigned'}`,
                `Department: ${emp.department || 'Not specified'}`,
                `Position: ${emp.job_title || 'Not specified'}`,
                `Email: ${emp.email || 'Not provided'}`,
                emp.phone ? `Phone: ${emp.phone}` : '',
                emp.mobile_phone ? `Mobile: ${emp.mobile_phone}` : '',
                emp.hire_date ? `Hired: ${emp.hire_date}` : '',
                emp.date_of_birth ? `Date of Birth: ${emp.date_of_birth}` : '',
                emp.address ? `Address: ${emp.address}` : '',
                emp.city ? `City: ${emp.city}` : '',
                emp.country ? `Country: ${emp.country}` : '',
                emp.nationality ? `Nationality: ${emp.nationality}` : '',
                emp.notes ? `Notes: ${emp.notes}` : ''
              ].filter(detail => detail && detail.trim() !== '');
              
              return details.join('\n');
            }).join('\n\n---\n\n');

            // Include navigation suggestion with employee ID for the first result
            const firstEmployee = searchResults[0];
            const profileSuggestions = firstEmployee ? [
              `View ${firstEmployee.first_name || firstEmployee.name}'s profile`,
              "Show training history", 
              "View certificates", 
              "Update information", 
              "Search for others"
            ] : ["Show training history", "View certificates", "Update information", "Search for others"];

            return {
              content: `Here's the detailed information I found:\n\n${employeeDetails}`,
              suggestions: profileSuggestions,
              actions: firstEmployee ? [{
                type: 'navigate',
                description: `Navigate to ${firstEmployee.first_name || firstEmployee.name}'s profile`,
                function: 'navigate',
                parameters: { path: `/participants/${firstEmployee.id}` },
                requiresConfirmation: false
              }] : undefined
            };
          } catch (error) {
            logger.error('Error searching employees:', error);
            return {
              content: "I encountered an error while searching for employee information.",
              suggestions: ["Try again", "Search with different terms", "Contact support"]
            };
          }

        case 'navigate_to_employee':
          try {
            logger.ai('Processing navigate_to_employee', args);
            
            // Use search functionality to find the employee
            const searchResults = await this.enhancedDbService.searchEmployees(args.searchTerm, {});
            
            if (!searchResults || searchResults.length === 0) {
              return {
                content: `I couldn't find an employee matching "${args.searchTerm}". Please check the name, email, or employee number and try again.`,
                suggestions: ["Search all employees", "Try different spelling", "Browse participant list"],
                actions: [{
                  type: 'navigate',
                  description: 'Go to participants page to browse all employees',
                  function: 'navigate',
                  parameters: { path: '/participants' },
                  requiresConfirmation: false
                }]
              };
            }

            const employee = searchResults[0];
            const employeeName = `${employee.first_name} ${employee.tussenvoegsel || ''} ${employee.last_name}`.trim();
            
            return {
              content: `I found ${employeeName}! I'll take you to their profile page now.`,
              actions: [{
                type: 'navigate',
                description: `Navigate to ${employeeName}'s profile`,
                function: 'navigate',
                parameters: { path: `/participants/${employee.id}` },
                requiresConfirmation: false
              }],
              suggestions: ["View training history", "Check certificates", "Update information", "Search for others"]
            };
          } catch (error) {
            logger.error('Error navigating to employee:', error);
            return {
              content: `I had trouble finding that employee. Let me take you to the participants page where you can search and browse all employees.`,
              actions: [{
                type: 'navigate',
                description: 'Go to participants page',
                function: 'navigate',
                parameters: { path: '/participants' },
                requiresConfirmation: false
              }],
              suggestions: ["Search employees manually", "Browse employee list", "Try different search term"]
            };
          }

        case 'view_employee_profile':
          return {
            content: content || `I'll take you to ${args.employeeName || 'the employee'}'s profile page.`,
            actions: [{
              type: 'navigate',
              description: `Navigate to ${args.employeeName || 'employee'} profile`,
              function: 'navigate',
              parameters: { path: `/participants/${args.employeeId}` },
              requiresConfirmation: false
            }]
          };
          
        default:
          return {
            content: content || "I can help you with that. What would you like to do?"
          };
      }
    } catch (error) {
      logger.error('Error handling function call:', error);
      return {
        content: content || "I can help you with that. What would you like to do?"
      };
    }
  }

  async processTextRequest(prompt: string): Promise<{ content: string }> {
    if (!AI_CONFIG.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch(`${AI_CONFIG.openai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`
        },
        body: JSON.stringify({
          model: AI_CONFIG.openai.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
          temperature: 0.1 // Lower temperature for more consistent extraction
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data: OpenAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI');
      }

      return {
        content: data.choices[0].message.content
      };
    } catch (error) {
      logger.error('OpenAI Text Processing Error:', error);
      throw error;
    }
  }

  async processVisionRequest(prompt: string, base64Data: string, mimeType: string = 'image/jpeg'): Promise<{ content: string }> {
    if (!AI_CONFIG.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch(`${AI_CONFIG.openai.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Use vision-enabled model
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('OpenAI Vision API error response:', errorText);
        throw new Error(`OpenAI Vision API error: ${response.status} - ${errorText}`);
      }

      const data: OpenAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI Vision');
      }

      return {
        content: data.choices[0].message.content
      };
    } catch (error) {
      logger.error('OpenAI Vision Processing Error:', error);
      throw error;
    }
  }

  private generateSuggestions(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('training')) {
      return [
        "Show me available courses",
        "Find instructors",
        "Check participant availability",
        "View training calendar"
      ];
    }
    
    if (lowerMessage.includes('employee') || lowerMessage.includes('participant')) {
      return [
        "Search for employees",
        "View employee profiles",
        "Check training history",
        "Add new employee"
      ];
    }
    
    if (lowerMessage.includes('certificate') || lowerMessage.includes('license')) {
      return [
        "Check expiring certificates",
        "View all certificates",
        "Add new certificate",
        "Generate compliance report"
      ];
    }
    
    return [
      "Schedule a training",
      "View employee list",
      "Check certificates",
      "See recent activity"
    ];
  }
}