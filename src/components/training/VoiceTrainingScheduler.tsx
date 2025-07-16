import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Calendar,
  Users,
  Clock,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { ElevenLabsService } from '@/services/ai/elevenlabs-service';
import { useAIChat } from '@/hooks/useAIChat';
import { toast } from 'sonner';

interface VoiceTrainingSchedulerProps {
  onScheduleTraining?: (parameters: {
    courseName?: string;
    date?: string;
    employees?: string[];
    duration?: string;
    location?: string;
  }) => void;
  onFindEmployee?: (searchQuery: string) => void;
  onCheckAvailability?: (employeeName: string, date?: string) => void;
  preSelectedCourseId?: string;
  preSelectedEmployeeId?: string;
  className?: string;
}

export function VoiceTrainingScheduler({
  onScheduleTraining,
  onFindEmployee,
  onCheckAvailability,
  preSelectedCourseId,
  preSelectedEmployeeId,
  className = ''
}: VoiceTrainingSchedulerProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);

  const elevenlabsService = ElevenLabsService.getInstance();
  const { sendMessage } = useAIChat();

  const handleStartListening = async () => {
    if (!elevenlabsService.isConfigured()) {
      toast.error('ElevenLabs not configured. Please add your API key to environment variables.');
      return;
    }

    setIsListening(true);
    setCurrentTranscript('');
    
    try {
      await elevenlabsService.handleVoiceConversation(
        (userSpeech) => {
          setCurrentTranscript(userSpeech);
          handleUserSpeech(userSpeech);
        },
        (aiResponse) => {
          handleAIResponse(aiResponse);
        },
        (error) => {
          console.error('Voice conversation error:', error);
          setIsListening(false);
        }
      );
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    setIsListening(false);
    setCurrentTranscript('');
  };

  const handleUserSpeech = async (transcript: string) => {
    setIsListening(false);
    setIsProcessing(true);
    
    // Add user message to history
    const userMessage = {
      role: 'user' as const,
      content: transcript,
      timestamp: new Date()
    };
    
    setConversationHistory(prev => [...prev, userMessage]);
    
    try {
      // Parse voice command specifically for training scheduling
      const command = parseTrainingCommand(transcript);
      setLastCommand(command.action);
      
      // Handle different training command types
      switch (command.action) {
        case 'schedule_training':
          await handleScheduleTrainingCommand(command.parameters);
          break;
        case 'find_employee':
          await handleFindEmployeeCommand(command.parameters);
          break;
        case 'check_availability':
          await handleCheckAvailabilityCommand(command.parameters);
          break;
        case 'list_courses':
          await handleListCoursesCommand();
          break;
        case 'show_calendar':
          await handleShowCalendarCommand(command.parameters);
          break;
        case 'training_help':
          await handleTrainingHelpCommand();
          break;
        default:
          await handleGeneralAICommand(transcript);
          break;
      }
      
    } catch (error) {
      console.error('Error processing user speech:', error);
      const errorMessage = 'Sorry, I had trouble understanding that. Could you please try again?';
      await handleAIResponse(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseTrainingCommand = (transcript: string): { action: string; parameters: Record<string, any> } => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Schedule training commands
    if (lowerTranscript.includes('schedule') || lowerTranscript.includes('book') || lowerTranscript.includes('create')) {
      return {
        action: 'schedule_training',
        parameters: {
          transcript,
          extractedInfo: extractTrainingInfo(transcript)
        }
      };
    }
    
    // Find employee commands
    if (lowerTranscript.includes('find') && (lowerTranscript.includes('employee') || lowerTranscript.includes('person'))) {
      return {
        action: 'find_employee',
        parameters: {
          transcript,
          searchQuery: extractEmployeeName(transcript)
        }
      };
    }
    
    // Check availability commands
    if (lowerTranscript.includes('availability') || lowerTranscript.includes('available') || lowerTranscript.includes('free')) {
      return {
        action: 'check_availability',
        parameters: {
          transcript,
          employeeName: extractEmployeeName(transcript),
          date: extractDate(transcript)
        }
      };
    }
    
    // List courses commands
    if (lowerTranscript.includes('courses') || lowerTranscript.includes('training types') || lowerTranscript.includes('what can I schedule')) {
      return {
        action: 'list_courses',
        parameters: { transcript }
      };
    }
    
    // Show calendar commands
    if (lowerTranscript.includes('calendar') || lowerTranscript.includes('schedule') || lowerTranscript.includes('what\'s planned')) {
      return {
        action: 'show_calendar',
        parameters: {
          transcript,
          date: extractDate(transcript)
        }
      };
    }
    
    // Training help commands
    if (lowerTranscript.includes('help') || lowerTranscript.includes('how to') || lowerTranscript.includes('commands')) {
      return {
        action: 'training_help',
        parameters: { transcript }
      };
    }
    
    // Default to general AI command
    return {
      action: 'general_ai',
      parameters: { transcript }
    };
  };

  const extractTrainingInfo = (transcript: string): Record<string, any> => {
    const info: Record<string, any> = {};
    
    // Extract course names
    const coursePatterns = [
      /\b(vca|bhv|code 95|forklift|crane|safety|first aid|fire safety)\b/gi,
      /\b(\w+)\s+training\b/gi,
      /\b(\w+)\s+course\b/gi,
    ];
    
    coursePatterns.forEach(pattern => {
      const matches = transcript.match(pattern);
      if (matches) {
        info.courseName = matches[0];
      }
    });
    
    // Extract dates
    info.date = extractDate(transcript);
    
    // Extract employee names or counts
    const employeePatterns = [
      /\b(\d+)\s+people\b/gi,
      /\b(\d+)\s+employees\b/gi,
      /\bfor\s+([\w\s]+?)(?:\s+on|\s+at|\s+in|$)/gi,
    ];
    
    employeePatterns.forEach(pattern => {
      const matches = transcript.match(pattern);
      if (matches) {
        info.employees = matches[0];
      }
    });
    
    // Extract duration
    const durationPatterns = [
      /\b(\d+)\s+hour[s]?\b/gi,
      /\b(\d+)\s+day[s]?\b/gi,
      /\bhalf\s+day\b/gi,
      /\bfull\s+day\b/gi,
    ];
    
    durationPatterns.forEach(pattern => {
      const matches = transcript.match(pattern);
      if (matches) {
        info.duration = matches[0];
      }
    });
    
    return info;
  };

  const extractEmployeeName = (transcript: string): string => {
    const patterns = [
      /find\s+([\w\s]+?)(?:\s+availability|\s+schedule|$)/gi,
      /for\s+([\w\s]+?)(?:\s+availability|\s+schedule|$)/gi,
      /employee\s+([\w\s]+?)(?:\s+availability|\s+schedule|$)/gi,
    ];
    
    for (const pattern of patterns) {
      const match = transcript.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return '';
  };

  const extractDate = (transcript: string): string => {
    const datePatterns = [
      /\b(today|tomorrow|next week|this week|next month)\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b(\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4})\b/gi,
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi,
    ];
    
    for (const pattern of datePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return '';
  };

  const handleScheduleTrainingCommand = async (parameters: Record<string, any>) => {
    const extractedInfo = parameters.extractedInfo || {};
    let response = 'I can help you schedule training. ';
    
    if (extractedInfo.courseName) {
      response += `I understand you want to schedule ${extractedInfo.courseName}. `;
    }
    
    if (extractedInfo.date) {
      response += `For ${extractedInfo.date}. `;
    }
    
    if (extractedInfo.employees) {
      response += `For ${extractedInfo.employees}. `;
    }
    
    if (extractedInfo.duration) {
      response += `Duration: ${extractedInfo.duration}. `;
    }
    
    response += 'Let me help you set up the training details.';
    
    // Call the callback if provided
    if (onScheduleTraining) {
      onScheduleTraining({
        courseName: extractedInfo.courseName,
        date: extractedInfo.date,
        employees: extractedInfo.employees ? [extractedInfo.employees] : [],
        duration: extractedInfo.duration
      });
    }
    
    await handleAIResponse(response);
  };

  const handleFindEmployeeCommand = async (parameters: Record<string, any>) => {
    const searchQuery = parameters.searchQuery || '';
    const response = searchQuery 
      ? `I'll help you find ${searchQuery}. Searching the employee database now.`
      : 'I can help you find employees. Please provide the name of the employee you\'re looking for.';
    
    if (onFindEmployee && searchQuery) {
      onFindEmployee(searchQuery);
    }
    
    await handleAIResponse(response);
  };

  const handleCheckAvailabilityCommand = async (parameters: Record<string, any>) => {
    const employeeName = parameters.employeeName || '';
    const date = parameters.date || '';
    
    let response = 'I can check employee availability. ';
    
    if (employeeName) {
      response += `Checking availability for ${employeeName}`;
      if (date) {
        response += ` on ${date}`;
      }
      response += '.';
    } else {
      response += 'Please specify which employee you\'d like to check availability for.';
    }
    
    if (onCheckAvailability && employeeName) {
      onCheckAvailability(employeeName, date);
    }
    
    await handleAIResponse(response);
  };

  const handleListCoursesCommand = async () => {
    const response = 'Here are the available training courses: VCA, BHV, Code 95, Forklift, Crane Safety, First Aid, Fire Safety, and more. Which course would you like to schedule?';
    await handleAIResponse(response);
  };

  const handleShowCalendarCommand = async (parameters: Record<string, any>) => {
    const date = parameters.date || '';
    const response = date 
      ? `Showing calendar for ${date}. Here are the scheduled trainings for that period.`
      : 'Showing the training calendar. Here are the upcoming scheduled trainings.';
    
    await handleAIResponse(response);
  };

  const handleTrainingHelpCommand = async () => {
    const response = `I can help you with training scheduling. Here are some commands you can use:
    
    • "Schedule VCA training for John Doe next week"
    • "Find employee Sarah Johnson"
    • "Check availability for Mike Smith on Friday"
    • "What courses are available?"
    • "Show me the calendar for next week"
    
    What would you like to do?`;
    
    await handleAIResponse(response);
  };

  const handleGeneralAICommand = async (transcript: string) => {
    try {
      const response = await sendMessage(transcript);
      await handleAIResponse(response);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      await handleAIResponse('I apologize, but I encountered an error processing your request. Please try again.');
    }
  };

  const handleAIResponse = async (responseText: string) => {
    // Add AI response to history
    const aiMessage = {
      role: 'assistant' as const,
      content: responseText,
      timestamp: new Date()
    };
    
    setConversationHistory(prev => [...prev, aiMessage]);
    
    // Play AI response if voice is enabled
    if (voiceEnabled && elevenlabsService.isConfigured()) {
      try {
        setIsPlaying(true);
        await elevenlabsService.playText(responseText);
      } catch (error) {
        console.error('Error playing AI response:', error);
      } finally {
        setIsPlaying(false);
      }
    }
  };

  const handleToggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isPlaying) {
      elevenlabsService.stopAudio();
      setIsPlaying(false);
    }
  };

  const handleStopAudio = () => {
    elevenlabsService.stopAudio();
    setIsPlaying(false);
  };

  const handleReplayLast = () => {
    const lastAIMessage = conversationHistory
      .slice()
      .reverse()
      .find(msg => msg.role === 'assistant');
    
    if (lastAIMessage && voiceEnabled) {
      elevenlabsService.playText(lastAIMessage.content);
    }
  };

  const getCommandIcon = (command: string) => {
    switch (command) {
      case 'schedule_training': return <Calendar className="h-4 w-4" />;
      case 'find_employee': return <Users className="h-4 w-4" />;
      case 'check_availability': return <Clock className="h-4 w-4" />;
      case 'list_courses': return <Settings className="h-4 w-4" />;
      case 'show_calendar': return <Calendar className="h-4 w-4" />;
      default: return <Mic className="h-4 w-4" />;
    }
  };

  const getCommandLabel = (command: string) => {
    switch (command) {
      case 'schedule_training': return 'Schedule Training';
      case 'find_employee': return 'Find Employee';
      case 'check_availability': return 'Check Availability';
      case 'list_courses': return 'List Courses';
      case 'show_calendar': return 'Show Calendar';
      case 'training_help': return 'Training Help';
      default: return 'Voice Command';
    }
  };

  const isElevenLabsConfigured = elevenlabsService.isConfigured();

  return (
    <Card className={`${className} border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          Voice Training Scheduler
          {!isElevenLabsConfigured && (
            <Badge variant="destructive" className="text-xs">
              Not Configured
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Controls */}
        <div className="flex items-center gap-2 justify-center">
          <Button
            variant={isListening ? "destructive" : "default"}
            size="lg"
            onClick={isListening ? handleStopListening : handleStartListening}
            disabled={!isElevenLabsConfigured || isProcessing}
            className="flex-1"
          >
            {isListening ? (
              <>
                <MicOff className="h-5 w-5 mr-2" />
                Stop Listening
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                Start Voice Commands
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleToggleVoice}
            className={voiceEnabled ? "text-indigo-600" : "text-gray-400"}
          >
            {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>

        {/* Current Status */}
        {(isListening || isProcessing || isPlaying) && (
          <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50 rounded-lg">
            {isListening && (
              <>
                <Mic className="h-4 w-4 text-indigo-600 animate-pulse" />
                <span className="text-sm text-indigo-700">Listening...</span>
              </>
            )}
            {isProcessing && (
              <>
                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                <span className="text-sm text-indigo-700">Processing...</span>
              </>
            )}
            {isPlaying && (
              <>
                <Volume2 className="h-4 w-4 text-purple-600 animate-pulse" />
                <span className="text-sm text-purple-700">Speaking...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStopAudio}
                  className="ml-2"
                >
                  <Pause className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Current Transcript */}
        {currentTranscript && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>You said:</strong> "{currentTranscript}"
            </p>
          </div>
        )}

        {/* Last Command */}
        {lastCommand && (
          <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
            {getCommandIcon(lastCommand)}
            <span className="text-sm text-indigo-700">
              Command: {getCommandLabel(lastCommand)}
            </span>
          </div>
        )}

        {/* Voice Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReplayLast}
            disabled={!conversationHistory.some(msg => msg.role === 'assistant') || !voiceEnabled}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Replay Last
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConversationHistory([])}
            disabled={conversationHistory.length === 0}
            className="flex-1"
          >
            Clear History
          </Button>
        </div>

        {/* Quick Training Commands */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Quick Training Commands:</p>
          <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
            <div>"Schedule VCA training for John next week"</div>
            <div>"Find employee Sarah Johnson"</div>
            <div>"Check availability for Mike on Friday"</div>
            <div>"What courses are available?"</div>
            <div>"Show me the calendar for next week"</div>
          </div>
        </div>

        {/* Configuration Help */}
        {!isElevenLabsConfigured && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Configuration Required:</strong> Add your ElevenLabs API key to environment variables:
            </p>
            <code className="text-xs bg-yellow-100 px-2 py-1 rounded mt-1 block">
              VITE_ELEVENLABS_API_KEY=your_api_key_here
            </code>
          </div>
        )}

        {/* Recent Conversation */}
        {conversationHistory.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <p className="text-sm font-medium text-gray-700">Recent Conversation:</p>
            {conversationHistory.slice(-4).map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                  <span className="text-xs opacity-75">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}