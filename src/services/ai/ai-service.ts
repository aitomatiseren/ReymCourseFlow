import { AIRequest, AIResponse, PlatformContext } from './types';
import { PLATFORM_KNOWLEDGE, searchKnowledge } from './knowledge-base';

export class AIService {
  private static instance: AIService;
  
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async processMessage(request: AIRequest, context?: PlatformContext): Promise<AIResponse> {
    const query = request.message.toLowerCase();
    
    // Simple intent detection
    const intent = this.detectIntent(query);
    
    switch (intent) {
      case 'navigation':
        return this.handleNavigationQuery(query);
      case 'how_to':
        return this.handleHowToQuery(query);
      case 'schedule_training':
        return this.handleScheduleTrainingQuery(query);
      case 'find_employees':
        return this.handleEmployeeQuery(query);
      case 'certificates':
        return this.handleCertificateQuery(query);
      case 'general_info':
        return this.handleGeneralInfoQuery(query);
      default:
        return this.handleGenericQuery(query);
    }
  }

  private detectIntent(query: string): string {
    if (query.includes('how do i') || query.includes('how to') || query.includes('how can i')) {
      return 'how_to';
    }
    if (query.includes('where') && (query.includes('find') || query.includes('menu') || query.includes('go'))) {
      return 'navigation';
    }
    if (query.includes('schedule') && query.includes('training')) {
      return 'schedule_training';
    }
    if (query.includes('employee') || query.includes('participant')) {
      return 'find_employees';
    }
    if (query.includes('certificate') || query.includes('expir') || query.includes('code 95')) {
      return 'certificates';
    }
    if (query.includes('what is') || query.includes('what are')) {
      return 'general_info';
    }
    return 'generic';
  }

  private handleNavigationQuery(query: string): AIResponse {
    if (query.includes('training') || query.includes('schedule')) {
      return {
        content: "You can find the Training Scheduler in the main navigation menu. It allows you to create, edit, and manage training sessions.",
        actions: [{
          type: 'navigate',
          description: 'Go to Training Scheduler',
          function: 'navigate',
          parameters: { path: '/scheduling' },
          requiresConfirmation: false
        }]
      };
    }
    
    if (query.includes('employee') || query.includes('participant')) {
      return {
        content: "The Participants menu is where you can manage all employee records, add new employees, and view employee profiles.",
        actions: [{
          type: 'navigate', 
          description: 'Go to Participants',
          function: 'navigate',
          parameters: { path: '/participants' },
          requiresConfirmation: false
        }]
      };
    }

    if (query.includes('course')) {
      return {
        content: "You can manage courses in the Courses menu. Here you can create new courses, edit existing ones, and configure Code 95 points.",
        actions: [{
          type: 'navigate',
          description: 'Go to Courses',
          function: 'navigate', 
          parameters: { path: '/courses' },
          requiresConfirmation: false
        }]
      };
    }

    return {
      content: "I can help you navigate to different sections of the platform. The main areas are: Training Scheduler, Participants, Courses, Certificate Expiry, and Reports. What would you like to access?"
    };
  }

  private handleHowToQuery(query: string): AIResponse {
    const knowledge = searchKnowledge(query);
    
    if (knowledge.length > 0) {
      const result = knowledge[0];
      if (result.type === 'question') {
        return {
          content: result.answer,
          suggestions: ["Tell me more about this", "Show me where to go", "What else can I do?"]
        };
      } else if (result.type === 'feature') {
        return {
          content: `${result.description}\n\n${result.guide}`,
          actions: [{
            type: 'navigate',
            description: `Go to ${result.location}`,
            function: 'navigate',
            parameters: { path: this.getPathForLocation(result.location) },
            requiresConfirmation: false
          }]
        };
      }
    }

    return {
      content: "I can help you with common tasks like scheduling trainings, managing employees, creating courses, and checking certificates. What specifically would you like to learn how to do?"
    };
  }

  private handleScheduleTrainingQuery(query: string): AIResponse {
    return {
      content: "To schedule a training, I can guide you through the process:\n\n1. First, I'll take you to the Training Scheduler\n2. You can then create a new training\n3. Select the course and set the date/time\n4. Add participants\n\nWould you like me to take you to the Training Scheduler now?",
      actions: [{
        type: 'navigate',
        description: 'Go to Training Scheduler',
        function: 'navigate',
        parameters: { path: '/training-scheduler' },
        requiresConfirmation: false
      }],
      suggestions: ["Yes, take me there", "Tell me more about the process", "What courses are available?"]
    };
  }

  private handleEmployeeQuery(query: string): AIResponse {
    return {
      content: "I can help you with employee management. You can:\n\n• View all employees in the Participants section\n• Add new employees\n• Edit employee information\n• Manage employee licenses and certificates\n\nWhat would you like to do with employee records?",
      actions: [{
        type: 'navigate',
        description: 'Go to Participants',
        function: 'navigate',
        parameters: { path: '/participants' },
        requiresConfirmation: false
      }]
    };
  }

  private handleCertificateQuery(query: string): AIResponse {
    return {
      content: "For certificate management, you can check expiring certificates, update certificate statuses, and generate compliance reports. The Certificate Expiry section shows you all certificates with their status and expiry dates.",
      actions: [{
        type: 'navigate',
        description: 'Go to Certificate Expiry',
        function: 'navigate',
        parameters: { path: '/certifications' },
        requiresConfirmation: false
      }]
    };
  }

  private handleGeneralInfoQuery(query: string): AIResponse {
    const knowledge = searchKnowledge(query);
    
    if (knowledge.length > 0) {
      const result = knowledge.find(r => r.type === 'terminology');
      if (result) {
        return {
          content: `${result.term}: ${result.definition}`,
          suggestions: ["Tell me more", "How do I use this?", "Where can I find this?"]
        };
      }
    }

    return {
      content: "I can provide information about various aspects of the training management platform. What specifically would you like to know about?"
    };
  }

  private handleGenericQuery(query: string): AIResponse {
    const knowledge = searchKnowledge(query);
    
    if (knowledge.length > 0) {
      const result = knowledge[0];
      return {
        content: result.answer || result.description || result.definition || "I found some information about that.",
        suggestions: ["Tell me more", "How do I do this?", "Where can I find this?"]
      };
    }

    return {
      content: "I'm here to help you with the training management platform. I can assist with:\n\n• Scheduling trainings\n• Managing employees\n• Creating courses\n• Checking certificates\n• Generating reports\n• Finding features and menus\n\nWhat would you like to do?",
      suggestions: ["Schedule a training", "Add an employee", "Check certificates", "Find a feature"]
    };
  }

  private getPathForLocation(location: string): string {
    const pathMap: Record<string, string> = {
      'Training Scheduler menu': '/scheduling',
      'Participants menu': '/participants', 
      'Courses menu': '/courses',
      'Certificate Expiry menu': '/certifications',
      'Reports menu': '/reports'
    };
    
    return pathMap[location] || '/';
  }
}